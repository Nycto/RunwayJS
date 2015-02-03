var assert = require('chai').assert
var runway = require('../src/runway.js');
var _ = require('lodash');

describe('Runway.eventify', function(){

    it('should allow events to be triggered', function( done ) {
        var obj = runway.eventify({});
        obj.on('event', done);
        obj.trigger('event');
    });

    it('should allow multiple events to be triggered', function( done ) {
        var obj = runway.eventify({});

        var handler = _.after(3, done);

        obj.on('one', handler);
        obj.on('two', handler);
        obj.on('three', handler);

        obj.trigger('one two three');
    });

    it('should allow multiple events to be watched', function( done ) {
        var obj = runway.eventify({});

        var handler = _.after(3, done);

        obj.on('one two three', handler);

        obj.trigger('one');
        obj.trigger('two');
        obj.trigger('three');
    });

    it('should trigger all registered handlers', function( done ) {
        var obj = runway.eventify({});

        var handler = _.after(3, done);

        obj.on('evt', handler.bind(null));
        obj.on('evt', handler.bind(null));
        obj.on('evt', handler.bind(null));

        obj.trigger('evt');
    });

    it('should pass arguments to the handler', function( done ) {

        function testAndCall ( args, then ) {
            var obj = runway.eventify({});
            obj.on('evt', function () {
                assert.deepEqual( [].slice.call(arguments), args );
                then();
            });
            obj.trigger.apply( obj, ['evt'].concat(args) );
        }

        testAndCall([1],
            testAndCall.bind(null, [1, 2],
                testAndCall.bind(null, [1, 2, 3],
                    testAndCall.bind(null, [1, 2, 3, 4], done))));
    });

    it('should bind handlers to the object itself', function(done) {
        var obj = runway.eventify({});
        obj.on('evt', function () {
            assert.strictEqual( this, obj );
            done();
        });
        obj.trigger('evt');
    });

    it('should trigger every level for nested events', function(done) {
        var obj = runway.eventify({});
        var handler = _.after(3, done);

        obj.on('one', handler.bind(null));
        obj.on('one:two', handler.bind(null));
        obj.on('one:two:three', handler.bind(null));
        obj.trigger('one:two:three');
    });

    it('should allow events to be unregistered', function(done) {
        var obj = runway.eventify({});

        var handler = function () {
            assert.fail("Should not have been called");
        };

        obj.on('one', handler);
        obj.on('one', handler);
        obj.off('one', handler);

        obj.on('one', done);

        obj.trigger('one');
    });

});


