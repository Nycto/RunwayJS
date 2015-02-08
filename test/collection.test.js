var assert = require('chai').assert;
var _ = require('lodash');
var runway = require('../src/runway.js');

describe('Runway.Collection', function(){

    var Item = runway.model({ defaults: { id: null } });
    var Items = runway.collection({ model: Item })

    it('should work like an array', function(){

        var list = new Items([ { id: 1 }, { id: 2 } ]);
        list.add({ id: 3 });

        var list2 = new Items([ { id: 4 } ]);
        list2.add({ id: 5 });
        list2.add({ id: 6 });

        assert.deepEqual(
            list.toArray(),
            [ new Item({ id: 1 }), new Item({ id: 2 }), new Item({ id: 3 }) ]
        );

        assert.deepEqual(
            list2.toArray(),
            [ new Item({ id: 4}), new Item({ id: 5 }), new Item({ id: 6 }) ]
        );
    });

    it('should trigger an event when an element is added', function(done) {

        var list = new Items();
        var toAdd = new Item({ id: 'abc' });

        var finish = _.after(2, done);

        list.on('add change', function ( value ) {
            assert.strictEqual(value, toAdd);
            finish();
        });

        list.add(toAdd);
    });

    it('should trigger an event for constructor args', function(done) {

        var toAdd = new Item({ id: 'abc' });

        var finish = _.after(2, done);

        var List = runway.collection({
            model: Item,
            initialize: function () {
                this.on('add change', function ( value ) {
                    assert.strictEqual(value, toAdd);
                    finish();
                });
            }
        });

        new List([ toAdd ]);
    });

    it('should attach functions to the prototype', function() {

        var toAdd = new Item({ id: 'abc' });

        var List = runway.collection({
            model: Item,
            func: function ( that ) {
                assert.strictEqual(this, that);
                return "Result";
            }
        });

        var ls = new List();
        assert.equal( ls.func(ls), "Result" );
    });

    it('should instantiate empty objects automatically', function() {

        var list = new Items([ {} ]);
        list.add();

        assert.deepEqual(
            list.toArray(),
            [ new Item({ id: null }), new Item({ id: null }) ]
        );
    });

    it('should remove items', function() {
        var toRemove = new Item({ id: 'abc' });

        var list = new Items([ {}, toRemove, toRemove, {} ]);
        list.remove( toRemove );

        assert.deepEqual(list.toArray(), [ new Item(), new Item() ]);
    });

    it('should trigger events on removal', function(done) {
        var toRemove = new Item({ id: 'abc' });

        var list = new Items([ {}, toRemove, toRemove, {} ]);

        var finish = _.after(4, done);

        list.on('remove change', function (removed) {
            assert.strictEqual(toRemove, removed);
            finish();
        });

        list.remove( toRemove );
    });

    it('should trigger events on push and pop', function(done) {
        var finish = _.after(4, done);

        var elem = new Item({ id: 'elem' });

        var list = new Items([ {} ]);

        list.on('add remove change', function (changed) {
            assert.strictEqual(elem, changed);
            finish();
        });

        list.push(elem);
        assert.deepEqual(list.toArray(), [ new Item(), elem ]);
        assert.strictEqual( elem, list.pop() );
        assert.deepEqual(list.toArray(), [ new Item() ]);
    });

    it('should trigger events on shift and unshift', function(done) {
        var finish = _.after(4, done);

        var elem = new Item({ id: 'elem' });

        var list = new Items([ {} ]);

        list.on('add remove change', function (changed) {
            assert.strictEqual(elem, changed);
            finish();
        });

        list.unshift(elem);
        assert.deepEqual(list.toArray(), [ elem, new Item() ]);
        assert.strictEqual( elem, list.shift() );
        assert.deepEqual(list.toArray(), [ new Item() ]);
    });

    it('should trigger events on sort and reverse', function(done) {
        var finish = _.after(4, done);

        var list = new Items([ { id: 1 }, { id: 4 }, { id: 2 } ]);

        list.on('sort change', _.after(4, done));

        list.reverse();
        assert.deepEqual(
            list.toArray(),
            [ new Item({id: 2}), new Item({id: 4}), new Item({id: 1}) ]
        );

        list.sort(function (a, b) { return a.id - b.id; });
        assert.deepEqual(
            list.toArray(),
            [ new Item({id: 1}), new Item({id: 2}), new Item({id: 4}) ]
        );
    });

    it('should allow constructor args to be preprocessed', function() {
        var List = runway.collection({
            preprocess: function (one, two, three) {
                return [ one * 2, two * 3, three * 4 ];
            }
        });

        var ls = new List(1, 2, 3);
        assert.deepEqual( ls.toArray(), [ 2, 6, 12 ] );
    });


    it('should bubble up change events from models', function(done) {
        var ItemsItems = runway.collection({ model: Items })

        var inner = new Item({ id: 50 });
        var middle = new Items([ inner ]);
        var outer = new ItemsItems();
        outer.add( middle );

        outer.on('sub:change', function (value, data) {
            assert.strictEqual(this, outer);
            assert.equal(value, 100);
            assert.deepEqual(data, { old: 50, key: 'id' });
            done();
        });

        inner.id = 100;
    });

    it('should stop bubbling when a value is removed', function() {
        var ItemsItems = runway.collection({ model: Items })

        var inner = new Item({ id: 50, wakka: 123 });
        var middle = new Items([ inner ]);
        var outer = new ItemsItems([ middle ]);

        middle.remove( inner );

        outer.on('sub:change', function () {
            assert.fail("Should not be executed");
        });

        inner.id = 100;
    });

    it('should stop bubbling when a value is removed', function(done) {
        var finish = _.after(5, done);

        var list = new Items([ { id: 50 }, { id: 60 }, { id: 70 } ]);

        list.eachAndAdded(function (item) {
            assert.isTrue( item instanceof Item );
            finish();
        });

        list.add({ id: 80 });
        list.add({ id: 90 });
    });
});

