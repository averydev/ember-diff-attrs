import WeakMap from 'ember-weakmap';


function isEqual(key, a, b) {
  return a === b;
}

export default function(keys, hook) {
  let oldValuesMap = new WeakMap();
  let watchArrayLength = false;
  let isEqualFunc = isEqual;

  if (typeof keys === 'object') {
    let options = keys;
    keys = options.keys;

    if (options.isEqual) {
      isEqualFunc = options.isEqual;
    }

    if(options.watchArrayLength === true){
      watchArrayLength = true;
    }

    if (options.hook) {
      hook = options.hook;
    }
  } else if (arguments.length > 1) {
    keys = [].slice.call(arguments);
    hook = keys.pop();
  } else {
    throw new Error('Invalid `diffAttrs` argument. Expected either one or more strings and a function, or an options hash.');
  }

  return function() {
    let changedAttrs = {};
    let oldValues;
    let isFirstCall = false;

    if (!oldValuesMap.has(this)) {
      isFirstCall = true;
      const stateObj = {};
      oldValuesMap.set(this, {});
    }

    oldValues = oldValuesMap.get(this);

    keys.forEach(key => {
      let value = this.get(key);
      let attrIsArray = Array.isArray(value);

      if (!isEqualFunc(key, oldValues[key], value)) {
        changedAttrs[key] = [oldValues[key], value];
        oldValues[key] = value;
      }
      if (watchArrayLength && attrIsArray){

        let oldLength = (oldValuesMap.get(value) == null) ? 0 : oldValuesMap.get(value).length;
        if (oldLength !== value.length) {
          changedAttrs[key] = [oldValues[key], value];
          oldValues[key] = value;
          oldValuesMap.set(value, {obj:value, length:value.length});
        }
      }
    });

    hook.apply(this, [(isFirstCall ? null : changedAttrs), ...arguments]);
  };
}
