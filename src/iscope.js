const activeScopes = new Set();
const unset = {};
const defaultScope = createScope();

function createScope(init) {
  let currentValue = unset;

  function getValue() {
    if (currentValue === unset) {
      currentValue = typeof init === 'function' ? init() : init;
    }
    return currentValue;
  }

  function iscope() {
    if (arguments.length) {
      // iscope(scope, func, args, context);
      const [scope, func, args = [], context = null] = arguments;
      const previousValue = getValue();
      activeScopes.add(iscope);
      try {
        currentValue = scope;
        return func.apply(context, args);
      } finally {
        currentValue = previousValue;
        activeScopes.delete(iscope);
      }
    }
    // iscope();
    else {
      return getValue();
    }
  }

  Object.assign(iscope, {
    __iscope: true,
    reset() {
      currentValue = unset;
    },
  });

  return iscope;
}

if (!Promise.__applyHooks) {
  Promise.__applyHooks = true;
  const {then: $then, catch: $catch, finally: $finally} = Promise.prototype;

  Object.assign(Promise.prototype, {
    then(onResolve, onReject) {
      return $then.call(this, wrap(onResolve), wrap(onReject));
    },
    catch(onCatch) {
      return $catch.call(this, wrap(onCatch));
    },
    finally(onFinally) {
      return $finally.call(this, wrap(onFinally));
    },
  });
}

function wrap(f) {
  if (!f) {
    return f;
  }

  if (!activeScopes.size) {
    return f;
  }

  const scopes = Array.from(activeScopes).map((iscope) => [iscope, iscope()]);

  return function () {
    const context = this;
    const args = arguments;

    if (!scopes.length) {
      return f.apply(context, args);
    }

    return applyScopes(scopes, f, args, context);
  };
}

function applyScopes(scopes, f, args, context) {
  return scopes.reduce(
    (func, [iscope, value]) => () => iscope(value, func, args, context),
    f,
  )();
}

export default function () {
  if (!arguments.length) {
    return defaultScope();
  }
  const firstArg = arguments[0];
  if (arguments.length === 1) {
    return createScope(firstArg);
  }
  // iscope(listOfScopes, func)
  if (
    Array.isArray(firstArg) &&
    Array.isArray(firstArg[0]) &&
    typeof firstArg[0][0] === 'function' &&
    firstArg[0][0].__iscope
  ) {
    const [scopes, func, args = [], context = null] = arguments;

    return applyScopes(scopes, func, args, context);
  }

  return defaultScope(...arguments);
}
