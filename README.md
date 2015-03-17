RunwayJS [![Build Status](https://secure.travis-ci.org/Nycto/RunwayJS.png?branch=master)](http://travis-ci.org/Nycto/RunwayJS)
========

Just the 'M' in MVC.

RunwayJS provides really simple Models and Collections that behave like regular
Objects and Arrays, while still letting you observe changes.

Models
------

Models are basic key/value blobs. You can create one like this:

```javascript
// Define the 'Item' class
var Item = runway.model();

// Create a new instance
var myItem = new Item({
    id: '1234',
    name: 'Whatsit'
});

// Watch for changes on the name
myItem.on('change:name', function (newName) {
    console.log(newName);
});

// Set a new value
myItem.name = "Thingamajig";
```

### Default Values

You can provide default values that will be present on every instance:

```javascript
// Define the 'Item' class
var Item = runway.model({
    defaults: {
        coolness: 42,
        name: 'Unknown'
    }
});

var myItem = new Item({
    name: 'Whatsit'
});

console.log(myItem.coolness); // Prints '42'
console.log(myItem.name); // Prints 'Whatsit'
```


Collections
-----------

Collections are arrays of Models. In fact, they actually inherit from the
`Array` object, which means you can treat them like arrays:

```javascript
// Define the 'Item' class
var Items = runway.collection();

// Create a new list of items
var myList = new Items([ "Whatsit", "Thingamajig" ]);

// Because collections are arrays, you read them as arrays. Read only, though.
// If you write to an index, it won't trigger any events
console.log( myList[0] ); // Prints 'Whatsit'

// Monitor for any changes to this list: pushes, pops, etc
myList.on('change', function (value) {
    console.log(value);
});

// Pushing triggers the 'change' event, so this prints "Doohickey"
myList.push("Doohickey");
```

Class Methods
-------------

You can define functions that will be attached to the prototype of your Model
or Collection by passing them in when declaring your class:

```javascript
// Define the 'Person' class with the 'fullname' function
var Person = runway.model({
    fullname: function () {
        return this.firstName + " " + this.lastName;
    }
});

var lug = new Person({
    firstName: 'Lug',
    lastName: 'ThickNeck',
});

console.log(lug.fullname()); // Prints 'Lug ThickNeck'
```

Initializer
-----------

By passing in a function called `initialize`, you can define logic that should
be executed any time a new instance is created. Any keys passed to the
constructor will already be bound to `this`. This works for both Models and
Collections.

```javascript
// Define the 'Person' class
var Person = runway.model({
    initialize: function () {
        console.log( this.firstName + " " + this.lastName );
    }
});

// Create a new instance
var lug = new Person({
    firstName: 'Lug',
    lastName: 'ThickNeck',
});
```

Preprocessor
------------

If you want control over the constructor arguments, you can pass in a
preprocessor. This will be given the exact arguments used during construction
and should return an object (if you are creating a Model) or an array (if you
you are creating a Collection).

```javascript
// Define the 'Person' class
var Person = runway.model({
    preprocess: function (first, last) {
        return { firstName: first, lastName: last };
    }
});

// Create a new instance
var lug = new Person('Lug', 'ThickNeck');

console.log( lug.firstName + " " + lug.lastName );
```


