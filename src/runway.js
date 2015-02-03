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
    /*globals define, window, module, require */
    "use strict";

    if ( typeof define === 'function' && define.amd ) {
        define("runway", ["lodash"], factory);
    }
    else if ( module !== undefined && module.exports ) {
        module.exports = factory( require("lodash") );
    }
    else {
        window.runway = factory(window._);
    }

}(function (_) {
    "use strict";

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
    function eventMap (that) {
        if ( !that.hasOwnProperty('__events') ) {
            Object.defineProperty(that, '__events', {
                enumerable: false,
                writeable: false,
                value: {}
            });
        }
        return that.__events;
    }

    /** Splits an incoming event into multiple events */
    function prepEventHandler( inner ) {
        return function (events) {
            var args = [].slice.call(arguments, 1);
            args.unshift( eventMap(this) );
            args.unshift( null );

            var eachEvent = events.split(' ');
            for ( var i = 0; i < eachEvent.length; i++ ) {
                args[0] = eachEvent[i];
                inner.apply(this, args);
            }
        };
    }

    /** Adds event support to a class definition */
    function eventify( obj ) {

        /** Triggers a change event for this model */
        obj.trigger = prepEventHandler(function trigger ( event, map ) {
            var args = [].slice.call(arguments, 2);

            var parts = event.split(":");
            while ( parts.length ) {
                var eventName = parts.join(":");
                if ( map[eventName] ) {
                    triggerEvents(map[eventName], this, args);
                }
                parts.pop();
            }
        });

        /** Subscribes to an event on this model */
        obj.on = prepEventHandler(function on ( event, map, callback ) {
            if ( !map[event] ) {
                map[event] = [ callback ];
            }
            else {
                map[event].push(callback);
            }
        });

        /** Unsubscribes to an event on this model */
        obj.off = prepEventHandler(function off (  event, map, callback ) {
            if ( map[event] ) {
                map[event] = _.reject(
                    map[event],
                    _.partial(_.isEqual, callback)
                );
            }
        });

        return obj;
    }


    /** Binds a property to 'this' and sets up watches */
    var defineProperty = function defineProperty(value, key) {
        if ( this.hasOwnProperty(key) ) {
            return;
        }

        Object.defineProperty(this, key, {
            enumerable: true,
            configurable: false,
            set: function ( newValue ) {
                var oldValue = value;
                value = newValue;
                this.trigger(
                    'change:' + key, value, { old: oldValue, key: key });
            },
            get: function () {
                return value;
            }
        });
    };


    /** Given a hash of options, adds any functions to an object */
    function addFunctions(options, clazz) {
        _.each(options, function (value, key) {
            if ( typeof value === 'function' && key !== 'initialize' ) {
                clazz.prototype[key] = value;
            }
        });
    }


    /** The base class for all models */
    function BaseModel() {}
    eventify( BaseModel.prototype );

    BaseModel.prototype.set = function (key, value) {
        this[key] = value;
    };

    BaseModel.prototype.get = function (key) {
        return this[key];
    };


    /** Configures a new model */
    function defineModel (options) {
        options = options || {};

        /** Constructor for the specific model */
        function Model (values) {

            _.each(values, defineProperty, this);
            _.each(options.defaults, defineProperty, this);

            if ( options.initialize ) {
                options.initialize.call(this);
            }
        }

        Model.prototype = new BaseModel();

        addFunctions(options, Model);

        return Model;
    }


    /** The base class for defining a collection of models */
    function BaseCollection () {}
    BaseCollection.prototype = [];

    eventify( BaseCollection.prototype );

    _.extend(BaseCollection.prototype, {

        /** Converts this object to an array */
        toArray: function () {
            return Array.prototype.slice.call(this);
        },

        /** Adds a value */
        add: function (value) {
            this.push(value);
        },

        /** Override to handle events */
        pop: function () {
            var popped = Array.prototype.pop.call(this);
            this.trigger('remove change', popped);
            return popped;
        },

        /** Override to handle events */
        shift: function () {
            var shifted = Array.prototype.shift.call(this);
            this.trigger('remove change', shifted);
            return shifted;
        },

        /** Remove an element */
        remove: function (elem) {
            for (var i = this.indexOf(elem); i !== -1; i = this.indexOf(elem)) {
                Array.prototype.splice.call(this, i, 1);
                this.trigger('remove change', elem);
            }
        },

        // Splice is... complicated. Clear it out right now to simplify how
        // events need to be handled.
        splice: null
    });


    // Mix in a host of lodash functions
    _.forEach([ "findWhere" ], function (name) {
        BaseCollection.prototype[name] = function () {
            var iface = _(this);
            return iface[name].apply(iface, arguments);
        };
    });


    /** Creates a push or unshift method */
    function createAdder ( func, options ) {
        return function (value) {
            if ( options.model && !(value instanceof options.model) ) {
                value = new options.model(value);
            }

            Array.prototype[func].call(this, value);
            this.trigger('add change', value);
        };
    }

    /** Defines a collection of models */
    function defineCollection ( options ) {
        options = options || {};

        /** Constructor for the specific model */
        function Collection(values) {

            // Override push and unshift to trigger events
            this.push = createAdder('push', options);
            this.unshift = createAdder('unshift', options);

            if ( options.initialize ) {
                options.initialize.call(this);
            }

            _.each(values, this.push, this);
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
