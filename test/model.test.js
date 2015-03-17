var assert = require('chai').assert
var runway = require('../src/runway.js');

describe('Runway.Model', function(){

    it('should work like an object', function() {
        var Item = runway.model();

        var elem = new Item({ id: 1, key: "blah" });

        assert.equal( elem.id, 1 );
        assert.equal( elem.key, "blah" );
    });

    it('should allow defaults', function() {
        var Item = runway.model({
            defaults: {
                id: 1,
                key: "blah"
            }
        });

        var elem = new Item();

        assert.equal( elem.id, 1 );
        assert.equal( elem.key, "blah" );
    });

    it('should trigger a named event when a value changes', function(done) {
        var Item = runway.model();
        var elem = new Item({ id: 1, key: "blah" });

        elem.on('change:id', function ( newVal, data ) {
            assert.equal(newVal, 3.14);
            assert.deepEqual(data, { old: 1, key: 'id' });
            done();
        });

        elem.id = 3.14;
    });

    it('should trigger a general event when a value changes', function(done) {
        var Item = runway.model();
        var elem = new Item({ id: 1, key: "blah" });

        elem.on('change', function ( newVal, data ) {
            assert.equal(newVal, 3.14);
            assert.deepEqual(data, { old: 1, key: 'id' });
            done();
        });

        elem.id = 3.14;
    });

    it('should allow constructor args to be preprocessed', function() {
        var Item = runway.model({
            preprocess: function (one, two, three) {
                return { one: one, two: two, three: three };
            }
        });

        var item = new Item(1, 2, 3);
        assert.equal(1, item.one);
        assert.equal(2, item.two);
        assert.equal(3, item.three);
    });

    it('should bubble up change events from internal models', function(done) {
        var Item = runway.model();

        var inner = new Item({ id: 1 });
        var middle = new Item({ inside: inner });
        var outer = new Item({ inside: middle });

        outer.on('sub:change', function (value, data) {
            assert.strictEqual(this, outer);
            assert.equal(value, 2);
            assert.deepEqual(data, { old: 1, key: 'id' });
            done();
        });

        inner.id = 2;
    });

    it('should not bubble when a value is unset', function() {
        var Item = runway.model();

        var inner = new Item({ id: 1 });
        var middle = new Item({ inside: inner });
        var outer = new Item({ inside: middle });

        outer.on('sub:change', function () {
            assert.fail("Should not be executed");
        });

        outer.inside = null;
        inner.id = 2;
    });

    it('should bubble up change events from collections', function(done) {
        var Item = runway.model();
        var List = runway.collection();

        var inner = new List();
        var middle = new Item({ inside: inner });
        var outer = new Item({ inside: middle });

        outer.on('sub:change', function (value) {
            assert.strictEqual(this, outer);
            assert.equal(value, "test");
            done();
        });

        inner.add("test");
    });

    it('Should trigger changes for nested collections', function(done) {
        var Item = runway.model();
        var List = runway.collection({ model: Item });

        var toPush = new Item({ pushed: true });

        var inner = new List([ {}, {} ]);
        var outer = new Item({ inside: inner });

        outer.on('change:inside', function (value) {
            assert.strictEqual(value, toPush);
            done();
        });

        inner.push( toPush );
    });

    it('shouldnt trigger events when a set value is the same', function() {
        var Item = runway.model();
        var elem = new Item({ id: 3.1415 });

        elem.on('change change:id', function () {
            assert.fail("Should not be triggered");
        });

        elem.id = 3.1415;
    });

});

