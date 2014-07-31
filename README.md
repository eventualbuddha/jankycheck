# jankycheck

## Do not use this

At least don't use it for anything real. I make no promises about it working
well. I mean, really, didn't you see the name?

## If you must try it out

### Install

```
$ npm install -g git://github.com/eventualbuddha/jankycheck.git
```

You don't have to install it globally, it's just easier that way.

### Write some properties

Create a module with export whose names start with `prop_`. These should be
functions that take however many random arguments you need and return a
boolean to indicate success or failure. If the function takes arguments it
should have a `generators` property containing an array of `gentest`
generators. Here's an example:

```js
// myprops.js
var gentest = require('gentest');

function add(x,y) {
  return x + y;
}

function prop_isCommutative(x, y) {
  return add(x, y) === add(y, x);
}

prop_isCommutative.generators = [gentest.types.int, gentest.types.int];
exports.prop_isCommutative = prop_isCommutative;
```

### Run some random checks

```
$ jankycheck myprops.js
✓ prop_isCommutative

1 total, 1 passed, 0 failed.
```

### Contributing

Well, probably don't. If you must, create a branch and submit a PR.

### License

MIT, but you're not using this library for real, right?
