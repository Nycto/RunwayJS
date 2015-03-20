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
(function (root) {
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
    function extend(source, onto, iff) {
        eachObject(source, function (value, key) {
            if ( !iff || iff(key, value) ) {
                onto[key] = value;
            }
        });
        return onto;
    }

    /** Returns whether a function should be added to a class prototype */
    function isClassMethod(key, value) {
        return typeof value === 'function' && key !== 'initialize';
    }

    /** Partially applies arguments to a function */
    function partial( func ) {
        var args = [].slice.call(arguments, 1);
        return function () {
            return func.apply(this, args.concat([].slice.call(arguments)));
        };
    }

    /** Removes a value from an array in place */
    function removeFromArray( array, value ) {
        var removed = false;
        var index;
        while ( -1 !== (index = array.indexOf(value)) ) {
            [].splice.call( array, index, 1 );
            removed = true;
        }
        return removed;
    }


    /**
     * A difficult-to-believe, but optimized internal dispatch function for
     * triggering events. Tries to keep the usual cases speedy. This function
     * was lifted almost directly from Backbone.
     */
    function triggerEvents(callbacks, bind, args) {
        if ( !callbacks ) {
            return;
        }

        var i = -1;
        var len = callbacks.length;

        var a1 = args[0], a2 = args[1];

        switch (args.length) {
            case 0:
                while (++i < len) {
                    if ( callbacks[i] ) {
                        callbacks[i].call(bind);
                    }
                }
                return;
            case 1:
                while (++i < len) {
                    if ( callbacks[i] ) {
                        callbacks[i].call(bind, a1);
                    }
                }
                return;
            case 2:
                while (++i < len) {
                    if ( callbacks[i] ) {
                        callbacks[i].call(bind, a1, a2);
                    }
                }
                return;
            default:
                while (++i < len) {
                    if ( callbacks[i] ) {
                        callbacks[i].apply(bind, args);
                    }
                }
                return;
        }
    }

    /** Splits an incoming event into multiple events before delegating */
    function splitEvents( inner, events ) {
        /*jshint validthis:true */

        // Create a map of events on this object
        if ( !this.hasOwnProperty('__events') ) {
            Object.defineProperty(this, '__events', {
                enumerable: false,
                value: {}
            });
        }

        var args = [].slice.call(arguments, 2);
        args.unshift( this.__events );
        args.unshift( null );

        events = events.split(' ');
        for (var i = 0; i < events.length; i++) {
            args[0] = events[i];
            inner.apply(this, args);
        }
    }

    /** Adds event support to a an object */
    var eventify = partial(extend, {

        /** Triggers a change event for this model */
        trigger: partial(splitEvents, function trigger ( event, map ) {
            var args = [].slice.call(arguments, 2);

            var parts = event.split(":");
            while ( parts.length ) {
                var eventName = parts.join(":");
                triggerEvents(map[eventName], this, args);
                parts.pop();
            }

            triggerEvents(map['*'], this, args);
        }),

        /** Subscribes to an event on this model */
        on: partial(splitEvents, function on ( event, map, callback ) {
            if ( !map[event] ) {
                map[event] = [ callback ];
            }
            else {
                map[event].push(callback);
            }
        }),

        /** Unsubscribes to an event on this model */
        off: partial(splitEvents, function off ( event, map, callback ) {
            removeFromArray( map[event] || [], callback );
        })
    });

    /**
     * Subscribes to changes on a value
     * @return function Returns a function for unsubscribing
     */
    function subscribe ( that, key, value ) {

        // Triggers a 'sub' event when a nested value changes
        var triggerSubChange = that.trigger.bind(that, 'sub:change');

        // Triggers a change event
        var triggerChange = that.trigger.bind(that, 'change:' + key);

        // If the new object is a collection, treat push/pop
        // operations as changes directly on this key
        if ( value instanceof BaseCollection ) {
            value.on('change', triggerChange);
        }
        else if ( isModelOrCollection(value) ) {
            value.on('change sub:change', triggerSubChange);
        }

        // Return a function that will remove the events we just attached
        return function unsubscribe() {
            if ( value instanceof BaseCollection ) {
                value.off('change', triggerChange);
            }
            else if ( isModelOrCollection(value) ) {
                value.off('change sub:change', triggerSubChange);
            }
        };
    }

    /** Binds a property to 'this' and sets up watches */
    function setProperty(value, key) {
        /*jshint validthis:true */

        if ( this.hasOwnProperty(key) ) {
            return;
        }

        var unsubscribe = subscribe(this, key, value);

        Object.defineProperty(this, key, {
            enumerable: true,
            configurable: false,
            set: function ( newValue ) {
                if ( newValue === value ) {
                    return;
                }

                var oldValue = value;
                value = newValue;

                unsubscribe();

                this.trigger('change:' + key, value, {old: oldValue, key: key});

                unsubscribe = subscribe(this, key, value);
            },
            get: function () {
                return value;
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

            eachObject(values, setProperty, this);
            eachObject(options.defaults, setProperty, this);

            if ( options.initialize ) {
                options.initialize.call(this);
            }
        }

        Model.prototype = new BaseModel();

        extend(options, Model.prototype, isClassMethod);

        return Model;
    }



    /* Start adding functions to the BaseCollection */
    BaseCollection.prototype = [];

    eventify( BaseCollection.prototype );

    /** Returns a function that sorts and triggers an event */
    function sorter( func, compare ) {
        /*jshint validthis:true */
        Array.prototype[func].call(this, compare);
        this.trigger('sort change');
    }

    /** Returns a function that sorts and triggers an event */
    function remover( func ) {
        /*jshint validthis:true */
        var removed = Array.prototype[func].call(this);
        this.trigger('remove change', removed);

        return removed;
    }

    /** Creates a push or unshift method */
    function adder ( func, value ) {
        /*jshint validthis:true */
        if ( this.__model && !(value instanceof this.__model) ) {
            value = new this.__model(value);
        }

        Array.prototype[func].call(this, value);
        this.trigger('add change', value);
    }

    extend({

        /** Converts this object to an array */
        toArray: [].slice,

        /** Adds a value */
        add: partial(adder, 'push'),

        /** Remove an element */
        remove: function (elem) {
            if ( removeFromArray(this, elem) ) {
                this.trigger('remove change', elem);
            }
        },

        /** Override to handle events */
        push: partial(adder, 'push'),

        /** Override to handle events */
        pop: partial(remover, 'pop'),

        /** Override to handle events */
        unshift: partial(adder, 'unshift'),

        /** Override to handle events */
        shift: partial(remover, 'shift'),

        /** Override to handle events */
        sort: partial(sorter, 'sort'),

        /** Override to handle events */
        reverse: partial(sorter, 'reverse'),

        /** Override to handle events */
        splice: function ( start, deleteCount ) {

            // Make sure all new elements are cast to the model
            var toAdd = [].slice.call(arguments, 2).map(function (value) {
                if ( this.__model && !(value instanceof this.__model) ) {
                    return new this.__model(value);
                }
                else {
                    return value;
                }
            }, this);

            var removed = [].splice.apply(
                this, [start, deleteCount].concat(toAdd));

            if ( removed.length > 0 ) {
                removed.forEach(function (elem) {
                    this.trigger('remove change', elem);
                }, this);
            }

            if (toAdd.length > 0) {
                toAdd.forEach(function (elem) {
                    this.trigger('add change', elem);
                }, this);
            }

            return removed;
        },

        /** Applies a callback to */
        eachAndAdded: function (callback) {
            this.forEach(callback, this);
            this.on('add', callback);
        }
    }, BaseCollection.prototype);


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

        extend(options, Collection.prototype, isClassMethod);

        return Collection;
    }

    var runway = {
        model: defineModel,
        collection: defineCollection,
        eventify: eventify,
        is: isModelOrCollection
    };

    /** Export the public interface */
    if ( typeof define === 'function' && define.amd ) {
        define("runway", runway);
    }
    else if (typeof exports === 'object') {
        module.exports = runway;
    }
    else {
        root.runway = runway;
    }

}(this));
