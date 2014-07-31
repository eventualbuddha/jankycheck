var gentest = require('gentest');
var shrinker = require('shrinker');

var SHRINKER = new shrinker.Shrinker();
SHRINKER.addDefaultRules();
setShrinker(SHRINKER);

/**
 * @param {shrinker.Shrinker} shrinker
 */
function setShrinker(shrinker) {
  SHRINKER = exports.SHRINKER = shrinker;
}
exports.setShrinker = setShrinker;

/**
 * Calls gentests's `run` and automatically shrinks the failing test case.
 *
 * @param {function(...[*]): boolean} prop
 * @param {number=} numTests
 * @param {number=} seed
 * @param {...function} generators
 */
function run(prop) {
  try {
    return gentest.run.apply(gentest, arguments);
  } catch (ex) {
    if (ex instanceof gentest.FailureError) {
      var values = ex.testCase;
      var shrinks;
      var totalShrinks = 0;
      ex.originalTestCase = values.slice();

      while ((shrinks = shrinkValuesForProperty(prop, values)) > 0) {
        // shrinkValuesForProperty mutates values
        totalShrinks += shrinks;
      }

      ex.shrinks = totalShrinks;
    }

    throw ex;
  }
}
exports.run = run;

/**
 * Shrinks the contents of `values` in place, returning the number of shrinks.
 *
 * @param {function(...[*]): boolean} prop
 * @param {*[]} values
 * @return {number}
 * @private
 */
function shrinkValuesForProperty(prop, values) {
  var shrinks = 0;
  var didShrink = false;

  values.forEach(function(value, i) {
    var result = exports.SHRINKER.shrink(value, function(shrunk) {
      var valuesWithOneShrunk = values.slice(0, i).concat([shrunk], values.slice(i + 1));
      return !prop.apply(null, valuesWithOneShrunk);
    });
    if (result.iterations > 0) {
      didShrink = true;
      shrinks += result.iterations;
      values[i] = result.data;
    }
  });

  return shrinks;
}

exports.FailureError = gentest.FailureError;
