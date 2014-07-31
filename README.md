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

```
$ jankycheck myprops.js
✓ prop_isCommutative

1 total, 1 passed, 0 failed.
```

### PDD (Property-Driven Development)

jankycheck uses [gentest][gentest] to handle the generation of random data to
pass to properties under test. It also uses it to check the properties.
jankytest intercepts failures and automatically shrinks the failing test case
down to a minimal failing test using [shrinker][shrinker]. Given this broken
`pow` function and property:

```js
var gentest = require('gentest');

function pow(base, exponent) {
  var result = 1;
  while (--exponent > 0) {
    result *= base;
  }
  return result;
}

function prop_powWorks(base, exponent) {
  return pow(base, exponent) === Math.pow(base, exponent);
}
prop_powWorks.generators = [gentest.types.int, gentest.types.int];
exports.prop_powWorks = prop_powWorks;
```

`pow` looks like it *might* work, but let's see what happens when we try it:

```
$ jankycheck myprops.js
  ✘ prop_powWorks

    Failed with test case: [ -1, -1 ]
    Shrunk after 2 iterations to [ 0, 1 ]


  1 total, 0 passed, 1 failed.
```

We aren't handling a base of 0 correctly or negative exponents. Let's fix base
of 0 first.

```js
function pow(base, exponent) {
  if (base === 0) {
    return 0;
  }

  var result = 1;
  while (--exponent > 0) {
    result *= base;
  }
  return result;
}
```

Looks better! Let's try again.

```
$ jankycheck myprops.js
  ✘ prop_powWorks

    Failed with test case: [ 0, -1 ]
    Shrunk after 1 iteration to [ 0, 0 ]


  1 total, 0 passed, 1 failed.
```

Oh right, 0<sup>0</sup> is 1, not 0.

```js
function pow(base, exponent) {
  if (exponent === 0) {
    return 1;
  }

  if (base === 0) {
    return 0;
  }

  var result = 1;
  while (--exponent > 0) {
    result *= base;
  }
  return result;
}
```

Okay, that should fix the zero exponent case.

```
$ jankycheck myprops.js
✘ prop_powWorks

  Failed with test case: [ -3, 3 ]
  Shrunk after 4 iterations to [ 2, 1 ]


1 total, 0 passed, 1 failed.
```

Grr, something else is busted. Maybe `--exponent` should be `exponent--`?

```js
function pow(base, exponent) {
  if (exponent === 0) {
    return 1;
  }

  if (base === 0) {
    return 0;
  }

  var result = 1;
  while (exponent-- > 0) {
    result *= base;
  }
  return result;
}
```

Let's see what that did…

```
$ jankycheck myprops.js
✘ prop_powWorks

  Failed with test case: [ 4, -2 ]
  Shrunk after 2 iterations to [ 0, -1 ]


1 total, 0 passed, 1 failed.
```

That's the problem we saw before with negative exponents! After fixing this we
run into an issue where our results are not the same as `Math.pow`. This is
probably attributable to floating point math weirdness. Also, what happens if
base is 0 and exponent is less than 0? Division by zero! Turns out that's okay
in JS as you just get `Infinity`. tl;dr, here's the final `pow` function and
property:

```js
var gentest = require('gentest');

function pow(base, exponent) {
  if (exponent < 0) {
    return pow(1/base, -exponent);
  }

  if (exponent === 0) {
    return 1;
  }

  if (base === 0) {
    return 0;
  }

  var result = 1;
  while (exponent-- > 0) {
    result *= base;
  }
  return result;
}

function prop_powWorks(base, exponent) {
  var result = pow(base, exponent);
  var reference = Math.pow(base, exponent);
  return result === reference || (Math.abs(result - reference) / reference) < 0.00000001;
}
prop_powWorks.generators = [gentest.types.int, gentest.types.int];
exports.prop_powWorks = prop_powWorks;
```

Let's run it just to make sure:

```
$ jankycheck myprops.js
✓ prop_powWorks

1 total, 1 passed, 0 failed.
```

The great thing about this was that we didn't have to keep thinking of test
cases. Instead, they were just handed to us (in minimal form) and all we had to
do was figure out why they failed. We did have to modify our property a little
bit (yay floats!), but not much.

You're right that this is a contrived example since we had a reference
implementation we could check our result against. But often you'll have a
slow-but-working implementation and a fast-but-untested implementation that you
can compare against each other. Also, you can do model-based property testing
where you model the system under test using simple primitives you know work
(such as using the built-in `Array` class to test your custom `Set` class).

### Contributing

Well, probably don't. If you must, create a branch and submit a PR.

### License

MIT, but you're not using this library for real, right?

[gentest]: https://github.com/graue/gentest
[shrinker]: https://github.com/eventualbuddha/shrinker
