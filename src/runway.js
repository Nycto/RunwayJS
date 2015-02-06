/**
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */
(function (factory) {
    /*globals define, window, module */
    "use strict";

    if ( typeof define === 'function' && define.amd ) {
        define("runway", factory);
    }
    else if ( module !== undefined && module.exports ) {
        module.exports = factory();
    }
    else {
        window.runway = factory();
    }

}(function () {
    "use strict";

    /** The base class for all models */
    function BaseModel() {}

    /** The base class for defining a collection of models */
    function BaseCollection () {}

    /** Whether an object is a model or collection */
    function isModelOrCollection ( obj ) {
        return obj instanceof BaseModel || obj instanceof BaseCollection;
    }


    /** Iterates over the keys in an object */
    function eachObject(obj, callback, bind) {
        for ( var key in obj ) {
            if ( obj.hasOwnProperty(key) ) {
                callback.call(bind, obj[key], key);
            }
        }
    }

    /** Extends an object with values from another object */
    function extend(onto, source) {
        eachObject(source, function (value, key) {
            onto[key] = value;
        });
    }


    /**
     * A difficult-to-believe, but optimized internal dispatch function for
     * triggering events. Tries to keep the usual cases speedy. This function
     * was lifted almost directly from Backbone.
     */
    function triggerEvents(callbacks, bind, args) {
        var i = -1;
        var len = callbacks.length;

        var a1 = args[0], a2 = args[1], a3 = args[2];

        switch (args.length) {
            case 0:
                while (++i < len) { callbacks[i].call(bind); }
                return;
            case 1:
                while (++i < len) { callbacks[i].call(bind, a1); }
                return;
            case 2:
                while (++i < len) { callbacks[i].call(bind, a1, a2); }
                return;
            case 3:
                while (++i < len) { callbacks[i].call(bind, a1, a2, a3); }
                return;
            default:
                while (++i < len) { callbacks[i].apply(bind, args); }
                return;
        }
    }

    /** Returns the event map for an object, or adds one */
    function getEventMap (that) {
        if ( !that.hasOwnProperty('__events') ) {
            Object.defineProperty(that, '__events', {
                enumerable: false,
                writeable: false,
                value: {}
            });
        }
        return that.__events;
    }

    /** Splits an incoming event into multiple events before delegating */
    function prepEventHandler( inner ) {
        return function (events) {
            var args = [].slice.call(arguments, 1);
            args.unshift( getEventMap(this) );
            args.unshift( null );

            var eachEvent = events.split(' ');
            for ( var i = 0; i < eachEvent.length; i++ ) {
                args[0] = eachEvent[i];
                inner.apply(this, args);
            }
        };
    }


    /** Functions to for triggering and observing events */
    var eventInterface = {

        /** Triggers a change event for this model */
        trigger: prepEventHandler(function trigger ( event, map ) {
            var args = [].slice.call(arguments, 2);

            var parts = event.split(":");
            while ( parts.length ) {
                var eventName = parts.join(":");
                if ( map[eventName] ) {
                    triggerEvents(map[eventName], this, args);
                }
                parts.pop();
            }
        }),

        /** Subscribes to an event on this model */
        on: prepEventHandler(function on ( event, map, callback ) {
            if ( !map[event] ) {
                map[event] = [ callback ];
            }
            else {
                map[event].push(callback);
            }
        }),

        /** Unsubscribes to an event on this model */
        off: prepEventHandler(function off ( event, map, callback ) {
            if ( map[event] ) {
                for ( var i = 0; i < map[event].length; ) {
                    if ( map[event][i] === callback ) {
                        map[event].splice(i, 1);
                    }
                    else {
                        i++;
                    }
                }
            }
        })
    };

    /** Adds event support to a an object */
    function eventify( obj ) {
        extend(obj, eventInterface);
        return obj;
    }


    /** Binds a property to 'this' and sets up watches */
    function setProperty(that, value, key) {

        if ( that.hasOwnProperty(key) ) {
            return;
        }

        // Triggers an event when a nested value changes
        var triggerChange = that.trigger.bind(that, 'sub:change');

        if ( isModelOrCollection(value) ) {
            value.on('change sub:change', triggerChange);
        }

        Object.defineProperty(that, key, {
            enumerable: true,
            configurable: false,
            set: function ( newValue ) {
                var oldValue = value;
                value = newValue;

                if ( isModelOrCollection(oldValue) ) {
                    oldValue.off('change sub:change', triggerChange);
                }

                that.trigger(
                    'change:' + key, value, { old: oldValue, key: key }
                );

                if ( isModelOrCollection(newValue) ) {
                    newValue.on('change sub:change', triggerChange);
                }
            },
            get: function () {
                return value;
            }
        });
    }


    /** Given a hash of options, adds any functions to an object */
    function addFunctions(options, clazz) {
        eachObject(options, function (value, key) {
            if ( typeof value === 'function' && key !== 'initialize' ) {
                clazz.prototype[key] = value;
            }
        });
    }


    /* Start adding functions to the BaseModel */
    eventify( BaseModel.prototype );

    /** Configures a new model */
    function defineModel (options) {
        options = options || {};

        /** Constructor for the specific model */
        function Model (values) {

            if ( options.preprocess ) {
                values = options.preprocess.apply(this, arguments);
            }

            eachObject(values, setProperty.bind(null, this));
            eachObject(options.defaults, setProperty.bind(null, this));

            if ( options.initialize ) {
                options.initialize.call(this);
            }
        }

        Model.prototype = new BaseModel();

        addFunctions(options, Model);

        return Model;
    }



    /* Start adding functions to the BaseCollection */
    BaseCollection.prototype = [];

    eventify( BaseCollection.prototype );

    /** Returns a function that sorts and triggers an event */
    function createSorter( func ) {
        return function (compare) {
            Array.prototype[func].call(this, compare);
            this.trigger('sort change');
        };
    }

    /** Returns a function that sorts and triggers an event */
    function createRemover( func ) {
        return function () {
            var removed = Array.prototype[func].call(this);
            this.trigger('remove change', removed);

            if ( isModelOrCollection(removed) ) {
                removed.trigger('removed', this);
            }

            return removed;
        };
    }

    /** Creates a push or unshift method */
    function createAdder ( func ) {
        return function (value) {
            if ( this.__model && !(value instanceof this.__model) ) {
                value = new this.__model(value);
            }

            Array.prototype[func].call(this, value);
            this.trigger('add change', value);
        };
    }

    extend(BaseCollection.prototype, {

        /** Converts this object to an array */
        toArray: [].slice,

        /** Adds a value */
        add: createAdder('push'),

        /** Remove an element */
        remove: function (elem) {
            var removed = false;
            var index;
            while ( -1 !== (index = this.indexOf(elem)) ) {
                [].splice.call(this, index, 1);
                removed = true;
                this.trigger('remove change', elem);
            }

            if ( removed && isModelOrCollection(elem) ) {
                elem.trigger('removed', this);
            }
        },

        /** Override to handle events */
        push: createAdder('push'),

        /** Override to handle events */
        pop: createRemover('pop'),

        /** Override to handle events */
        unshift: createAdder('unshift'),

        /** Override to handle events */
        shift: createRemover('shift'),

        /** Override to handle events */
        sort: createSorter('sort'),

        /** Override to handle events */
        reverse: createSorter('reverse'),

        // Splice is... complicated. Clear it out right now to simplify how
        // events need to be handled.
        splice: null,

        /** Applies a callback to */
        eachAndAdded: function (callback) {
            this.forEach(callback, this);
            this.on('add', callback);
        }

    });


    /** Defines a collection of models */
    function defineCollection ( options ) {
        options = options || {};

        /** Constructor for the specific model */
        function Collection(values) {

            if ( options.preprocess ) {
                values = options.preprocess.apply(this, arguments);
            }

            // Store the defined model so it can be referenced by add and push
            if ( options.model ) {
                Object.defineProperty(this, '__model', {
                    enumerable: false,
                    value: options.model
                });
            }

            // Monitor for changes to nested elements and bubble up events
            var triggerSubChange = this.trigger.bind(this, 'sub:change');

            this.on('add', function (elem) {
                if ( isModelOrCollection(elem) ) {
                    elem.on('change sub:change', triggerSubChange);
                }
            });

            this.on('remove', function (elem) {
                if ( isModelOrCollection(elem) ) {
                    elem.off('change sub:change', triggerSubChange);
                }
            });


            if ( options.initialize ) {
                options.initialize.call(this);
            }

            (values || []).forEach(this.push, this);
        }

        Collection.prototype = new BaseCollection();

        addFunctions(options, Collection);

        return Collection;
    }

    return {
        model: defineModel,
        collection: defineCollection,
        eventify: eventify
    };

}));
