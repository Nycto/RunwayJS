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

});

