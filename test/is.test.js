var assert = require('chai').assert;
var _ = require('lodash');
var runway = require('../src/runway.js');

describe('Runway.is', function(){

    var Item = runway.model();
    var Items = runway.collection()

    it('should return true for models and collections', function(){
        assert.isTrue( runway.is( new Item() ) );
        assert.isTrue( runway.is( new Items() ) );
    });

    it('should return false for other types', function(){
        assert.isFalse( runway.is( false ) );
        assert.isFalse( runway.is( true ) );
        assert.isFalse( runway.is( null ) );
        assert.isFalse( runway.is( undefined ) );
        assert.isFalse( runway.is( "test" ) );
        assert.isFalse( runway.is( 3.1415 ) );
        assert.isFalse( runway.is( [1, 2, 3] ) );
        assert.isFalse( runway.is( {} ) );

        function Test(){}
        assert.isFalse( runway.is( new Test() ) );
    });

});

