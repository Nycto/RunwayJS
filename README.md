RunwayJS [![Build Status](https://secure.travis-ci.org/Nycto/RunwayJS.png?branch=master)](http://travis-ci.org/Nycto/RunwayJS)
========

Just the 'M' in MVC.

RunwayJS provides really simple JavaScript Models and Collections that behave
like regular Objects and Arrays, while still letting you observe changes.

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
// Define the 'Items' collection
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

### Default Model

By passing in the `model` option to a Collection, you can ensure that any
values added to the Collection are the proper type. If you add a value that
isn't already a Model, it will get passed as constructor arguments to the
default model.

```javascript

// Define the 'Item' model
var Item = runway.model();

// Define the 'ItemList' collection
var ItemList = runway.collection({
    model: Item
});

var myList = new ItemList([
    { id: 123, name: 'Whatsit' }
]);

// The following prints 'true' because ItemList automatically instantiated
// a new Item and passed the object above as an argument
console.log( myList[0] instanceof Item );
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

Events
------

Models and Collections both come with built in event support. There are three
primary methods involved:

__on(event, callback)__

> Adds an event listener for the given callback

__off(event, callback)__

> Removes a previously registered event listener. `callback` must be the same
> exact value that was passed to `on`

__trigger(event, ...args)__

> Triggers the specificed event. Any additional args will be passed as arguments
> to each event handler

### Specificity

Events can be made more specific by separating the event name with a colon
(`:`). For example, an event named `Family:Genus:Species` will also trigger
callbacks listening for `Family:Genus` and `Family`.

### Multiple Events at Once

All three event methods can accept multiple event names simply by separating
them by spaces. For example:

```javascript
// This will listen to 'add' and 'remove' events
item.on("add remove", function () {
    console.log("Added or removed");
});
```

### Model Events

Any time a value is changed on a Model, it will trigger an event. This allows
you to monitor and respond to your data as it evolves. For example:

```javascript
var Item = runway.model();

var thingy = new Item({
    id: 12345,
    name: 'Whosit'
});

// Listen for changes to the 'name' key
thingy.on('change:name', function (value, details) {
    console.log('The new value is: ' + value);
    console.log('The old value was: ' + details.old);
});

// Listen for all change events
thingy.on('change', function (value, details) {
    console.log('The new value is: ' + value);
    console.log('On key: ' + details.key);
    console.log('The old value was: ' + details.old);
});
```

### Collection Events

Collections will trigger `change` events whenever a value is added, removed or
the entire collection is sorted. It will also trigger more specific `add`
events, `remove` events, and `sort` events.

```javascript
var Item = runway.model();

var ItemList = runway.collection({ model: Item });

var list = new ItemList();

// Listen for pushed and unshifted values
thingy.on('add', function (value) {
    console.log('The added value is: ' + value);
});

// Listen for popped or shifted values
thingy.on('remove', function (value) {
    console.log('The removed value is: ' + value);
});

// Listen for calls to sort or reverse
thingy.on('sort', function () {
    console.log('The collection has been sorted');
});
```

### Collections in Models

Collections that are directly embedded in a model will trigger `change` events
directly on the model when the collection is modified.

```javascript
var Item = runway.model();

var ItemList = runway.collection({ model: Item });

var Groups = runway.model();

// Create a model that contains a collection
var group = new Group({
    items: new ItemList();
});

// Listen for changes to the 'items' key
group.on('change:items', function () {
    console.log("Items changed!");
});

// Even though group.items isn't being reassigned, changes to the collection
// will directly trigger change events:
group.items.push( new Item() );
```

### Change Event Bubbling

Change events are bubbled up through the containing Models and Collections as
`sub:change` events. For example:

```javascript
var Item = runway.model();

var Group = runway.model();

// Create a model containing an item
var group = new Group({
    items: new Item();
});

// Listen for changes to any internal values
group.on('sub:change', function () {
    console.log("Items changed!");
});

// Triggers a 'change' on 'group.items' and a 'sub:change' on 'group'
group.items.name = "Whatchamacallit";
```

What about Ajax?
----------------

Runway doesn't come with any Ajax capabilities built in. But there are a lot
of [great ajax micro-frameworks](http://microjs.com/#ajax) you can pull in.

How do Models Work?
-------------------

RunwayJS makes use of `Object.defineProperty` to put setters and getters in
place. These setters and getters then trigger events when a change is made.

This means there is one important caveat: If a key isn't present when you create
an object, it won't trigger events. For example, this won't work:

```javascript
var Item = model.create();
var whosit = new Item();

// This does NOT trigger an event
whosit.name = "Thingy";
```

To solve that problem, make sure all your keys are present in either the
constructor argument or the defaults list. For example:

```javascript
var Item = model.create({
    defaults: {
        name: undefined
    }
});

// `whosit` will trigger events for the 'name' key and the 'id' key, but
// nothing else
var whosit = new Item({
    id: 1234
});
```

How do Collections work?
------------------------

Collections use a the JavaScript Array object as their foundation. This means
you can use them anywhere you would normally use an array. Events are triggered
by wrapping the default functions, triggering, then calling the original array
methods. The following methods are overriden:

* push
* pop
* shift
* unshift
* splice
* sort
* reverse

This means there is an important caveat: Writing to an array index won't work.
Array style access can't be overriden in JavaScript, so there isn't any way
around this. Basically, don't do this:

```javascript
var Items = runway.collection();

var myList = new Items([ "Whatsit", "Thingamajig" ]);

// This will NOT trigger an event
myList[0] = "New Thing";
```

License
-------

RunwayJS is released under the MIT License, which is pretty spiffy. You should
have received a copy of the MIT License along with this program. If not, see
http://www.opensource.org/licenses/mit-license.php


