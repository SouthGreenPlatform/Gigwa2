(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global = global || self, global.GenotypeRenderer = factory());
}(this, (function () { 'use strict';

  function _typeof(obj) {
    "@babel/helpers - typeof";

    return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) {
      return typeof obj;
    } : function (obj) {
      return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
    }, _typeof(obj);
  }
  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }
  function _defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];
      descriptor.enumerable = descriptor.enumerable || false;
      descriptor.configurable = true;
      if ("value" in descriptor) descriptor.writable = true;
      Object.defineProperty(target, descriptor.key, descriptor);
    }
  }
  function _createClass(Constructor, protoProps, staticProps) {
    if (protoProps) _defineProperties(Constructor.prototype, protoProps);
    if (staticProps) _defineProperties(Constructor, staticProps);
    Object.defineProperty(Constructor, "prototype", {
      writable: false
    });
    return Constructor;
  }
  function _slicedToArray(arr, i) {
    return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _unsupportedIterableToArray(arr, i) || _nonIterableRest();
  }
  function _toConsumableArray(arr) {
    return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _unsupportedIterableToArray(arr) || _nonIterableSpread();
  }
  function _arrayWithoutHoles(arr) {
    if (Array.isArray(arr)) return _arrayLikeToArray(arr);
  }
  function _arrayWithHoles(arr) {
    if (Array.isArray(arr)) return arr;
  }
  function _iterableToArray(iter) {
    if (typeof Symbol !== "undefined" && iter[Symbol.iterator] != null || iter["@@iterator"] != null) return Array.from(iter);
  }
  function _iterableToArrayLimit(arr, i) {
    var _i = arr == null ? null : typeof Symbol !== "undefined" && arr[Symbol.iterator] || arr["@@iterator"];
    if (_i == null) return;
    var _arr = [];
    var _n = true;
    var _d = false;
    var _s, _e;
    try {
      for (_i = _i.call(arr); !(_n = (_s = _i.next()).done); _n = true) {
        _arr.push(_s.value);
        if (i && _arr.length === i) break;
      }
    } catch (err) {
      _d = true;
      _e = err;
    } finally {
      try {
        if (!_n && _i["return"] != null) _i["return"]();
      } finally {
        if (_d) throw _e;
      }
    }
    return _arr;
  }
  function _unsupportedIterableToArray(o, minLen) {
    if (!o) return;
    if (typeof o === "string") return _arrayLikeToArray(o, minLen);
    var n = Object.prototype.toString.call(o).slice(8, -1);
    if (n === "Object" && o.constructor) n = o.constructor.name;
    if (n === "Map" || n === "Set") return Array.from(o);
    if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen);
  }
  function _arrayLikeToArray(arr, len) {
    if (len == null || len > arr.length) len = arr.length;
    for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i];
    return arr2;
  }
  function _nonIterableSpread() {
    throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
  }
  function _nonIterableRest() {
    throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
  }
  function _createForOfIteratorHelper(o, allowArrayLike) {
    var it = typeof Symbol !== "undefined" && o[Symbol.iterator] || o["@@iterator"];
    if (!it) {
      if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") {
        if (it) o = it;
        var i = 0;
        var F = function () {};
        return {
          s: F,
          n: function () {
            if (i >= o.length) return {
              done: true
            };
            return {
              done: false,
              value: o[i++]
            };
          },
          e: function (e) {
            throw e;
          },
          f: F
        };
      }
      throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
    }
    var normalCompletion = true,
      didErr = false,
      err;
    return {
      s: function () {
        it = it.call(o);
      },
      n: function () {
        var step = it.next();
        normalCompletion = step.done;
        return step;
      },
      e: function (e) {
        didErr = true;
        err = e;
      },
      f: function () {
        try {
          if (!normalCompletion && it.return != null) it.return();
        } finally {
          if (didErr) throw err;
        }
      }
    };
  }

  function bind(fn, thisArg) {
    return function wrap() {
      return fn.apply(thisArg, arguments);
    };
  }

  // utils is a library of generic helper functions non-specific to axios

  const {toString} = Object.prototype;
  const {getPrototypeOf} = Object;

  const kindOf = (cache => thing => {
      const str = toString.call(thing);
      return cache[str] || (cache[str] = str.slice(8, -1).toLowerCase());
  })(Object.create(null));

  const kindOfTest = (type) => {
    type = type.toLowerCase();
    return (thing) => kindOf(thing) === type
  };

  const typeOfTest = type => thing => typeof thing === type;

  /**
   * Determine if a value is an Array
   *
   * @param {Object} val The value to test
   *
   * @returns {boolean} True if value is an Array, otherwise false
   */
  const {isArray} = Array;

  /**
   * Determine if a value is undefined
   *
   * @param {*} val The value to test
   *
   * @returns {boolean} True if the value is undefined, otherwise false
   */
  const isUndefined = typeOfTest('undefined');

  /**
   * Determine if a value is a Buffer
   *
   * @param {*} val The value to test
   *
   * @returns {boolean} True if value is a Buffer, otherwise false
   */
  function isBuffer(val) {
    return val !== null && !isUndefined(val) && val.constructor !== null && !isUndefined(val.constructor)
      && isFunction(val.constructor.isBuffer) && val.constructor.isBuffer(val);
  }

  /**
   * Determine if a value is an ArrayBuffer
   *
   * @param {*} val The value to test
   *
   * @returns {boolean} True if value is an ArrayBuffer, otherwise false
   */
  const isArrayBuffer = kindOfTest('ArrayBuffer');


  /**
   * Determine if a value is a view on an ArrayBuffer
   *
   * @param {*} val The value to test
   *
   * @returns {boolean} True if value is a view on an ArrayBuffer, otherwise false
   */
  function isArrayBufferView(val) {
    let result;
    if ((typeof ArrayBuffer !== 'undefined') && (ArrayBuffer.isView)) {
      result = ArrayBuffer.isView(val);
    } else {
      result = (val) && (val.buffer) && (isArrayBuffer(val.buffer));
    }
    return result;
  }

  /**
   * Determine if a value is a String
   *
   * @param {*} val The value to test
   *
   * @returns {boolean} True if value is a String, otherwise false
   */
  const isString = typeOfTest('string');

  /**
   * Determine if a value is a Function
   *
   * @param {*} val The value to test
   * @returns {boolean} True if value is a Function, otherwise false
   */
  const isFunction = typeOfTest('function');

  /**
   * Determine if a value is a Number
   *
   * @param {*} val The value to test
   *
   * @returns {boolean} True if value is a Number, otherwise false
   */
  const isNumber = typeOfTest('number');

  /**
   * Determine if a value is an Object
   *
   * @param {*} thing The value to test
   *
   * @returns {boolean} True if value is an Object, otherwise false
   */
  const isObject = (thing) => thing !== null && typeof thing === 'object';

  /**
   * Determine if a value is a Boolean
   *
   * @param {*} thing The value to test
   * @returns {boolean} True if value is a Boolean, otherwise false
   */
  const isBoolean = thing => thing === true || thing === false;

  /**
   * Determine if a value is a plain Object
   *
   * @param {*} val The value to test
   *
   * @returns {boolean} True if value is a plain Object, otherwise false
   */
  const isPlainObject = (val) => {
    if (kindOf(val) !== 'object') {
      return false;
    }

    const prototype = getPrototypeOf(val);
    return (prototype === null || prototype === Object.prototype || Object.getPrototypeOf(prototype) === null) && !(Symbol.toStringTag in val) && !(Symbol.iterator in val);
  };

  /**
   * Determine if a value is a Date
   *
   * @param {*} val The value to test
   *
   * @returns {boolean} True if value is a Date, otherwise false
   */
  const isDate = kindOfTest('Date');

  /**
   * Determine if a value is a File
   *
   * @param {*} val The value to test
   *
   * @returns {boolean} True if value is a File, otherwise false
   */
  const isFile = kindOfTest('File');

  /**
   * Determine if a value is a Blob
   *
   * @param {*} val The value to test
   *
   * @returns {boolean} True if value is a Blob, otherwise false
   */
  const isBlob = kindOfTest('Blob');

  /**
   * Determine if a value is a FileList
   *
   * @param {*} val The value to test
   *
   * @returns {boolean} True if value is a File, otherwise false
   */
  const isFileList = kindOfTest('FileList');

  /**
   * Determine if a value is a Stream
   *
   * @param {*} val The value to test
   *
   * @returns {boolean} True if value is a Stream, otherwise false
   */
  const isStream = (val) => isObject(val) && isFunction(val.pipe);

  /**
   * Determine if a value is a FormData
   *
   * @param {*} thing The value to test
   *
   * @returns {boolean} True if value is an FormData, otherwise false
   */
  const isFormData = (thing) => {
    const pattern = '[object FormData]';
    return thing && (
      (typeof FormData === 'function' && thing instanceof FormData) ||
      toString.call(thing) === pattern ||
      (isFunction(thing.toString) && thing.toString() === pattern)
    );
  };

  /**
   * Determine if a value is a URLSearchParams object
   *
   * @param {*} val The value to test
   *
   * @returns {boolean} True if value is a URLSearchParams object, otherwise false
   */
  const isURLSearchParams = kindOfTest('URLSearchParams');

  /**
   * Trim excess whitespace off the beginning and end of a string
   *
   * @param {String} str The String to trim
   *
   * @returns {String} The String freed of excess whitespace
   */
  const trim = (str) => str.trim ?
    str.trim() : str.replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, '');

  /**
   * Iterate over an Array or an Object invoking a function for each item.
   *
   * If `obj` is an Array callback will be called passing
   * the value, index, and complete array for each item.
   *
   * If 'obj' is an Object callback will be called passing
   * the value, key, and complete object for each property.
   *
   * @param {Object|Array} obj The object to iterate
   * @param {Function} fn The callback to invoke for each item
   *
   * @param {Boolean} [allOwnKeys = false]
   * @returns {void}
   */
  function forEach(obj, fn, {allOwnKeys = false} = {}) {
    // Don't bother if no value provided
    if (obj === null || typeof obj === 'undefined') {
      return;
    }

    let i;
    let l;

    // Force an array if not already something iterable
    if (typeof obj !== 'object') {
      /*eslint no-param-reassign:0*/
      obj = [obj];
    }

    if (isArray(obj)) {
      // Iterate over array values
      for (i = 0, l = obj.length; i < l; i++) {
        fn.call(null, obj[i], i, obj);
      }
    } else {
      // Iterate over object keys
      const keys = allOwnKeys ? Object.getOwnPropertyNames(obj) : Object.keys(obj);
      const len = keys.length;
      let key;

      for (i = 0; i < len; i++) {
        key = keys[i];
        fn.call(null, obj[key], key, obj);
      }
    }
  }

  /**
   * Accepts varargs expecting each argument to be an object, then
   * immutably merges the properties of each object and returns result.
   *
   * When multiple objects contain the same key the later object in
   * the arguments list will take precedence.
   *
   * Example:
   *
   * ```js
   * var result = merge({foo: 123}, {foo: 456});
   * console.log(result.foo); // outputs 456
   * ```
   *
   * @param {Object} obj1 Object to merge
   *
   * @returns {Object} Result of all merge properties
   */
  function merge(/* obj1, obj2, obj3, ... */) {
    const result = {};
    const assignValue = (val, key) => {
      if (isPlainObject(result[key]) && isPlainObject(val)) {
        result[key] = merge(result[key], val);
      } else if (isPlainObject(val)) {
        result[key] = merge({}, val);
      } else if (isArray(val)) {
        result[key] = val.slice();
      } else {
        result[key] = val;
      }
    };

    for (let i = 0, l = arguments.length; i < l; i++) {
      arguments[i] && forEach(arguments[i], assignValue);
    }
    return result;
  }

  /**
   * Extends object a by mutably adding to it the properties of object b.
   *
   * @param {Object} a The object to be extended
   * @param {Object} b The object to copy properties from
   * @param {Object} thisArg The object to bind function to
   *
   * @param {Boolean} [allOwnKeys]
   * @returns {Object} The resulting value of object a
   */
  const extend = (a, b, thisArg, {allOwnKeys}= {}) => {
    forEach(b, (val, key) => {
      if (thisArg && isFunction(val)) {
        a[key] = bind(val, thisArg);
      } else {
        a[key] = val;
      }
    }, {allOwnKeys});
    return a;
  };

  /**
   * Remove byte order marker. This catches EF BB BF (the UTF-8 BOM)
   *
   * @param {string} content with BOM
   *
   * @returns {string} content value without BOM
   */
  const stripBOM = (content) => {
    if (content.charCodeAt(0) === 0xFEFF) {
      content = content.slice(1);
    }
    return content;
  };

  /**
   * Inherit the prototype methods from one constructor into another
   * @param {function} constructor
   * @param {function} superConstructor
   * @param {object} [props]
   * @param {object} [descriptors]
   *
   * @returns {void}
   */
  const inherits = (constructor, superConstructor, props, descriptors) => {
    constructor.prototype = Object.create(superConstructor.prototype, descriptors);
    constructor.prototype.constructor = constructor;
    Object.defineProperty(constructor, 'super', {
      value: superConstructor.prototype
    });
    props && Object.assign(constructor.prototype, props);
  };

  /**
   * Resolve object with deep prototype chain to a flat object
   * @param {Object} sourceObj source object
   * @param {Object} [destObj]
   * @param {Function|Boolean} [filter]
   * @param {Function} [propFilter]
   *
   * @returns {Object}
   */
  const toFlatObject = (sourceObj, destObj, filter, propFilter) => {
    let props;
    let i;
    let prop;
    const merged = {};

    destObj = destObj || {};
    // eslint-disable-next-line no-eq-null,eqeqeq
    if (sourceObj == null) return destObj;

    do {
      props = Object.getOwnPropertyNames(sourceObj);
      i = props.length;
      while (i-- > 0) {
        prop = props[i];
        if ((!propFilter || propFilter(prop, sourceObj, destObj)) && !merged[prop]) {
          destObj[prop] = sourceObj[prop];
          merged[prop] = true;
        }
      }
      sourceObj = filter !== false && getPrototypeOf(sourceObj);
    } while (sourceObj && (!filter || filter(sourceObj, destObj)) && sourceObj !== Object.prototype);

    return destObj;
  };

  /**
   * Determines whether a string ends with the characters of a specified string
   *
   * @param {String} str
   * @param {String} searchString
   * @param {Number} [position= 0]
   *
   * @returns {boolean}
   */
  const endsWith = (str, searchString, position) => {
    str = String(str);
    if (position === undefined || position > str.length) {
      position = str.length;
    }
    position -= searchString.length;
    const lastIndex = str.indexOf(searchString, position);
    return lastIndex !== -1 && lastIndex === position;
  };


  /**
   * Returns new array from array like object or null if failed
   *
   * @param {*} [thing]
   *
   * @returns {?Array}
   */
  const toArray = (thing) => {
    if (!thing) return null;
    if (isArray(thing)) return thing;
    let i = thing.length;
    if (!isNumber(i)) return null;
    const arr = new Array(i);
    while (i-- > 0) {
      arr[i] = thing[i];
    }
    return arr;
  };

  /**
   * Checking if the Uint8Array exists and if it does, it returns a function that checks if the
   * thing passed in is an instance of Uint8Array
   *
   * @param {TypedArray}
   *
   * @returns {Array}
   */
  // eslint-disable-next-line func-names
  const isTypedArray = (TypedArray => {
    // eslint-disable-next-line func-names
    return thing => {
      return TypedArray && thing instanceof TypedArray;
    };
  })(typeof Uint8Array !== 'undefined' && getPrototypeOf(Uint8Array));

  /**
   * For each entry in the object, call the function with the key and value.
   *
   * @param {Object<any, any>} obj - The object to iterate over.
   * @param {Function} fn - The function to call for each entry.
   *
   * @returns {void}
   */
  const forEachEntry = (obj, fn) => {
    const generator = obj && obj[Symbol.iterator];

    const iterator = generator.call(obj);

    let result;

    while ((result = iterator.next()) && !result.done) {
      const pair = result.value;
      fn.call(obj, pair[0], pair[1]);
    }
  };

  /**
   * It takes a regular expression and a string, and returns an array of all the matches
   *
   * @param {string} regExp - The regular expression to match against.
   * @param {string} str - The string to search.
   *
   * @returns {Array<boolean>}
   */
  const matchAll = (regExp, str) => {
    let matches;
    const arr = [];

    while ((matches = regExp.exec(str)) !== null) {
      arr.push(matches);
    }

    return arr;
  };

  /* Checking if the kindOfTest function returns true when passed an HTMLFormElement. */
  const isHTMLForm = kindOfTest('HTMLFormElement');

  const toCamelCase = str => {
    return str.toLowerCase().replace(/[_-\s]([a-z\d])(\w*)/g,
      function replacer(m, p1, p2) {
        return p1.toUpperCase() + p2;
      }
    );
  };

  /* Creating a function that will check if an object has a property. */
  const hasOwnProperty = (({hasOwnProperty}) => (obj, prop) => hasOwnProperty.call(obj, prop))(Object.prototype);

  /**
   * Determine if a value is a RegExp object
   *
   * @param {*} val The value to test
   *
   * @returns {boolean} True if value is a RegExp object, otherwise false
   */
  const isRegExp = kindOfTest('RegExp');

  const reduceDescriptors = (obj, reducer) => {
    const descriptors = Object.getOwnPropertyDescriptors(obj);
    const reducedDescriptors = {};

    forEach(descriptors, (descriptor, name) => {
      if (reducer(descriptor, name, obj) !== false) {
        reducedDescriptors[name] = descriptor;
      }
    });

    Object.defineProperties(obj, reducedDescriptors);
  };

  /**
   * Makes all methods read-only
   * @param {Object} obj
   */

  const freezeMethods = (obj) => {
    reduceDescriptors(obj, (descriptor, name) => {
      const value = obj[name];

      if (!isFunction(value)) return;

      descriptor.enumerable = false;

      if ('writable' in descriptor) {
        descriptor.writable = false;
        return;
      }

      if (!descriptor.set) {
        descriptor.set = () => {
          throw Error('Can not read-only method \'' + name + '\'');
        };
      }
    });
  };

  const toObjectSet = (arrayOrString, delimiter) => {
    const obj = {};

    const define = (arr) => {
      arr.forEach(value => {
        obj[value] = true;
      });
    };

    isArray(arrayOrString) ? define(arrayOrString) : define(String(arrayOrString).split(delimiter));

    return obj;
  };

  const noop = () => {};

  const toFiniteNumber = (value, defaultValue) => {
    value = +value;
    return Number.isFinite(value) ? value : defaultValue;
  };

  var utils = {
    isArray,
    isArrayBuffer,
    isBuffer,
    isFormData,
    isArrayBufferView,
    isString,
    isNumber,
    isBoolean,
    isObject,
    isPlainObject,
    isUndefined,
    isDate,
    isFile,
    isBlob,
    isRegExp,
    isFunction,
    isStream,
    isURLSearchParams,
    isTypedArray,
    isFileList,
    forEach,
    merge,
    extend,
    trim,
    stripBOM,
    inherits,
    toFlatObject,
    kindOf,
    kindOfTest,
    endsWith,
    toArray,
    forEachEntry,
    matchAll,
    isHTMLForm,
    hasOwnProperty,
    hasOwnProp: hasOwnProperty, // an alias to avoid ESLint no-prototype-builtins detection
    reduceDescriptors,
    freezeMethods,
    toObjectSet,
    toCamelCase,
    noop,
    toFiniteNumber
  };

  /**
   * Create an Error with the specified message, config, error code, request and response.
   *
   * @param {string} message The error message.
   * @param {string} [code] The error code (for example, 'ECONNABORTED').
   * @param {Object} [config] The config.
   * @param {Object} [request] The request.
   * @param {Object} [response] The response.
   *
   * @returns {Error} The created error.
   */
  function AxiosError(message, code, config, request, response) {
    Error.call(this);

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    } else {
      this.stack = (new Error()).stack;
    }

    this.message = message;
    this.name = 'AxiosError';
    code && (this.code = code);
    config && (this.config = config);
    request && (this.request = request);
    response && (this.response = response);
  }

  utils.inherits(AxiosError, Error, {
    toJSON: function toJSON() {
      return {
        // Standard
        message: this.message,
        name: this.name,
        // Microsoft
        description: this.description,
        number: this.number,
        // Mozilla
        fileName: this.fileName,
        lineNumber: this.lineNumber,
        columnNumber: this.columnNumber,
        stack: this.stack,
        // Axios
        config: this.config,
        code: this.code,
        status: this.response && this.response.status ? this.response.status : null
      };
    }
  });

  const prototype = AxiosError.prototype;
  const descriptors = {};

  [
    'ERR_BAD_OPTION_VALUE',
    'ERR_BAD_OPTION',
    'ECONNABORTED',
    'ETIMEDOUT',
    'ERR_NETWORK',
    'ERR_FR_TOO_MANY_REDIRECTS',
    'ERR_DEPRECATED',
    'ERR_BAD_RESPONSE',
    'ERR_BAD_REQUEST',
    'ERR_CANCELED',
    'ERR_NOT_SUPPORT',
    'ERR_INVALID_URL'
  // eslint-disable-next-line func-names
  ].forEach(code => {
    descriptors[code] = {value: code};
  });

  Object.defineProperties(AxiosError, descriptors);
  Object.defineProperty(prototype, 'isAxiosError', {value: true});

  // eslint-disable-next-line func-names
  AxiosError.from = (error, code, config, request, response, customProps) => {
    const axiosError = Object.create(prototype);

    utils.toFlatObject(error, axiosError, function filter(obj) {
      return obj !== Error.prototype;
    }, prop => {
      return prop !== 'isAxiosError';
    });

    AxiosError.call(axiosError, error.message, code, config, request, response);

    axiosError.cause = error;

    axiosError.name = error.name;

    customProps && Object.assign(axiosError, customProps);

    return axiosError;
  };

  /* eslint-env browser */
  var browser = typeof self == 'object' ? self.FormData : window.FormData;

  /**
   * Determines if the given thing is a array or js object.
   *
   * @param {string} thing - The object or array to be visited.
   *
   * @returns {boolean}
   */
  function isVisitable(thing) {
    return utils.isPlainObject(thing) || utils.isArray(thing);
  }

  /**
   * It removes the brackets from the end of a string
   *
   * @param {string} key - The key of the parameter.
   *
   * @returns {string} the key without the brackets.
   */
  function removeBrackets(key) {
    return utils.endsWith(key, '[]') ? key.slice(0, -2) : key;
  }

  /**
   * It takes a path, a key, and a boolean, and returns a string
   *
   * @param {string} path - The path to the current key.
   * @param {string} key - The key of the current object being iterated over.
   * @param {string} dots - If true, the key will be rendered with dots instead of brackets.
   *
   * @returns {string} The path to the current key.
   */
  function renderKey(path, key, dots) {
    if (!path) return key;
    return path.concat(key).map(function each(token, i) {
      // eslint-disable-next-line no-param-reassign
      token = removeBrackets(token);
      return !dots && i ? '[' + token + ']' : token;
    }).join(dots ? '.' : '');
  }

  /**
   * If the array is an array and none of its elements are visitable, then it's a flat array.
   *
   * @param {Array<any>} arr - The array to check
   *
   * @returns {boolean}
   */
  function isFlatArray(arr) {
    return utils.isArray(arr) && !arr.some(isVisitable);
  }

  const predicates = utils.toFlatObject(utils, {}, null, function filter(prop) {
    return /^is[A-Z]/.test(prop);
  });

  /**
   * If the thing is a FormData object, return true, otherwise return false.
   *
   * @param {unknown} thing - The thing to check.
   *
   * @returns {boolean}
   */
  function isSpecCompliant(thing) {
    return thing && utils.isFunction(thing.append) && thing[Symbol.toStringTag] === 'FormData' && thing[Symbol.iterator];
  }

  /**
   * Convert a data object to FormData
   *
   * @param {Object} obj
   * @param {?Object} [formData]
   * @param {?Object} [options]
   * @param {Function} [options.visitor]
   * @param {Boolean} [options.metaTokens = true]
   * @param {Boolean} [options.dots = false]
   * @param {?Boolean} [options.indexes = false]
   *
   * @returns {Object}
   **/

  /**
   * It converts an object into a FormData object
   *
   * @param {Object<any, any>} obj - The object to convert to form data.
   * @param {string} formData - The FormData object to append to.
   * @param {Object<string, any>} options
   *
   * @returns
   */
  function toFormData(obj, formData, options) {
    if (!utils.isObject(obj)) {
      throw new TypeError('target must be an object');
    }

    // eslint-disable-next-line no-param-reassign
    formData = formData || new (browser || FormData)();

    // eslint-disable-next-line no-param-reassign
    options = utils.toFlatObject(options, {
      metaTokens: true,
      dots: false,
      indexes: false
    }, false, function defined(option, source) {
      // eslint-disable-next-line no-eq-null,eqeqeq
      return !utils.isUndefined(source[option]);
    });

    const metaTokens = options.metaTokens;
    // eslint-disable-next-line no-use-before-define
    const visitor = options.visitor || defaultVisitor;
    const dots = options.dots;
    const indexes = options.indexes;
    const _Blob = options.Blob || typeof Blob !== 'undefined' && Blob;
    const useBlob = _Blob && isSpecCompliant(formData);

    if (!utils.isFunction(visitor)) {
      throw new TypeError('visitor must be a function');
    }

    function convertValue(value) {
      if (value === null) return '';

      if (utils.isDate(value)) {
        return value.toISOString();
      }

      if (!useBlob && utils.isBlob(value)) {
        throw new AxiosError('Blob is not supported. Use a Buffer instead.');
      }

      if (utils.isArrayBuffer(value) || utils.isTypedArray(value)) {
        return useBlob && typeof Blob === 'function' ? new Blob([value]) : Buffer.from(value);
      }

      return value;
    }

    /**
     * Default visitor.
     *
     * @param {*} value
     * @param {String|Number} key
     * @param {Array<String|Number>} path
     * @this {FormData}
     *
     * @returns {boolean} return true to visit the each prop of the value recursively
     */
    function defaultVisitor(value, key, path) {
      let arr = value;

      if (value && !path && typeof value === 'object') {
        if (utils.endsWith(key, '{}')) {
          // eslint-disable-next-line no-param-reassign
          key = metaTokens ? key : key.slice(0, -2);
          // eslint-disable-next-line no-param-reassign
          value = JSON.stringify(value);
        } else if (
          (utils.isArray(value) && isFlatArray(value)) ||
          (utils.isFileList(value) || utils.endsWith(key, '[]') && (arr = utils.toArray(value))
          )) {
          // eslint-disable-next-line no-param-reassign
          key = removeBrackets(key);

          arr.forEach(function each(el, index) {
            !(utils.isUndefined(el) || el === null) && formData.append(
              // eslint-disable-next-line no-nested-ternary
              indexes === true ? renderKey([key], index, dots) : (indexes === null ? key : key + '[]'),
              convertValue(el)
            );
          });
          return false;
        }
      }

      if (isVisitable(value)) {
        return true;
      }

      formData.append(renderKey(path, key, dots), convertValue(value));

      return false;
    }

    const stack = [];

    const exposedHelpers = Object.assign(predicates, {
      defaultVisitor,
      convertValue,
      isVisitable
    });

    function build(value, path) {
      if (utils.isUndefined(value)) return;

      if (stack.indexOf(value) !== -1) {
        throw Error('Circular reference detected in ' + path.join('.'));
      }

      stack.push(value);

      utils.forEach(value, function each(el, key) {
        const result = !(utils.isUndefined(el) || el === null) && visitor.call(
          formData, el, utils.isString(key) ? key.trim() : key, path, exposedHelpers
        );

        if (result === true) {
          build(el, path ? path.concat(key) : [key]);
        }
      });

      stack.pop();
    }

    if (!utils.isObject(obj)) {
      throw new TypeError('data must be an object');
    }

    build(obj);

    return formData;
  }

  /**
   * It encodes a string by replacing all characters that are not in the unreserved set with
   * their percent-encoded equivalents
   *
   * @param {string} str - The string to encode.
   *
   * @returns {string} The encoded string.
   */
  function encode(str) {
    const charMap = {
      '!': '%21',
      "'": '%27',
      '(': '%28',
      ')': '%29',
      '~': '%7E',
      '%20': '+',
      '%00': '\x00'
    };
    return encodeURIComponent(str).replace(/[!'()~]|%20|%00/g, function replacer(match) {
      return charMap[match];
    });
  }

  /**
   * It takes a params object and converts it to a FormData object
   *
   * @param {Object<string, any>} params - The parameters to be converted to a FormData object.
   * @param {Object<string, any>} options - The options object passed to the Axios constructor.
   *
   * @returns {void}
   */
  function AxiosURLSearchParams(params, options) {
    this._pairs = [];

    params && toFormData(params, this, options);
  }

  const prototype$1 = AxiosURLSearchParams.prototype;

  prototype$1.append = function append(name, value) {
    this._pairs.push([name, value]);
  };

  prototype$1.toString = function toString(encoder) {
    const _encode = encoder ? function(value) {
      return encoder.call(this, value, encode);
    } : encode;

    return this._pairs.map(function each(pair) {
      return _encode(pair[0]) + '=' + _encode(pair[1]);
    }, '').join('&');
  };

  /**
   * It replaces all instances of the characters `:`, `$`, `,`, `+`, `[`, and `]` with their
   * URI encoded counterparts
   *
   * @param {string} val The value to be encoded.
   *
   * @returns {string} The encoded value.
   */
  function encode$1(val) {
    return encodeURIComponent(val).
      replace(/%3A/gi, ':').
      replace(/%24/g, '$').
      replace(/%2C/gi, ',').
      replace(/%20/g, '+').
      replace(/%5B/gi, '[').
      replace(/%5D/gi, ']');
  }

  /**
   * Build a URL by appending params to the end
   *
   * @param {string} url The base of the url (e.g., http://www.google.com)
   * @param {object} [params] The params to be appended
   * @param {?object} options
   *
   * @returns {string} The formatted url
   */
  function buildURL(url, params, options) {
    /*eslint no-param-reassign:0*/
    if (!params) {
      return url;
    }
    
    const _encode = options && options.encode || encode$1;

    const serializeFn = options && options.serialize;

    let serializedParams;

    if (serializeFn) {
      serializedParams = serializeFn(params, options);
    } else {
      serializedParams = utils.isURLSearchParams(params) ?
        params.toString() :
        new AxiosURLSearchParams(params, options).toString(_encode);
    }

    if (serializedParams) {
      const hashmarkIndex = url.indexOf("#");

      if (hashmarkIndex !== -1) {
        url = url.slice(0, hashmarkIndex);
      }
      url += (url.indexOf('?') === -1 ? '?' : '&') + serializedParams;
    }

    return url;
  }

  class InterceptorManager {
    constructor() {
      this.handlers = [];
    }

    /**
     * Add a new interceptor to the stack
     *
     * @param {Function} fulfilled The function to handle `then` for a `Promise`
     * @param {Function} rejected The function to handle `reject` for a `Promise`
     *
     * @return {Number} An ID used to remove interceptor later
     */
    use(fulfilled, rejected, options) {
      this.handlers.push({
        fulfilled,
        rejected,
        synchronous: options ? options.synchronous : false,
        runWhen: options ? options.runWhen : null
      });
      return this.handlers.length - 1;
    }

    /**
     * Remove an interceptor from the stack
     *
     * @param {Number} id The ID that was returned by `use`
     *
     * @returns {Boolean} `true` if the interceptor was removed, `false` otherwise
     */
    eject(id) {
      if (this.handlers[id]) {
        this.handlers[id] = null;
      }
    }

    /**
     * Clear all interceptors from the stack
     *
     * @returns {void}
     */
    clear() {
      if (this.handlers) {
        this.handlers = [];
      }
    }

    /**
     * Iterate over all the registered interceptors
     *
     * This method is particularly useful for skipping over any
     * interceptors that may have become `null` calling `eject`.
     *
     * @param {Function} fn The function to call for each interceptor
     *
     * @returns {void}
     */
    forEach(fn) {
      utils.forEach(this.handlers, function forEachHandler(h) {
        if (h !== null) {
          fn(h);
        }
      });
    }
  }

  var transitionalDefaults = {
    silentJSONParsing: true,
    forcedJSONParsing: true,
    clarifyTimeoutError: false
  };

  var URLSearchParams$1 = typeof URLSearchParams !== 'undefined' ? URLSearchParams : AxiosURLSearchParams;

  /**
   * Determine if we're running in a standard browser environment
   *
   * This allows axios to run in a web worker, and react-native.
   * Both environments support XMLHttpRequest, but not fully standard globals.
   *
   * web workers:
   *  typeof window -> undefined
   *  typeof document -> undefined
   *
   * react-native:
   *  navigator.product -> 'ReactNative'
   * nativescript
   *  navigator.product -> 'NativeScript' or 'NS'
   *
   * @returns {boolean}
   */
  const isStandardBrowserEnv = (() => {
    let product;
    if (typeof navigator !== 'undefined' && (
      (product = navigator.product) === 'ReactNative' ||
      product === 'NativeScript' ||
      product === 'NS')
    ) {
      return false;
    }

    return typeof window !== 'undefined' && typeof document !== 'undefined';
  })();

  var platform = {
    isBrowser: true,
    classes: {
      URLSearchParams: URLSearchParams$1,
      FormData,
      Blob
    },
    isStandardBrowserEnv,
    protocols: ['http', 'https', 'file', 'blob', 'url', 'data']
  };

  function toURLEncodedForm(data, options) {
    return toFormData(data, new platform.classes.URLSearchParams(), Object.assign({
      visitor: function(value, key, path, helpers) {

        return helpers.defaultVisitor.apply(this, arguments);
      }
    }, options));
  }

  /**
   * It takes a string like `foo[x][y][z]` and returns an array like `['foo', 'x', 'y', 'z']
   *
   * @param {string} name - The name of the property to get.
   *
   * @returns An array of strings.
   */
  function parsePropPath(name) {
    // foo[x][y][z]
    // foo.x.y.z
    // foo-x-y-z
    // foo x y z
    return utils.matchAll(/\w+|\[(\w*)]/g, name).map(match => {
      return match[0] === '[]' ? '' : match[1] || match[0];
    });
  }

  /**
   * Convert an array to an object.
   *
   * @param {Array<any>} arr - The array to convert to an object.
   *
   * @returns An object with the same keys and values as the array.
   */
  function arrayToObject(arr) {
    const obj = {};
    const keys = Object.keys(arr);
    let i;
    const len = keys.length;
    let key;
    for (i = 0; i < len; i++) {
      key = keys[i];
      obj[key] = arr[key];
    }
    return obj;
  }

  /**
   * It takes a FormData object and returns a JavaScript object
   *
   * @param {string} formData The FormData object to convert to JSON.
   *
   * @returns {Object<string, any> | null} The converted object.
   */
  function formDataToJSON(formData) {
    function buildPath(path, value, target, index) {
      let name = path[index++];
      const isNumericKey = Number.isFinite(+name);
      const isLast = index >= path.length;
      name = !name && utils.isArray(target) ? target.length : name;

      if (isLast) {
        if (utils.hasOwnProp(target, name)) {
          target[name] = [target[name], value];
        } else {
          target[name] = value;
        }

        return !isNumericKey;
      }

      if (!target[name] || !utils.isObject(target[name])) {
        target[name] = [];
      }

      const result = buildPath(path, value, target[name], index);

      if (result && utils.isArray(target[name])) {
        target[name] = arrayToObject(target[name]);
      }

      return !isNumericKey;
    }

    if (utils.isFormData(formData) && utils.isFunction(formData.entries)) {
      const obj = {};

      utils.forEachEntry(formData, (name, value) => {
        buildPath(parsePropPath(name), value, obj, 0);
      });

      return obj;
    }

    return null;
  }

  /**
   * Resolve or reject a Promise based on response status.
   *
   * @param {Function} resolve A function that resolves the promise.
   * @param {Function} reject A function that rejects the promise.
   * @param {object} response The response.
   *
   * @returns {object} The response.
   */
  function settle(resolve, reject, response) {
    const validateStatus = response.config.validateStatus;
    if (!response.status || !validateStatus || validateStatus(response.status)) {
      resolve(response);
    } else {
      reject(new AxiosError(
        'Request failed with status code ' + response.status,
        [AxiosError.ERR_BAD_REQUEST, AxiosError.ERR_BAD_RESPONSE][Math.floor(response.status / 100) - 4],
        response.config,
        response.request,
        response
      ));
    }
  }

  var cookies = platform.isStandardBrowserEnv ?

  // Standard browser envs support document.cookie
    (function standardBrowserEnv() {
      return {
        write: function write(name, value, expires, path, domain, secure) {
          const cookie = [];
          cookie.push(name + '=' + encodeURIComponent(value));

          if (utils.isNumber(expires)) {
            cookie.push('expires=' + new Date(expires).toGMTString());
          }

          if (utils.isString(path)) {
            cookie.push('path=' + path);
          }

          if (utils.isString(domain)) {
            cookie.push('domain=' + domain);
          }

          if (secure === true) {
            cookie.push('secure');
          }

          document.cookie = cookie.join('; ');
        },

        read: function read(name) {
          const match = document.cookie.match(new RegExp('(^|;\\s*)(' + name + ')=([^;]*)'));
          return (match ? decodeURIComponent(match[3]) : null);
        },

        remove: function remove(name) {
          this.write(name, '', Date.now() - 86400000);
        }
      };
    })() :

  // Non standard browser env (web workers, react-native) lack needed support.
    (function nonStandardBrowserEnv() {
      return {
        write: function write() {},
        read: function read() { return null; },
        remove: function remove() {}
      };
    })();

  /**
   * Determines whether the specified URL is absolute
   *
   * @param {string} url The URL to test
   *
   * @returns {boolean} True if the specified URL is absolute, otherwise false
   */
  function isAbsoluteURL(url) {
    // A URL is considered absolute if it begins with "<scheme>://" or "//" (protocol-relative URL).
    // RFC 3986 defines scheme name as a sequence of characters beginning with a letter and followed
    // by any combination of letters, digits, plus, period, or hyphen.
    return /^([a-z][a-z\d+\-.]*:)?\/\//i.test(url);
  }

  /**
   * Creates a new URL by combining the specified URLs
   *
   * @param {string} baseURL The base URL
   * @param {string} relativeURL The relative URL
   *
   * @returns {string} The combined URL
   */
  function combineURLs(baseURL, relativeURL) {
    return relativeURL
      ? baseURL.replace(/\/+$/, '') + '/' + relativeURL.replace(/^\/+/, '')
      : baseURL;
  }

  /**
   * Creates a new URL by combining the baseURL with the requestedURL,
   * only when the requestedURL is not already an absolute URL.
   * If the requestURL is absolute, this function returns the requestedURL untouched.
   *
   * @param {string} baseURL The base URL
   * @param {string} requestedURL Absolute or relative URL to combine
   *
   * @returns {string} The combined full path
   */
  function buildFullPath(baseURL, requestedURL) {
    if (baseURL && !isAbsoluteURL(requestedURL)) {
      return combineURLs(baseURL, requestedURL);
    }
    return requestedURL;
  }

  var isURLSameOrigin = platform.isStandardBrowserEnv ?

  // Standard browser envs have full support of the APIs needed to test
  // whether the request URL is of the same origin as current location.
    (function standardBrowserEnv() {
      const msie = /(msie|trident)/i.test(navigator.userAgent);
      const urlParsingNode = document.createElement('a');
      let originURL;

      /**
      * Parse a URL to discover it's components
      *
      * @param {String} url The URL to be parsed
      * @returns {Object}
      */
      function resolveURL(url) {
        let href = url;

        if (msie) {
          // IE needs attribute set twice to normalize properties
          urlParsingNode.setAttribute('href', href);
          href = urlParsingNode.href;
        }

        urlParsingNode.setAttribute('href', href);

        // urlParsingNode provides the UrlUtils interface - http://url.spec.whatwg.org/#urlutils
        return {
          href: urlParsingNode.href,
          protocol: urlParsingNode.protocol ? urlParsingNode.protocol.replace(/:$/, '') : '',
          host: urlParsingNode.host,
          search: urlParsingNode.search ? urlParsingNode.search.replace(/^\?/, '') : '',
          hash: urlParsingNode.hash ? urlParsingNode.hash.replace(/^#/, '') : '',
          hostname: urlParsingNode.hostname,
          port: urlParsingNode.port,
          pathname: (urlParsingNode.pathname.charAt(0) === '/') ?
            urlParsingNode.pathname :
            '/' + urlParsingNode.pathname
        };
      }

      originURL = resolveURL(window.location.href);

      /**
      * Determine if a URL shares the same origin as the current location
      *
      * @param {String} requestURL The URL to test
      * @returns {boolean} True if URL shares the same origin, otherwise false
      */
      return function isURLSameOrigin(requestURL) {
        const parsed = (utils.isString(requestURL)) ? resolveURL(requestURL) : requestURL;
        return (parsed.protocol === originURL.protocol &&
            parsed.host === originURL.host);
      };
    })() :

    // Non standard browser envs (web workers, react-native) lack needed support.
    (function nonStandardBrowserEnv() {
      return function isURLSameOrigin() {
        return true;
      };
    })();

  /**
   * A `CanceledError` is an object that is thrown when an operation is canceled.
   *
   * @param {string=} message The message.
   * @param {Object=} config The config.
   * @param {Object=} request The request.
   *
   * @returns {CanceledError} The created error.
   */
  function CanceledError(message, config, request) {
    // eslint-disable-next-line no-eq-null,eqeqeq
    AxiosError.call(this, message == null ? 'canceled' : message, AxiosError.ERR_CANCELED, config, request);
    this.name = 'CanceledError';
  }

  utils.inherits(CanceledError, AxiosError, {
    __CANCEL__: true
  });

  function parseProtocol(url) {
    const match = /^([-+\w]{1,25})(:?\/\/|:)/.exec(url);
    return match && match[1] || '';
  }

  // RawAxiosHeaders whose duplicates are ignored by node
  // c.f. https://nodejs.org/api/http.html#http_message_headers
  const ignoreDuplicateOf = utils.toObjectSet([
    'age', 'authorization', 'content-length', 'content-type', 'etag',
    'expires', 'from', 'host', 'if-modified-since', 'if-unmodified-since',
    'last-modified', 'location', 'max-forwards', 'proxy-authorization',
    'referer', 'retry-after', 'user-agent'
  ]);

  /**
   * Parse headers into an object
   *
   * ```
   * Date: Wed, 27 Aug 2014 08:58:49 GMT
   * Content-Type: application/json
   * Connection: keep-alive
   * Transfer-Encoding: chunked
   * ```
   *
   * @param {String} rawHeaders Headers needing to be parsed
   *
   * @returns {Object} Headers parsed into an object
   */
  var parseHeaders = rawHeaders => {
    const parsed = {};
    let key;
    let val;
    let i;

    rawHeaders && rawHeaders.split('\n').forEach(function parser(line) {
      i = line.indexOf(':');
      key = line.substring(0, i).trim().toLowerCase();
      val = line.substring(i + 1).trim();

      if (!key || (parsed[key] && ignoreDuplicateOf[key])) {
        return;
      }

      if (key === 'set-cookie') {
        if (parsed[key]) {
          parsed[key].push(val);
        } else {
          parsed[key] = [val];
        }
      } else {
        parsed[key] = parsed[key] ? parsed[key] + ', ' + val : val;
      }
    });

    return parsed;
  };

  const $internals = Symbol('internals');
  const $defaults = Symbol('defaults');

  function normalizeHeader(header) {
    return header && String(header).trim().toLowerCase();
  }

  function normalizeValue(value) {
    if (value === false || value == null) {
      return value;
    }

    return utils.isArray(value) ? value.map(normalizeValue) : String(value);
  }

  function parseTokens(str) {
    const tokens = Object.create(null);
    const tokensRE = /([^\s,;=]+)\s*(?:=\s*([^,;]+))?/g;
    let match;

    while ((match = tokensRE.exec(str))) {
      tokens[match[1]] = match[2];
    }

    return tokens;
  }

  function matchHeaderValue(context, value, header, filter) {
    if (utils.isFunction(filter)) {
      return filter.call(this, value, header);
    }

    if (!utils.isString(value)) return;

    if (utils.isString(filter)) {
      return value.indexOf(filter) !== -1;
    }

    if (utils.isRegExp(filter)) {
      return filter.test(value);
    }
  }

  function formatHeader(header) {
    return header.trim()
      .toLowerCase().replace(/([a-z\d])(\w*)/g, (w, char, str) => {
        return char.toUpperCase() + str;
      });
  }

  function buildAccessors(obj, header) {
    const accessorName = utils.toCamelCase(' ' + header);

    ['get', 'set', 'has'].forEach(methodName => {
      Object.defineProperty(obj, methodName + accessorName, {
        value: function(arg1, arg2, arg3) {
          return this[methodName].call(this, header, arg1, arg2, arg3);
        },
        configurable: true
      });
    });
  }

  function findKey(obj, key) {
    key = key.toLowerCase();
    const keys = Object.keys(obj);
    let i = keys.length;
    let _key;
    while (i-- > 0) {
      _key = keys[i];
      if (key === _key.toLowerCase()) {
        return _key;
      }
    }
    return null;
  }

  function AxiosHeaders(headers, defaults) {
    headers && this.set(headers);
    this[$defaults] = defaults || null;
  }

  Object.assign(AxiosHeaders.prototype, {
    set: function(header, valueOrRewrite, rewrite) {
      const self = this;

      function setHeader(_value, _header, _rewrite) {
        const lHeader = normalizeHeader(_header);

        if (!lHeader) {
          throw new Error('header name must be a non-empty string');
        }

        const key = findKey(self, lHeader);

        if (key && _rewrite !== true && (self[key] === false || _rewrite === false)) {
          return;
        }

        self[key || _header] = normalizeValue(_value);
      }

      if (utils.isPlainObject(header)) {
        utils.forEach(header, (_value, _header) => {
          setHeader(_value, _header, valueOrRewrite);
        });
      } else {
        setHeader(valueOrRewrite, header, rewrite);
      }

      return this;
    },

    get: function(header, parser) {
      header = normalizeHeader(header);

      if (!header) return undefined;

      const key = findKey(this, header);

      if (key) {
        const value = this[key];

        if (!parser) {
          return value;
        }

        if (parser === true) {
          return parseTokens(value);
        }

        if (utils.isFunction(parser)) {
          return parser.call(this, value, key);
        }

        if (utils.isRegExp(parser)) {
          return parser.exec(value);
        }

        throw new TypeError('parser must be boolean|regexp|function');
      }
    },

    has: function(header, matcher) {
      header = normalizeHeader(header);

      if (header) {
        const key = findKey(this, header);

        return !!(key && (!matcher || matchHeaderValue(this, this[key], key, matcher)));
      }

      return false;
    },

    delete: function(header, matcher) {
      const self = this;
      let deleted = false;

      function deleteHeader(_header) {
        _header = normalizeHeader(_header);

        if (_header) {
          const key = findKey(self, _header);

          if (key && (!matcher || matchHeaderValue(self, self[key], key, matcher))) {
            delete self[key];

            deleted = true;
          }
        }
      }

      if (utils.isArray(header)) {
        header.forEach(deleteHeader);
      } else {
        deleteHeader(header);
      }

      return deleted;
    },

    clear: function() {
      return Object.keys(this).forEach(this.delete.bind(this));
    },

    normalize: function(format) {
      const self = this;
      const headers = {};

      utils.forEach(this, (value, header) => {
        const key = findKey(headers, header);

        if (key) {
          self[key] = normalizeValue(value);
          delete self[header];
          return;
        }

        const normalized = format ? formatHeader(header) : String(header).trim();

        if (normalized !== header) {
          delete self[header];
        }

        self[normalized] = normalizeValue(value);

        headers[normalized] = true;
      });

      return this;
    },

    toJSON: function(asStrings) {
      const obj = Object.create(null);

      utils.forEach(Object.assign({}, this[$defaults] || null, this),
        (value, header) => {
          if (value == null || value === false) return;
          obj[header] = asStrings && utils.isArray(value) ? value.join(', ') : value;
        });

      return obj;
    }
  });

  Object.assign(AxiosHeaders, {
    from: function(thing) {
      if (utils.isString(thing)) {
        return new this(parseHeaders(thing));
      }
      return thing instanceof this ? thing : new this(thing);
    },

    accessor: function(header) {
      const internals = this[$internals] = (this[$internals] = {
        accessors: {}
      });

      const accessors = internals.accessors;
      const prototype = this.prototype;

      function defineAccessor(_header) {
        const lHeader = normalizeHeader(_header);

        if (!accessors[lHeader]) {
          buildAccessors(prototype, _header);
          accessors[lHeader] = true;
        }
      }

      utils.isArray(header) ? header.forEach(defineAccessor) : defineAccessor(header);

      return this;
    }
  });

  AxiosHeaders.accessor(['Content-Type', 'Content-Length', 'Accept', 'Accept-Encoding', 'User-Agent']);

  utils.freezeMethods(AxiosHeaders.prototype);
  utils.freezeMethods(AxiosHeaders);

  /**
   * Calculate data maxRate
   * @param {Number} [samplesCount= 10]
   * @param {Number} [min= 1000]
   * @returns {Function}
   */
  function speedometer(samplesCount, min) {
    samplesCount = samplesCount || 10;
    const bytes = new Array(samplesCount);
    const timestamps = new Array(samplesCount);
    let head = 0;
    let tail = 0;
    let firstSampleTS;

    min = min !== undefined ? min : 1000;

    return function push(chunkLength) {
      const now = Date.now();

      const startedAt = timestamps[tail];

      if (!firstSampleTS) {
        firstSampleTS = now;
      }

      bytes[head] = chunkLength;
      timestamps[head] = now;

      let i = tail;
      let bytesCount = 0;

      while (i !== head) {
        bytesCount += bytes[i++];
        i = i % samplesCount;
      }

      head = (head + 1) % samplesCount;

      if (head === tail) {
        tail = (tail + 1) % samplesCount;
      }

      if (now - firstSampleTS < min) {
        return;
      }

      const passed = startedAt && now - startedAt;

      return  passed ? Math.round(bytesCount * 1000 / passed) : undefined;
    };
  }

  function progressEventReducer(listener, isDownloadStream) {
    let bytesNotified = 0;
    const _speedometer = speedometer(50, 250);

    return e => {
      const loaded = e.loaded;
      const total = e.lengthComputable ? e.total : undefined;
      const progressBytes = loaded - bytesNotified;
      const rate = _speedometer(progressBytes);
      const inRange = loaded <= total;

      bytesNotified = loaded;

      const data = {
        loaded,
        total,
        progress: total ? (loaded / total) : undefined,
        bytes: progressBytes,
        rate: rate ? rate : undefined,
        estimated: rate && total && inRange ? (total - loaded) / rate : undefined
      };

      data[isDownloadStream ? 'download' : 'upload'] = true;

      listener(data);
    };
  }

  function xhrAdapter(config) {
    return new Promise(function dispatchXhrRequest(resolve, reject) {
      let requestData = config.data;
      const requestHeaders = AxiosHeaders.from(config.headers).normalize();
      const responseType = config.responseType;
      let onCanceled;
      function done() {
        if (config.cancelToken) {
          config.cancelToken.unsubscribe(onCanceled);
        }

        if (config.signal) {
          config.signal.removeEventListener('abort', onCanceled);
        }
      }

      if (utils.isFormData(requestData) && platform.isStandardBrowserEnv) {
        requestHeaders.setContentType(false); // Let the browser set it
      }

      let request = new XMLHttpRequest();

      // HTTP basic authentication
      if (config.auth) {
        const username = config.auth.username || '';
        const password = config.auth.password ? unescape(encodeURIComponent(config.auth.password)) : '';
        requestHeaders.set('Authorization', 'Basic ' + btoa(username + ':' + password));
      }

      const fullPath = buildFullPath(config.baseURL, config.url);

      request.open(config.method.toUpperCase(), buildURL(fullPath, config.params, config.paramsSerializer), true);

      // Set the request timeout in MS
      request.timeout = config.timeout;

      function onloadend() {
        if (!request) {
          return;
        }
        // Prepare the response
        const responseHeaders = AxiosHeaders.from(
          'getAllResponseHeaders' in request && request.getAllResponseHeaders()
        );
        const responseData = !responseType || responseType === 'text' ||  responseType === 'json' ?
          request.responseText : request.response;
        const response = {
          data: responseData,
          status: request.status,
          statusText: request.statusText,
          headers: responseHeaders,
          config,
          request
        };

        settle(function _resolve(value) {
          resolve(value);
          done();
        }, function _reject(err) {
          reject(err);
          done();
        }, response);

        // Clean up request
        request = null;
      }

      if ('onloadend' in request) {
        // Use onloadend if available
        request.onloadend = onloadend;
      } else {
        // Listen for ready state to emulate onloadend
        request.onreadystatechange = function handleLoad() {
          if (!request || request.readyState !== 4) {
            return;
          }

          // The request errored out and we didn't get a response, this will be
          // handled by onerror instead
          // With one exception: request that using file: protocol, most browsers
          // will return status as 0 even though it's a successful request
          if (request.status === 0 && !(request.responseURL && request.responseURL.indexOf('file:') === 0)) {
            return;
          }
          // readystate handler is calling before onerror or ontimeout handlers,
          // so we should call onloadend on the next 'tick'
          setTimeout(onloadend);
        };
      }

      // Handle browser request cancellation (as opposed to a manual cancellation)
      request.onabort = function handleAbort() {
        if (!request) {
          return;
        }

        reject(new AxiosError('Request aborted', AxiosError.ECONNABORTED, config, request));

        // Clean up request
        request = null;
      };

      // Handle low level network errors
      request.onerror = function handleError() {
        // Real errors are hidden from us by the browser
        // onerror should only fire if it's a network error
        reject(new AxiosError('Network Error', AxiosError.ERR_NETWORK, config, request));

        // Clean up request
        request = null;
      };

      // Handle timeout
      request.ontimeout = function handleTimeout() {
        let timeoutErrorMessage = config.timeout ? 'timeout of ' + config.timeout + 'ms exceeded' : 'timeout exceeded';
        const transitional = config.transitional || transitionalDefaults;
        if (config.timeoutErrorMessage) {
          timeoutErrorMessage = config.timeoutErrorMessage;
        }
        reject(new AxiosError(
          timeoutErrorMessage,
          transitional.clarifyTimeoutError ? AxiosError.ETIMEDOUT : AxiosError.ECONNABORTED,
          config,
          request));

        // Clean up request
        request = null;
      };

      // Add xsrf header
      // This is only done if running in a standard browser environment.
      // Specifically not if we're in a web worker, or react-native.
      if (platform.isStandardBrowserEnv) {
        // Add xsrf header
        const xsrfValue = (config.withCredentials || isURLSameOrigin(fullPath))
          && config.xsrfCookieName && cookies.read(config.xsrfCookieName);

        if (xsrfValue) {
          requestHeaders.set(config.xsrfHeaderName, xsrfValue);
        }
      }

      // Remove Content-Type if data is undefined
      requestData === undefined && requestHeaders.setContentType(null);

      // Add headers to the request
      if ('setRequestHeader' in request) {
        utils.forEach(requestHeaders.toJSON(), function setRequestHeader(val, key) {
          request.setRequestHeader(key, val);
        });
      }

      // Add withCredentials to request if needed
      if (!utils.isUndefined(config.withCredentials)) {
        request.withCredentials = !!config.withCredentials;
      }

      // Add responseType to request if needed
      if (responseType && responseType !== 'json') {
        request.responseType = config.responseType;
      }

      // Handle progress if needed
      if (typeof config.onDownloadProgress === 'function') {
        request.addEventListener('progress', progressEventReducer(config.onDownloadProgress, true));
      }

      // Not all browsers support upload events
      if (typeof config.onUploadProgress === 'function' && request.upload) {
        request.upload.addEventListener('progress', progressEventReducer(config.onUploadProgress));
      }

      if (config.cancelToken || config.signal) {
        // Handle cancellation
        // eslint-disable-next-line func-names
        onCanceled = cancel => {
          if (!request) {
            return;
          }
          reject(!cancel || cancel.type ? new CanceledError(null, config, request) : cancel);
          request.abort();
          request = null;
        };

        config.cancelToken && config.cancelToken.subscribe(onCanceled);
        if (config.signal) {
          config.signal.aborted ? onCanceled() : config.signal.addEventListener('abort', onCanceled);
        }
      }

      const protocol = parseProtocol(fullPath);

      if (protocol && platform.protocols.indexOf(protocol) === -1) {
        reject(new AxiosError('Unsupported protocol ' + protocol + ':', AxiosError.ERR_BAD_REQUEST, config));
        return;
      }


      // Send the request
      request.send(requestData || null);
    });
  }

  const adapters = {
    http: xhrAdapter,
    xhr: xhrAdapter
  };

  var adapters$1 = {
    getAdapter: (nameOrAdapter) => {
      if(utils.isString(nameOrAdapter)){
        const adapter = adapters[nameOrAdapter];

        if (!nameOrAdapter) {
          throw Error(
            utils.hasOwnProp(nameOrAdapter) ?
              `Adapter '${nameOrAdapter}' is not available in the build` :
              `Can not resolve adapter '${nameOrAdapter}'`
          );
        }

        return adapter
      }

      if (!utils.isFunction(nameOrAdapter)) {
        throw new TypeError('adapter is not a function');
      }

      return nameOrAdapter;
    },
    adapters
  };

  const DEFAULT_CONTENT_TYPE = {
    'Content-Type': 'application/x-www-form-urlencoded'
  };

  /**
   * If the browser has an XMLHttpRequest object, use the XHR adapter, otherwise use the HTTP
   * adapter
   *
   * @returns {Function}
   */
  function getDefaultAdapter() {
    let adapter;
    if (typeof XMLHttpRequest !== 'undefined') {
      // For browsers use XHR adapter
      adapter = adapters$1.getAdapter('xhr');
    } else if (typeof process !== 'undefined' && utils.kindOf(process) === 'process') {
      // For node use HTTP adapter
      adapter = adapters$1.getAdapter('http');
    }
    return adapter;
  }

  /**
   * It takes a string, tries to parse it, and if it fails, it returns the stringified version
   * of the input
   *
   * @param {any} rawValue - The value to be stringified.
   * @param {Function} parser - A function that parses a string into a JavaScript object.
   * @param {Function} encoder - A function that takes a value and returns a string.
   *
   * @returns {string} A stringified version of the rawValue.
   */
  function stringifySafely(rawValue, parser, encoder) {
    if (utils.isString(rawValue)) {
      try {
        (parser || JSON.parse)(rawValue);
        return utils.trim(rawValue);
      } catch (e) {
        if (e.name !== 'SyntaxError') {
          throw e;
        }
      }
    }

    return (encoder || JSON.stringify)(rawValue);
  }

  const defaults = {

    transitional: transitionalDefaults,

    adapter: getDefaultAdapter(),

    transformRequest: [function transformRequest(data, headers) {
      const contentType = headers.getContentType() || '';
      const hasJSONContentType = contentType.indexOf('application/json') > -1;
      const isObjectPayload = utils.isObject(data);

      if (isObjectPayload && utils.isHTMLForm(data)) {
        data = new FormData(data);
      }

      const isFormData = utils.isFormData(data);

      if (isFormData) {
        if (!hasJSONContentType) {
          return data;
        }
        return hasJSONContentType ? JSON.stringify(formDataToJSON(data)) : data;
      }

      if (utils.isArrayBuffer(data) ||
        utils.isBuffer(data) ||
        utils.isStream(data) ||
        utils.isFile(data) ||
        utils.isBlob(data)
      ) {
        return data;
      }
      if (utils.isArrayBufferView(data)) {
        return data.buffer;
      }
      if (utils.isURLSearchParams(data)) {
        headers.setContentType('application/x-www-form-urlencoded;charset=utf-8', false);
        return data.toString();
      }

      let isFileList;

      if (isObjectPayload) {
        if (contentType.indexOf('application/x-www-form-urlencoded') > -1) {
          return toURLEncodedForm(data, this.formSerializer).toString();
        }

        if ((isFileList = utils.isFileList(data)) || contentType.indexOf('multipart/form-data') > -1) {
          const _FormData = this.env && this.env.FormData;

          return toFormData(
            isFileList ? {'files[]': data} : data,
            _FormData && new _FormData(),
            this.formSerializer
          );
        }
      }

      if (isObjectPayload || hasJSONContentType ) {
        headers.setContentType('application/json', false);
        return stringifySafely(data);
      }

      return data;
    }],

    transformResponse: [function transformResponse(data) {
      const transitional = this.transitional || defaults.transitional;
      const forcedJSONParsing = transitional && transitional.forcedJSONParsing;
      const JSONRequested = this.responseType === 'json';

      if (data && utils.isString(data) && ((forcedJSONParsing && !this.responseType) || JSONRequested)) {
        const silentJSONParsing = transitional && transitional.silentJSONParsing;
        const strictJSONParsing = !silentJSONParsing && JSONRequested;

        try {
          return JSON.parse(data);
        } catch (e) {
          if (strictJSONParsing) {
            if (e.name === 'SyntaxError') {
              throw AxiosError.from(e, AxiosError.ERR_BAD_RESPONSE, this, null, this.response);
            }
            throw e;
          }
        }
      }

      return data;
    }],

    /**
     * A timeout in milliseconds to abort a request. If set to 0 (default) a
     * timeout is not created.
     */
    timeout: 0,

    xsrfCookieName: 'XSRF-TOKEN',
    xsrfHeaderName: 'X-XSRF-TOKEN',

    maxContentLength: -1,
    maxBodyLength: -1,

    env: {
      FormData: platform.classes.FormData,
      Blob: platform.classes.Blob
    },

    validateStatus: function validateStatus(status) {
      return status >= 200 && status < 300;
    },

    headers: {
      common: {
        'Accept': 'application/json, text/plain, */*'
      }
    }
  };

  utils.forEach(['delete', 'get', 'head'], function forEachMethodNoData(method) {
    defaults.headers[method] = {};
  });

  utils.forEach(['post', 'put', 'patch'], function forEachMethodWithData(method) {
    defaults.headers[method] = utils.merge(DEFAULT_CONTENT_TYPE);
  });

  /**
   * Transform the data for a request or a response
   *
   * @param {Array|Function} fns A single function or Array of functions
   * @param {?Object} response The response object
   *
   * @returns {*} The resulting transformed data
   */
  function transformData(fns, response) {
    const config = this || defaults;
    const context = response || config;
    const headers = AxiosHeaders.from(context.headers);
    let data = context.data;

    utils.forEach(fns, function transform(fn) {
      data = fn.call(config, data, headers.normalize(), response ? response.status : undefined);
    });

    headers.normalize();

    return data;
  }

  function isCancel(value) {
    return !!(value && value.__CANCEL__);
  }

  /**
   * Throws a `CanceledError` if cancellation has been requested.
   *
   * @param {Object} config The config that is to be used for the request
   *
   * @returns {void}
   */
  function throwIfCancellationRequested(config) {
    if (config.cancelToken) {
      config.cancelToken.throwIfRequested();
    }

    if (config.signal && config.signal.aborted) {
      throw new CanceledError();
    }
  }

  /**
   * Dispatch a request to the server using the configured adapter.
   *
   * @param {object} config The config that is to be used for the request
   *
   * @returns {Promise} The Promise to be fulfilled
   */
  function dispatchRequest(config) {
    throwIfCancellationRequested(config);

    config.headers = AxiosHeaders.from(config.headers);

    // Transform request data
    config.data = transformData.call(
      config,
      config.transformRequest
    );

    const adapter = config.adapter || defaults.adapter;

    return adapter(config).then(function onAdapterResolution(response) {
      throwIfCancellationRequested(config);

      // Transform response data
      response.data = transformData.call(
        config,
        config.transformResponse,
        response
      );

      response.headers = AxiosHeaders.from(response.headers);

      return response;
    }, function onAdapterRejection(reason) {
      if (!isCancel(reason)) {
        throwIfCancellationRequested(config);

        // Transform response data
        if (reason && reason.response) {
          reason.response.data = transformData.call(
            config,
            config.transformResponse,
            reason.response
          );
          reason.response.headers = AxiosHeaders.from(reason.response.headers);
        }
      }

      return Promise.reject(reason);
    });
  }

  /**
   * Config-specific merge-function which creates a new config-object
   * by merging two configuration objects together.
   *
   * @param {Object} config1
   * @param {Object} config2
   *
   * @returns {Object} New object resulting from merging config2 to config1
   */
  function mergeConfig(config1, config2) {
    // eslint-disable-next-line no-param-reassign
    config2 = config2 || {};
    const config = {};

    function getMergedValue(target, source) {
      if (utils.isPlainObject(target) && utils.isPlainObject(source)) {
        return utils.merge(target, source);
      } else if (utils.isPlainObject(source)) {
        return utils.merge({}, source);
      } else if (utils.isArray(source)) {
        return source.slice();
      }
      return source;
    }

    // eslint-disable-next-line consistent-return
    function mergeDeepProperties(prop) {
      if (!utils.isUndefined(config2[prop])) {
        return getMergedValue(config1[prop], config2[prop]);
      } else if (!utils.isUndefined(config1[prop])) {
        return getMergedValue(undefined, config1[prop]);
      }
    }

    // eslint-disable-next-line consistent-return
    function valueFromConfig2(prop) {
      if (!utils.isUndefined(config2[prop])) {
        return getMergedValue(undefined, config2[prop]);
      }
    }

    // eslint-disable-next-line consistent-return
    function defaultToConfig2(prop) {
      if (!utils.isUndefined(config2[prop])) {
        return getMergedValue(undefined, config2[prop]);
      } else if (!utils.isUndefined(config1[prop])) {
        return getMergedValue(undefined, config1[prop]);
      }
    }

    // eslint-disable-next-line consistent-return
    function mergeDirectKeys(prop) {
      if (prop in config2) {
        return getMergedValue(config1[prop], config2[prop]);
      } else if (prop in config1) {
        return getMergedValue(undefined, config1[prop]);
      }
    }

    const mergeMap = {
      'url': valueFromConfig2,
      'method': valueFromConfig2,
      'data': valueFromConfig2,
      'baseURL': defaultToConfig2,
      'transformRequest': defaultToConfig2,
      'transformResponse': defaultToConfig2,
      'paramsSerializer': defaultToConfig2,
      'timeout': defaultToConfig2,
      'timeoutMessage': defaultToConfig2,
      'withCredentials': defaultToConfig2,
      'adapter': defaultToConfig2,
      'responseType': defaultToConfig2,
      'xsrfCookieName': defaultToConfig2,
      'xsrfHeaderName': defaultToConfig2,
      'onUploadProgress': defaultToConfig2,
      'onDownloadProgress': defaultToConfig2,
      'decompress': defaultToConfig2,
      'maxContentLength': defaultToConfig2,
      'maxBodyLength': defaultToConfig2,
      'beforeRedirect': defaultToConfig2,
      'transport': defaultToConfig2,
      'httpAgent': defaultToConfig2,
      'httpsAgent': defaultToConfig2,
      'cancelToken': defaultToConfig2,
      'socketPath': defaultToConfig2,
      'responseEncoding': defaultToConfig2,
      'validateStatus': mergeDirectKeys
    };

    utils.forEach(Object.keys(config1).concat(Object.keys(config2)), function computeConfigValue(prop) {
      const merge = mergeMap[prop] || mergeDeepProperties;
      const configValue = merge(prop);
      (utils.isUndefined(configValue) && merge !== mergeDirectKeys) || (config[prop] = configValue);
    });

    return config;
  }

  const VERSION = "1.1.3";

  const validators = {};

  // eslint-disable-next-line func-names
  ['object', 'boolean', 'number', 'function', 'string', 'symbol'].forEach((type, i) => {
    validators[type] = function validator(thing) {
      return typeof thing === type || 'a' + (i < 1 ? 'n ' : ' ') + type;
    };
  });

  const deprecatedWarnings = {};

  /**
   * Transitional option validator
   *
   * @param {function|boolean?} validator - set to false if the transitional option has been removed
   * @param {string?} version - deprecated version / removed since version
   * @param {string?} message - some message with additional info
   *
   * @returns {function}
   */
  validators.transitional = function transitional(validator, version, message) {
    function formatMessage(opt, desc) {
      return '[Axios v' + VERSION + '] Transitional option \'' + opt + '\'' + desc + (message ? '. ' + message : '');
    }

    // eslint-disable-next-line func-names
    return (value, opt, opts) => {
      if (validator === false) {
        throw new AxiosError(
          formatMessage(opt, ' has been removed' + (version ? ' in ' + version : '')),
          AxiosError.ERR_DEPRECATED
        );
      }

      if (version && !deprecatedWarnings[opt]) {
        deprecatedWarnings[opt] = true;
        // eslint-disable-next-line no-console
        console.warn(
          formatMessage(
            opt,
            ' has been deprecated since v' + version + ' and will be removed in the near future'
          )
        );
      }

      return validator ? validator(value, opt, opts) : true;
    };
  };

  /**
   * Assert object's properties type
   *
   * @param {object} options
   * @param {object} schema
   * @param {boolean?} allowUnknown
   *
   * @returns {object}
   */

  function assertOptions(options, schema, allowUnknown) {
    if (typeof options !== 'object') {
      throw new AxiosError('options must be an object', AxiosError.ERR_BAD_OPTION_VALUE);
    }
    const keys = Object.keys(options);
    let i = keys.length;
    while (i-- > 0) {
      const opt = keys[i];
      const validator = schema[opt];
      if (validator) {
        const value = options[opt];
        const result = value === undefined || validator(value, opt, options);
        if (result !== true) {
          throw new AxiosError('option ' + opt + ' must be ' + result, AxiosError.ERR_BAD_OPTION_VALUE);
        }
        continue;
      }
      if (allowUnknown !== true) {
        throw new AxiosError('Unknown option ' + opt, AxiosError.ERR_BAD_OPTION);
      }
    }
  }

  var validator = {
    assertOptions,
    validators
  };

  const validators$1 = validator.validators;

  /**
   * Create a new instance of Axios
   *
   * @param {Object} instanceConfig The default config for the instance
   *
   * @return {Axios} A new instance of Axios
   */
  class Axios {
    constructor(instanceConfig) {
      this.defaults = instanceConfig;
      this.interceptors = {
        request: new InterceptorManager(),
        response: new InterceptorManager()
      };
    }

    /**
     * Dispatch a request
     *
     * @param {String|Object} configOrUrl The config specific for this request (merged with this.defaults)
     * @param {?Object} config
     *
     * @returns {Promise} The Promise to be fulfilled
     */
    request(configOrUrl, config) {
      /*eslint no-param-reassign:0*/
      // Allow for axios('example/url'[, config]) a la fetch API
      if (typeof configOrUrl === 'string') {
        config = config || {};
        config.url = configOrUrl;
      } else {
        config = configOrUrl || {};
      }

      config = mergeConfig(this.defaults, config);

      const {transitional, paramsSerializer} = config;

      if (transitional !== undefined) {
        validator.assertOptions(transitional, {
          silentJSONParsing: validators$1.transitional(validators$1.boolean),
          forcedJSONParsing: validators$1.transitional(validators$1.boolean),
          clarifyTimeoutError: validators$1.transitional(validators$1.boolean)
        }, false);
      }

      if (paramsSerializer !== undefined) {
        validator.assertOptions(paramsSerializer, {
          encode: validators$1.function,
          serialize: validators$1.function
        }, true);
      }

      // Set config.method
      config.method = (config.method || this.defaults.method || 'get').toLowerCase();

      // Flatten headers
      const defaultHeaders = config.headers && utils.merge(
        config.headers.common,
        config.headers[config.method]
      );

      defaultHeaders && utils.forEach(
        ['delete', 'get', 'head', 'post', 'put', 'patch', 'common'],
        function cleanHeaderConfig(method) {
          delete config.headers[method];
        }
      );

      config.headers = new AxiosHeaders(config.headers, defaultHeaders);

      // filter out skipped interceptors
      const requestInterceptorChain = [];
      let synchronousRequestInterceptors = true;
      this.interceptors.request.forEach(function unshiftRequestInterceptors(interceptor) {
        if (typeof interceptor.runWhen === 'function' && interceptor.runWhen(config) === false) {
          return;
        }

        synchronousRequestInterceptors = synchronousRequestInterceptors && interceptor.synchronous;

        requestInterceptorChain.unshift(interceptor.fulfilled, interceptor.rejected);
      });

      const responseInterceptorChain = [];
      this.interceptors.response.forEach(function pushResponseInterceptors(interceptor) {
        responseInterceptorChain.push(interceptor.fulfilled, interceptor.rejected);
      });

      let promise;
      let i = 0;
      let len;

      if (!synchronousRequestInterceptors) {
        const chain = [dispatchRequest.bind(this), undefined];
        chain.unshift.apply(chain, requestInterceptorChain);
        chain.push.apply(chain, responseInterceptorChain);
        len = chain.length;

        promise = Promise.resolve(config);

        while (i < len) {
          promise = promise.then(chain[i++], chain[i++]);
        }

        return promise;
      }

      len = requestInterceptorChain.length;

      let newConfig = config;

      i = 0;

      while (i < len) {
        const onFulfilled = requestInterceptorChain[i++];
        const onRejected = requestInterceptorChain[i++];
        try {
          newConfig = onFulfilled(newConfig);
        } catch (error) {
          onRejected.call(this, error);
          break;
        }
      }

      try {
        promise = dispatchRequest.call(this, newConfig);
      } catch (error) {
        return Promise.reject(error);
      }

      i = 0;
      len = responseInterceptorChain.length;

      while (i < len) {
        promise = promise.then(responseInterceptorChain[i++], responseInterceptorChain[i++]);
      }

      return promise;
    }

    getUri(config) {
      config = mergeConfig(this.defaults, config);
      const fullPath = buildFullPath(config.baseURL, config.url);
      return buildURL(fullPath, config.params, config.paramsSerializer);
    }
  }

  // Provide aliases for supported request methods
  utils.forEach(['delete', 'get', 'head', 'options'], function forEachMethodNoData(method) {
    /*eslint func-names:0*/
    Axios.prototype[method] = function(url, config) {
      return this.request(mergeConfig(config || {}, {
        method,
        url,
        data: (config || {}).data
      }));
    };
  });

  utils.forEach(['post', 'put', 'patch'], function forEachMethodWithData(method) {
    /*eslint func-names:0*/

    function generateHTTPMethod(isForm) {
      return function httpMethod(url, data, config) {
        return this.request(mergeConfig(config || {}, {
          method,
          headers: isForm ? {
            'Content-Type': 'multipart/form-data'
          } : {},
          url,
          data
        }));
      };
    }

    Axios.prototype[method] = generateHTTPMethod();

    Axios.prototype[method + 'Form'] = generateHTTPMethod(true);
  });

  /**
   * A `CancelToken` is an object that can be used to request cancellation of an operation.
   *
   * @param {Function} executor The executor function.
   *
   * @returns {CancelToken}
   */
  class CancelToken {
    constructor(executor) {
      if (typeof executor !== 'function') {
        throw new TypeError('executor must be a function.');
      }

      let resolvePromise;

      this.promise = new Promise(function promiseExecutor(resolve) {
        resolvePromise = resolve;
      });

      const token = this;

      // eslint-disable-next-line func-names
      this.promise.then(cancel => {
        if (!token._listeners) return;

        let i = token._listeners.length;

        while (i-- > 0) {
          token._listeners[i](cancel);
        }
        token._listeners = null;
      });

      // eslint-disable-next-line func-names
      this.promise.then = onfulfilled => {
        let _resolve;
        // eslint-disable-next-line func-names
        const promise = new Promise(resolve => {
          token.subscribe(resolve);
          _resolve = resolve;
        }).then(onfulfilled);

        promise.cancel = function reject() {
          token.unsubscribe(_resolve);
        };

        return promise;
      };

      executor(function cancel(message, config, request) {
        if (token.reason) {
          // Cancellation has already been requested
          return;
        }

        token.reason = new CanceledError(message, config, request);
        resolvePromise(token.reason);
      });
    }

    /**
     * Throws a `CanceledError` if cancellation has been requested.
     */
    throwIfRequested() {
      if (this.reason) {
        throw this.reason;
      }
    }

    /**
     * Subscribe to the cancel signal
     */

    subscribe(listener) {
      if (this.reason) {
        listener(this.reason);
        return;
      }

      if (this._listeners) {
        this._listeners.push(listener);
      } else {
        this._listeners = [listener];
      }
    }

    /**
     * Unsubscribe from the cancel signal
     */

    unsubscribe(listener) {
      if (!this._listeners) {
        return;
      }
      const index = this._listeners.indexOf(listener);
      if (index !== -1) {
        this._listeners.splice(index, 1);
      }
    }

    /**
     * Returns an object that contains a new `CancelToken` and a function that, when called,
     * cancels the `CancelToken`.
     */
    static source() {
      let cancel;
      const token = new CancelToken(function executor(c) {
        cancel = c;
      });
      return {
        token,
        cancel
      };
    }
  }

  /**
   * Syntactic sugar for invoking a function and expanding an array for arguments.
   *
   * Common use case would be to use `Function.prototype.apply`.
   *
   *  ```js
   *  function f(x, y, z) {}
   *  var args = [1, 2, 3];
   *  f.apply(null, args);
   *  ```
   *
   * With `spread` this example can be re-written.
   *
   *  ```js
   *  spread(function(x, y, z) {})([1, 2, 3]);
   *  ```
   *
   * @param {Function} callback
   *
   * @returns {Function}
   */
  function spread(callback) {
    return function wrap(arr) {
      return callback.apply(null, arr);
    };
  }

  /**
   * Determines whether the payload is an error thrown by Axios
   *
   * @param {*} payload The value to test
   *
   * @returns {boolean} True if the payload is an error thrown by Axios, otherwise false
   */
  function isAxiosError(payload) {
    return utils.isObject(payload) && (payload.isAxiosError === true);
  }

  /**
   * Create an instance of Axios
   *
   * @param {Object} defaultConfig The default config for the instance
   *
   * @returns {Axios} A new instance of Axios
   */
  function createInstance(defaultConfig) {
    const context = new Axios(defaultConfig);
    const instance = bind(Axios.prototype.request, context);

    // Copy axios.prototype to instance
    utils.extend(instance, Axios.prototype, context, {allOwnKeys: true});

    // Copy context to instance
    utils.extend(instance, context, null, {allOwnKeys: true});

    // Factory for creating new instances
    instance.create = function create(instanceConfig) {
      return createInstance(mergeConfig(defaultConfig, instanceConfig));
    };

    return instance;
  }

  // Create the default instance to be exported
  const axios = createInstance(defaults);

  // Expose Axios class to allow class inheritance
  axios.Axios = Axios;

  // Expose Cancel & CancelToken
  axios.CanceledError = CanceledError;
  axios.CancelToken = CancelToken;
  axios.isCancel = isCancel;
  axios.VERSION = VERSION;
  axios.toFormData = toFormData;

  // Expose AxiosError class
  axios.AxiosError = AxiosError;

  // alias for CanceledError for backward compatibility
  axios.Cancel = axios.CanceledError;

  // Expose all/spread
  axios.all = function all(promises) {
    return Promise.all(promises);
  };

  axios.spread = spread;

  // Expose isAxiosError
  axios.isAxiosError = isAxiosError;

  axios.formToJSON = thing => {
    return formDataToJSON(utils.isHTMLForm(thing) ? new FormData(thing) : thing);
  };

  var ScrollBarWidget = /*#__PURE__*/function () {
    function ScrollBarWidget(x, y, width, height) {
      _classCallCheck(this, ScrollBarWidget);
      this.widgetX = x;
      this.widgetY = y;
      this.width = width;
      this.height = height;
      this.corner_radius = 5;
    }
    _createClass(ScrollBarWidget, [{
      key: "render",
      value: function render(ctx) {
        // Set faux rounded corners
        ctx.lineJoin = 'round';
        ctx.lineWidth = this.corner_radius;
        ctx.fillStyle = '#aaa';
        ctx.strokeStyle = '#aaa';

        // Change origin and dimensions to match true size (a stroke makes the shape a bit larger)
        ctx.strokeRect(this.widgetX + this.corner_radius / 2, this.widgetY + this.corner_radius / 2, this.width - this.corner_radius, this.height - this.corner_radius);
        ctx.fillRect(this.widgetX + this.corner_radius / 2, this.widgetY + this.corner_radius / 2, this.width - this.corner_radius, this.height - this.corner_radius);
      }
    }, {
      key: "setPosition",
      value: function setPosition(x, y) {
        this.widgetX = x;
        this.widgetY = y;
      }
    }, {
      key: "move",
      value: function move(newX, newY) {
        this.widgetX = newX;
        this.widgetY = newY;
      }
    }, {
      key: "resizeWidth",
      value: function resizeWidth(newWidth) {
        this.width = newWidth > 20 ? newWidth : 20;
      }
    }, {
      key: "resizeHeight",
      value: function resizeHeight(newHeight) {
        this.height = newHeight > 20 ? newHeight : 20;
      }
    }]);
    return ScrollBarWidget;
  }();

  var ScrollBar = /*#__PURE__*/function () {
    function ScrollBar(parentWidth, parentHeight, width, height, vertical) {
      _classCallCheck(this, ScrollBar);
      this.parentWidth = parentWidth;
      this.parentHeight = parentHeight;
      this.width = width;
      this.height = height;
      this.vertical = vertical;
      this.x = vertical ? parentWidth - width : 0;
      this.y = vertical ? 0 : parentHeight - height;
      this.widget = new ScrollBarWidget(this.x, this.y, this.vertical ? this.width : 20, this.vertical ? 20 : this.height);
    }
    _createClass(ScrollBar, [{
      key: "render",
      value: function render(ctx) {
        ctx.fillStyle = '#eee';
        ctx.strokeStyle = '#eee';
        ctx.fillRect(this.x, this.y, this.width, this.height);
        this.widget.render(ctx);
      }
    }, {
      key: "setPosition",
      value: function setPosition(x, y) {
        this.x = x;
        this.y = y;
        if (this.vertical) {
          this.widget.setPosition(x, this.widget.widgetY);
        } else {
          this.widget.setPosition(this.widget.widgetX, y);
        }
      }
    }, {
      key: "move",
      value: function move(newX, newY) {
        this.widget.move(newX, newY);
      }

      // The width of the horizontal scrollbar can change depending on the width
      // of the germplasmNameCanvas
    }, {
      key: "updateWidth",
      value: function updateWidth(newWidth) {
        if (!this.vertical) {
          this.width = newWidth;
        }
      }
    }, {
      key: "resizeWidgetWidth",
      value: function resizeWidgetWidth(newWidth) {
        if (!this.vertical) {
          this.widget.resizeWidth(newWidth);
        }
      }
    }, {
      key: "resizeWidgetHeight",
      value: function resizeWidgetHeight(newHeight) {
        if (this.vertical) {
          this.widget.resizeHeight(newHeight);
        }
      }
    }]);
    return ScrollBar;
  }();

  var GenotypeCanvas = /*#__PURE__*/function () {
    function GenotypeCanvas(width, height, boxSize) {
      _classCallCheck(this, GenotypeCanvas);
      this.width = width;
      this.height = height;
      this.canvas = document.createElement('canvas');
      this.canvas.width = width;
      this.canvas.height = height;
      this.canvas.style.display = "block";
      this.drawingContext = this.canvas.getContext('2d');
      this.backBuffer = document.createElement('canvas');
      this.backBuffer.width = width;
      this.backBuffer.height = height;
      this.backContext = this.backBuffer.getContext('2d');
      this.mapCanvasHeight = 60;
      this.nameCanvasWidth = 100;
      //this.traitBoxWidth = 8;

      this.scrollbarWidth = 10;
      this.scrollbarHeight = 10;
      this.backContext.lineWidth = 1;
      this.boxSize = boxSize;
      this.fontSize = 100;
      this.font = undefined;
      this.verticalScrollbar = new ScrollBar(width, this.alleleCanvasHeight() + this.scrollbarHeight, this.scrollbarWidth, this.alleleCanvasHeight(), true);
      this.horizontalScrollbar = new ScrollBar(this.alleleCanvasWidth(), height, this.alleleCanvasWidth(), this.scrollbarHeight, false);
      this.translatedX = 0;
      this.translatedY = 0;
      this.colorScheme = undefined;
      this.markerUnderMouse = undefined;
      this.markerIndexUnderMouse = undefined;
      this.chromosomeUnderMouse = -1;
      this.lineUnderMouse = undefined;
      this.markerNameFont = '10px sans-serif';
      this.dataSet = undefined;
      this.lineSort = undefined;
      this.selectedChromosome = 0;
      this.colorComparisonLineIndex = 0;
      this.sortComparisonLineIndex = 0;
      this.scorePadding = 2;
      this.columnBackgrounds = ["#FFFFFF", "#D8D8D8"];
      this.resetColumnBackground();
      this.displayTraits = [];
      this.mouseOverText = undefined;
      this.mouseOverPosition = undefined;
      this.enabled = true;
    }
    _createClass(GenotypeCanvas, [{
      key: "maxCanvasWidth",
      value: function maxCanvasWidth() {
        return Math.max(this.dataSet.markerCountOn(this.selectedChromosome) * this.boxSize, this.alleleCanvasWidth());
      }
    }, {
      key: "maxCanvasHeight",
      value: function maxCanvasHeight() {
        return Math.max(this.alleleUsedHeight(), this.alleleCanvasHeight());
      }
    }, {
      key: "alleleCanvasWidth",
      value: function alleleCanvasWidth() {
        return this.canvas.width - this.alleleCanvasXOffset - this.scrollbarWidth;
      }
    }, {
      key: "alleleCanvasHeight",
      value: function alleleCanvasHeight() {
        return this.canvas.height - this.mapCanvasHeight - this.scrollbarHeight;
      }
    }, {
      key: "alleleUsedHeight",
      value: function alleleUsedHeight() {
        return this.dataSet.lineCount() * this.boxSize;
      }
    }, {
      key: "maxDataHeight",
      value: function maxDataHeight() {
        return this.dataSet.lineCount() * this.boxSize;
      }
    }, {
      key: "maxDataWidth",
      value: function maxDataWidth() {
        return this.dataSet.markerCountOn(this.selectedChromosome) * this.boxSize; // + ((this.dataSet.chromosomeCount() - 1) * this.chromosomeGapSize);
      }
    }, {
      key: "init",
      value: function init(dataSet, settings) {
        this.dataSet = dataSet;
        this.lineSort = settings.lineSort;
        this.lineSort.sort(this.dataSet);
        this.colorScheme = settings.colorScheme;
        this.colorComparisonLineIndex = this.dataSet.germplasmList.findIndex(function (germplasm) {
          return germplasm.name == settings.colorReference;
        });
        this.colorScheme.setComparisonLineIndex(this.colorComparisonLineIndex);
        this.font = this.updateFontSize();
        this.displayTraits = settings.displayTraits; // this.updateVisualPositions();

        this.colorScheme.setupColorStamps(this.boxSize, this.font, this.fontSize);
        this.zoom(this.boxSize);
        //    this.moveToPosition(0, 0);	// useless at startup?
      }
    }, {
      key: "prerender",
      value: function prerender(redraw) {
        this.drawingContext.save();
        this.drawingContext.clearRect(0, 0, this.canvas.width, this.canvas.height);
        var dataWidth = Math.ceil(this.alleleCanvasWidth() / this.boxSize);
        var markerStart = Math.floor(this.translatedX / this.boxSize);
        var markerEnd = Math.min(markerStart + dataWidth, this.dataSet.markerCountOn(this.selectedChromosome));
        var germplasmStart = Math.floor(this.translatedY / this.boxSize);
        var germplasmEnd = Math.min(germplasmStart + Math.floor(this.canvas.height / this.boxSize), this.dataSet.lineCount());
        var yWiggle = this.translatedY - germplasmStart * this.boxSize;
        if (redraw) this.render(germplasmStart, germplasmEnd, markerStart, markerEnd, yWiggle);
        this.drawingContext.drawImage(this.backBuffer, 0, 0);
        var xPos = this.markerIndexUnderMouse * this.boxSize - this.translatedX;
        var yPos = this.lineUnderMouse * this.boxSize - yWiggle;
        this.renderCrosshair(markerStart, xPos, germplasmStart, yPos);
        this.highlightMarker(dataWidth, markerStart, markerEnd, xPos);
        this.highlightLineName(germplasmStart, yPos);
        this.highlightLineTraitValues(germplasmStart, yPos);
        this.highlightLineScore(germplasmStart, yPos);
        this.renderMouseOverText();
        if (!this.enabled) {
          this.drawingContext.fillStyle = 'rgba(150, 150, 150, 0.4)';
          this.drawingContext.fillRect(0, 0, this.canvas.width, this.canvas.height);
        }
        this.drawingContext.restore();
      }
    }, {
      key: "calcMapMarkerPos",
      value: function calcMapMarkerPos(marker, firstMarkerPos, mapScaleFactor, drawStart) {
        var mapMarkerPos = (marker.position - firstMarkerPos) * mapScaleFactor;
        mapMarkerPos = drawStart > 0 ? mapMarkerPos + drawStart : mapMarkerPos;
        return mapMarkerPos;
      }
    }, {
      key: "highlightMarker",
      value: function highlightMarker(dataWidth, markerStart, markerEnd, xPos) {
        if (this.markerUnderMouse) {
          var renderData = this.dataSet.markersToRenderOn(this.selectedChromosome, markerStart, markerEnd);
          var chromosome = this.dataSet.genomeMap.chromosomes[this.selectedChromosome];
          var chrStart = 0;
          var chrEnd = chromosome.markerCount() * this.boxSize;
          var drawStart = -this.translatedX;
          var potentialWidth = drawStart > 0 ? this.alleleCanvasWidth() - drawStart : this.alleleCanvasWidth();
          var chromosomeWidth = Math.min(chrEnd - this.translatedX, potentialWidth, chrEnd - chrStart);

          // The data array can have too many markers in it due to the gaps between
          // chromosomes, this is a fudge to ensure we don't try to draw too many markers
          var chromosomeMarkerWidth = Math.max(0, Math.floor(chromosomeWidth / this.boxSize));
          var dW = Math.min(renderData.lastMarker - renderData.firstMarker, chromosomeMarkerWidth);
          var firstMarkerPos = chromosome.markers[renderData.firstMarker].position;
          var lastMarkerPos = chromosome.markers[renderData.firstMarker + dW].position;
          var scaleFactor = lastMarkerPos == 0 ? 0 /* hack for cases where variants are not positioned */ : chromosomeWidth / (lastMarkerPos - firstMarkerPos);
          this.highlightMarkerName(firstMarkerPos, scaleFactor, scaleFactor == 0 ? xPos : drawStart);
          this.drawingContext.save();

          // Translate to the correct position to draw the map
          this.drawingContext.translate(this.alleleCanvasXOffset, 10);
          xPos += this.boxSize / 2;
          this.drawingContext.strokeStyle = '#F00';
          this.renderMarker(this.drawingContext, this.markerUnderMouse, xPos, firstMarkerPos, scaleFactor, scaleFactor == 0 ? xPos : drawStart);
          this.drawingContext.restore();
        }
      }
    }, {
      key: "highlightMarkerName",
      value: function highlightMarkerName(firstMarkerPos, scaleFactor, drawStart) {
        if (this.markerUnderMouse) {
          this.drawingContext.save();
          this.drawingContext.translate(this.alleleCanvasXOffset, 10);
          this.drawingContext.fillStyle = '#F00';
          this.drawingContext.font = this.markerNameFont;
          var xPos = this.calcMapMarkerPos(this.markerUnderMouse, firstMarkerPos, scaleFactor, drawStart);
          var text = this.markerUnderMouse.name + (scaleFactor == 0 /*unpositioned data*/ ? "" : " (" + this.markerUnderMouse.position + ")");

          // Measure the text width so we can guarantee it doesn't get drawn off
          // the right hand side of the display
          var textWidth = this.drawingContext.measureText(text).width;
          var halfTextWidth = textWidth / 2;
          xPos -= halfTextWidth;
          if (xPos < 0) {
            xPos = 0;
          } else if (xPos + textWidth > this.alleleCanvasWidth()) {
            xPos = this.alleleCanvasWidth() - textWidth;
          }
          this.drawingContext.fillText(text, xPos, 0);
          this.drawingContext.restore();
        }
      }
    }, {
      key: "highlightLineName",
      value: function highlightLineName(germplasmStart, yPos) {
        if (this.lineUnderMouse !== undefined) {
          this.drawingContext.save();
          this.drawingContext.translate(this.traitValuesCanvasWidth, this.mapCanvasHeight);
          // Prevent line name under scrollbar being highlighted
          var region = new Path2D();
          var clipHeight = this.canScrollX() ? this.alleleCanvasHeight() : this.alleleUsedHeight();
          region.rect(0, 0, this.nameCanvasWidth, clipHeight);
          this.drawingContext.clip(region);
          this.drawingContext.fillStyle = '#F00';
          this.drawingContext.font = this.font;
          var name = this.dataSet.germplasmList[this.lineIndexUnderMouse].name;
          var y = yPos + (this.boxSize - this.fontSize / 2);
          this.drawingContext.fillText(name, 0, y);
          this.drawingContext.restore();
        }
      }
    }, {
      key: "highlightLineTraitValues",
      value: function highlightLineTraitValues(germplasmStart, yPos) {
        var _this = this;
        if (this.dataSet.hasTraits() && this.lineUnderMouse !== undefined) {
          this.drawingContext.save();
          this.drawingContext.translate(0, this.mapCanvasHeight);

          // Prevent line name under scrollbar being highlighted
          var region = new Path2D();
          var clipHeight = this.canScrollX() ? this.alleleCanvasHeight() : this.alleleUsedHeight();
          region.rect(0, 0, this.traitValuesCanvasWidth, clipHeight);
          this.drawingContext.clip(region);
          this.drawingContext.fillStyle = '#F00';
          this.drawingContext.font = this.font;
          var germplasm = this.dataSet.germplasmList[this.lineIndexUnderMouse];
          if (germplasm.phenotype !== undefined) {
            var xPos = 0;
            this.displayTraits.forEach(function (traitName, traitIndex) {
              var trait = _this.dataSet.getTrait(traitName);
              var traitValue = trait.getValue(germplasm.getPhenotype(traitName));
              if (traitValue !== undefined) {
                _this.drawingContext.save();
                var column = new Path2D();
                column.rect(xPos, 0, _this.traitValueColumnWidths[traitIndex], clipHeight);
                _this.drawingContext.clip(column);
                var y = yPos + (_this.boxSize - _this.fontSize / 2);
                _this.drawingContext.fillText(traitValue.toString(), xPos + _this.scorePadding, y);
                _this.drawingContext.restore();
              }
              xPos += _this.traitValueColumnWidths[traitIndex];
            });
          }
          this.drawingContext.restore();
        }
      }
    }, {
      key: "highlightLineScore",
      value: function highlightLineScore(germplasmStart, yPos) {
        if (this.lineSort.hasScore && this.lineUnderMouse !== undefined) {
          this.drawingContext.save();
          this.drawingContext.translate(this.traitValuesCanvasWidth + this.nameCanvasWidth, this.mapCanvasHeight);
          // Prevent line name under scrollbar being highlighted
          var region = new Path2D();
          var clipHeight = this.canScrollX() ? this.alleleCanvasHeight() : this.alleleUsedHeight();
          region.rect(0, 0, this.scoreCanvasWidth, clipHeight);
          this.drawingContext.clip(region);
          this.drawingContext.fillStyle = '#F00';
          this.drawingContext.font = this.font;
          var name = this.dataSet.germplasmList[this.lineIndexUnderMouse].name;
          var y = yPos + (this.boxSize - this.fontSize / 2);
          var score = this.lineSort.getScore(name);
          this.drawingContext.fillText(score.toFixed(2), this.scorePadding, y);
          this.drawingContext.restore();
        }
      }
    }, {
      key: "renderCrosshair",
      value: function renderCrosshair(markerStart, xPos, germplasmStart, yPos) {
        // Setup crosshair drawing parameters
        this.drawingContext.save();
        this.drawingContext.translate(this.alleleCanvasXOffset, this.mapCanvasHeight);
        this.drawingContext.globalAlpha = 0.4;
        this.drawingContext.fillStyle = '#fff';

        // Clip the canvas to prevent over-drawing of the crosshair
        var region = new Path2D();
        region.rect(0, 0, this.alleleCanvasWidth(), this.alleleCanvasHeight());
        this.drawingContext.clip(region);

        // Render each element of the crosshair
        this.renderVerticalCrosshairLine(xPos);
        this.renderHorizontalCrosshairLine(yPos);

        // Reset the drawing parameters for the rest of the render code
        this.drawingContext.translate(-this.alleleCanvasXOffset, -this.mapCanvasHeight);
        this.drawingContext.globalAlpha = 1;
        this.drawingContext.restore();
      }
    }, {
      key: "renderVerticalCrosshairLine",
      value: function renderVerticalCrosshairLine(xPos) {
        this.drawingContext.fillRect(xPos, 0, this.boxSize, this.alleleCanvasHeight());
      }
    }, {
      key: "renderHorizontalCrosshairLine",
      value: function renderHorizontalCrosshairLine(yPos) {
        this.drawingContext.fillRect(0, yPos, this.alleleCanvasWidth(), this.boxSize);
      }
    }, {
      key: "renderMouseOverText",
      value: function renderMouseOverText() {
        if (this.mouseOverText !== undefined) {
          this.drawingContext.save();
          this.drawingContext.font = this.font;
          var textWidth = this.drawingContext.measureText(this.mouseOverText).width;
          var textHeight = this.fontSize;
          var padding = 4;
          var boxWidth = textWidth + 2 * padding;
          var boxHeight = textHeight + 2 * padding;
          var _this$mouseOverPositi = _slicedToArray(this.mouseOverPosition, 2),
            xBase = _this$mouseOverPositi[0],
            yBase = _this$mouseOverPositi[1];
          var drawDirection = [0, -1];
          if (yBase - boxHeight < 0) drawDirection[1] = 0;
          if (xBase + boxWidth > this.canvas.width) drawDirection[0] = -1;
          var boxX = xBase + drawDirection[0] * boxWidth;
          var boxY = yBase + drawDirection[1] * boxHeight;
          this.drawingContext.fillStyle = "rgba(50,50,50,0.8)";
          this.drawingContext.fillRect(boxX, boxY, boxWidth, boxHeight);
          this.drawingContext.fillStyle = "#FFFFFF";
          this.drawingContext.fillText(this.mouseOverText, boxX + padding, boxY + boxHeight - padding);
          this.drawingContext.restore();
        }
      }
    }, {
      key: "render",
      value: function render(germplasmStart, germplasmEnd, markerStart, markerEnd, yWiggle) {
        this.resetColumnBackground();
        this.backContext.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.renderMap(markerStart, markerEnd);

        /*if (this.dataSet.hasTraits())
          this.renderGermplasmTraits(germplasmStart, germplasmEnd, yWiggle);*/

        if (this.dataSet.hasTraits()) this.renderGermplasmTraitValues(germplasmStart, germplasmEnd, yWiggle);
        this.renderGermplasmNames(germplasmStart, germplasmEnd, yWiggle);
        if (this.lineSort.hasScore) this.renderGermplasmScore(germplasmStart, germplasmEnd, yWiggle);
        this.renderGermplasm(germplasmStart, germplasmEnd, markerStart, markerEnd, yWiggle);
        this.renderScrollbars();
      }
    }, {
      key: "renderMarker",
      value: function renderMarker(mapCanvas, marker, genoMarkerPos, firstMarkerPos, mapScaleFactor, drawStart) {
        var mapMarkerPos = this.calcMapMarkerPos(marker, firstMarkerPos, mapScaleFactor, drawStart);
        mapCanvas.beginPath();

        // Draw vertical line on top of map rectangle
        mapCanvas.moveTo(mapMarkerPos, 0);
        mapCanvas.lineTo(mapMarkerPos, 10);

        // Draw diagonal line to marker position on the genotype canvas
        mapCanvas.lineTo(genoMarkerPos, 30);

        // Draw a vertical line down to the genotype canvas
        mapCanvas.lineTo(genoMarkerPos, 40);
        mapCanvas.stroke();
      }
    }, {
      key: "renderMarkers",
      value: function renderMarkers(renderData) {
        var chrStart = 0;
        var chrEnd = this.dataSet.genomeMap.chromosomes[this.selectedChromosome].markerCount() * this.boxSize;
        var drawStart = -this.translatedX;
        var chromosome = this.dataSet.genomeMap.chromosomes[this.selectedChromosome];
        var potentialWidth = drawStart > 0 ? this.alleleCanvasWidth() - drawStart : this.alleleCanvasWidth();
        var chromosomeWidth = Math.min(chrEnd - this.translatedX, potentialWidth, chrEnd - chrStart);

        // The data array can have too many markers in it due to the gaps between
        // chromosomes, this is a fudge to ensure we don't try to draw too many markers
        var chromosomeMarkerWidth = Math.max(0, Math.floor(chromosomeWidth / this.boxSize));
        var dataWidth = Math.min(renderData.lastMarker - renderData.firstMarker, chromosomeMarkerWidth);
        var firstMarkerPos = chromosome.markers[renderData.firstMarker].position;
        var lastMarkerPos = chromosome.markers[renderData.firstMarker + dataWidth].position;
        var scaleFactor = lastMarkerPos == 0 ? 0 /* hack for cases where variants are not positioned */ : chromosomeWidth / (lastMarkerPos - firstMarkerPos);
        for (var markerIndex = renderData.firstMarker; markerIndex <= renderData.lastMarker; markerIndex += 1) {
          var marker = this.dataSet.genomeMap.chromosomes[this.selectedChromosome].markers[markerIndex];
          var xPos = drawStart + markerIndex * this.boxSize;
          xPos += this.boxSize / 2;
          this.renderMarker(this.backContext, marker, xPos, firstMarkerPos, scaleFactor, scaleFactor == 0 ? xPos : drawStart);
        }
      }
    }, {
      key: "renderChromosome",
      value: function renderChromosome(chromosomeData) {
        var width = this.dataSet.genomeMap.chromosomes[this.selectedChromosome].markerCount() * this.boxSize;
        this.backContext.strokeRect(-this.translatedX, 1, width, 10);
      }
    }, {
      key: "renderMap",
      value: function renderMap(markerStart, markerEnd) {
        this.backContext.save();
        // Set the line style for drawing the map and markers
        this.backContext.lineWidth = 1;
        this.backContext.strokeStyle = 'gray';

        // Create a clipping region so that lineNames can't creep up above the line
        // name canvas
        var region = new Path2D();
        region.rect(this.alleleCanvasXOffset, 0, this.alleleCanvasWidth(), this.mapCanvasHeight);
        this.backContext.clip(region);

        // Translate to the correct position to draw the map
        this.backContext.translate(this.alleleCanvasXOffset, 10);
        var renderData = this.dataSet.markersToRenderOn(this.selectedChromosome, markerStart, markerEnd);
        this.renderChromosome(renderData);
        this.renderMarkers(renderData);
        this.backContext.restore();
      }

      /*renderGermplasmTraits(germplasmStart, germplasmEnd, yWiggle){
        this.backContext.save();
         // Create a clipping region so that lineNames can't creep up above the line
        // name canvas
        const region = new Path2D();
        // We need to take account of the scrollbar potentially disappearing when
        // zoomed out
        const clipHeight = this.canScrollX() ? this.alleleCanvasHeight() : this.alleleUsedHeight();
        region.rect(0, this.mapCanvasHeight, this.traitCanvasWidth, clipHeight);
        this.backContext.clip(region);
         const germplasms = this.dataSet.germplasmFor(germplasmStart, germplasmEnd);
         this.backContext.font = this.font;
        this.backContext.translate(0, this.mapCanvasHeight);
         germplasms.forEach((germplasm, idx) => {
          const yPos = (idx * this.boxSize) - yWiggle;
          if (germplasm.phenotype !== undefined){
            this.displayTraits.forEach((traitName, traitIndex) => {
              const xPos = traitIndex * this.traitBoxWidth;
              const trait = this.dataSet.getTrait(traitName);
              const traitValue = germplasm.getPhenotype(traitName);
              if (traitValue !== undefined) {
                const scaleValue = trait.scaleValue(traitValue);
                const hue = 120 * scaleValue;
                const rgb = this.hsv2rgb(hue, 0.53, 1);
                this.backContext.fillStyle = "rgb(" + Math.floor(rgb[0] * 255) + "," + Math.floor(rgb[1] * 255) + "," + Math.floor(rgb[2] * 255) + ")";
                this.backContext.fillRect(xPos, yPos, this.traitBoxWidth, this.boxSize);
              }
            });
          }
        });
         this.backContext.restore();
      }*/
    }, {
      key: "renderGermplasmNames",
      value: function renderGermplasmNames(germplasmStart, germplasmEnd, yWiggle) {
        var _this2 = this;
        this.backContext.save();

        // Create a clipping region so that lineNames can't creep up above the line
        // name canvas
        var region = new Path2D();
        // We need to take account of the scrollbar potentially disappearing when
        // zoomed out
        var clipHeight = this.canScrollX() ? this.alleleCanvasHeight() : this.alleleUsedHeight();
        region.rect(this.traitValuesCanvasWidth, this.mapCanvasHeight, this.nameCanvasWidth, clipHeight);
        this.backContext.clip(region);
        var lineNames = this.dataSet.germplasmFor(germplasmStart, germplasmEnd).map(function (germplasm) {
          return germplasm.name;
        });
        this.backContext.translate(this.traitValuesCanvasWidth, this.mapCanvasHeight);
        this.backContext.fillStyle = this.nextColumnBackground();
        this.backContext.fillRect(0, 0, this.nameCanvasWidth, clipHeight);
        this.backContext.fillStyle = '#333';
        this.backContext.font = this.font;
        lineNames.forEach(function (name, idx) {
          var y = idx * _this2.boxSize - yWiggle + (_this2.boxSize - _this2.fontSize / 2);
          _this2.backContext.fillText(name, 0, y);
        });
        this.backContext.restore();
      }
    }, {
      key: "renderGermplasmTraitValues",
      value: function renderGermplasmTraitValues(germplasmStart, germplasmEnd, yWiggle) {
        var _this3 = this;
        this.backContext.save();

        // Create a clipping region so that lineNames can't creep up above the line
        // name canvas
        var region = new Path2D();
        // We need to take account of the scrollbar potentially disappearing when
        // zoomed out
        var clipHeight = this.canScrollX() ? this.alleleCanvasHeight() : this.alleleUsedHeight();
        region.rect(0, this.mapCanvasHeight, this.traitValuesCanvasWidth, clipHeight);
        this.backContext.clip(region);
        var germplasms = this.dataSet.germplasmFor(germplasmStart, germplasmEnd);
        this.backContext.font = this.font;
        this.backContext.translate(0, this.mapCanvasHeight);
        var xPos = 0;
        this.displayTraits.forEach(function (traitName, traitIndex) {
          _this3.backContext.fillStyle = "#FFF";
          _this3.backContext.fillRect(xPos, 0, _this3.traitValueColumnWidths[traitIndex], clipHeight);
          _this3.backContext.fillStyle = "#333";
          var trait = _this3.dataSet.getTrait(traitName);
          _this3.backContext.save();
          var column = new Path2D();
          column.rect(xPos, 0, _this3.traitValueColumnWidths[traitIndex] + 1, clipHeight);
          _this3.backContext.clip(column);
          germplasms.forEach(function (germplasm, idx) {
            if (germplasm.phenotype !== undefined) {
              var yPos = idx * _this3.boxSize - yWiggle;
              var phenotype = germplasm.getPhenotype(traitName);
              var traitValue = trait.getValue(phenotype);
              if (traitValue !== undefined) {
                _this3.backContext.fillStyle = trait.getColor(phenotype);
                //this.backContext.fillStyle = "rgb(" + Math.floor(rgb[0] * 255) + "," + Math.floor(rgb[1] * 255) + "," + Math.floor(rgb[2] * 255) + ")";
                _this3.backContext.fillRect(xPos, yPos, _this3.traitValueColumnWidths[traitIndex], _this3.boxSize);
                _this3.backContext.fillStyle = "#333";
                var y = yPos + (_this3.boxSize - _this3.fontSize / 2);
                _this3.backContext.fillText(traitValue.toString(), xPos + _this3.scorePadding, y);
              }
            }
          });
          _this3.backContext.restore();
          xPos += _this3.traitValueColumnWidths[traitIndex];
        });
        this.backContext.restore();
      }

      // Render the sorting scores column
    }, {
      key: "renderGermplasmScore",
      value: function renderGermplasmScore(germplasmStart, germplasmEnd, yWiggle) {
        var _this4 = this;
        this.backContext.save();

        // Create a clipping region so that lineNames can't creep up above the line
        // name canvas
        var region = new Path2D();
        // We need to take account of the scrollbar potentially disappearing when
        //zoomed out
        var clipHeight = this.canScrollX() ? this.alleleCanvasHeight() : this.alleleUsedHeight();
        region.rect(this.traitValuesCanvasWidth + this.nameCanvasWidth, this.mapCanvasHeight, this.scoreCanvasWidth, clipHeight);
        this.backContext.clip(region);
        var lineNames = this.dataSet.germplasmFor(germplasmStart, germplasmEnd).map(function (germplasm) {
          return germplasm.name;
        });
        this.backContext.translate(this.traitValuesCanvasWidth + this.nameCanvasWidth, this.mapCanvasHeight);
        this.backContext.fillStyle = this.nextColumnBackground();
        this.backContext.fillRect(0, 0, this.scoreCanvasWidth, clipHeight);
        this.backContext.fillStyle = '#333';
        this.backContext.font = this.font;
        lineNames.forEach(function (name, idx) {
          var y = idx * _this4.boxSize - yWiggle + (_this4.boxSize - _this4.fontSize / 2);
          var score = _this4.lineSort.getScore(name);
          _this4.backContext.fillText(score.toFixed(2), _this4.scorePadding, y);
        });
        this.backContext.restore();
      }
    }, {
      key: "renderGermplasm",
      value: function renderGermplasm(germplasmStart, germplasmEnd, markerStart, markerEnd, yWiggle) {
        this.backContext.save();
        var renderData = this.dataSet.markersToRenderOn(this.selectedChromosome, markerStart, markerEnd);

        // Clip so that we can only draw into the region that is intended to be the
        // genotype canvas
        var region = new Path2D();
        region.rect(this.alleleCanvasXOffset, this.mapCanvasHeight, this.canvas.width, this.canvas.height);
        this.backContext.clip(region);
        this.backContext.translate(this.alleleCanvasXOffset, this.mapCanvasHeight);
        for (var germplasm = germplasmStart, line = 0; germplasm < germplasmEnd; germplasm += 1, line += 1) {
          var yPos = line * this.boxSize - yWiggle;
          var chrStart = -this.translatedX;
          for (var marker = renderData.firstMarker; marker <= renderData.lastMarker; marker += 1) {
            var xPos = chrStart + marker * this.boxSize;
            var stamp = this.colorScheme.getState(germplasm, this.selectedChromosome, marker);
            this.backContext.drawImage(stamp, xPos, yPos);
          }
        }
        this.backContext.restore();
      }
    }, {
      key: "renderScrollbars",
      value: function renderScrollbars() {
        this.backContext.save();
        if (this.canScrollY()) {
          this.backContext.translate(0, this.mapCanvasHeight);
          this.verticalScrollbar.render(this.backContext);
        }
        this.backContext.restore();
        this.backContext.save();
        if (this.canScrollX()) {
          this.backContext.translate(this.alleleCanvasXOffset, 0);
          this.horizontalScrollbar.render(this.backContext);
        }
        this.backContext.restore();
        this.backContext.save();
        if (this.canScrollX() || this.canScrollY()) {
          this.backContext.translate(this.alleleCanvasXOffset, this.mapCanvasHeight);
          this.backContext.fillStyle = '#aaa';
          this.backContext.strokeRect(this.alleleCanvasWidth(), this.alleleCanvasHeight(), this.scrollbarWidth, this.scrollbarHeight);
          this.backContext.fillRect(this.alleleCanvasWidth(), this.alleleCanvasHeight(), this.scrollbarWidth, this.scrollbarHeight);
        }
        this.backContext.restore();
      }
    }, {
      key: "mapToRange",
      value: function mapToRange(num, inMin, inMax, outMin, outMax) {
        return (num - inMin) * (outMax - outMin) / (inMax - inMin) + outMin;
      }
    }, {
      key: "canScrollX",
      value:
      // We can only scroll horizontally if the render size of our data horizontally
      // is wider than the canvas itself
      function canScrollX() {
        return this.maxCanvasWidth() > this.alleleCanvasWidth();
      }
    }, {
      key: "canScrollY",
      value: function canScrollY() {
        return this.maxCanvasHeight() > this.alleleCanvasHeight();
      }
    }, {
      key: "moveX",
      value: function moveX(diffX) {
        if (!this.enabled) return;
        var xScrollMax = this.maxCanvasWidth() - this.alleleCanvasWidth();
        if (xScrollMax > 0) {
          this.translatedX -= diffX;

          // Prevent scrolling beyond start or end of data
          if (this.translatedX < 0) {
            this.translatedX = 0;
          } else if (this.translatedX >= xScrollMax) {
            this.translatedX = xScrollMax;
          }
          var scrollWidth = this.alleleCanvasWidth() - this.horizontalScrollbar.widget.width;
          var scrollX = Math.floor(this.mapToRange(this.translatedX, 0, xScrollMax, 0, scrollWidth));
          this.horizontalScrollbar.move(scrollX, this.horizontalScrollbar.y);
        }
        return this.currentPosition();
      }
    }, {
      key: "moveY",
      value: function moveY(diffY) {
        if (!this.enabled) return;
        var yScrollMax = this.maxCanvasHeight() - this.alleleCanvasHeight();
        if (yScrollMax > 0) {
          this.translatedY -= diffY;

          // Prevent scrolling beyond start or end of data
          if (this.translatedY < 0) {
            this.translatedY = 0;
          } else if (this.translatedY >= yScrollMax) {
            this.translatedY = yScrollMax;
          }
          var scrollHeight = this.alleleCanvasHeight() - this.verticalScrollbar.widget.height;
          var scrollY = Math.floor(this.mapToRange(this.translatedY, 0, yScrollMax, 0, scrollHeight));
          this.verticalScrollbar.move(this.verticalScrollbar.x, scrollY);
        }
        return this.currentPosition();
      }
    }, {
      key: "dragVerticalScrollbar",
      value: function dragVerticalScrollbar(y) {
        if (!this.enabled) return;
        var yScrollMax = this.maxCanvasHeight() - this.alleleCanvasHeight();
        if (yScrollMax > 0) {
          this.translatedY = y / this.verticalScrollbar.height * yScrollMax;

          // Prevent scrolling beyond start or end of data
          if (this.translatedY < 0) {
            this.translatedY = 0;
          } else if (this.translatedY >= yScrollMax) {
            this.translatedY = yScrollMax;
          }
          var scrollHeight = this.alleleCanvasHeight() - this.verticalScrollbar.widget.height;
          var scrollY = Math.floor(this.mapToRange(this.translatedY, 0, yScrollMax, 0, scrollHeight));
          this.verticalScrollbar.move(this.verticalScrollbar.x, scrollY);
        }
        this.prerender(true);
        return this.currentPosition();
      }
    }, {
      key: "dragHorizontalScrollbar",
      value: function dragHorizontalScrollbar(x) {
        if (!this.enabled) return;
        var xScrollMax = this.maxCanvasWidth() - this.alleleCanvasWidth();
        if (xScrollMax > 0) {
          this.translatedX = x / this.horizontalScrollbar.width * xScrollMax;

          // Prevent scrolling beyond start or end of data
          if (this.translatedX < 0) {
            this.translatedX = 0;
          } else if (this.translatedX >= xScrollMax) {
            this.translatedX = xScrollMax;
          }
          var scrollWidth = this.alleleCanvasWidth() - this.horizontalScrollbar.widget.width;
          var scrollX = Math.floor(this.mapToRange(this.translatedX, 0, xScrollMax, 0, scrollWidth));
          this.horizontalScrollbar.move(scrollX, this.horizontalScrollbar.y);
        }
        this.prerender(true);
        return this.currentPosition();
      }
    }, {
      key: "moveToPosition",
      value: function moveToPosition(marker, germplasm) {
        var diffX = this.translatedX - marker * this.boxSize;
        var diffY = this.translatedY - germplasm * this.boxSize;
        return this.move(diffX, diffY);
      }
    }, {
      key: "move",
      value: function move(diffX, diffY) {
        this.moveX(diffX);
        this.moveY(diffY);
        this.prerender(true);
        return this.currentPosition();
      }
    }, {
      key: "mouseOver",
      value: function mouseOver(x, y) {
        if (!this.enabled) return;
        var mouseXPos = x - this.alleleCanvasXOffset;
        var mouseYPos = y - this.mapCanvasHeight;
        if (mouseXPos > 0 && mouseXPos < this.alleleCanvasWidth() && mouseXPos < this.maxDataWidth()) {
          // Calculate the marker's index in the dataset and get the marker data
          var markerIndex = Math.floor((this.translatedX + mouseXPos) / this.boxSize);
          var marker = this.dataSet.markerOn(this.selectedChromosome, markerIndex);
          this.markerUnderMouse = marker.marker;
          this.markerIndexUnderMouse = marker.markerIndex;
        } else {
          this.markerUnderMouse = undefined;
          this.markerIndexUnderMouse = undefined;
          this.lineUnderMouse = undefined;
          this.lineIndexUnderMouse = undefined;
        }
        if (mouseYPos > 0 && mouseYPos < this.alleleCanvasHeight() && mouseYPos < this.maxDataHeight()) {
          var germplasmStart = Math.floor(this.translatedY / this.boxSize);
          var yWiggle = this.translatedY - germplasmStart * this.boxSize;
          this.lineUnderMouse = Math.floor((mouseYPos + yWiggle) / this.boxSize);
          this.lineIndexUnderMouse = Math.floor((this.translatedY + mouseYPos) / this.boxSize);
          // this.lineIndexUnderMouse = this.lineUnderMouse + Math.floor(this.translatedY / this.boxSize);  // Accumulates rounding errors
        } else {
          this.markerUnderMouse = undefined;
          this.markerIndexUnderMouse = undefined;
          this.lineUnderMouse = undefined;
          this.lineIndexUnderMouse = undefined;
        }

        // Mouse over text boxes
        this.mouseOverText = undefined;
        this.mouseOverPosition = undefined;
        if (this.lineIndexUnderMouse !== undefined) {
          /*if (this.dataSet.hasTraits() && x > 0 && x < this.traitCanvasWidth){
            const germplasm = this.dataSet.germplasmList[this.lineIndexUnderMouse];
            const traitIndex = Math.floor(x / this.traitBoxWidth);
            const trait = this.dataSet.getTrait(this.displayTraits[traitIndex]);
            const traitValue = trait.getValue(germplasm.getPhenotype(trait.name));
            if (traitValue !== undefined){
              this.mouseOverText = trait.name + " : " + traitValue.toString();
              this.mouseOverPosition = [x, y];
            }
          } else */
          if (this.dataSet.hasTraits() && x < this.traitValuesCanvasWidth / 1.1 /*accounting for apennded blank space*/) {
            var xPos = 0,
              traitIndex = undefined;

            // Get the trait under the mouse (columns are not of equal size)
            for (var _columnIndex = 0; _columnIndex < this.traitValueColumnWidths.length; _columnIndex += 1) {
              xPos += this.traitValueColumnWidths[_columnIndex];
              if (x < xPos) {
                traitIndex = _columnIndex;
                break;
              }
            }
            var germplasm = this.dataSet.germplasmList[this.lineIndexUnderMouse];
            var trait = this.dataSet.getTrait(this.displayTraits[traitIndex]);
            var traitValue = trait.getValue(germplasm.getPhenotype(trait.name));
            if (traitValue !== undefined) {
              this.mouseOverText = trait.name + " : " + traitValue.toString();
              this.mouseOverPosition = [x, y];
            }
          } else if (this.lineSort.hasScore && x > this.nameCanvasWidth + this.traitValuesCanvasWidth && x < this.nameCanvasWidth + this.traitValuesCanvasWidth + this.scoreCanvasWidth) {
            var _germplasm = this.dataSet.germplasmList[this.lineIndexUnderMouse];
            var score = this.lineSort.getScore(_germplasm.name);
            this.mouseOverText = "Sort score : " + score.toString();
            this.mouseOverPosition = [x, y];
          }
        }
        this.prerender(false);
      }
    }, {
      key: "updateFontSize",
      value: function updateFontSize() {
        // TODO: need some code to iteratively find the "widest" text, currently
        // testing indicated C/G was the widest for standard diploid genotypes.
        var text = 'C/G';
        var fontface = 'sans-serif';
        var fontCanvas = document.createElement('canvas');
        fontCanvas.width = this.boxSize;
        fontCanvas.height = this.boxSize;
        var fontContext = fontCanvas.getContext('2d');
        this.fontSize = 100;
        fontContext.font = "".concat(this.fontSize, "px ").concat(fontface);

        // Iteratrively reduce the font size until the sample text fits in the
        // canvas width
        while (fontContext.measureText(text).width > fontCanvas.width) {
          this.fontSize -= 1;
          fontContext.font = "".concat(this.fontSize, "px ").concat(fontface);
        }
        this.font = fontContext.font;
        this.backContext.font = this.font;
      }
    }, {
      key: "updateCanvasWidths",
      value: function updateCanvasWidths() {
        var _this5 = this;
        // Find the longest germplasm name and adjust the width of the germplasm name
        // rendering area accordingly
        var germplasm = this.dataSet.germplasmList;
        var longestName = Math.max.apply(Math, _toConsumableArray(germplasm.map(function (g) {
          return _this5.backContext.measureText(g.name).width;
        })));
        this.nameCanvasWidth = longestName;
        if (this.lineSort.hasScore) {
          this.scoreCanvasWidth = this.backContext.measureText("0.00").width + 2 * this.scorePadding; // 2px of padding on each side
        } else {
          this.scoreCanvasWidth = 0;
        }
        if (this.dataSet.hasTraits()) {
          //this.traitCanvasWidth = this.displayTraits.length * this.traitBoxWidth;
          this.traitValueColumnWidths = this.displayTraits.map(function (name) {
            return _this5.backContext.measureText(_this5.dataSet.getTrait(name).longestValue).width + 2 * _this5.scorePadding;
          });
          if (this.traitValueColumnWidths.length == 0) this.traitValuesCanvasWidth = 0;else this.traitValuesCanvasWidth = this.traitValueColumnWidths.reduce(function (a, b) {
            return a + b;
          });

          // Add 10% blank space to separate it from the genotypes, otherwise readability is really bad
          if (!this.lineSort.hasScore) this.traitValuesCanvasWidth = Math.floor(this.traitValuesCanvasWidth * 1.1);
        } else {
          //this.traitCanvasWidth = 0;
          this.traitValuesCanvasWidth = 0;
        }
        this.alleleCanvasXOffset = this.nameCanvasWidth + this.traitValuesCanvasWidth + this.scoreCanvasWidth;
        this.horizontalScrollbar.updateWidth(this.alleleCanvasWidth());
      }
    }, {
      key: "updateScrollBarSizes",
      value: function updateScrollBarSizes() {
        var screenWidthPerc = this.alleleCanvasWidth() / this.maxCanvasWidth();
        var hScrollWidgetWidth = Math.ceil(this.alleleCanvasWidth() * screenWidthPerc);
        this.horizontalScrollbar.resizeWidgetWidth(hScrollWidgetWidth);
        var screenHeightPerc = this.alleleCanvasHeight() / this.maxCanvasHeight();
        var vScrollWidgetHeight = Math.ceil(this.alleleCanvasHeight() * screenHeightPerc);
        this.verticalScrollbar.resizeWidgetHeight(vScrollWidgetHeight);
      }
    }, {
      key: "updateScrollBars",
      value: function updateScrollBars() {
        this.updateScrollBarSizes();
        var scrollWidth = this.alleleCanvasWidth() - this.horizontalScrollbar.widget.width;
        var scrollX = Math.floor(this.mapToRange(this.translatedX, 0, this.maxCanvasWidth() - this.alleleCanvasWidth(), 0, scrollWidth));
        this.horizontalScrollbar.move(scrollX, this.horizontalScrollbar.y);
        var scrollHeight = this.alleleCanvasHeight() - this.verticalScrollbar.widget.height;
        var scrollY = Math.floor(this.mapToRange(this.translatedY, 0, this.maxCanvasHeight() - this.alleleCanvasHeight(), 0, scrollHeight));
        this.verticalScrollbar.move(this.verticalScrollbar.x, scrollY);
      }
    }, {
      key: "zoom",
      value: function zoom(size) {
        var newBoxSize = parseInt(size);

        // oldPosition * zoomFactor = newPosition => zoomFactor = newBoxSize / oldBoxSize
        var zoomFactor = newBoxSize / this.boxSize;
        this.boxSize = newBoxSize;
        this.updateFontSize();
        this.colorScheme.setupColorStamps(this.boxSize, this.font, this.fontSize);
        this.updateCanvasWidths();

        // If zooming out means the genotypes don't take up the full canvas, return
        // the display to its horizontal origin
        if (!this.canScrollX()) {
          this.translatedX = 0;
          this.horizontalScrollbar.move(0, this.horizontalScrollbar.y);
        } else {
          this.translatedX = Math.min(this.translatedX * zoomFactor, this.maxDataWidth() - this.alleleCanvasWidth());
        }

        // If zooming out means the genotypes don't take up the full canvas, return
        // the display to its vertical origin
        if (!this.canScrollY()) {
          this.translatedY = 0;
          this.verticalScrollbar.move(this.verticalScrollbar.x, 0);
        } else {
          this.translatedY = Math.min(this.translatedY * zoomFactor, this.maxDataHeight() - this.alleleCanvasHeight());
        }
        this.updateScrollBars();
        this.prerender(true);
        return this.currentPosition();
      }

      // Get the current data position of the top-right corner (marker and germplasm indices)
    }, {
      key: "currentPosition",
      value: function currentPosition() {
        var marker = Math.floor(this.translatedX / this.boxSize);
        var germplasm = Math.floor(this.translatedY / this.boxSize);
        return {
          marker: marker,
          germplasm: germplasm
        };
      }

      // Get the size of the visible data in the canvas (in markers and germplasms)
    }, {
      key: "visibilityWindow",
      value: function visibilityWindow() {
        var markers = Math.min(this.alleleCanvasWidth() / this.boxSize, this.dataSet.markerCountOn(this.selectedChromosome));
        var germplasms = Math.min(this.alleleCanvasHeight() / this.boxSize, this.dataSet.germplasmList.length);
        return {
          markers: markers,
          germplasms: germplasms
        };
      }
    }, {
      key: "setAutoWidth",
      value: function setAutoWidth(newWidth) {
        this.width = newWidth;
        this.canvas.width = newWidth;
        this.backBuffer.width = newWidth;
        this.verticalScrollbar.setPosition(newWidth - this.verticalScrollbar.width, 0);
        this.horizontalScrollbar.updateWidth(this.alleleCanvasWidth());
        this.updateScrollBars();

        // If zooming out means the genotypes don't take up the full canvas, return
        // the display to its horizontal origin
        if (!this.canScrollX()) {
          this.translatedX = 0;
          this.horizontalScrollbar.move(0, this.horizontalScrollbar.y);
        } else {
          this.translatedX = Math.min(this.translatedX, this.maxDataWidth() - this.alleleCanvasWidth());
        }

        // If zooming out means the genotypes don't take up the full canvas, return
        // the display to its vertical origin
        if (!this.canScrollY()) {
          this.translatedY = 0;
          this.verticalScrollbar.move(this.verticalScrollbar.x, 0);
        } else {
          this.translatedY = Math.min(this.translatedY, this.maxDataHeight() - this.alleleCanvasHeight());
        }
        this.prerender(true);
      }
    }, {
      key: "setColorScheme",
      value: function setColorScheme(scheme) {
        this.colorScheme = scheme;
        this.prerender(true);
      }
    }, {
      key: "setColorComparisonLine",
      value: function setColorComparisonLine(comparedName) {
        this.colorComparisonLineIndex = this.dataSet.germplasmList.findIndex(function (germplasm) {
          return germplasm.name == comparedName;
        });
        this.colorScheme.setComparisonLineIndex(this.colorComparisonLineIndex);
        this.prerender(true);
      }
    }, {
      key: "setLineSort",
      value: function setLineSort(newLineSort) {
        this.lineSort = newLineSort;
        this.updateCanvasWidths(); // To account for the presence or absence of scores
        this.sortLines();
      }
    }, {
      key: "setSortComparisonLine",
      value: function setSortComparisonLine(comparedName) {
        if (this.lineSort.setComparisonLine !== undefined) {
          this.lineSort.setComparisonLine(comparedName);
          this.sortLines();
        }
      }
    }, {
      key: "setSortTrait",
      value: function setSortTrait(comparedTrait) {
        if (this.lineSort.setTrait !== undefined) {
          this.lineSort.setTrait(comparedTrait);
          this.sortLines();
        }
      }
    }, {
      key: "setDisplayTraits",
      value: function setDisplayTraits(displayTraits) {
        this.displayTraits = displayTraits;
        this.updateCanvasWidths();
        this.prerender(true);
      }
    }, {
      key: "setChromosome",
      value: function setChromosome(chromosomeIndex) {
        this.selectedChromosome = chromosomeIndex;

        // Reset the position
        this.moveToPosition(0, 0);
        if (this.lineSort.setChromosomes !== undefined) {
          this.lineSort.setChromosomes([chromosomeIndex]);
        }
        this.sortLines(); // This redraws too
      }
    }, {
      key: "sortLines",
      value: function sortLines() {
        // Save the color comparison line to restore it after sorting
        var colorComparisonGermplasm = this.dataSet.germplasmList[this.colorComparisonLineIndex];
        this.lineSort.sort(this.dataSet);
        if (colorComparisonGermplasm != null) this.setColorComparisonLine(colorComparisonGermplasm.name);
        this.prerender(true);
      }
    }, {
      key: "exportName",
      value: function exportName() {
        return "view_".concat(this.dataSet.genomeMap.chromosomes[this.selectedChromosome].name, "_").concat(this.translatedX);
      }
    }, {
      key: "toDataURL",
      value: function toDataURL(type, encoderOptions) {
        var tmpCanvas = document.createElement('canvas');
        tmpCanvas.width = this.canvas.width;
        tmpCanvas.height = this.canvas.height;
        var tmpContext = tmpCanvas.getContext('2d');
        tmpContext.fillStyle = 'white';
        tmpContext.fillRect(0, 0, tmpCanvas.width, tmpCanvas.height);
        tmpContext.drawImage(this.canvas, 0, 0);
        return tmpCanvas.toDataURL(type, encoderOptions);
      }
    }, {
      key: "nextColumnBackground",
      value: function nextColumnBackground() {
        var background = this.columnBackgrounds[this.currentColumnBackground];
        this.currentColumnBackground = (this.currentColumnBackground + 1) % this.columnBackgrounds.length;
        return background;
      }
    }, {
      key: "resetColumnBackground",
      value: function resetColumnBackground() {
        this.currentColumnBackground = 1;
      }
    }, {
      key: "disable",
      value: function disable() {
        this.enabled = false;
        this.prerender(false);
      }
    }, {
      key: "enable",
      value: function enable() {
        this.enabled = true;
        this.prerender(false);
      }

      //   rainbowColor(numOfSteps, step) {
      //     // This function generates vibrant, "evenly spaced" colours (i.e. no clustering). This is ideal for creating easily distinguishable vibrant markers in Google Maps and other apps.
      //     // Adam Cole, 2011-Sept-14
      //     // HSV to RBG adapted from: http://mjijackson.com/2008/02/rgb-to-hsl-and-rgb-to-hsv-color-model-conversion-algorithms-in-javascript
      //     let r, g, b;
      //     const h = step / numOfSteps;
      //     const i = ~~(h * 6);
      //     const f = h * 6 - i;
      //     const q = 1 - f;
      //     switch(i % 6){
      //         case 0: r = 1; g = f; b = 0; break;
      //         case 1: r = q; g = 1; b = 0; break;
      //         case 2: r = 0; g = 1; b = f; break;
      //         case 3: r = 0; g = q; b = 1; break;
      //         case 4: r = f; g = 0; b = 1; break;
      //         case 5: r = 1; g = 0; b = q; break;
      //     }
      //     let c = "#" + ("00" + (~ ~(r * 255)).toString(16)).slice(-2) + ("00" + (~ ~(g * 255)).toString(16)).slice(-2) + ("00" + (~ ~(b * 255)).toString(16)).slice(-2);
      //     return (c);
      // }
    }]);
    return GenotypeCanvas;
  }();

  var OverviewCanvas = /*#__PURE__*/function () {
    function OverviewCanvas(width, height) {
      _classCallCheck(this, OverviewCanvas);
      this.width = width;
      this.height = height;
      this.canvas = document.createElement('canvas');
      this.canvas.width = width;
      this.canvas.height = height;
      this.canvas.style.display = "block";
      this.drawingContext = this.canvas.getContext('2d');
      this.backBuffer = document.createElement('canvas');
      this.backBuffer.width = width;
      this.backBuffer.height = height;
      this.backContext = this.backBuffer.getContext('2d');

      // Coordinates of the visibility window (pixels)
      this.windowRect = {
        x: 0,
        y: 0,
        width: 0,
        height: 0
      };
      this.dataSet = undefined;
      this.colorScheme = undefined;
      this.selectedChromosome = 0;
      this.enabled = true;
    }
    _createClass(OverviewCanvas, [{
      key: "init",
      value: function init(dataSet, settings, visibilityWindow) {
        this.dataSet = dataSet;
        this.colorScheme = settings.colorScheme;
        this.moveToPosition(0, 0, visibilityWindow);
        this.prerender(true);
      }
    }, {
      key: "prerender",
      value: function prerender(redraw) {
        this.drawingContext.save();
        if (redraw) {
          this.renderImage(this.backContext, this.width, this.height, false);
        }
        this.drawingContext.drawImage(this.backBuffer, 0, 0);
        this.renderWindow();
        if (!this.enabled) {
          this.drawingContext.fillStyle = 'rgba(150, 150, 150, 0.4)';
          this.drawingContext.fillRect(0, 0, this.canvas.width, this.canvas.height);
        }
        this.drawingContext.restore();
      }

      // Draw the genotype canvas' visibility window
    }, {
      key: "renderWindow",
      value: function renderWindow() {
        this.drawingContext.save();
        this.drawingContext.fillStyle = 'rgba(0,0,0,0.2)';
        this.drawingContext.strokeStyle = 'rgba(255,0,0,0.8)';
        this.drawingContext.lineWidth = 1;
        this.drawingContext.fillRect(this.windowRect.x, this.windowRect.y, this.windowRect.width, this.windowRect.height);
        this.drawingContext.strokeRect(this.windowRect.x, this.windowRect.y, this.windowRect.width, this.windowRect.height);
        this.drawingContext.restore();
      }
    }, {
      key: "renderImage",
      value: function renderImage(context, width, height, highlightReference) {
        try {
          var imageData = this.createImage(context.createImageData(width, height), highlightReference);
          context.putImageData(imageData, 0, 0);
        } catch (thrownError) {
          alert(thrownError.message.indexOf("Cannot read properties of undefined (reading 'genotypeData')") != -1 ? "Error loading genotypes (dataset may be too large for the available RAM)" : thrownError);
          throw thrownError;
        }
      }

      // Calculate the number of markers and germplasms per pixel in the overview
    }, {
      key: "renderingScale",
      value: function renderingScale(width, height) {
        return {
          markersPerPixel: this.dataSet.markerCountOn(this.selectedChromosome) / width,
          germplasmsPerPixel: this.dataSet.germplasmList.length / height
        };
      }

      // Generate the overview image, squished within a given size
      // Modeled on the desktop version
    }, {
      key: "createImage",
      value: function createImage(imageData, highlightReference) {
        var scale = this.renderingScale(imageData.width, imageData.height);
        var germplasmsPerPixel = this.dataSet.germplasmList.length / imageData.height;
        var markersPerPixel = this.dataSet.markerCountOn(this.selectedChromosome) / imageData.width;
        for (var x = 0; x < imageData.width; x += 1) {
          for (var y = 0; y < imageData.height; y += 1) {
            var marker = Math.floor(x * scale.markersPerPixel);
            var germplasm = Math.floor(y * scale.germplasmsPerPixel);
            var color = this.colorScheme.getColor(germplasm, this.selectedChromosome, marker, highlightReference);
            var pixelIndex = (y * imageData.width + x) * 4;
            imageData.data[pixelIndex] = color[0];
            imageData.data[pixelIndex + 1] = color[1];
            imageData.data[pixelIndex + 2] = color[2];
            imageData.data[pixelIndex + 3] = color.length > 3 ? color[3] : 255;
          }
        }
        return imageData;
      }

      // Get the visibility window pixel coordinates from its data coordinates
    }, {
      key: "windowFromPosition",
      value: function windowFromPosition(marker, germplasm, visibilityWindow) {
        var scale = this.renderingScale(this.width, this.height);
        var cornerX = marker / scale.markersPerPixel;
        var cornerY = germplasm / scale.germplasmsPerPixel;
        var windowWidth = visibilityWindow.markers / scale.markersPerPixel;
        var windowHeight = visibilityWindow.germplasms / scale.germplasmsPerPixel;
        return {
          x: cornerX,
          y: cornerY,
          width: windowWidth,
          height: windowHeight
        };
      }

      // Set the center of the visibility window to (mouseX, mouseY)
    }, {
      key: "mouseDrag",
      value: function mouseDrag(mouseX, mouseY, visibilityWindow) {
        if (!this.enabled) return;
        var scale = this.renderingScale(this.width, this.height);
        var centerMarker = mouseX * scale.markersPerPixel;
        var centerGermplasm = mouseY * scale.germplasmsPerPixel;

        // Clamp within the canvas (no position < 0 or > number of markers or germplasms)
        var cornerMarker = Math.min(Math.max(0, Math.floor(centerMarker - visibilityWindow.markers / 2)), this.dataSet.markerCountOn(this.selectedChromosome) - visibilityWindow.markers);
        var cornerGermplasm = Math.min(Math.max(Math.floor(centerGermplasm - visibilityWindow.germplasms / 2), 0), this.dataSet.germplasmList.length - visibilityWindow.germplasms);
        this.windowRect = this.windowFromPosition(cornerMarker, cornerGermplasm, visibilityWindow);
        this.prerender(false);
        return {
          marker: cornerMarker,
          germplasm: cornerGermplasm
        };
      }

      // Set the visibility window, given its data coordinates
    }, {
      key: "moveToPosition",
      value: function moveToPosition(marker, germplasm, visibilityWindow) {
        if (!this.enabled) return;
        this.windowRect = this.windowFromPosition(marker, germplasm, visibilityWindow);
        this.prerender(false);
        return {
          marker: marker,
          germplasm: germplasm
        };
      }
    }, {
      key: "setChromosome",
      value: function setChromosome(chromosomeIndex) {
        this.selectedChromosome = chromosomeIndex;
        this.prerender(true);
      }
    }, {
      key: "setColorScheme",
      value: function setColorScheme(colorScheme) {
        this.colorScheme = colorScheme;
        this.prerender(true);
      }
    }, {
      key: "setAutoWidth",
      value: function setAutoWidth(newWidth) {
        this.width = newWidth;
        this.canvas.width = newWidth;
        this.backBuffer.width = newWidth;
        this.prerender(true);
      }
    }, {
      key: "exportName",
      value: function exportName() {
        return "overview-".concat(this.dataSet.genomeMap.chromosomes[this.selectedChromosome].name);
      }
    }, {
      key: "disable",
      value: function disable() {
        this.enabled = false;
        this.prerender(false);
      }
    }, {
      key: "enable",
      value: function enable() {
        this.enabled = true;
        this.prerender(false);
      }

      // Export the overview to an image
      // FIXME : There's a limit on the size and area of canvas.
      //         Beyond these limits, the browser either throws an error or simply makes the canvas unresponsive
      //         These limits and this behaviour are not standard
      //         Possible solution : Using a third-party library to handle the image manipulation
      //         Current implementation : Catch the error and warn the user if we are able to detect this case
    }, {
      key: "toDataURL",
      value: function toDataURL(type, encoderOptions) {
        var tmpCanvas = document.createElement('canvas');
        tmpCanvas.width = this.dataSet.markerCountOn(this.selectedChromosome);
        tmpCanvas.height = this.dataSet.germplasmList.length;
        var tmpContext = tmpCanvas.getContext('2d');
        tmpContext.fillStyle = 'white';
        tmpContext.fillRect(0, 0, tmpCanvas.width, tmpCanvas.height);

        // Ugly, but only way we have to check whether the export can succeed on browser that fail silently
        // Check if the data part of the data URL (after "data:") is empty
        var checkDataURL = tmpCanvas.toDataURL(type, encoderOptions);
        if (checkDataURL.slice(5).length == 0 || checkDataURL.split(/,$/g).pop().length == 0) {
          window.alert("Overview export failed : the image is probably too large");
          return undefined;
        }
        try {
          this.renderImage(tmpContext, tmpCanvas.width, tmpCanvas.height, true);
          return tmpCanvas.toDataURL(type, encoderOptions);
        } catch (error) {
          window.alert("Overview export failed : the image is probably too large");
          console.error(error);
          return undefined;
        }
      }
    }]);
    return OverviewCanvas;
  }();

  var TraitType = {
    Category: 0,
    Numerical: 1
  };

  // Colors are stored as HSV (hue, saturation, value)
  var DEFAULT_HUE_MIN = 0;
  var DEFAULT_HUE_MAX = 120;
  var DEFAULT_SATURATION = 0.53;
  var DEFAULT_VALUE = 1;
  var DEFAULT_GRADIENT_MIN = [DEFAULT_HUE_MIN, DEFAULT_SATURATION, DEFAULT_VALUE];
  var DEFAULT_GRADIENT_MAX = [DEFAULT_HUE_MAX, DEFAULT_SATURATION, DEFAULT_VALUE];
  var Trait = /*#__PURE__*/function () {
    function Trait(name, type, experiment) {
      _classCallCheck(this, Trait);
      this.name = name;
      this.type = type;
      this.experiment = experiment;
      this.values = undefined;
      this.colors = new Map();
      this.customColors = new Set();
      this.longestValue = undefined;
      this.minValue = undefined;
      this.maxValue = undefined;
    }
    _createClass(Trait, [{
      key: "setValues",
      value: function setValues(values) {
        this.values = values;
      }
    }, {
      key: "setScale",
      value: function setScale(min, max) {
        this.minValue = min;
        this.maxValue = max;
        this.resetColors();
      }
    }, {
      key: "resetColors",
      value: function resetColors() {
        this.customColors.clear();
        if (this.type == TraitType.Category) {
          this.setCategoryColors();
        } else if (this.type == TraitType.Numerical) {
          this.colors.set(this.minValue, DEFAULT_GRADIENT_MIN);
          this.colors.set(this.maxValue, DEFAULT_GRADIENT_MAX);
        }
      }
    }, {
      key: "setCategoryColors",
      value: function setCategoryColors() {
        var sortedValues = this.values.slice();
        for (var valueIndex = 0; valueIndex < this.values.length; valueIndex++) {
          var value = this.values[valueIndex];
          var index = sortedValues.indexOf(value);
          var hue = (DEFAULT_HUE_MAX - DEFAULT_HUE_MIN) * index / (sortedValues.length - 1) + DEFAULT_HUE_MIN;
          this.colors.set(valueIndex, [hue, DEFAULT_SATURATION, DEFAULT_VALUE]);
        }
      }
    }, {
      key: "scaleValue",
      value: function scaleValue(value) {
        return (value - this.minValue) / (this.maxValue - this.minValue);
      }
    }, {
      key: "getValue",
      value: function getValue(value) {
        if (this.type == TraitType.Category) {
          return this.values[value];
        } else {
          return value;
        }
      }
    }, {
      key: "getValues",
      value: function getValues() {
        if (this.type == TraitType.Category) return this.values.slice();else return [this.minValue, this.maxValue];
      }
    }, {
      key: "getMinColor",
      value: function getMinColor() {
        return this.getColor(this.minValue);
      }
    }, {
      key: "getMaxColor",
      value: function getMaxColor() {
        return this.getColor(this.maxValue);
      }
    }, {
      key: "getColor",
      value: function getColor(value) {
        var hsv = null;
        if (this.type == TraitType.Category) {
          hsv = this.colors.get(value);
        } else {
          var minColor = this.colors.get(this.minValue);
          var maxColor = this.colors.get(this.maxValue);
          var normalized = this.scaleValue(value);
          hsv = [(maxColor[0] - minColor[0]) * normalized + minColor[0], (maxColor[1] - minColor[1]) * normalized + minColor[1], (maxColor[2] - minColor[2]) * normalized + minColor[2]];
        }
        var rgb = this.hsv2rgb(hsv[0], hsv[1], hsv[2]);
        var hexa = '#' + (1 << 24 | Math.floor(rgb[0] * 255) << 16 | Math.floor(rgb[1] * 255) << 8 | Math.floor(rgb[2] * 255)).toString(16).slice(1);
        return hexa;
      }
    }, {
      key: "setMinColor",
      value: function setMinColor(color) {
        this.setColor(this.minValue, color);
      }
    }, {
      key: "setMaxColor",
      value: function setMaxColor(color) {
        this.setColor(this.maxValue, color);
      }
    }, {
      key: "setColor",
      value: function setColor(value, color) {
        var rgb = [parseInt(color.slice(1, 3), 16) / 255, parseInt(color.slice(3, 5), 16) / 255, parseInt(color.slice(5, 7), 16) / 255];
        var hsv = this.rgb2hsv(rgb[0], rgb[1], rgb[2]);
        this.colors.set(value, hsv);
        this.customColors.add(value);
      }
    }, {
      key: "setHSVColor",
      value: function setHSVColor(value, color) {
        this.colors.set(value, color);
        this.customColors.add(value);
      }
    }, {
      key: "getCustomColors",
      value: function getCustomColors() {
        var customMap = new Map();
        var _iterator = _createForOfIteratorHelper(this.customColors),
          _step;
        try {
          for (_iterator.s(); !(_step = _iterator.n()).done;) {
            var value = _step.value;
            var color = this.colors.get(value);
            customMap.set(this.values[value], color);
          }
        } catch (err) {
          _iterator.e(err);
        } finally {
          _iterator.f();
        }
        return customMap;
      }

      // From https://stackoverflow.com/a/54024653
    }, {
      key: "hsv2rgb",
      value: function hsv2rgb(h, s, v) {
        var f = function f(n) {
          var k = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : (n + h / 60) % 6;
          return v - v * s * Math.max(Math.min(k, 4 - k, 1), 0);
        };
        return [f(5), f(3), f(1)];
      }

      // From https://stackoverflow.com/a/54070620
    }, {
      key: "rgb2hsv",
      value: function rgb2hsv(r, g, b) {
        var v = Math.max(r, g, b);
        var c = v - Math.min(r, g, b);
        var h = c && (v == r ? (g - b) / c : v == g ? 2 + (b - r) / c : 4 + (r - g) / c);
        return [60 * (h < 0 ? h + 6 : h), v && c / v, v];
      }
    }]);
    return Trait;
  }();

  var AlphabeticLineSort = /*#__PURE__*/function () {
    function AlphabeticLineSort() {
      _classCallCheck(this, AlphabeticLineSort);
      this.hasScore = false;
    }
    _createClass(AlphabeticLineSort, [{
      key: "sort",
      value: function sort(dataSet) {
        dataSet.germplasmList.sort(function (a, b) {
          return a.name < b.name ? -1 : a.name > b.name ? 1 : 0;
        });
      }
    }]);
    return AlphabeticLineSort;
  }();

  // Enumeration of the various similarity cases
  var similarityCases = {
    misMatch: 0,
    comparisonLine: 1,
    fullMatch: 2,
    heterozygote1Match: 3,
    heterozygote2Match: 4,
    missing: 5
  };

  // Associate the similarity cases to the similarity score they represent
  var similarityScores = new Map([[similarityCases.misMatch, 0], [similarityCases.comparisonLine, 1], [similarityCases.fullMatch, 1], [similarityCases.heterozygote1Match, 0.5], [similarityCases.heterozygote2Match, 0.5], [similarityCases.missing, 0]]);

  // Build a lookup table for genotypes similarity
  // All existing genotypes are identified once within the stateTable, as a genotype -> index mapping, where indices are sequential
  // This builds a matrix that gives the similarity case from two genotype indices
  function buildSimilarityLookupTable(stateTable) {
    var length = stateTable.size;
    var table = Array.from(Array(length), function () {
      return new Array(length);
    });

    // As a Map is ordered and indices are sequential, this gives the index -> genotype mapping, inverse of stateTable
    var stateTableKeys = Array.from(stateTable.keys());
    for (var i = 0; i < length; i += 1) {
      for (var j = 0; j < length; j += 1) {
        // Default to misMatch
        table[i][j] = similarityCases.misMatch;
        var iStateKey = stateTableKeys[i];
        var iStateValue = stateTable.get(iStateKey);
        var jStateKey = stateTableKeys[j];
        var jStateValue = stateTable.get(jStateKey);

        // Either state is missing
        if (iStateValue === 0 || jStateValue === 0) {
          table[i][j] = similarityCases.missing;
          // Same state
        } else if (i === j) {
          table[i][j] = similarityCases.fullMatch;
        } else {
          // Our state is homozygous and the comparison state is heterozygous
          if (iStateKey.isHomozygous && !jStateKey.isHomozygous) {
            if (iStateKey.allele1 === jStateKey.allele1) {
              table[i][j] = similarityCases.heterozygote1Match;
            } else if (iStateKey.allele1 === jStateKey.allele2) {
              table[i][j] = similarityCases.heterozygote2Match;
            }
            // Our state is het and comp state is homozygous
          } else if (!iStateKey.isHomozygous && jStateKey.isHomozygous) {
            // First allele matches
            if (iStateKey.allele1 === jStateKey.allele1 || iStateKey.allele1 === jStateKey.allele2) {
              table[i][j] = similarityCases.heterozygote1Match;
              // Second allele matches
            } else if (iStateKey.allele2 === jStateKey.allele1 || iStateKey.allele2 === jStateKey.allele2) {
              table[i][j] = similarityCases.heterozygote2Match;
            }
            // Neither state is homozygous
          } else if (!iStateKey.isHomozygous && !jStateKey.isHomozygous) {
            // First allele matches
            if (iStateKey.allele1 === jStateKey.allele1 || iStateKey.allele1 === jStateKey.allele2) {
              table[i][j] = similarityCases.heterozygote1Match;
              // Second allele matches
            } else if (iStateKey.allele2 === jStateKey.allele1 || iStateKey.allele2 === jStateKey.allele2) {
              table[i][j] = similarityCases.heterozygote2Match;
            }
          }
        }
      }
    }
    return table;
  }

  // Calculate the similarity score for two full germplasms on the given chromosomes
  function germplasmSimilarityScore(dataSet, referenceIndex, comparedIndex, chromosomes) {
    if (!chromosomes || chromosomes.length == 0) return 0;
    var score = 0;
    var markerCount = 0;
    var referenceGermplasm = dataSet.germplasmList[referenceIndex];
    var _iterator = _createForOfIteratorHelper(chromosomes),
      _step;
    try {
      for (_iterator.s(); !(_step = _iterator.n()).done;) {
        var chromosome = _step.value;
        markerCount += referenceGermplasm.genotypeData[chromosome].length;
        for (var marker in referenceGermplasm.genotypeData[chromosome]) {
          var reference = dataSet.genotypeFor(referenceIndex, chromosome, marker);
          var compared = dataSet.genotypeFor(comparedIndex, chromosome, marker);
          var similarityCase = dataSet.similarityLookupTable[compared][reference];
          if (similarityCase == similarityCases.missing) {
            markerCount -= 1;
            continue;
          }
          score += similarityScores.get(similarityCase);
        }
      }
    } catch (err) {
      _iterator.e(err);
    } finally {
      _iterator.f();
    }
    return score / markerCount;
  }

  var SimilarityLineSort = /*#__PURE__*/function () {
    function SimilarityLineSort(referenceName, chromosomeIndices) {
      _classCallCheck(this, SimilarityLineSort);
      this.referenceName = referenceName;
      this.chromosomeIndices = chromosomeIndices;
      this.scoreMap = undefined;
      this.hasScore = true;
    }
    _createClass(SimilarityLineSort, [{
      key: "sort",
      value: function sort(dataSet) {
        var _this = this;
        var referenceIndex = dataSet.germplasmList.findIndex(function (germplasm) {
          return germplasm.name == _this.referenceName;
        });
        this.scoreMap = new Map();
        for (var comparedIndex in dataSet.germplasmList) {
          this.scoreMap.set(dataSet.germplasmList[comparedIndex].name, germplasmSimilarityScore(dataSet, referenceIndex, comparedIndex, this.chromosomeIndices));
        }
        dataSet.germplasmList.sort(function (a, b) {
          return _this.scoreMap.get(b.name) - _this.scoreMap.get(a.name);
        });
      }
    }, {
      key: "getScore",
      value: function getScore(germplasmName) {
        return this.scoreMap.get(germplasmName);
      }
    }, {
      key: "setComparisonLine",
      value: function setComparisonLine(referenceName) {
        this.referenceName = referenceName;
      }
    }, {
      key: "setChromosomes",
      value: function setChromosomes(chromosomeIndices) {
        this.chromosomeIndices = chromosomeIndices;
      }
    }]);
    return SimilarityLineSort;
  }();

  var ImportingOrderLineSort = /*#__PURE__*/function () {
    function ImportingOrderLineSort() {
      _classCallCheck(this, ImportingOrderLineSort);
      this.hasScore = false;
    }
    _createClass(ImportingOrderLineSort, [{
      key: "sort",
      value: function sort(dataSet) {
        dataSet.germplasmList.sort(function (a, b) {
          return dataSet.importingOrder.indexOf(a.name) - dataSet.importingOrder.indexOf(b.name);
        });
      }
    }]);
    return ImportingOrderLineSort;
  }();

  var TraitLineSort = /*#__PURE__*/function () {
    function TraitLineSort(traitName) {
      _classCallCheck(this, TraitLineSort);
      this.hasScore = false;
      this.traitName = traitName;
    }
    _createClass(TraitLineSort, [{
      key: "sort",
      value: function sort(dataSet) {
        var self = this;
        var trait = dataSet.getTrait(self.traitName);
        dataSet.germplasmList.sort(function (a, b) {
          return dataSet.importingOrder.indexOf(a.name) - dataSet.importingOrder.indexOf(b.name);
        }).sort(function (a, b) {
          if (a.phenotype === undefined) return 1;
          if (b.phenotype === undefined) return -1;
          var valueA = a.getPhenotype(self.traitName); // No need to getValue, the valueIndex are already sorted for category traits
          if (valueA === undefined) return 1;
          var valueB = b.getPhenotype(self.traitName);
          if (valueB === undefined) return -1;
          if (valueA < valueB) return -1;
          if (valueB < valueA) return 1;
          if (valueA == valueB) return 0;
        });
      }
    }, {
      key: "setTrait",
      value: function setTrait(traitName) {
        this.traitName = traitName;
      }
    }]);
    return TraitLineSort;
  }();

  function buildCSSColors(colors) {
    var cssColors = {};
    for (var _i = 0, _Object$keys = Object.keys(colors); _i < _Object$keys.length; _i++) {
      var name = _Object$keys[_i];
      var color = colors[name];
      if (color.length > 3) {
        cssColors[name] = 'rgb(' + color[0] + ',' + color[1] + ',' + color[2] + ',' + color[3] + ')';
      } else {
        cssColors[name] = 'rgb(' + color[0] + "," + color[1] + "," + color[2] + ')';
      }
    }
    return cssColors;
  }

  var NucleotideColorScheme = /*#__PURE__*/function () {
    function NucleotideColorScheme(dataSet) {
      _classCallCheck(this, NucleotideColorScheme);
      this.dataSet = dataSet;
      this.stateTable = this.dataSet.stateTable;
      this.colors = {
        greenLight: [171, 255, 171],
        greenDark: [86, 179, 86],
        redLight: [255, 171, 171],
        redDark: [179, 86, 86],
        blueLight: [171, 171, 255],
        blueDark: [86, 86, 179],
        orangeLight: [255, 228, 171],
        orangeDark: [179, 114, 86],
        white: [255, 255, 255],
        greyLight: [210, 210, 210],
        greyDark: [192, 192, 192],
        heterozygotePrimary: [100, 100, 100]
      };
      this.cssColors = buildCSSColors(this.colors);
      this.colorMap = new Map();
      this.colorMap.set('A', {
        light: this.colors.greenLight,
        dark: this.colors.greenDark,
        cssLight: this.cssColors.greenLight,
        cssDark: this.cssColors.greenDark
      });
      this.colorMap.set('C', {
        light: this.colors.orangeLight,
        dark: this.colors.orangeDark,
        cssLight: this.cssColors.orangeLight,
        cssDark: this.cssColors.orangeDark
      });
      this.colorMap.set('G', {
        light: this.colors.redLight,
        dark: this.colors.redDark,
        cssLight: this.cssColors.redLight,
        cssDark: this.cssColors.redDark
      });
      this.colorMap.set('T', {
        light: this.colors.blueLight,
        dark: this.colors.blueDark,
        cssLight: this.cssColors.blueLight,
        cssDark: this.cssColors.blueDark
      });
      this.colorMap.set('', {
        light: this.colors.white,
        dark: this.colors.white,
        cssLight: this.cssColors.white,
        cssDark: this.cssColors.white
      });
      this.colorMap.set('-', {
        light: this.colors.greyLight,
        dark: this.colors.greyDark,
        cssLight: this.cssColors.greyLight,
        cssDark: this.cssColors.greyDark
      });
      this.colorMap.set('+', {
        light: this.colors.greyLight,
        dark: this.colors.greyDark,
        cssLight: this.cssColors.greyLight,
        cssDark: this.cssColors.greyDark
      });
      this.colorStamps = [];
      this.genotypeColors = [];
    }
    _createClass(NucleotideColorScheme, [{
      key: "getColor",
      value: function getColor(germplasm, chromosome, marker) {
        var genotype = this.dataSet.genotypeFor(germplasm, chromosome, marker);
        return this.genotypeColors[genotype];
      }
    }, {
      key: "getState",
      value: function getState(germplasm, chromosome, marker) {
        var geno = this.dataSet.genotypeFor(germplasm, chromosome, marker);
        return this.colorStamps[geno];
      }

      // Generates a set of homozygous and heterozygous color stamps from the stateTable
    }, {
      key: "setupColorStamps",
      value: function setupColorStamps(size, font, fontSize) {
        var _this = this;
        this.colorStamps = [];
        this.stateTable.forEach(function (value, genotype) {
          var stamp, color;
          if (genotype.isHomozygous) {
            stamp = _this.drawGradientSquare(size, genotype, font, fontSize);
            color = _this.getAlleleColor(genotype.allele1).light;
          } else {
            stamp = _this.drawHetSquare(size, genotype, font, fontSize);
            color = _this.colors.heterozygotePrimary;
          }
          _this.colorStamps.push(stamp);
          _this.genotypeColors.push(color);
        });
      }
    }, {
      key: "getAlleleColor",
      value: function getAlleleColor(allele) {
        var color = this.colorMap.get(allele);
        return color == null ? this.colorMap.get("-") : color;
      }
    }, {
      key: "drawGradientSquare",
      value: function drawGradientSquare(size, genotype, font, fontSize) {
        var color = this.getAlleleColor(genotype.allele1);
        var gradCanvas = document.createElement('canvas');
        gradCanvas.width = size;
        gradCanvas.height = size;
        var gradientCtx = gradCanvas.getContext('2d');
        var lingrad = gradientCtx.createLinearGradient(0, 0, size, size);
        lingrad.addColorStop(0, color.cssLight);
        lingrad.addColorStop(1, color.cssDark);
        gradientCtx.fillStyle = lingrad;
        gradientCtx.fillRect(0, 0, size, size);
        gradientCtx.fillStyle = 'rgb(0,0,0)';
        gradientCtx.font = font;
        if (size >= 10) {
          var textWidth = gradientCtx.measureText(genotype.allele1).width;
          gradientCtx.fillText(genotype.getText(), (size - textWidth) / 2, size - fontSize / 2);
        }
        return gradCanvas;
      }
    }, {
      key: "drawHetSquare",
      value: function drawHetSquare(size, genotype, font, fontSize) {
        var color1 = this.getAlleleColor(genotype.allele1);
        var color2 = this.getAlleleColor(genotype.allele2);
        var gradCanvas = document.createElement('canvas');
        gradCanvas.width = size;
        gradCanvas.height = size;
        var gradientCtx = gradCanvas.getContext('2d');
        var lingrad = gradientCtx.createLinearGradient(0, 0, size, size);
        lingrad.addColorStop(0, color1.cssLight);
        lingrad.addColorStop(1, color1.cssDark);
        gradientCtx.fillStyle = lingrad;
        gradientCtx.beginPath();
        gradientCtx.lineTo(size, 0);
        gradientCtx.lineTo(0, size);
        gradientCtx.lineTo(0, 0);
        gradientCtx.fill();
        var lingrad2 = gradientCtx.createLinearGradient(0, 0, size, size);
        lingrad2.addColorStop(0, color2.cssLight);
        lingrad2.addColorStop(1, color2.cssDark);
        gradientCtx.fillStyle = lingrad2;
        gradientCtx.beginPath();
        gradientCtx.moveTo(size, 0);
        gradientCtx.lineTo(size, size);
        gradientCtx.lineTo(0, size);
        gradientCtx.lineTo(size, 0);
        gradientCtx.fill();
        gradientCtx.fillStyle = 'rgb(0,0,0)';
        gradientCtx.font = font;
        if (size >= 10) {
          var allele1Width = gradientCtx.measureText(genotype.allele1).width;
          gradientCtx.fillText(genotype.allele1, (size / 2 - allele1Width) / 2, fontSize);
          var allele2Width = gradientCtx.measureText(genotype.allele2).width;
          gradientCtx.fillText(genotype.allele2, size - (size / 2 + allele2Width) / 2, size - fontSize / 4);
        }
        return gradCanvas;
      }
    }, {
      key: "setComparisonLineIndex",
      value: function setComparisonLineIndex(newIndex) {}
    }]);
    return NucleotideColorScheme;
  }();

  var SimilarityColorScheme = /*#__PURE__*/function () {
    function SimilarityColorScheme(dataSet, compIndex) {
      _classCallCheck(this, SimilarityColorScheme);
      this.dataSet = dataSet;
      this.stateTable = this.dataSet.stateTable;
      this.lookupTable = this.dataSet.similarityLookupTable;
      // Line index of the line to be compared against
      this.compIndex = compIndex;
      this.colors = {
        compGreenLight: [90, 180, 90],
        compGreenDark: [50, 100, 50],
        greenLight: [171, 255, 171],
        greenDark: [86, 179, 86],
        redLight: [255, 171, 171],
        redDark: [179, 86, 86],
        white: [255, 255, 255],
        greyLight: [210, 210, 210],
        greyDark: [192, 192, 192],
        heterozygotePrimary: [100, 100, 100]
      };
      this.cssColors = buildCSSColors(this.colors);
      var size = this.stateTable.size;

      // An array of color stamps for each class of comparison
      this.compStamps = [size];
      this.matchStamps = [size];
      this.misMatchStamps = [size];
      this.het1MatchStamps = [size];
      this.het2MatchStamps = [size];
      this.greyStamps = [size];
    }
    _createClass(SimilarityColorScheme, [{
      key: "getColor",
      value: function getColor(germplasm, chromosome, marker, highlightReference) {
        var compState = this.dataSet.genotypeFor(this.compIndex, chromosome, marker);
        var genoState = this.dataSet.genotypeFor(germplasm, chromosome, marker);
        var lookupValue = this.lookupTable[genoState][compState];
        if (genoState === 0) {
          return this.colors.white;
        } else if (this.compIndex === germplasm && highlightReference) {
          return this.colors.compGreenLight;
        } else {
          switch (lookupValue) {
            case similarityCases.misMatch:
              return this.colors.redLight;
            case similarityCases.comparisonLine:
              return this.colors.compGreenLight;
            case similarityCases.fullMatch:
              return this.colors.greenLight;
            case similarityCases.heterozygote1Match:
            case similarityCases.heterozygote2Match:
              return this.colors.heterozygotePrimary;
            case similarityCases.missing:
              return this.colors.greyDark;
          }
        }
      }
    }, {
      key: "getState",
      value: function getState(germplasm, chromosome, marker) {
        var stamp;
        var compState = this.dataSet.genotypeFor(this.compIndex, chromosome, marker);
        var genoState = this.dataSet.genotypeFor(germplasm, chromosome, marker);
        var lookupValue = this.lookupTable[genoState][compState];
        if (this.compIndex === germplasm) {
          stamp = this.compStamps[genoState];
        } else {
          switch (lookupValue) {
            case similarityCases.misMatch:
              stamp = this.misMatchStamps[genoState];
              break;
            case similarityCases.comparisonLine:
              stamp = this.compStamps[genoState];
              break;
            case similarityCases.fullMatch:
              stamp = this.matchStamps[genoState];
              break;
            case similarityCases.heterozygote1Match:
              stamp = this.het1MatchStamps[genoState];
              break;
            case similarityCases.heterozygote2Match:
              stamp = this.het2MatchStamps[genoState];
              break;
            case similarityCases.missing:
              stamp = this.greyStamps[genoState];
              break;
          }
        }
        return stamp;
      }

      // Generates a set of homozygous and heterozygous color stamps from the stateTable
    }, {
      key: "setupColorStamps",
      value: function setupColorStamps(size, font, fontSize) {
        var _this = this;
        var length = this.stateTable.size;
        this.compStamps = [length];
        this.matchStamps = [length];
        this.misMatchStamps = [length];
        this.het1MatchStamps = [length];
        this.het2MatchStamps = [length];
        this.greyStamps = [length];
        var index = 0;
        this.stateTable.forEach(function (value, genotype) {
          if (genotype.isHomozygous) {
            _this.compStamps[index] = _this.drawGradientSquare(size, genotype, font, fontSize, _this.cssColors.compGreenLight, _this.cssColors.compGreenDark);
            _this.matchStamps[index] = _this.drawGradientSquare(size, genotype, font, fontSize, _this.cssColors.greenLight, _this.cssColors.greenDark);
            // Homozygotes compared to heterozygotes show as a match, but retain a half-point for similarity score
            _this.het1MatchStamps[index] = _this.drawGradientSquare(size, genotype, font, fontSize, _this.cssColors.greenLight, _this.cssColors.greenDark);
            _this.het2MatchStamps[index] = _this.drawGradientSquare(size, genotype, font, fontSize, _this.cssColors.greenLight, _this.cssColors.greenDark);
            _this.misMatchStamps[index] = _this.drawGradientSquare(size, genotype, font, fontSize, _this.cssColors.redLight, _this.cssColors.redDark);
            _this.greyStamps[index] = _this.drawGradientSquare(size, genotype, font, fontSize, _this.cssColors.greyLight, _this.cssColors.greyDark);
          } else {
            _this.compStamps[index] = _this.drawHetSquare(size, genotype, font, fontSize, _this.cssColors.compGreenLight, _this.cssColors.compGreenDark, _this.cssColors.compGreenLight, _this.cssColors.compGreenDark);
            _this.matchStamps[index] = _this.drawHetSquare(size, genotype, font, fontSize, _this.cssColors.greenLight, _this.cssColors.greenDark, _this.cssColors.greenLight, _this.cssColors.greenDark);
            _this.misMatchStamps[index] = _this.drawHetSquare(size, genotype, font, fontSize, _this.cssColors.redLight, _this.cssColors.redDark, _this.cssColors.redLight, _this.cssColors.redDark);
            _this.het1MatchStamps[index] = _this.drawHetSquare(size, genotype, font, fontSize, _this.cssColors.greenLight, _this.cssColors.greenDark, _this.cssColors.redLight, _this.cssColors.redDark);
            _this.het2MatchStamps[index] = _this.drawHetSquare(size, genotype, font, fontSize, _this.cssColors.redLight, _this.cssColors.redDark, _this.cssColors.greenLight, _this.cssColors.greenDark);
            _this.greyStamps[index] = _this.drawHetSquare(size, genotype, font, fontSize, _this.cssColors.greyLight, _this.cssColors.greyDark, _this.cssColors.greyLight, _this.cssColors.greyDark);
          }
          index += 1;
        });
      }
    }, {
      key: "drawGradientSquare",
      value: function drawGradientSquare(size, genotype, font, fontSize, colorLight, colorDark) {
        var gradCanvas = document.createElement('canvas');
        gradCanvas.width = size;
        gradCanvas.height = size;
        var gradientCtx = gradCanvas.getContext('2d');
        if (genotype.allele1 === '') {
          colorLight = colorDark = this.cssColors.white;
        }
        var lingrad = gradientCtx.createLinearGradient(0, 0, size, size);
        lingrad.addColorStop(0, colorLight);
        lingrad.addColorStop(1, colorDark);
        gradientCtx.fillStyle = lingrad;
        gradientCtx.fillRect(0, 0, size, size);
        gradientCtx.fillStyle = 'rgb(0,0,0)';
        gradientCtx.font = font;
        if (size >= 10) {
          var textWidth = gradientCtx.measureText(genotype.allele1).width;
          gradientCtx.fillText(genotype.getText(), (size - textWidth) / 2, size - fontSize / 2);
        }
        return gradCanvas;
      }
    }, {
      key: "drawHetSquare",
      value: function drawHetSquare(size, genotype, font, fontSize, color1Light, color1Dark, color2Light, color2Dark) {
        var gradCanvas = document.createElement('canvas');
        gradCanvas.width = size;
        gradCanvas.height = size;
        var gradientCtx = gradCanvas.getContext('2d');
        if (genotype.allele1 === '') {
          color1Light = color1Dark = color2Light = color2Dark = this.cssColors.white;
        }
        var lingrad = gradientCtx.createLinearGradient(0, 0, size, size);
        lingrad.addColorStop(0, color1Light);
        lingrad.addColorStop(1, color1Dark);
        gradientCtx.fillStyle = lingrad;
        gradientCtx.beginPath();
        gradientCtx.lineTo(size, 0);
        gradientCtx.lineTo(0, size);
        gradientCtx.lineTo(0, 0);
        gradientCtx.fill();
        var lingrad2 = gradientCtx.createLinearGradient(0, 0, size, size);
        lingrad2.addColorStop(0, color2Light);
        lingrad2.addColorStop(1, color2Dark);
        gradientCtx.fillStyle = lingrad2;
        gradientCtx.beginPath();
        gradientCtx.moveTo(size, 0);
        gradientCtx.lineTo(size, size);
        gradientCtx.lineTo(0, size);
        gradientCtx.lineTo(size, 0);
        gradientCtx.fill();
        gradientCtx.fillStyle = 'rgb(0,0,0)';
        gradientCtx.font = font;
        if (size >= 10) {
          var allele1Width = gradientCtx.measureText(genotype.allele1).width;
          gradientCtx.fillText(genotype.allele1, (size / 2 - allele1Width) / 2, fontSize);
          var allele2Width = gradientCtx.measureText(genotype.allele2).width;
          gradientCtx.fillText(genotype.allele2, size - (size / 2 + allele2Width) / 2, size - fontSize / 4);
        }
        return gradCanvas;
      }
    }, {
      key: "setComparisonLineIndex",
      value: function setComparisonLineIndex(newIndex) {
        this.compIndex = newIndex;
      }
    }]);
    return SimilarityColorScheme;
  }();

  var CanvasController = /*#__PURE__*/function () {
    function CanvasController(container, genotypeCanvas, overviewCanvas, saveSettings, genotypeAutoWidth, overviewAutoWidth, minGenotypeAutoWidth, minOverviewAutoWidth) {
      _classCallCheck(this, CanvasController);
      this.canvasContainer = container;
      this.genotypeCanvas = genotypeCanvas;
      this.overviewCanvas = overviewCanvas;
      this.genotypeAutoWidth = genotypeAutoWidth === undefined ? false : genotypeAutoWidth;
      this.overviewAutoWidth = overviewAutoWidth === undefined ? false : overviewAutoWidth;
      this.minGenotypeAutoWidth = minGenotypeAutoWidth === undefined ? 0 : minGenotypeAutoWidth;
      this.minOverviewAutoWidth = minOverviewAutoWidth === undefined ? 0 : minOverviewAutoWidth;
      this.saveSettings = saveSettings;
      this.chromosomeIndex = 0;
      this.dragStartX = null;
      this.dragStartY = null;
      this.draggingGenotypeCanvas = false;
      this.draggingVerticalScrollbar = false;
      this.draggingHorizontalScrollbar = false;
      this.draggingOverviewCanvas = false;
      this.contextMenuY = null;
    }
    _createClass(CanvasController, [{
      key: "init",
      value: function init(dataSet) {
        var _this = this;
        this.dataSet = dataSet;
        var settings = this.loadDefaultSettings(this.dataSet.id);
        if (settings.traitColors != null && this.dataSet.hasTraits()) {
          for (var traitName in settings.traitColors) {
            var trait = this.dataSet.getTrait(traitName);
            if (trait !== undefined) {
              for (var value in settings.traitColors[traitName]) {
                trait.setHSVColor(parseFloat(value), settings.traitColors[traitName][value]);
              }
            }
          }
        }

        // Initialize the components
        this.genotypeCanvas.init(dataSet, settings);
        this.genotypeCanvas.prerender(true);
        this.overviewCanvas.init(dataSet, settings, this.genotypeCanvas.visibilityWindow());
        this.overviewCanvas.prerender(true);
        this.updateAutoWidth();
        window.addEventListener("resize", function (event) {
          _this.updateAutoWidth();
        });

        // Color schemes
        var nucleotideRadio = document.getElementById('nucleotideScheme');
        if (settings.colorSchemeId == "nucleotide") nucleotideRadio.checked = true;
        nucleotideRadio.addEventListener('change', function () {
          var lineSelect = document.getElementById('colorLineSelect');
          lineSelect.disabled = true;
          var colorScheme = new NucleotideColorScheme(_this.genotypeCanvas.dataSet);
          colorScheme.setupColorStamps(_this.genotypeCanvas.boxSize, _this.genotypeCanvas.font, _this.genotypeCanvas.fontSize);
          _this.genotypeCanvas.setColorScheme(colorScheme);
          _this.overviewCanvas.setColorScheme(colorScheme);
          _this.saveSetting("colorScheme", "nucleotide");
        });
        var similarityRadio = document.getElementById('similarityScheme');
        var lineSelect = document.getElementById('colorLineSelect');
        if (settings.colorSchemeId == "similarity") {
          similarityRadio.checked = true;
          lineSelect.disabled = false;
          lineSelect.value = settings.colorReference;
        }
        similarityRadio.addEventListener('change', function () {
          var lineSelect = document.getElementById('colorLineSelect');
          lineSelect.disabled = false;
          var referenceName = lineSelect.options[lineSelect.selectedIndex].value;
          var referenceIndex = _this.genotypeCanvas.dataSet.germplasmList.findIndex(function (germplasm) {
            return germplasm.name == referenceName;
          });
          var colorScheme = new SimilarityColorScheme(_this.genotypeCanvas.dataSet, referenceIndex);
          colorScheme.setupColorStamps(_this.genotypeCanvas.boxSize, _this.genotypeCanvas.font, _this.genotypeCanvas.fontSize);
          _this.genotypeCanvas.setColorScheme(colorScheme);
          _this.genotypeCanvas.setColorComparisonLine(referenceName);
          _this.overviewCanvas.setColorScheme(colorScheme);
          _this.saveSetting("colorReference", referenceName);
          _this.saveSetting("colorScheme", "similarity");
        });
        lineSelect.addEventListener('change', function (event) {
          var reference = event.target.options[event.target.selectedIndex].value;
          _this.genotypeCanvas.setColorComparisonLine(reference);
          _this.overviewCanvas.prerender(true);
          _this.saveSetting("colorReference", reference);
        });

        // Sort
        var sortLineSelect = document.getElementById('sortLineSelect');
        var sortTraitSelect = document.getElementById('sortTraitSelect');
        var importingOrderRadio = document.getElementById('importingOrderSort');
        if (settings.lineSortId == "importing") importingOrderRadio.checked = true;
        importingOrderRadio.addEventListener('change', function () {
          sortLineSelect.disabled = true;
          if (sortTraitSelect !== null) sortTraitSelect.disabled = true;
          _this.setLineSort(new ImportingOrderLineSort());
          _this.saveSetting("sort", "importing");
        });
        var alphabetOrderRadio = document.getElementById('alphabeticSort');
        if (settings.lineSortId == "alphabetic") alphabetOrderRadio.checked = true;
        alphabetOrderRadio.addEventListener('change', function () {
          sortLineSelect.disabled = true;
          if (sortTraitSelect !== null) sortTraitSelect.disabled = true;
          _this.setLineSort(new AlphabeticLineSort());
          _this.saveSetting("sort", "alphabetic");
        });
        var similarityOrderRadio = document.getElementById('similaritySort');
        if (settings.lineSortId == "similarity") {
          similarityOrderRadio.checked = true;
          sortLineSelect.disabled = false;
          sortLineSelect.value = settings.sortReference;
        }
        similarityOrderRadio.addEventListener('change', function () {
          sortLineSelect.disabled = false;
          if (sortTraitSelect !== null) sortTraitSelect.disabled = true;
          var referenceName = sortLineSelect.options[sortLineSelect.selectedIndex].value;
          _this.setLineSort(new SimilarityLineSort(referenceName, [_this.chromosomeIndex]));
          _this.saveSetting("sort", "similarity");
          _this.saveSetting("sortReference", referenceName);
        });
        sortLineSelect.addEventListener('change', function (event) {
          if (!sortLineSelect.disabled) {
            var referenceName = sortLineSelect.options[sortLineSelect.selectedIndex].value;
            _this.setLineSort(new SimilarityLineSort(referenceName, [_this.chromosomeIndex]));
            _this.saveSetting("sortReference", referenceName);
          }
        });
        if (dataSet.hasTraits()) {
          var traitOrderRadio = document.getElementById('traitSort');
          if (settings.lineSortId == "trait") {
            traitOrderRadio.checked = true;
            sortTraitSelect.disabled = false;
            sortTraitSelect.value = settings.sortReference;
          }
          traitOrderRadio.addEventListener('change', function () {
            sortLineSelect.disabled = true;
            sortTraitSelect.disabled = false;
            var traitName = sortTraitSelect.options[sortTraitSelect.selectedIndex].value;
            _this.setLineSort(new TraitLineSort(traitName));
            _this.saveSetting("sort", "trait");
            _this.saveSetting("sortReference", traitName);
          });
          sortTraitSelect.addEventListener('change', function (event) {
            if (!sortTraitSelect.disabled) {
              var _traitName = sortTraitSelect.options[sortTraitSelect.selectedIndex].value;
              _this.setLineSort(new TraitLineSort(_traitName));
              _this.saveSetting("sortReference", _traitName);
            }
          });
          var displayTraitSelect = document.getElementById('displayTraitSelect');
          displayTraitSelect.addEventListener('change', function (event) {
            var displayTraits = [];
            var _iterator = _createForOfIteratorHelper(displayTraitSelect),
              _step;
            try {
              for (_iterator.s(); !(_step = _iterator.n()).done;) {
                var option = _step.value;
                if (option.selected) displayTraits.push(option.value);
              }
            } catch (err) {
              _iterator.e(err);
            } finally {
              _iterator.f();
            }
            _this.genotypeCanvas.setDisplayTraits(displayTraits);
            _this.saveSetting("displayTraits", displayTraits.join(";"));
          });

          // Trait palettes
          var paletteTraitSelect = document.getElementById('paletteTrait');
          var paletteValueSelect = document.getElementById('paletteValue');
          var paletteValueColor = document.getElementById('paletteColor');
          var paletteResetButton = document.getElementById('paletteReset');
          this.dataSet.traitNames.forEach(function (traitName) {
            var opt = document.createElement('option');
            opt.value = traitName;
            opt.text = traitName;
            paletteTraitSelect.add(opt);
          });
          paletteTraitSelect.addEventListener('change', function (event) {
            var traitName = paletteTraitSelect.options[paletteTraitSelect.selectedIndex].value;
            var trait = _this.dataSet.getTrait(traitName);
            var traitOptions = null;
            if (trait.type == TraitType.Numerical) {
              traitOptions = ['min : ' + trait.minValue, 'max : ' + trait.maxValue];
            } else {
              traitOptions = trait.getValues();
            }

            // Clear the select list
            for (var i = paletteValueSelect.options.length - 1; i >= 0; i--) {
              paletteValueSelect.remove(i);
            }
            var _iterator2 = _createForOfIteratorHelper(traitOptions),
              _step2;
            try {
              for (_iterator2.s(); !(_step2 = _iterator2.n()).done;) {
                var _value = _step2.value;
                var opt = document.createElement('option');
                opt.value = _value;
                opt.text = _value;
                paletteValueSelect.add(opt);
              }
            } catch (err) {
              _iterator2.e(err);
            } finally {
              _iterator2.f();
            }
            paletteValueSelect.selectedIndex = 0;
            paletteValueSelect.dispatchEvent(new Event('change'));
          });
          paletteTraitSelect.value = this.dataSet.traitNames[0];
          paletteTraitSelect.dispatchEvent(new Event('change'));
          paletteValueSelect.addEventListener('change', function (event) {
            var traitName = paletteTraitSelect.options[paletteTraitSelect.selectedIndex].value;
            var trait = _this.dataSet.getTrait(traitName);
            var color = null;
            if (trait.type == TraitType.Numerical) {
              var index = paletteValueSelect.selectedIndex;
              color = index == 0 ? trait.getMinColor() : trait.getMaxColor();
            } else {
              color = trait.getColor(paletteValueSelect.selectedIndex);
            }
            paletteValueColor.value = color;
          });
          paletteValueSelect.dispatchEvent(new Event('change'));
          paletteValueColor.addEventListener('change', function (event) {
            var traitName = paletteTraitSelect.options[paletteTraitSelect.selectedIndex].value;
            var trait = _this.dataSet.getTrait(traitName);
            var color = paletteValueColor.value;
            if (trait.type == TraitType.Numerical) {
              var index = paletteValueSelect.selectedIndex;
              if (index == 0) trait.setMinColor(color);else trait.setMaxColor(color);
            } else {
              trait.setColor(paletteValueSelect.selectedIndex, color);
            }
            _this.genotypeCanvas.prerender(true);
            _this.saveColors();
          });
          paletteResetButton.addEventListener('click', function (event) {
            var traitName = paletteTraitSelect.options[paletteTraitSelect.selectedIndex].value;
            var trait = _this.dataSet.getTrait(traitName);
            trait.resetColors();
            _this.genotypeCanvas.prerender(true);
            paletteValueSelect.dispatchEvent(new Event('change'));
            _this.saveColors();
          });
        }

        // Set the canvas controls only once we have a valid data set and color scheme
        // If they are set in the constructor, moving the mouse above the canvas before
        // the loading is complete throws errors

        // Genotype canvas control
        this.genotypeCanvas.canvas.addEventListener('mousedown', function (e) {
          // The following block of code is used to determine if we are scrolling
          // using the scrollbar widget, rather than grabbing the canvas
          var _this$getGenotypeMous = _this.getGenotypeMouseLocation(e.clientX, e.clientY),
            x = _this$getGenotypeMous.x,
            y = _this$getGenotypeMous.y;
          var _this$genotypeCanvas = _this.genotypeCanvas,
            verticalScrollbar = _this$genotypeCanvas.verticalScrollbar,
            horizontalScrollbar = _this$genotypeCanvas.horizontalScrollbar;
          if (_this.isOverVerticalScrollbar(x, verticalScrollbar)) {
            // Flag to remember that the scrollbar widget was initially clicked on
            // which prevents mouse drift prematurely stopping scrolling from happening
            _this.draggingVerticalScrollbar = true;
            _this.dragVerticalScrollbar(e.clientY);
          } else if (_this.isOverHorizontalScrollbar(y, horizontalScrollbar)) {
            // Flag to remember that the scrollbar widget was initially clicked on
            // which prevents mouse drift prematurely stopping scrolling from happening
            _this.draggingHorizontalScrollbar = true;
            _this.dragHorizontalScrollbar(e.clientX);
          } else {
            // We are scrolling by grabbing the canvas directly
            _this.dragStartX = e.pageX;
            _this.dragStartY = e.pageY;
            _this.draggingGenotypeCanvas = true;
          }
        });
        this.genotypeCanvas.canvas.addEventListener('mousemove', function (e) {
          var mousePos = _this.getGenotypeMouseLocation(e.clientX, e.clientY);
          _this.genotypeCanvas.mouseOver(mousePos.x, mousePos.y);
        });
        this.genotypeCanvas.canvas.addEventListener('mouseleave', function () {
          _this.genotypeCanvas.mouseOver(undefined, undefined);
        });

        // Overview canvas control
        this.overviewCanvas.canvas.addEventListener('mousedown', function (event) {
          _this.setOverviewPosition(event.clientX, event.clientY);
        });

        // Other events
        window.addEventListener('mouseup', function () {
          _this.draggingGenotypeCanvas = false;
          _this.draggingVerticalScrollbar = false;
          _this.draggingHorizontalScrollbar = false;
          _this.draggingOverviewCanvas = false;
        });
        window.addEventListener('mousemove', function (e) {
          if (_this.draggingVerticalScrollbar) {
            _this.dragVerticalScrollbar(e.clientY);
          } else if (_this.draggingHorizontalScrollbar) {
            _this.dragHorizontalScrollbar(e.clientX);
          } else if (_this.draggingGenotypeCanvas) {
            _this.dragCanvas(e.pageX, e.pageY);
          } else if (_this.draggingOverviewCanvas) {
            _this.setOverviewPosition(e.clientX, e.clientY);
          }
        });
      }
    }, {
      key: "setLineSort",
      value: function setLineSort(lineSort) {
        var _this2 = this;
        this.disableCanvas();

        // Yield control to the browser to make a render (to show the grey overlay)
        setTimeout(function () {
          _this2.genotypeCanvas.setLineSort(lineSort);
          _this2.overviewCanvas.prerender(true);
          _this2.enableCanvas();
        }, 4);
      }
    }, {
      key: "updateAutoWidth",
      value: function updateAutoWidth() {
        var computedStyles = window.getComputedStyle(this.canvasContainer);
        var autoWidth = this.canvasContainer.clientWidth - parseInt(computedStyles.paddingLeft) - parseInt(computedStyles.paddingRight);
        if (this.genotypeAutoWidth) {
          var genotypeWidth = Math.max(autoWidth, this.minGenotypeAutoWidth);
          this.genotypeCanvas.setAutoWidth(genotypeWidth);
        }
        if (this.overviewAutoWidth) {
          var overviewWidth = Math.max(autoWidth, this.minOverviewAutoWidth);
          this.overviewCanvas.setAutoWidth(overviewWidth);
        }

        // Update the visibilityWindow
        var position = this.genotypeCanvas.currentPosition();
        this.overviewCanvas.moveToPosition(position.marker, position.germplasm, this.genotypeCanvas.visibilityWindow());
      }
    }, {
      key: "setChromosome",
      value: function setChromosome(chromosomeIndex) {
        this.chromosomeIndex = chromosomeIndex;
        this.genotypeCanvas.setChromosome(chromosomeIndex);
        this.overviewCanvas.setChromosome(chromosomeIndex);
        this.overviewCanvas.moveToPosition(0, 0, this.genotypeCanvas.visibilityWindow());
      }
    }, {
      key: "disableCanvas",
      value: function disableCanvas() {
        this.genotypeCanvas.disable();
        this.overviewCanvas.disable();
      }
    }, {
      key: "enableCanvas",
      value: function enableCanvas(self) {
        this.genotypeCanvas.enable();
        this.overviewCanvas.enable();
      }
    }, {
      key: "getGenotypeMouseLocation",
      value: function getGenotypeMouseLocation(clientX, clientY) {
        var rect = this.genotypeCanvas.canvas.getBoundingClientRect();
        var x = (clientX - rect.left) / (rect.right - rect.left) * this.genotypeCanvas.canvas.width;
        var y = (clientY - rect.top) / (rect.bottom - rect.top) * this.genotypeCanvas.canvas.height;
        return {
          x: x,
          y: y
        };
      }
    }, {
      key: "getOverviewMouseLocation",
      value: function getOverviewMouseLocation(clientX, clientY) {
        var rect = this.overviewCanvas.canvas.getBoundingClientRect();
        var x = (clientX - rect.left) / (rect.right - rect.left) * this.overviewCanvas.canvas.width;
        var y = (clientY - rect.top) / (rect.bottom - rect.top) * this.overviewCanvas.canvas.height;
        return {
          x: x,
          y: y
        };
      }
    }, {
      key: "isOverVerticalScrollbar",
      value: function isOverVerticalScrollbar(x, verticalScrollbar) {
        return x >= verticalScrollbar.x && x <= verticalScrollbar.x + verticalScrollbar.widget.width;
      }
    }, {
      key: "isOverHorizontalScrollbar",
      value: function isOverHorizontalScrollbar(y, horizontalScrollbar) {
        return y >= horizontalScrollbar.y && y <= horizontalScrollbar.y + horizontalScrollbar.widget.height;
      }
    }, {
      key: "dragVerticalScrollbar",
      value: function dragVerticalScrollbar(clientY) {
        // Grab various variables which allow us to calculate the y coordinate
        // relative to the allele canvas
        var rect = this.genotypeCanvas.canvas.getBoundingClientRect();
        var alleleCanvasHeight = this.genotypeCanvas.alleleCanvasHeight();
        var mapCanvasHeight = this.genotypeCanvas.mapCanvasHeight;
        var rectTop = rect.top + mapCanvasHeight;
        // Calculate the y coordinate of the mouse on the allele canvas
        var y = (clientY - rectTop) / (rect.bottom - rectTop) * alleleCanvasHeight;
        // Move the vertical scrollbar to coordinate y
        var newPosition = this.genotypeCanvas.dragVerticalScrollbar(y);
        this.overviewCanvas.moveToPosition(newPosition.marker, newPosition.germplasm, this.genotypeCanvas.visibilityWindow());
      }
    }, {
      key: "dragHorizontalScrollbar",
      value: function dragHorizontalScrollbar(clientX) {
        // Grab various variables which allow us to calculate the x coordinate
        // relative to the allele canvas
        var rect = this.genotypeCanvas.canvas.getBoundingClientRect();
        var alleleCanvasWidth = this.genotypeCanvas.alleleCanvasWidth();
        var nameCanvasWidth = this.genotypeCanvas.nameCanvasWidth;
        var rectLeft = rect.left + nameCanvasWidth;
        // Calculate the x coordinate of the mouse on the allele canvas
        var x = (clientX - rectLeft) / (rect.right - rectLeft) * alleleCanvasWidth;
        // Move the vertical scrollbar to coorodinate x
        var newPosition = this.genotypeCanvas.dragHorizontalScrollbar(x);
        this.overviewCanvas.moveToPosition(newPosition.marker, newPosition.germplasm, this.genotypeCanvas.visibilityWindow());
      }
    }, {
      key: "dragCanvas",
      value: function dragCanvas(x, y) {
        var diffX = x - this.dragStartX;
        var diffY = y - this.dragStartY;
        this.dragStartX = x;
        this.dragStartY = y;
        var newPosition = this.genotypeCanvas.move(diffX, diffY);
        this.overviewCanvas.moveToPosition(newPosition.marker, newPosition.germplasm, this.genotypeCanvas.visibilityWindow());
      }

      // Set the position of the visibility window on the overview canvas
      // The coordinates of the mouse are the center of the window
    }, {
      key: "setOverviewPosition",
      value: function setOverviewPosition(clientX, clientY) {
        var mousePos = this.getOverviewMouseLocation(clientX, clientY);
        var genotypePosition = this.overviewCanvas.mouseDrag(mousePos.x, mousePos.y, this.genotypeCanvas.visibilityWindow());
        this.genotypeCanvas.moveToPosition(genotypePosition.marker, genotypePosition.germplasm);
        this.draggingOverviewCanvas = true;
      }
    }, {
      key: "saveSetting",
      value: function saveSetting(key, value) {
        if (this.saveSettings) {
          var mangledKey = "_fj-bytes::" + this.dataSet.id + "::" + key;
          localStorage.setItem(mangledKey, value);
        }
      }
    }, {
      key: "loadSetting",
      value: function loadSetting(key) {
        var mangledKey = "_fj-bytes::" + this.dataSet.id + "::" + key;
        return localStorage.getItem(mangledKey);
      }
    }, {
      key: "saveColors",
      value: function saveColors() {
        if (this.saveSettings) {
          var jsonColors = {};
          var _iterator3 = _createForOfIteratorHelper(this.dataSet.traitNames),
            _step3;
          try {
            for (_iterator3.s(); !(_step3 = _iterator3.n()).done;) {
              var traitName = _step3.value;
              var customColors = this.dataSet.getTrait(traitName).getCustomColors();
              if (customColors.size > 0) jsonColors[traitName] = Object.fromEntries(customColors);
            }
          } catch (err) {
            _iterator3.e(err);
          } finally {
            _iterator3.f();
          }
          this.saveSetting('traitColors', JSON.stringify(jsonColors));
        }
      }
    }, {
      key: "loadDefaultSettings",
      value: function loadDefaultSettings() {
        var _this3 = this;
        var sortId = this.loadSetting("sort");
        var sortReference = this.loadSetting("sortReference");
        var colorSchemeId = this.loadSetting("colorScheme");
        var colorReference = this.loadSetting("colorReference");
        var displayTraits = this.loadSetting("displayTraits");
        var customColors = this.loadSetting("traitColors");
        var settings = {
          colorReference: colorReference,
          sortReference: sortReference,
          displayTraits: displayTraits == null ? this.dataSet.traitNames : displayTraits.split(";"),
          lineSort: new ImportingOrderLineSort(),
          lineSortId: "importing",
          colorScheme: new NucleotideColorScheme(this.dataSet),
          colorSchemeId: "nucleotide",
          traitColors: customColors == null ? {} : JSON.parse(customColors)
        };

        // We use trait values as keys in inner arrays for persisting to Local-storage, so we need to convert those back to list indexes on reload
        Object.entries(settings.traitColors).forEach(function (_ref) {
          var _ref2 = _slicedToArray(_ref, 2),
            traitName = _ref2[0],
            colorByValue = _ref2[1];
          return Object.entries(colorByValue).forEach(function (_ref3) {
            var _ref4 = _slicedToArray(_ref3, 2),
              traitValue = _ref4[0],
              traitValueColor = _ref4[1];
            var traitValueIndex = _this3.dataSet.traits.get(traitName).values.indexOf(traitValue),
              traitColorMap = settings.traitColors[traitName];
            if (traitValueIndex != -1) traitColorMap[traitValueIndex] = traitValueColor;
            delete traitColorMap[traitValue];
          });
        });
        switch (sortId) {
          case "importing":
            settings.lineSort = new ImportingOrderLineSort();
            settings.lineSortId = "importing";
            break;
          case "alphabetic":
            settings.lineSort = new AlphabeticLineSort();
            settings.lineSortId = "alphabetic";
            break;
          case "trait":
            if (this.dataSet.hasTraits() && this.dataSet.getTrait(sortReference) !== undefined) {
              settings.lineSort = new TraitLineSort(sortReference);
              settings.lineSortId = "trait";
            }
            break;
          case "similarity":
            if (this.dataSet.germplasmList.find(function (germplasm) {
              return germplasm.name == sortReference;
            }) !== undefined) {
              settings.lineSort = new SimilarityLineSort(sortReference, [this.chromosomeIndex]);
              settings.lineSortId = "similarity";
            }
            break;
        }
        switch (colorSchemeId) {
          case "nucleotide":
            settings.colorScheme = new NucleotideColorScheme(this.dataSet);
            settings.colorSchemeId = "nucleotide";
            break;
          case "similarity":
            var referenceIndex = this.dataSet.germplasmList.findIndex(function (germplasm) {
              return germplasm.name == colorReference;
            });
            if (referenceIndex !== undefined && referenceIndex != -1) {
              settings.colorScheme = new SimilarityColorScheme(this.dataSet, referenceIndex);
              settings.colorSchemeId = "similarity";
            }
            break;
        }
        return settings;
      }
    }]);
    return CanvasController;
  }();

  var Marker = /*#__PURE__*/_createClass(function Marker(name, chromosome, position) {
    _classCallCheck(this, Marker);
    this.name = name;
    this.chromosome = chromosome;
    this.position = position;
  });

  var Chromosome = /*#__PURE__*/function () {
    function Chromosome(name, end, markers) {
      _classCallCheck(this, Chromosome);
      this.start = 0;
      this.name = name;
      this.end = end;
      this.markers = markers;
      this.markers.sort(function (a, b) {
        return a.position > b.position ? 1 : -1;
      });
    }
    _createClass(Chromosome, [{
      key: "markerCount",
      value: function markerCount() {
        return this.markers.length;
      }
    }]);
    return Chromosome;
  }();

  function unwrapExports (x) {
  	return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, 'default') ? x['default'] : x;
  }

  function createCommonjsModule(fn, module) {
  	return module = { exports: {} }, fn(module, module.exports), module.exports;
  }

  //

  var shallowequal = function shallowEqual(objA, objB, compare, compareContext) {
    var ret = compare ? compare.call(compareContext, objA, objB) : void 0;

    if (ret !== void 0) {
      return !!ret;
    }

    if (objA === objB) {
      return true;
    }

    if (typeof objA !== "object" || !objA || typeof objB !== "object" || !objB) {
      return false;
    }

    var keysA = Object.keys(objA);
    var keysB = Object.keys(objB);

    if (keysA.length !== keysB.length) {
      return false;
    }

    var bHasOwnProperty = Object.prototype.hasOwnProperty.bind(objB);

    // Test for A's keys different from B.
    for (var idx = 0; idx < keysA.length; idx++) {
      var key = keysA[idx];

      if (!bHasOwnProperty(key)) {
        return false;
      }

      var valueA = objA[key];
      var valueB = objB[key];

      ret = compare ? compare.call(compareContext, valueA, valueB, key) : void 0;

      if (ret === false || (ret === void 0 && valueA !== valueB)) {
        return false;
      }
    }

    return true;
  };

  var lib = createCommonjsModule(function (module, exports) {
  // An augmented AVL Tree where each node maintains a list of records and their search intervals.
  // Record is composed of an interval and its underlying data, sent by a client. This allows the
  // interval tree to have the same interval inserted multiple times, as long its data is different.
  // Both insertion and deletion require O(log n) time. Searching requires O(k*logn) time, where `k`
  // is the number of intervals in the output list.
  Object.defineProperty(exports, "__esModule", { value: true });

  function height(node) {
      if (node === undefined) {
          return -1;
      }
      else {
          return node.height;
      }
  }
  var Node = /** @class */ (function () {
      function Node(intervalTree, record) {
          this.intervalTree = intervalTree;
          this.records = [];
          this.height = 0;
          this.key = record.low;
          this.max = record.high;
          // Save the array of all records with the same key for this node
          this.records.push(record);
      }
      // Gets the highest record.high value for this node
      Node.prototype.getNodeHigh = function () {
          var high = this.records[0].high;
          for (var i = 1; i < this.records.length; i++) {
              if (this.records[i].high > high) {
                  high = this.records[i].high;
              }
          }
          return high;
      };
      // Updates height value of the node. Called during insertion, rebalance, removal
      Node.prototype.updateHeight = function () {
          this.height = Math.max(height(this.left), height(this.right)) + 1;
      };
      // Updates the max value of all the parents after inserting into already existing node, as well as
      // removing the node completely or removing the record of an already existing node. Starts with
      // the parent of an affected node and bubbles up to root
      Node.prototype.updateMaxOfParents = function () {
          if (this === undefined) {
              return;
          }
          var thisHigh = this.getNodeHigh();
          if (this.left !== undefined && this.right !== undefined) {
              this.max = Math.max(Math.max(this.left.max, this.right.max), thisHigh);
          }
          else if (this.left !== undefined && this.right === undefined) {
              this.max = Math.max(this.left.max, thisHigh);
          }
          else if (this.left === undefined && this.right !== undefined) {
              this.max = Math.max(this.right.max, thisHigh);
          }
          else {
              this.max = thisHigh;
          }
          if (this.parent) {
              this.parent.updateMaxOfParents();
          }
      };
      /*
      Left-Left case:
    
             z                                      y
            / \                                   /   \
           y   T4      Right Rotate (z)          x     z
          / \          - - - - - - - - ->       / \   / \
         x   T3                                T1 T2 T3 T4
        / \
      T1   T2
    
      Left-Right case:
    
           z                               z                           x
          / \                             / \                        /   \
         y   T4  Left Rotate (y)         x  T4  Right Rotate(z)     y     z
        / \      - - - - - - - - ->     / \      - - - - - - - ->  / \   / \
      T1   x                           y  T3                      T1 T2 T3 T4
          / \                         / \
        T2   T3                      T1 T2
      */
      // Handles Left-Left case and Left-Right case after rebalancing AVL tree
      Node.prototype._updateMaxAfterRightRotate = function () {
          var parent = this.parent;
          var left = parent.left;
          // Update max of left sibling (x in first case, y in second)
          var thisParentLeftHigh = left.getNodeHigh();
          if (left.left === undefined && left.right !== undefined) {
              left.max = Math.max(thisParentLeftHigh, left.right.max);
          }
          else if (left.left !== undefined && left.right === undefined) {
              left.max = Math.max(thisParentLeftHigh, left.left.max);
          }
          else if (left.left === undefined && left.right === undefined) {
              left.max = thisParentLeftHigh;
          }
          else {
              left.max = Math.max(Math.max(left.left.max, left.right.max), thisParentLeftHigh);
          }
          // Update max of itself (z)
          var thisHigh = this.getNodeHigh();
          if (this.left === undefined && this.right !== undefined) {
              this.max = Math.max(thisHigh, this.right.max);
          }
          else if (this.left !== undefined && this.right === undefined) {
              this.max = Math.max(thisHigh, this.left.max);
          }
          else if (this.left === undefined && this.right === undefined) {
              this.max = thisHigh;
          }
          else {
              this.max = Math.max(Math.max(this.left.max, this.right.max), thisHigh);
          }
          // Update max of parent (y in first case, x in second)
          parent.max = Math.max(Math.max(parent.left.max, parent.right.max), parent.getNodeHigh());
      };
      /*
      Right-Right case:
    
        z                               y
       / \                            /   \
      T1  y     Left Rotate(z)       z     x
         / \   - - - - - - - ->     / \   / \
        T2  x                      T1 T2 T3 T4
           / \
          T3 T4
    
      Right-Left case:
    
         z                            z                            x
        / \                          / \                         /   \
       T1  y   Right Rotate (y)     T1  x      Left Rotate(z)   z     y
          / \  - - - - - - - - ->      / \   - - - - - - - ->  / \   / \
         x  T4                        T2  y                   T1 T2 T3 T4
        / \                              / \
      T2   T3                           T3 T4
      */
      // Handles Right-Right case and Right-Left case in rebalancing AVL tree
      Node.prototype._updateMaxAfterLeftRotate = function () {
          var parent = this.parent;
          var right = parent.right;
          // Update max of right sibling (x in first case, y in second)
          var thisParentRightHigh = right.getNodeHigh();
          if (right.left === undefined && right.right !== undefined) {
              right.max = Math.max(thisParentRightHigh, right.right.max);
          }
          else if (right.left !== undefined && right.right === undefined) {
              right.max = Math.max(thisParentRightHigh, right.left.max);
          }
          else if (right.left === undefined && right.right === undefined) {
              right.max = thisParentRightHigh;
          }
          else {
              right.max = Math.max(Math.max(right.left.max, right.right.max), thisParentRightHigh);
          }
          // Update max of itself (z)
          var thisHigh = this.getNodeHigh();
          if (this.left === undefined && this.right !== undefined) {
              this.max = Math.max(thisHigh, this.right.max);
          }
          else if (this.left !== undefined && this.right === undefined) {
              this.max = Math.max(thisHigh, this.left.max);
          }
          else if (this.left === undefined && this.right === undefined) {
              this.max = thisHigh;
          }
          else {
              this.max = Math.max(Math.max(this.left.max, this.right.max), thisHigh);
          }
          // Update max of parent (y in first case, x in second)
          parent.max = Math.max(Math.max(parent.left.max, right.max), parent.getNodeHigh());
      };
      Node.prototype._leftRotate = function () {
          var rightChild = this.right;
          rightChild.parent = this.parent;
          if (rightChild.parent === undefined) {
              this.intervalTree.root = rightChild;
          }
          else {
              if (rightChild.parent.left === this) {
                  rightChild.parent.left = rightChild;
              }
              else if (rightChild.parent.right === this) {
                  rightChild.parent.right = rightChild;
              }
          }
          this.right = rightChild.left;
          if (this.right !== undefined) {
              this.right.parent = this;
          }
          rightChild.left = this;
          this.parent = rightChild;
          this.updateHeight();
          rightChild.updateHeight();
      };
      Node.prototype._rightRotate = function () {
          var leftChild = this.left;
          leftChild.parent = this.parent;
          if (leftChild.parent === undefined) {
              this.intervalTree.root = leftChild;
          }
          else {
              if (leftChild.parent.left === this) {
                  leftChild.parent.left = leftChild;
              }
              else if (leftChild.parent.right === this) {
                  leftChild.parent.right = leftChild;
              }
          }
          this.left = leftChild.right;
          if (this.left !== undefined) {
              this.left.parent = this;
          }
          leftChild.right = this;
          this.parent = leftChild;
          this.updateHeight();
          leftChild.updateHeight();
      };
      // Rebalances the tree if the height value between two nodes of the same parent is greater than
      // two. There are 4 cases that can happen which are outlined in the graphics above
      Node.prototype._rebalance = function () {
          if (height(this.left) >= 2 + height(this.right)) {
              var left = this.left;
              if (height(left.left) >= height(left.right)) {
                  // Left-Left case
                  this._rightRotate();
                  this._updateMaxAfterRightRotate();
              }
              else {
                  // Left-Right case
                  left._leftRotate();
                  this._rightRotate();
                  this._updateMaxAfterRightRotate();
              }
          }
          else if (height(this.right) >= 2 + height(this.left)) {
              var right = this.right;
              if (height(right.right) >= height(right.left)) {
                  // Right-Right case
                  this._leftRotate();
                  this._updateMaxAfterLeftRotate();
              }
              else {
                  // Right-Left case
                  right._rightRotate();
                  this._leftRotate();
                  this._updateMaxAfterLeftRotate();
              }
          }
      };
      Node.prototype.insert = function (record) {
          if (record.low < this.key) {
              // Insert into left subtree
              if (this.left === undefined) {
                  this.left = new Node(this.intervalTree, record);
                  this.left.parent = this;
              }
              else {
                  this.left.insert(record);
              }
          }
          else {
              // Insert into right subtree
              if (this.right === undefined) {
                  this.right = new Node(this.intervalTree, record);
                  this.right.parent = this;
              }
              else {
                  this.right.insert(record);
              }
          }
          // Update the max value of this ancestor if needed
          if (this.max < record.high) {
              this.max = record.high;
          }
          // Update height of each node
          this.updateHeight();
          // Rebalance the tree to ensure all operations are executed in O(logn) time. This is especially
          // important in searching, as the tree has a high chance of degenerating without the rebalancing
          this._rebalance();
      };
      Node.prototype._getOverlappingRecords = function (currentNode, low, high) {
          if (currentNode.key <= high && low <= currentNode.getNodeHigh()) {
              // Nodes are overlapping, check if individual records in the node are overlapping
              var tempResults = [];
              for (var i = 0; i < currentNode.records.length; i++) {
                  if (currentNode.records[i].high >= low) {
                      tempResults.push(currentNode.records[i]);
                  }
              }
              return tempResults;
          }
          return [];
      };
      Node.prototype.search = function (low, high) {
          // Don't search nodes that don't exist
          if (this === undefined) {
              return [];
          }
          var leftSearch = [];
          var ownSearch = [];
          var rightSearch = [];
          // If interval is to the right of the rightmost point of any interval in this node and all its
          // children, there won't be any matches
          if (low > this.max) {
              return [];
          }
          // Search left children
          if (this.left !== undefined && this.left.max >= low) {
              leftSearch = this.left.search(low, high);
          }
          // Check this node
          ownSearch = this._getOverlappingRecords(this, low, high);
          // If interval is to the left of the start of this interval, then it can't be in any child to
          // the right
          if (high < this.key) {
              return leftSearch.concat(ownSearch);
          }
          // Otherwise, search right children
          if (this.right !== undefined) {
              rightSearch = this.right.search(low, high);
          }
          // Return accumulated results, if any
          return leftSearch.concat(ownSearch, rightSearch);
      };
      // Searches for a node by a `key` value
      Node.prototype.searchExisting = function (low) {
          if (this === undefined) {
              return undefined;
          }
          if (this.key === low) {
              return this;
          }
          else if (low < this.key) {
              if (this.left !== undefined) {
                  return this.left.searchExisting(low);
              }
          }
          else {
              if (this.right !== undefined) {
                  return this.right.searchExisting(low);
              }
          }
          return undefined;
      };
      // Returns the smallest node of the subtree
      Node.prototype._minValue = function () {
          if (this.left === undefined) {
              return this;
          }
          else {
              return this.left._minValue();
          }
      };
      Node.prototype.remove = function (node) {
          var parent = this.parent;
          if (node.key < this.key) {
              // Node to be removed is on the left side
              if (this.left !== undefined) {
                  return this.left.remove(node);
              }
              else {
                  return undefined;
              }
          }
          else if (node.key > this.key) {
              // Node to be removed is on the right side
              if (this.right !== undefined) {
                  return this.right.remove(node);
              }
              else {
                  return undefined;
              }
          }
          else {
              if (this.left !== undefined && this.right !== undefined) {
                  // Node has two children
                  var minValue = this.right._minValue();
                  this.key = minValue.key;
                  this.records = minValue.records;
                  return this.right.remove(this);
              }
              else if (parent.left === this) {
                  // One child or no child case on left side
                  if (this.right !== undefined) {
                      parent.left = this.right;
                      this.right.parent = parent;
                  }
                  else {
                      parent.left = this.left;
                      if (this.left !== undefined) {
                          this.left.parent = parent;
                      }
                  }
                  parent.updateMaxOfParents();
                  parent.updateHeight();
                  parent._rebalance();
                  return this;
              }
              else if (parent.right === this) {
                  // One child or no child case on right side
                  if (this.right !== undefined) {
                      parent.right = this.right;
                      this.right.parent = parent;
                  }
                  else {
                      parent.right = this.left;
                      if (this.left !== undefined) {
                          this.left.parent = parent;
                      }
                  }
                  parent.updateMaxOfParents();
                  parent.updateHeight();
                  parent._rebalance();
                  return this;
              }
          }
      };
      return Node;
  }());
  exports.Node = Node;
  var IntervalTree = /** @class */ (function () {
      function IntervalTree() {
          this.count = 0;
      }
      IntervalTree.prototype.insert = function (record) {
          if (record.low > record.high) {
              throw new Error('`low` value must be lower or equal to `high` value');
          }
          if (this.root === undefined) {
              // Base case: Tree is empty, new node becomes root
              this.root = new Node(this, record);
              this.count++;
              return true;
          }
          else {
              // Otherwise, check if node already exists with the same key
              var node = this.root.searchExisting(record.low);
              if (node !== undefined) {
                  // Check the records in this node if there already is the one with same low, high, data
                  for (var i = 0; i < node.records.length; i++) {
                      if (shallowequal(node.records[i], record)) {
                          // This record is same as the one we're trying to insert; return false to indicate
                          // nothing has been inserted
                          return false;
                      }
                  }
                  // Add the record to the node
                  node.records.push(record);
                  // Update max of the node and its parents if necessary
                  if (record.high > node.max) {
                      node.max = record.high;
                      if (node.parent) {
                          node.parent.updateMaxOfParents();
                      }
                  }
                  this.count++;
                  return true;
              }
              else {
                  // Node with this key doesn't already exist. Call insert function on root's node
                  this.root.insert(record);
                  this.count++;
                  return true;
              }
          }
      };
      IntervalTree.prototype.search = function (low, high) {
          if (this.root === undefined) {
              // Tree is empty; return empty array
              return [];
          }
          else {
              return this.root.search(low, high);
          }
      };
      IntervalTree.prototype.remove = function (record) {
          if (this.root === undefined) {
              // Tree is empty; nothing to remove
              return false;
          }
          else {
              var node = this.root.searchExisting(record.low);
              if (node === undefined) {
                  return false;
              }
              else if (node.records.length > 1) {
                  var removedRecord = void 0;
                  // Node with this key has 2 or more records. Find the one we need and remove it
                  for (var i = 0; i < node.records.length; i++) {
                      if (shallowequal(node.records[i], record)) {
                          removedRecord = node.records[i];
                          node.records.splice(i, 1);
                          break;
                      }
                  }
                  if (removedRecord) {
                      removedRecord = undefined;
                      // Update max of that node and its parents if necessary
                      if (record.high === node.max) {
                          var nodeHigh = node.getNodeHigh();
                          if (node.left !== undefined && node.right !== undefined) {
                              node.max = Math.max(Math.max(node.left.max, node.right.max), nodeHigh);
                          }
                          else if (node.left !== undefined && node.right === undefined) {
                              node.max = Math.max(node.left.max, nodeHigh);
                          }
                          else if (node.left === undefined && node.right !== undefined) {
                              node.max = Math.max(node.right.max, nodeHigh);
                          }
                          else {
                              node.max = nodeHigh;
                          }
                          if (node.parent) {
                              node.parent.updateMaxOfParents();
                          }
                      }
                      this.count--;
                      return true;
                  }
                  else {
                      return false;
                  }
              }
              else if (node.records.length === 1) {
                  // Node with this key has only 1 record. Check if the remaining record in this node is
                  // actually the one we want to remove
                  if (shallowequal(node.records[0], record)) {
                      // The remaining record is the one we want to remove. Remove the whole node from the tree
                      if (this.root.key === node.key) {
                          // We're removing the root element. Create a dummy node that will temporarily take
                          // root's parent role
                          var rootParent = new Node(this, { low: record.low, high: record.low });
                          rootParent.left = this.root;
                          this.root.parent = rootParent;
                          var removedNode = this.root.remove(node);
                          this.root = rootParent.left;
                          if (this.root !== undefined) {
                              this.root.parent = undefined;
                          }
                          if (removedNode) {
                              removedNode = undefined;
                              this.count--;
                              return true;
                          }
                          else {
                              return false;
                          }
                      }
                      else {
                          var removedNode = this.root.remove(node);
                          if (removedNode) {
                              removedNode = undefined;
                              this.count--;
                              return true;
                          }
                          else {
                              return false;
                          }
                      }
                  }
                  else {
                      // The remaining record is not the one we want to remove
                      return false;
                  }
              }
              else {
                  // No records at all in this node?! Shouldn't happen
                  return false;
              }
          }
      };
      IntervalTree.prototype.inOrder = function () {
          return new InOrder(this.root);
      };
      IntervalTree.prototype.preOrder = function () {
          return new PreOrder(this.root);
      };
      return IntervalTree;
  }());
  exports.IntervalTree = IntervalTree;
  var DataIntervalTree = /** @class */ (function () {
      function DataIntervalTree() {
          this.tree = new IntervalTree();
      }
      DataIntervalTree.prototype.insert = function (low, high, data) {
          return this.tree.insert({ low: low, high: high, data: data });
      };
      DataIntervalTree.prototype.remove = function (low, high, data) {
          return this.tree.remove({ low: low, high: high, data: data });
      };
      DataIntervalTree.prototype.search = function (low, high) {
          return this.tree.search(low, high).map(function (v) { return v.data; });
      };
      DataIntervalTree.prototype.inOrder = function () {
          return this.tree.inOrder();
      };
      DataIntervalTree.prototype.preOrder = function () {
          return this.tree.preOrder();
      };
      Object.defineProperty(DataIntervalTree.prototype, "count", {
          get: function () {
              return this.tree.count;
          },
          enumerable: true,
          configurable: true
      });
      return DataIntervalTree;
  }());
  exports.default = DataIntervalTree;
  var InOrder = /** @class */ (function () {
      function InOrder(startNode) {
          this.stack = [];
          if (startNode !== undefined) {
              this.push(startNode);
          }
      }
      InOrder.prototype.next = function () {
          // Will only happen if stack is empty and pop is called
          if (this.currentNode === undefined) {
              return {
                  done: true,
                  value: undefined,
              };
          }
          // Process this node
          if (this.i < this.currentNode.records.length) {
              return {
                  done: false,
                  value: this.currentNode.records[this.i++],
              };
          }
          if (this.currentNode.right !== undefined) {
              this.push(this.currentNode.right);
          }
          else {
              // Might pop the last and set this.currentNode = undefined
              this.pop();
          }
          return this.next();
      };
      InOrder.prototype.push = function (node) {
          this.currentNode = node;
          this.i = 0;
          while (this.currentNode.left !== undefined) {
              this.stack.push(this.currentNode);
              this.currentNode = this.currentNode.left;
          }
      };
      InOrder.prototype.pop = function () {
          this.currentNode = this.stack.pop();
          this.i = 0;
      };
      return InOrder;
  }());
  exports.InOrder = InOrder;
  if (typeof Symbol === 'function') {
      InOrder.prototype[Symbol.iterator] = function () { return this; };
  }
  var PreOrder = /** @class */ (function () {
      function PreOrder(startNode) {
          this.stack = [];
          this.i = 0;
          this.currentNode = startNode;
      }
      PreOrder.prototype.next = function () {
          // Will only happen if stack is empty and pop is called,
          // which only happens if there is no right node (i.e we are done)
          if (this.currentNode === undefined) {
              return {
                  done: true,
                  value: undefined,
              };
          }
          // Process this node
          if (this.i < this.currentNode.records.length) {
              return {
                  done: false,
                  value: this.currentNode.records[this.i++],
              };
          }
          if (this.currentNode.right !== undefined) {
              this.push(this.currentNode.right);
          }
          if (this.currentNode.left !== undefined) {
              this.push(this.currentNode.left);
          }
          this.pop();
          return this.next();
      };
      PreOrder.prototype.push = function (node) {
          this.stack.push(node);
      };
      PreOrder.prototype.pop = function () {
          this.currentNode = this.stack.pop();
          this.i = 0;
      };
      return PreOrder;
  }());
  exports.PreOrder = PreOrder;
  if (typeof Symbol === 'function') {
      PreOrder.prototype[Symbol.iterator] = function () { return this; };
  }

  });

  var IntervalTree = unwrapExports(lib);
  var lib_1 = lib.Node;
  var lib_2 = lib.IntervalTree;
  var lib_3 = lib.InOrder;
  var lib_4 = lib.PreOrder;

  var GenomeMap = /*#__PURE__*/function () {
    function GenomeMap(chromosomes) {
      _classCallCheck(this, GenomeMap);
      this.chromosomes = chromosomes;
      // TODO: initialise this value
      this.intervalTree = this.createIntervalTree();
      this.chromosomeStarts = this.calculateChromosomeStarts();
      this.markerIndices = this.calculateMarkerIndices();
    }

    // Creates an interval tree where the key is the range of the start and end of
    // a chromosome in the total marker data set and the value is that chromosome
    _createClass(GenomeMap, [{
      key: "createIntervalTree",
      value: function createIntervalTree() {
        var tree = new IntervalTree();
        var sum = 0;
        this.chromosomes.forEach(function (c) {
          var markerCount = c.markerCount();
          tree.insert(sum, sum + markerCount - 1, c);
          sum += markerCount;
        });
        return tree;
      }
    }, {
      key: "calculateChromosomeStarts",
      value: function calculateChromosomeStarts() {
        var starts = new Map();
        var sum = 0;
        this.chromosomes.forEach(function (c) {
          starts.set(c, sum);
          sum += c.markerCount();
        });
        return starts;
      }
    }, {
      key: "calculateMarkerIndices",
      value: function calculateMarkerIndices() {
        var indices = [];
        this.chromosomes.forEach(function (chr) {
          chr.markers.forEach(function (m, idx) {
            indices.push(idx);
          });
        });
        return indices;
      }
    }, {
      key: "chromosomePositionsFor",
      value: function chromosomePositionsFor(dataStart, dataEnd) {
        var _this = this;
        var foundChromosomes = this.intervalTree.search(dataStart, dataEnd);
        var positions = [];
        foundChromosomes.forEach(function (chromosome) {
          var chromStart = _this.chromosomeStarts.get(chromosome);
          var firstMarker = Math.max(dataStart - chromStart, 0);
          var lastMarker = Math.min(chromosome.markerCount() - 1, dataEnd - chromStart);
          positions.push({
            chromosomeIndex: _this.chromosomes.indexOf(chromosome),
            firstMarker: firstMarker,
            lastMarker: lastMarker
          });
        });
        return positions;
      }
    }, {
      key: "markersToRenderOn",
      value: function markersToRenderOn(chromosomeIndex, dataStart, dataEnd) {
        return {
          chromosomeIndex: chromosomeIndex,
          firstMarker: Math.max(dataStart, 0),
          lastMarker: Math.min(this.chromosomes[chromosomeIndex].markerCount() - 1, dataEnd)
        };
      }
    }, {
      key: "markerAt",
      value: function markerAt(dataIndex) {
        var foundChromosomes = this.intervalTree.search(dataIndex, dataIndex);
        var chromosome = foundChromosomes[0];
        var chromStart = this.chromosomeStarts.get(chromosome);
        var markerIndex = Math.max(dataIndex - chromStart, 0);
        return {
          marker: chromosome.markers[markerIndex],
          markerIndex: markerIndex
        };
      }
    }, {
      key: "markerOn",
      value: function markerOn(chromosomeIndex, dataIndex) {
        return {
          marker: this.chromosomes[chromosomeIndex].markers[dataIndex],
          markerIndex: dataIndex
        };
      }
    }, {
      key: "markerByName",
      value: function markerByName(markerName, markerIndexesByNamesAndChromosomes) {
        var found = -1;
        if (markerIndexesByNamesAndChromosomes != null) for (var chrIdx in markerIndexesByNamesAndChromosomes) {
          var markerIndex = markerIndexesByNamesAndChromosomes[chrIdx].indexOf(markerName);
          if (markerIndex !== -1) {
            found = {
              chromosome: chrIdx,
              markerIndex: markerIndex
            };
            break;
          }
        } else this.chromosomes.forEach(function (chromosome, idx) {
          var markerIndex = chromosome.markers.map(function (m) {
            return m.name;
          }).indexOf(markerName);
          if (markerIndex !== -1) {
            found = {
              chromosome: idx,
              markerIndex: markerIndex
            };
          }
        });
        return found;
      }
    }, {
      key: "markerCountOn",
      value: function markerCountOn(chromosomeIndex) {
        return this.chromosomes[chromosomeIndex].markerCount();
      }
    }, {
      key: "markerCount",
      value: function markerCount() {
        return this.chromosomes.map(function (c) {
          return c.markerCount();
        }).reduce(function (a, b) {
          return a + b;
        }, 0);
      }
    }]);
    return GenomeMap;
  }();

  var MapImporter = /*#__PURE__*/function () {
    function MapImporter() {
      _classCallCheck(this, MapImporter);
      this.markerNames = [];
      this.markerData = [];
      this.chromosomeNames = new Set();
    }
    _createClass(MapImporter, [{
      key: "processMapFileLine",
      value: function processMapFileLine(line) {
        if (line.startsWith('#') || !line || line.length === 0 || line.startsWith('\t')) {
          return;
        }

        // Only parse our default map file lines (i.e. not the special fixes for
        // exactly specifying the chromosome length)
        // http://flapjack.hutton.ac.uk/en/latest/projects_&_data_formats.html#data-sets-maps-and-genotypes
        var tokens = line.split('\t');
        if (tokens.length === 3) {
          var markerName = tokens[0];
          var chromosome = tokens[1];
          var pos = tokens[2];

          // Keep track of the chromosomes that we've found
          this.chromosomeNames.add(chromosome);

          // Create a marker object and add it to our array of markers
          var marker = new Marker(markerName, chromosome, parseFloat(pos.replace(/,/g, ''), 10));
          this.markerData.push(marker);
        }
      }
    }, {
      key: "createMap",
      value: function createMap() {
        var _this = this;
        var chromosomes = [];
        this.chromosomeNames.forEach(function (name) {
          var chromosomeMarkers = _this.markerData.filter(function (m) {
            return m.chromosome === name;
          });
          var markerPositions = chromosomeMarkers.map(function (marker) {
            return marker.position;
          });
          //const chromosomeEnd = Math.max(...markerPositions);
          // Use reduce instead of apply to avoid exceeding call stack size by passing too many arguments
          var chromosomeEnd = markerPositions.reduce(function (a, b) {
            return Math.max(a, b);
          });
          var chromosome = new Chromosome(name, chromosomeEnd, chromosomeMarkers);
          chromosomes.push(chromosome);
        });
        return new GenomeMap(chromosomes);
      }
    }, {
      key: "parseFile",
      value: function parseFile(fileContents) {
        var markers = fileContents.split(/\r?\n/);
        for (var marker = 0; marker < markers.length; marker += 1) {
          this.processMapFileLine(markers[marker]);
        }
        var map = this.createMap();
        return map;
      }

      // A method which converts BrAPI markerpositions into Flapjack markers for
      // rendering
    }, {
      key: "parseMarkerpositions",
      value: function parseMarkerpositions(markerpositions) {
        var _this2 = this;
        markerpositions.forEach(function (marker) {
          _this2.processBrapiMarkerposition(marker);
        });
        var map = this.createMap();
        return map;
      }
    }, {
      key: "processBrapiMarkerposition",
      value: function processBrapiMarkerposition(markerposition) {
        var name = markerposition.name,
          chromosome = markerposition.chromosome,
          position = markerposition.position;

        // Keep track of the chromosomes that we've found
        this.chromosomeNames.add(chromosome);

        // Create a marker object and add it to our array of markers
        var marker = new Marker(name, chromosome, position);
        this.markerData.push(marker);
      }
    }]);
    return MapImporter;
  }();

  var Genotype = /*#__PURE__*/function () {
    function Genotype(allele1, allele2, isHomozygous) {
      _classCallCheck(this, Genotype);
      this.allele1 = allele1;
      this.allele2 = allele2;
      this.isHomozygous = isHomozygous;
    }
    _createClass(Genotype, [{
      key: "getText",
      value: function getText() {
        return this.isHomozygous ? this.allele1 : this.getHetText();
      }
    }, {
      key: "getHetText",
      value: function getHetText() {
        return "".concat(this.allele1, "/").concat(this.allele2);
      }

      // Factory method for creating Genotypes from string input, has a default
      // heterozygous genotype separator of /
    }], [{
      key: "fromString",
      value: function fromString(genotypeString) {
        var hetSeparator = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : '/';
        var upperCased = genotypeString.toUpperCase();
        var geno;

        //    if (upperCased.length === 3 && !upperCased.includes(hetSeparator)) {
        //      throw Error('Encountered a string which could not be converted into a Genotype');
        //    }

        if (upperCased === '-' || upperCased === 'NN' || upperCased === 'N/N' || !upperCased || upperCased.length === 0) {
          geno = new Genotype('', '', true);
        } else if (upperCased.length === 1) {
          geno = new Genotype(upperCased, upperCased, true);
        } else if (upperCased.length === 2 && (hetSeparator == null || hetSeparator == "")) {
          geno = new Genotype(upperCased[0], upperCased[1], upperCased[0] === upperCased[1]);
        } else if (upperCased.includes(hetSeparator)) {
          var alleles = upperCased.split(hetSeparator);
          geno = new Genotype(alleles[0], alleles[1], alleles[0] === alleles[1]);
        } else
          // homozygous with multi-nucleic allele (INDEL?) 
          geno = new Genotype(upperCased, upperCased, true);
        return geno;
      }
    }]);
    return Genotype;
  }();

  var Germplasm = /*#__PURE__*/function () {
    function Germplasm(name, genotypeData, phenotype) {
      _classCallCheck(this, Germplasm);
      this.name = name;
      this.genotypeData = genotypeData;
      this.phenotype = phenotype;
    }
    _createClass(Germplasm, [{
      key: "getPhenotype",
      value: function getPhenotype(traitName) {
        if (this.phenotype !== undefined) return this.phenotype.get(traitName);
      }
    }]);
    return Germplasm;
  }();

  var GenotypeImporter = /*#__PURE__*/function () {
    function GenotypeImporter(genomeMap) {
      _classCallCheck(this, GenotypeImporter);
      this.rawToIndexMap = new Map();
      this.rawToIndexMap.set('', 0);
      this.rawToIndexMap.set('-', 0);
      this.stateTable = new Map();
      this.stateTable.set(Genotype.fromString(''), 0);
      this.genomeMap = genomeMap;
      this.markerIndices = new Map();
      this.germplasmList = [];
    }
    _createClass(GenotypeImporter, [{
      key: "getState",
      value: function getState(genoString) {
        var index = 0;
        try {
          index = this.rawToIndexMap.get(genoString);

          // New genotype, so add it to the stateTable and set its index to the size of the map
          if (index === undefined) {
            var genotype = Genotype.fromString(genoString);
            index = this.stateTable.size;
            this.stateTable.set(genotype, index);
            this.rawToIndexMap.set(genoString, index);
          }
        } catch (error) {
          console.error(error);
        }
        return index;
      }
    }, {
      key: "initGenotypeData",
      value: function initGenotypeData() {
        var data = [];
        this.genomeMap.chromosomes.forEach(function (chromosome) {
          data.push(Array(chromosome.markerCount()).fill(0));
        });
        return data;
      }
    }, {
      key: "processFileLine",
      value: function processFileLine(line, markerNameMap) {
        var _this = this;
        if (line.startsWith('#') || !line || line.length === 0) {
          return;
        }
        if (line.startsWith('Accession') || line.startsWith('\t')) {
          var markerNames = line.split('\t');

          // Get the position from the precomputed name -> position map 
          markerNames.slice(1).forEach(function (name, idx) {
            var indices = markerNameMap.get(name);
            _this.markerIndices.set(idx, indices);
          });
          // TODO: write code to deal with cases where we don't have a map here...
          // console.log(this.genomeMap.totalMarkerCount());
        } else {
          var tokens = line.split('\t');
          var lineName = tokens[0];
          var genotypeData = this.initGenotypeData();
          tokens.slice(1).forEach(function (state, idx) {
            var indices = _this.markerIndices.get(idx);
            if (indices !== undefined && indices !== -1) {
              genotypeData[indices.chromosome][indices.markerIndex] = _this.getState(state);
            }
          });
          var germplasm = new Germplasm(lineName, genotypeData);
          this.germplasmList.push(germplasm);
        }
      }
    }, {
      key: "parseFile",
      value: function parseFile(fileContents, advancementCallback, completionCallback) {
        var b4 = Date.now();

        // Pre-mapping the marker names to their position for faster loading
        var markerNameMap = new Map();
        this.genomeMap.chromosomes.forEach(function (chromosome, chromosomeIndex) {
          chromosome.markers.forEach(function (marker, markerIndex) {
            markerNameMap.set(marker.name, {
              chromosome: chromosomeIndex,
              markerIndex: markerIndex
            });
          });
        });
        this.processedLines = 0;
        var lines = fileContents.split(/\r?\n/);
        this.totalLineCount = lines.length;
        var self = this;

        // Give the browser some time to keep the page alive between the parsing of each line
        // Avoid a complete freeze during a large file load
        // This yields control between the parsing of each line for the browser to refresh itself
        // This calls recursively and asynchronously the parsing of the following line
        // In order to get a single promise that returns only once all the lines have been parsed
        function doLine(line) {
          return new Promise(function (resolve, reject) {
            self.processFileLine(lines[line], markerNameMap);
            self.processedLines += 1;
            if (advancementCallback) advancementCallback(self.processedLines / self.totalLineCount);
            if (line + 1 < self.totalLineCount) {
              // Yield to the browser to let it do its things, run the next lines (recursively),
              // and return once they are done
              setTimeout(function () {
                doLine(line + 1).then(resolve);
              }, 0);
            } else {
              // Finish
              resolve();
            }
          });
        }
        return doLine(0).then(function (results) {
          if (completionCallback) completionCallback();
          console.log("parseFile took " + (Date.now() - b4) + "ms");
          return self.germplasmList;
        });
      }

      // In situations where a map hasn't been provided, we want to create a fake or
      // dummy map one chromosome and evenly spaced markers
    }, {
      key: "createFakeMap",
      value: function createFakeMap(fileContents) {
        var _this2 = this;
        var lines = fileContents.split(/\r?\n/);
        for (var lineIndex = 0; lineIndex < lines.length; lineIndex += 1) {
          var line = lines[lineIndex];
          if (!line.startsWith('#')) {
            if (line.startsWith('Accession') || line.startsWith('\t')) {
              var _ret = function () {
                var markers = [];
                var markerNames = line.split('\t');

                // Use the genotype data format's header line to map marker names to
                // a 0 to length range of indices which double up as marker positions
                // for mapless loading
                markerNames.slice(1).forEach(function (name, idx) {
                  var marker = new Marker(name, 'unmapped', idx);
                  markers.push(marker);
                });
                var chromosomes = [];
                chromosomes.push(new Chromosome('unmapped', markers.length, markers));
                _this2.genomeMap = new GenomeMap(chromosomes);
                return {
                  v: _this2.genomeMap
                };
              }();
              if (_typeof(_ret) === "object") return _ret.v;
            }
          }
        }
        return this.genomeMap;
      }

      // A method to create a fake map from BrAPI variantset calls
    }, {
      key: "createFakeMapFromVariantSets",
      value: function createFakeMapFromVariantSets(variantSetCalls) {
        var firstGenoName = variantSetCalls[0].callSetName;
        var firstGenoCalls = variantSetCalls.filter(function (v) {
          return v.callSetName === firstGenoName;
        }).map(function (v) {
          return v.markerName;
        });
        // Make sure we only have unique markerNames
        var markerNames = _toConsumableArray(new Set(firstGenoCalls));
        var markers = [];
        markerNames.forEach(function (name, idx) {
          var marker = new Marker(name, 'unmapped', idx);
          markers.push(marker);
        });
        var chromosomes = [];
        chromosomes.push(new Chromosome('unmapped', markers.length, markers));
        this.genomeMap = new GenomeMap(chromosomes);
        return this.genomeMap;
      }

      // A method which converts BrAPI variantSetsCalls into Flapjack genotypes for
      // rendering
    }, {
      key: "parseVariantSetCalls",
      value: function parseVariantSetCalls(variantSetsCalls) {
        var _this3 = this;
        var genoNames = new Set(variantSetsCalls.map(function (v) {
          return v.lineName;
        }));
        genoNames.forEach(function (name) {
          var genoCalls = variantSetsCalls.filter(function (v) {
            return v.lineName === name;
          });
          if (_this3.markerIndices.size === 0) {
            genoCalls.forEach(function (call, idx) {
              var indices = _this3.genomeMap.markerByName(call.markerName);
              if (indices !== -1) {
                _this3.markerIndices.set(idx, indices);
              }
            });
          }
          var genotypeData = _this3.initGenotypeData();
          genoCalls.forEach(function (call, idx) {
            var indices = _this3.markerIndices.get(idx);
            if (indices !== undefined && indices !== -1) {
              genotypeData[indices.chromosome][indices.markerIndex] = _this3.getState(call.allele);
            }
          });
          var germplasm = new Germplasm(name, genotypeData);
          _this3.germplasmList.push(germplasm);
        });
        return this.germplasmList;
      }
    }]);
    return GenotypeImporter;
  }();

  var PhenotypeImporter = /*#__PURE__*/function () {
    function PhenotypeImporter() {
      _classCallCheck(this, PhenotypeImporter);
      this.traitNames = [];
      this.experiments = [];
      this.values = [];
      this.traits = new Map();
      this.valueToIndex = new Map();
      this.phenotypes = new Map();
    }
    _createClass(PhenotypeImporter, [{
      key: "loadData",
      value: function loadData(lines) {
        for (var index = 0; index < lines.length; index += 1) {
          var line = lines[index];
          if (line.startsWith('#') || !line || line.length === 0) continue;
          if (line.startsWith("\t")) {
            {
              // Traits
              this.traitNames = line.split("\t").slice(1);
            }
          } else {
            this.values.push(line.split("\t"));
          }
        }
      }
    }, {
      key: "buildTraits",
      value: function buildTraits() {
        var _this = this;
        var _loop = function _loop(traitIndex) {
          traitName = _this.traitNames[traitIndex];
          var experiment = _this.experiments[traitIndex]; // May be undefined
          var values = _this.values.map(function (germplasmValues) {
            return germplasmValues[traitIndex + 1];
          });
          var traitType = void 0;
          if (traitName.includes("_#CAT")) {
            traitType = TraitType.Category;
            traitName = traitName.replace("_#CAT", "");
          } else if (traitName.includes("_#NUM")) {
            traitType = TraitType.Numerical;
            traitName = traitName.replace("_#NUM", "");
          } else {
            var numValues = values.map(function (value) {
              return parseFloat(value);
            });
            if (numValues.some(function (value) {
              return isNaN(value);
            })) {
              // At least one value is not numerical
              traitType = TraitType.Category;
            } else {
              traitType = TraitType.Numerical;
            }
          }
          traitName = traitName.trim();
          var trait = new Trait(traitName, traitType, experiment);
          if (traitType == TraitType.Category) {
            var valueToIndex = new Map();
            var valueIndex = 0;
            var maxLength = 0;
            values.sort();
            var _iterator = _createForOfIteratorHelper(values),
              _step;
            try {
              for (_iterator.s(); !(_step = _iterator.n()).done;) {
                var value = _step.value;
                if (!valueToIndex.has(value)) {
                  valueToIndex.set(value, valueIndex);
                  valueIndex += 1;
                  if (value.length > maxLength) trait.longestValue = value;
                }
              }
            } catch (err) {
              _iterator.e(err);
            } finally {
              _iterator.f();
            }
            _this.valueToIndex.set(traitName, valueToIndex);
            trait.setValues(Array.from(valueToIndex.keys()));
            trait.setScale(0, valueIndex - 1);
          } else {
            var _numValues = values.map(function (value) {
              return parseFloat(value);
            });
            var minValue = _numValues[0],
              maxValue = _numValues[0];
            var _maxLength = 0;
            _numValues.slice(1).forEach(function (value) {
              if (value < minValue) minValue = value;
              if (value > maxValue) maxValue = value;
              if (value.toString().length > _maxLength) trait.longestValue = value.toString();
            });
            trait.setScale(minValue, maxValue);
          }
          _this.traits.set(traitName, trait);
          _this.traitNames[traitIndex] = traitName;
        };
        for (var traitIndex = 0; traitIndex < this.traitNames.length; traitIndex += 1) {
          var traitName;
          _loop(traitIndex);
        }
      }
    }, {
      key: "buildPhenotypes",
      value: function buildPhenotypes() {
        for (var index = 0; index < this.values.length; index += 1) {
          var values = this.values[index];
          var germplasmName = values[0];
          var traitValues = values.slice(1);
          var phenotype = new Map();
          for (var traitIndex = 0; traitIndex < traitValues.length; traitIndex += 1) {
            var trait = this.traits.get(this.traitNames[traitIndex]);
            var value = void 0;
            if (trait.type == TraitType.Category) {
              value = this.valueToIndex.get(trait.name).get(traitValues[traitIndex]);
            } else if (trait.type == TraitType.Numerical) {
              value = parseFloat(traitValues[traitIndex].trim());
            }
            phenotype.set(trait.name, value);
          }
          this.phenotypes.set(germplasmName.trim(), phenotype);
        }
        return this.phenotypes;
      }
    }, {
      key: "parseFile",
      value: function parseFile(fileContents) {
        var lines = fileContents.split(/\r?\n/);
        this.loadData(lines);
        this.buildTraits();
        return this.buildPhenotypes();
      }
    }]);
    return PhenotypeImporter;
  }();

  var DataSet = /*#__PURE__*/function () {
    function DataSet(dataSetId, genomeMap, germplasmList, stateTable, traits, phenotypes) {
      _classCallCheck(this, DataSet);
      this.id = dataSetId;
      this.genomeMap = genomeMap;
      this.germplasmList = germplasmList;
      this.stateTable = stateTable;
      this.traits = traits;

      // Keep the importing order to allow getting back to it later on
      this.importingOrder = germplasmList.map(function (germplasm) {
        return germplasm.name;
      });

      // Pre-compute the similarity matrix
      this.similarityLookupTable = buildSimilarityLookupTable(this.stateTable);
      if (this.traits !== undefined) {
        // Pre-order the traits
        this.traitNames = Array.from(this.traits.keys());
        this.traitNames.sort();

        // Set the germplasms' traits
        this.germplasmList.forEach(function (germplasm) {
          germplasm.phenotype = phenotypes.get(germplasm.name);
        });
      } else {
        this.traitNames = undefined;
      }
    }
    _createClass(DataSet, [{
      key: "germplasmFor",
      value: function germplasmFor(germplasmStart, germplasmEnd) {
        return this.germplasmList.slice(germplasmStart, germplasmEnd);
      }
    }, {
      key: "genotypeFor",
      value: function genotypeFor(germplasm, chromosome, marker) {
        return this.germplasmList[germplasm].genotypeData[chromosome][marker];
      }
    }, {
      key: "markersToRender",
      value: function markersToRender(markerStart, markerEnd) {
        return this.genomeMap.chromosomePositionsFor(markerStart, markerEnd);
      }
    }, {
      key: "markersToRenderOn",
      value: function markersToRenderOn(chromosomeIndex, markerStart, markerEnd) {
        return this.genomeMap.markersToRenderOn(chromosomeIndex, markerStart, markerEnd);
      }
    }, {
      key: "markerAt",
      value: function markerAt(markerIndex) {
        return this.genomeMap.markerAt(markerIndex);
      }
    }, {
      key: "markerOn",
      value: function markerOn(chromosomeIndex, markerIndex) {
        return this.genomeMap.markerOn(chromosomeIndex, markerIndex);
      }
    }, {
      key: "chromosomeCount",
      value: function chromosomeCount() {
        return this.genomeMap.chromosomes.length;
      }
    }, {
      key: "markerCountOn",
      value: function markerCountOn(chromosomeIndex) {
        return this.genomeMap.markerCountOn(chromosomeIndex);
      }
    }, {
      key: "markerCount",
      value: function markerCount() {
        return this.genomeMap.markerCount();
      }
    }, {
      key: "lineCount",
      value: function lineCount() {
        return this.germplasmList.length;
      }
    }, {
      key: "hasTraits",
      value: function hasTraits() {
        return this.traits !== undefined;
      }
    }, {
      key: "getTrait",
      value: function getTrait(traitName) {
        if (!this.hasTraits()) return undefined;
        return this.traits.get(traitName);
      }
    }]);
    return DataSet;
  }();

  function GenotypeRenderer() {
    var genotypeRenderer = {};
    var genotypeImporter;

    // Variables for referring to the genotype canvas
    var genotypeCanvas;
    var overviewCanvas;
    var settingsTabs = new Map();
    // TODO: need to investigate a proper clean way to implement this controller
    // functionality
    // eslint-disable-next-line no-unused-vars
    var canvasController;

    // Genotype import progress bar
    var progressBar;
    var progressBarLabel;
    var progressBarBackground;
    var boxSize = 17;
    var genomeMap;
    var phenotypes;
    var traits;
    var dataSet;
    function sendEvent(eventName, domParent) {
      // TODO: Invesitgate using older event emitting code for IE support
      var canvasHolder = document.getElementById(domParent.replace('#', ''));

      // Create the event.
      var event = new Event(eventName);
      canvasHolder.dispatchEvent(event);
    }
    function zoom(size) {
      var newPosition = genotypeCanvas.zoom(size);
      overviewCanvas.moveToPosition(newPosition.marker, newPosition.germplasm, genotypeCanvas.visibilityWindow());
    }
    function setChromosome(chromosomeIndex) {
      canvasController.setChromosome(chromosomeIndex);
    }
    function clearParent(domParent) {
      var canvasHolder = document.getElementById(domParent.replace('#', ''));
      while (canvasHolder.firstChild) {
        canvasHolder.removeChild(canvasHolder.firstChild);
      }
    }
    function createRendererComponents(config, showProgress) {
      // Canvas
      if (config.minGenotypeAutoWidth === undefined) config.minGenotypeAutoWidth = 0;
      if (config.minOverviewAutoWidth === undefined) config.minOverviewAutoWidth = 0;
      var canvasHolder = document.getElementById(config.domParent.replace('#', ''));
      canvasHolder.style.fontFamily = 'system-ui';
      canvasHolder.style.fontSize = '14px';
      var computedStyles = window.getComputedStyle(canvasHolder);
      var autoWidth = canvasHolder.clientWidth - parseInt(computedStyles.paddingLeft) - parseInt(computedStyles.paddingRight);
      var width = config.width === null ? Math.max(autoWidth, config.minGenotypeAutoWidth) : config.width;
      var overviewWidth = config.overviewWidth === null ? Math.max(autoWidth, config.minOverviewAutoWidth) : config.overviewWidth;
      var settings = createSettings(config);
      canvasHolder.appendChild(settings);
      if (showProgress) {
        // Progress bar
        progressBarBackground = document.createElement("div");
        progressBarBackground.style.width = width + "px";
        progressBarBackground.style.backgroundColor = "grey";
        progressBarBackground.style.position = "relative";
        progressBar = document.createElement("div");
        progressBar.style.width = "1%";
        progressBar.style.height = "30px";
        progressBar.style.backgroundColor = "cyan";
        var labelContainer = document.createElement("div");
        labelContainer.style.position = "absolute";
        labelContainer.style.display = "inline";
        labelContainer.style.top = "0px";
        labelContainer.style.left = "15px";
        labelContainer.style.height = "30px";
        labelContainer.style.lineHeight = "30px";
        progressBarLabel = document.createTextNode("");
        labelContainer.appendChild(progressBarLabel);
        progressBarBackground.appendChild(progressBar);
        progressBarBackground.appendChild(labelContainer);
        canvasHolder.append(progressBarBackground);
      }
      genotypeCanvas = new GenotypeCanvas(width, config.height, boxSize);
      canvasHolder.append(genotypeCanvas.canvas);
      if (!overviewWidth) overviewWidth = width;
      if (!config.overviewHeight) config.overviewHeight = 200;
      overviewCanvas = new OverviewCanvas(overviewWidth, config.overviewHeight);
      canvasHolder.append(overviewCanvas.canvas);
      addStyleSheet();
      canvasController = new CanvasController(canvasHolder, genotypeCanvas, overviewCanvas, config.saveSettings != false, config.width === null, config.overviewWidth === null, config.minGenotypeAutoWidth, config.minOverviewAutoWidth);
    }
    function createTabToggle(name, title) {
      var button = document.createElement('button');
      button.classList.add('bytes-tabtoggle');
      button.style.fontSize = '15px';
      button.appendChild(document.createTextNode(title));
      button.addEventListener('click', openSettingsTab(name));
      return button;
    }
    function openSettingsTab(name) {
      return function (event) {
        var _iterator = _createForOfIteratorHelper(settingsTabs.keys()),
          _step;
        try {
          for (_iterator.s(); !(_step = _iterator.n()).done;) {
            var key = _step.value;
            var _settingsTabs$get = settingsTabs.get(key),
              _settingsTabs$get2 = _slicedToArray(_settingsTabs$get, 2),
              button = _settingsTabs$get2[0],
              tab = _settingsTabs$get2[1];
            if (key == name) {
              button.classList.add('bytes-tabtoggle-active');
              tab.style.display = 'block';
            } else {
              button.classList.remove('bytes-tabtoggle-active');
              tab.style.display = 'none';
            }
          }
        } catch (err) {
          _iterator.e(err);
        } finally {
          _iterator.f();
        }
      };
    }
    function addRadioButton(name, id, text, checked, parent, subcontrol) {
      var formCheck = document.createElement('div');
      formCheck.classList.add('form-check');
      var radio = document.createElement('input');
      radio.setAttribute('type', 'radio');
      radio.name = name;
      radio.id = id;
      radio.checked = checked;
      radio.classList.add('form-check-input');
      var radioLabel = document.createElement('label');
      radioLabel.htmlFor = id;
      radioLabel.classList.add('form-check-label');
      var labelText = document.createTextNode(text + " ");
      radioLabel.appendChild(labelText);
      formCheck.appendChild(radio);
      formCheck.appendChild(radioLabel);
      if (subcontrol) formCheck.appendChild(subcontrol);
      parent.appendChild(formCheck);
    }
    function addCSSRule(sheet, selector, rules, index) {
      if ('insertRule' in sheet) {
        sheet.insertRule(selector + '{' + rules + '}', index);
      } else if ('addRule' in sheet) {
        sheet.addRule(selector, rules, index);
      }
    }
    function addStyleSheet() {
      var sheet = function () {
        // Create the <style> tag
        var style = document.createElement("style");

        // WebKit hack :(
        style.appendChild(document.createTextNode(""));

        // Add the <style> element to the page
        document.head.appendChild(style);
        return style.sheet;
      }();

      //addCSSRule(sheet, '.bytes-fieldset > legend', 'border-style: none; border-width: 0; font-size: 14px; line-height: 20px; margin-bottom: 0; width: auto; padding: 0 10px; border: 1px solid #e0e0e0;');
      //addCSSRule(sheet, '.bytes-fieldset', 'border: 1px solid #e0e0e0; padding: 10px;');
      addCSSRule(sheet, '.bytes-tabtoggle', "display: inline-block; border: none; outline: none; padding: 8px;");
      addCSSRule(sheet, '.bytes-tabtoggle:hover', 'background-color: #DDDDDD');
      addCSSRule(sheet, '.bytes-tabtoggle.bytes-tabtoggle-active', 'background-color: #CCCCCC');
      addCSSRule(sheet, '.bytes-tab', 'display: none;');
      // addCSSRule(sheet, 'input', 'margin: .4rem;');
    }

    function createSettings(config) {
      //// Settings
      var settings = document.createElement('div');
      settings.classList.add('row');
      settings.style.marginTop = '8px';

      // Create the tabs
      var controlTab = createControlTab();
      var colorTab = createColorSchemeTab();
      var sortTab = createSortTab(config);
      var exportTab = createExportTab();
      var displayTab = createDisplayTab(config);

      // Create the tab toggles
      var menuRow = document.createElement('div');
      var controlButton = createTabToggle('control', 'Controls');
      var colorButton = createTabToggle('color', 'Color schemes');
      var sortButton = createTabToggle('sort', 'Sorting');
      var displayButton = createTabToggle('display', 'Display');
      var exportButton = createTabToggle('export', 'Export');
      menuRow.appendChild(controlButton);
      menuRow.appendChild(colorButton);
      menuRow.appendChild(sortButton);
      if (displayTab !== undefined) menuRow.appendChild(displayButton);
      menuRow.appendChild(exportButton);
      settingsTabs.set('control', [controlButton, controlTab]);
      settingsTabs.set('color', [colorButton, colorTab]);
      settingsTabs.set('sort', [sortButton, sortTab]);
      if (displayTab !== undefined) settingsTabs.set('display', [displayButton, displayTab]);
      settingsTabs.set('export', [exportButton, exportTab]);
      settings.appendChild(menuRow);

      // Add the actual tabs
      var tabContainer = document.createElement('div');
      tabContainer.appendChild(controlTab);
      tabContainer.appendChild(colorTab);
      tabContainer.appendChild(sortTab);
      if (displayTab !== undefined) tabContainer.appendChild(displayTab);
      tabContainer.appendChild(exportTab);
      tabContainer.style.minHeight = '140px'; // Can't really use getClientBoundingRect as the tabs are not displayed yet, so...
      tabContainer.style.border = '1px solid #e0e0e0';
      tabContainer.style.padding = '10px';
      settings.appendChild(tabContainer);
      controlTab.style.display = 'block';
      return settings;
    }
    function createControlTab(config) {
      // Controls
      var tab = document.createElement('div');
      tab.classList.add('bytes-tab');

      // Chromosome
      var chromosomeLabel = document.createElement('label');
      chromosomeLabel.setAttribute('for', 'chromosomeSelect');
      chromosomeLabel.innerHTML = 'Chromosome: ';
      var chromosomeSelect = document.createElement('select');
      chromosomeSelect.id = 'chromosomeSelect';
      chromosomeSelect.addEventListener('change', function (event) {
        setChromosome(event.target.selectedIndex);
      });
      var chromosomeContainer = document.createElement('div');
      chromosomeContainer.append(chromosomeLabel);
      chromosomeContainer.append(chromosomeSelect);

      // Zoom
      var zoomLabel = document.createElement('label');
      zoomLabel.setAttribute('for', 'zoom-control');
      zoomLabel.innerHTML = 'Zoom:';
      var range = document.createElement('input');
      range.id = 'zoom-control';
      range.setAttribute('type', 'range');
      range.min = 2;
      range.max = 64;
      range.value = boxSize;
      range.style.width = "300px";
      var zoomPreviewLabel = document.createElement('label');
      zoomPreviewLabel.setAttribute('for', 'zoom-preview');
      zoomPreviewLabel.innerHTML = 'Preview while dragging';
      var zoomPreview = document.createElement('input');
      zoomPreview.id = 'zoom-preview';
      zoomPreview.setAttribute('type', 'checkbox');
      zoomPreview.style.marginLeft = "20px";
      var zoomContainer = document.createElement('div');
      zoomContainer.append(zoomLabel);
      zoomContainer.append(range);
      zoomContainer.append(zoomPreview);
      zoomContainer.append(zoomPreviewLabel);
      range.addEventListener('change', function () {
        if (!document.getElementById("zoom-preview").checked) {
          //console.log("change: " + range.value);
          zoom(range.value);
        }
      });
      range.addEventListener('input', function () {
        if (document.getElementById("zoom-preview").checked) {
          //console.log("input: " + range.value);
          zoom(range.value);
        }
      });
      tab.appendChild(chromosomeContainer);
      tab.appendChild(zoomContainer);
      return tab;
    }
    function createColorSchemeTab(config) {
      var tab = document.createElement('div');
      tab.classList.add('bytes-tab');
      var lineSelect = document.createElement('select');
      lineSelect.id = 'colorLineSelect';
      lineSelect.disabled = true;
      var radioCol = document.createElement('div');
      radioCol.classList.add('col');
      addRadioButton('selectedScheme', 'nucleotideScheme', 'Nucleotide', true, radioCol);
      addRadioButton('selectedScheme', 'similarityScheme', 'Similarity to line (allele match)', false, radioCol, lineSelect);
      tab.appendChild(radioCol);
      return tab;
    }
    function createSortTab(config) {
      var tab = document.createElement('div');
      tab.classList.add('bytes-tab');
      var lineSelect = document.createElement('select');
      lineSelect.id = 'sortLineSelect';
      lineSelect.disabled = true;
      var radioCol = document.createElement('div');
      radioCol.classList.add('col');
      addRadioButton('selectedSort', 'importingOrderSort', 'By importing order', true, radioCol);
      addRadioButton('selectedSort', 'alphabeticSort', 'Alphabetically', false, radioCol);
      addRadioButton('selectedSort', 'similaritySort', 'By similarity to line', false, radioCol, lineSelect);
      if (config.phenotypeFileDom !== undefined && document.getElementById(config.phenotypeFileDom.replace('#', '')).files[0] !== undefined || config.phenotypeFileURL !== undefined) {
        var traitSelect = document.createElement('select');
        traitSelect.id = 'sortTraitSelect';
        traitSelect.disabled = true;
        addRadioButton('selectedSort', 'traitSort', 'By trait', false, radioCol, traitSelect);
      }
      tab.appendChild(radioCol);
      return tab;
    }
    function createExportTab(config) {
      var tab = document.createElement('div');
      tab.classList.add('bytes-tab');
      var exportViewButton = document.createElement('button');
      var exportViewText = document.createTextNode('Export view');
      exportViewButton.appendChild(exportViewText);
      exportViewButton.addEventListener('click', function (e) {
        var dataURL = genotypeCanvas.toDataURL('image/png');
        if (dataURL) {
          // Export succeeded
          var element = document.createElement('a');
          element.setAttribute('href', dataURL);
          element.setAttribute('download', genotypeCanvas.exportName() + '.png');
          element.style.display = 'none';
          document.body.appendChild(element);
          element.click();
          document.body.removeChild(element);
        }
      });
      var exportOverviewButton = document.createElement('button');
      var exportOverviewText = document.createTextNode('Export overview');
      exportOverviewButton.appendChild(exportOverviewText);
      exportOverviewButton.addEventListener('click', function (e) {
        var dataURL = overviewCanvas.toDataURL('image/png');
        if (dataURL) {
          // Export succeeded
          var element = document.createElement('a');
          element.setAttribute('href', dataURL);
          element.setAttribute('download', overviewCanvas.exportName() + '.png');
          element.style.display = 'none';
          document.body.appendChild(element);
          element.click();
          document.body.removeChild(element);
        }
      });
      tab.appendChild(exportViewButton);
      tab.appendChild(exportOverviewButton);
      return tab;
    }
    function createDisplayTab(config) {
      if (config.phenotypeFileDom !== undefined && document.getElementById(config.phenotypeFileDom.replace('#', '')).files[0] !== undefined || config.phenotypeFileURL !== undefined) {
        var tab = document.createElement('div');
        tab.classList.add('bytes-tab');
        var traitSelectContainer = document.createElement('div');
        traitSelectContainer.style["float"] = 'left';
        var traitSelectLegend = document.createElement('p');
        var traitSelectLegendText = document.createTextNode('Traits to display');
        traitSelectLegend.appendChild(traitSelectLegendText);
        var traitSelect = document.createElement('select');
        traitSelect.id = 'displayTraitSelect';
        traitSelect.multiple = true;
        traitSelect.size = 5;
        traitSelectContainer.appendChild(traitSelectLegend);
        traitSelectContainer.appendChild(traitSelect);
        var paletteSelectContainer = document.createElement('div');
        paletteSelectContainer.style["float"] = 'left';
        paletteSelectContainer.style.marginLeft = '10px';
        var paletteSelectLegend = document.createElement('p');
        var paletteSelectLegendText = document.createTextNode('Trait colors');
        paletteSelectLegend.appendChild(paletteSelectLegendText);
        var paletteSelectTrait = document.createElement('select');
        paletteSelectTrait.id = 'paletteTrait';
        paletteSelectTrait.style.display = 'block';
        var paletteSelectValue = document.createElement('select');
        paletteSelectValue.id = 'paletteValue';
        paletteSelectValue.style.display = 'block';
        var paletteSelectColor = document.createElement('input');
        paletteSelectColor.id = 'paletteColor';
        paletteSelectColor.style.display = 'block';
        paletteSelectColor.setAttribute('type', 'color');
        var paletteResetButton = document.createElement('button');
        var paletteResetLegend = document.createTextNode("Reset this trait's colors");
        paletteResetButton.appendChild(paletteResetLegend);
        paletteResetButton.id = 'paletteReset';
        paletteSelectContainer.appendChild(paletteSelectLegend);
        paletteSelectContainer.appendChild(paletteSelectTrait);
        paletteSelectContainer.appendChild(paletteSelectValue);
        paletteSelectContainer.appendChild(paletteSelectColor);
        paletteSelectContainer.appendChild(paletteResetButton);
        tab.appendChild(traitSelectContainer);
        tab.appendChild(paletteSelectContainer);
        return tab;
      }
    }
    function setProgressBarLabel(newLabel) {
      progressBarLabel.data = newLabel;
    }
    function setAdvancement(ratio) {
      progressBar.style.width = Math.floor(100 * ratio) + "%";
    }
    function removeAdvancement() {
      progressBarBackground.remove();
    }
    function processMarkerPositionsCall(client, url, params) {
      var markerpositions = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : [];
      return client.get(url, params).then(function (response) {
        var _response$data$metada = response.data.metadata.pagination,
          currentPage = _response$data$metada.currentPage,
          totalPages = _response$data$metada.totalPages;
        var newData = response.data.result.data;
        markerpositions.push.apply(markerpositions, _toConsumableArray(newData.map(function (m) {
          return {
            name: m.variantName,
            chromosome: m.linkageGroupName,
            position: m.position
          };
        })));
        if (currentPage < totalPages - 1) {
          var nextPage = currentPage + 1;
          var newParams = {
            params: {
              page: nextPage
            }
          };
          return processMarkerPositionsCall(client, url, newParams, markerpositions);
        }
        return markerpositions;
      })["catch"](function (error) {
        // eslint-disable-next-line no-console
        console.log(error);
      });
    }
    function processVariantSetCall(client, url, params) {
      var variantSetCalls = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : [];
      if (params === undefined) params = {};
      return client.get(url, params).then(function (response) {
        var nextPageToken = response.data.metadata.pagination.nextPageToken;
        var newData = response.data.result.data;
        variantSetCalls.push.apply(variantSetCalls, _toConsumableArray(newData.map(function (calls) {
          return {
            lineName: calls.callSetName,
            markerName: calls.variantName,
            allele: calls.genotype.values[0]
          };
        })));
        if (nextPageToken) {
          var newParams = {
            params: {
              pageToken: nextPageToken
            }
          };
          return processVariantSetCall(client, url, newParams, variantSetCalls);
        }
        return variantSetCalls;
      })["catch"](function (error) {
        // eslint-disable-next-line no-console
        console.log(error);
      });
    }
    genotypeRenderer.renderGenotypesBrapi = function renderGenotypesBrapi(config,
    // Compatibility positional domParent

    // Positional arguments kept for compatibility
    width, height, baseURL, matrixId, mapId, authToken, overviewWidth, overviewHeight, minGenotypeAutoWidth, minOverviewAutoWidth) {
      if (!(config instanceof Object)) {
        config = {
          domParent: config,
          // Position for domParent
          baseURL: baseURL,
          matrixId: matrixId,
          mapId: mapId,
          authToken: authToken,
          minGenotypeAutoWidth: minGenotypeAutoWidth,
          minOverviewAutoWidth: minOverviewAutoWidth
        };
        config.width = width !== undefined ? width : null;
        config.height = height !== undefined ? height : 600;
        config.overviewWidth = overviewWidth !== undefined ? overviewWidth : config.width;
        config.overviewHeight = overviewHeight !== undefined ? overviewHeight : 200;
      }
      clearParent(config.domParent);
      createRendererComponents(config, false);
      var germplasmData;
      var client = axios.create({
        baseURL: config.baseURL
      });
      client.defaults.headers.common.Authorization = "Bearer ".concat(config.authToken);
      if (config.mapId !== null) {
        // TODO: GOBii don't have the markerpositions call implemented yet so I
        // can't load map data
        processMarkerPositionsCall(client, "/markerpositions?mapDbId=".concat(config.mapId)).then(function (markerpositions) {
          var mapImporter = new MapImporter();
          genomeMap = mapImporter.parseMarkerpositions(markerpositions);
          processVariantSetCall(client, "/variantsets/".concat(config.matrixId, "/calls")).then(function (variantSetCalls) {
            genotypeImporter = new GenotypeImporter(genomeMap);
            if (genomeMap === undefined) {
              genomeMap = genotypeImporter.createFakeMapFromVariantSets(variantSetCalls);
            }
            germplasmData = genotypeImporter.parseVariantSetCalls(variantSetCalls);
            var _genotypeImporter = genotypeImporter,
              stateTable = _genotypeImporter.stateTable;
            var dataSetId = config.dataSetId === undefined ? config.matrixId : config.dataSetId;
            dataSet = new DataSet(dataSetId, genomeMap, germplasmData, stateTable);
            populateLineSelect();
            populateChromosomeSelect();
            canvasController.init(dataSet);

            // Tells the dom parent that Flapjack has finished loading. Allows spinners
            // or similar to be disabled
            sendEvent('FlapjackFinished', config.domParent);
          })["catch"](function (error) {
            sendEvent('FlapjackError', config.domParent);
            // eslint-disable-next-line no-console
            console.log(error);
          });
        })["catch"](function (error) {
          sendEvent('FlapjackError', config.domParent);
          // eslint-disable-next-line no-console
          console.log(error);
        });
      } else {
        processVariantSetCall(client, "/variantsets/".concat(config.matrixId, "/calls")).then(function (variantSetCalls) {
          genotypeImporter = new GenotypeImporter(genomeMap);
          if (genomeMap === undefined) {
            genomeMap = genotypeImporter.createFakeMapFromVariantSets(variantSetCalls);
          }
          germplasmData = genotypeImporter.parseVariantSetCalls(variantSetCalls);
          var _genotypeImporter2 = genotypeImporter,
            stateTable = _genotypeImporter2.stateTable;
          var dataSetId = config.dataSetId === undefined ? config.matrixId : config.dataSetId;
          dataSet = new DataSet(config.matrixId, genomeMap, germplasmData, stateTable);
          populateLineSelect();
          populateChromosomeSelect();
          canvasController.init(dataSet);

          // Tells the dom parent that Flapjack has finished loading. Allows spinners
          // or similar to be disabled
          sendEvent('FlapjackFinished', config.domParent);
        })["catch"](function (error) {
          sendEvent('FlapjackError', config.domParent);
          // eslint-disable-next-line no-console
          console.log(error);
        });
      }
      return genotypeRenderer;
    };
    genotypeRenderer.renderGenotypesUrl = function renderGenotypesUrl(config,
    // Positional : domParent

    // Old positional arguments, kept for backwards compatibility
    width, height, mapFileURL, genotypeFileURL, authToken, overviewWidth, overviewHeight, minGenotypeAutoWidth, minOverviewAutoWidth) {
      if (!(config instanceof Object)) {
        config = {
          domParent: config,
          // Position for domParent
          mapFileURL: mapFileURL,
          genotypeFileURL: genotypeFileURL,
          authToken: authToken,
          minGenotypeAutoWidth: minGenotypeAutoWidth,
          minOverviewAutoWidth: minOverviewAutoWidth
        };
        config.width = width !== undefined ? width : null;
        config.height = height !== undefined ? height : 600;
        config.overviewWidth = overviewWidth !== undefined ? overviewWidth : config.width;
        config.overviewHeight = overviewHeight !== undefined ? overviewHeight : 200;
      }
      clearParent(config.domParent);
      createRendererComponents(config, true);
      var mapFile, genotypeFile, phenotypeFile;
      var germplasmData;
      var loadingPromises = [];
      var mapLoaded = 0,
        genotypeLoaded = 0,
        phenotypeLoaded = 0;
      var mapSize = 0,
        genotypeSize = 0,
        phenotypeSize = 0;
      setProgressBarLabel("Downloading data...");
      setAdvancement(0);
      if (config.mapFileURL) {
        var mapPromise = axios.get(config.mapFileURL, {
          headers: {
            'Content-Type': 'text/plain'
          },
          onDownloadProgress: function onDownloadProgress(progressEvent) {
            if (progressEvent.lengthComputable) {
              mapLoaded = progressEvent.loaded;
              mapSize = progressEvent.total;
              setAdvancement((mapLoaded + genotypeLoaded + phenotypeLoaded) / (mapSize + genotypeSize + phenotypeSize));
            }
          }
        }).then(function (response) {
          mapFile = response.data;
        })["catch"](function (error) {
          console.error(error);
        });
        loadingPromises.push(mapPromise);
      }
      if (config.phenotypeFileURL) {
        var phenotypePromise = axios.get(config.phenotypeFileURL, {
          headers: {
            'Content-Type': 'text/plain'
          },
          onDownloadProgress: function onDownloadProgress(progressEvent) {
            if (progressEvent.lengthComputable) {
              phenotypeLoaded = progressEvent.loaded;
              phenotypeSize = progressEvent.total;
              setAdvancement((mapLoaded + genotypeLoaded + phenotypeLoaded) / (mapSize + genotypeSize + phenotypeSize));
            }
          }
        }).then(function (response) {
          phenotypeFile = response.data;
        })["catch"](function (error) {
          console.error(error);
        });
        loadingPromises.push(phenotypePromise);
      }
      var genotypePromise = axios.get(config.genotypeFileURL, {
        headers: {
          'Content-Type': 'text/plain'
        },
        onDownloadProgress: function onDownloadProgress(progressEvent) {
          if (progressEvent.lengthComputable) {
            genotypeLoaded = progressEvent.loaded;
            genotypeSize = progressEvent.total;
            setAdvancement((mapLoaded + genotypeLoaded + phenotypeLoaded) / (mapSize + genotypeSize + phenotypeSize));
          } else setProgressBarLabel("Downloading genotype file... " + formatFileSize(progressEvent.loaded));
        }
      }).then(function (response) {
        genotypeFile = response.data;
      })["catch"](function (error) {
        console.error(error);
      });
      loadingPromises.push(genotypePromise);
      Promise.all(loadingPromises).then(function () {
        setAdvancement(0);
        setProgressBarLabel("Processing the genome map...");
        if (mapFile !== undefined) {
          var mapImporter = new MapImporter();
          genomeMap = mapImporter.parseFile(mapFile);
        }
        setAdvancement(0);
        setProgressBarLabel("Processing the phenotypes...");
        if (phenotypeFile !== undefined) {
          var phenotypeImporter = new PhenotypeImporter();
          phenotypes = phenotypeImporter.parseFile(phenotypeFile);
          traits = phenotypeImporter.traits;
        }
        setProgressBarLabel("Processing the genotypes...");
        genotypeImporter = new GenotypeImporter(genomeMap);
        if (genomeMap === undefined) {
          genomeMap = genotypeImporter.createFakeMap(genotypeFile);
        }
        genotypeImporter.parseFile(genotypeFile, setAdvancement, removeAdvancement).then(function (germplasmList) {
          germplasmData = germplasmList;
          var _genotypeImporter3 = genotypeImporter,
            stateTable = _genotypeImporter3.stateTable;
          var dataSetId = config.dataSetId === undefined ? config.genotypeFileURL : config.dataSetId;
          dataSet = new DataSet(dataSetId, genomeMap, germplasmData, stateTable, traits, phenotypes);
          populateLineSelect();
          if (phenotypes !== undefined) populateTraitSelect();
          populateChromosomeSelect();
          canvasController.init(dataSet);

          // Tells the dom parent that Flapjack has finished loading. Allows spinners
          // or similar to be disabled
          sendEvent('FlapjackFinished', config.domParent);
        });
      })["catch"](function (error) {
        sendEvent('FlapjackError', config.domParent);
        // eslint-disable-next-line no-console
        console.log(error);
      });
      return genotypeRenderer;
    };
    function formatFileSize(sizeInBytes) {
      if (isNaN(sizeInBytes)) return "";
      if (sizeInBytes >= 1073741824) return parseFloat(sizeInBytes / 1073741824).toFixed(2) + " GB";
      if (sizeInBytes >= 1048576) return parseFloat(sizeInBytes / 1048576).toFixed(1) + " MB";
      if (sizeInBytes >= 1024) return parseFloat(sizeInBytes / 1024).toFixed(0) + " KB";
      return sizeInBytes.toFixed(1) + " B";
    }
    function loadFromFile(file) {
      return new Promise(function (resolve, reject) {
        var reader = new FileReader();
        reader.onerror = function () {
          reader.abort();
          reject(new DOMException('Problem parsing input file'));
        };
        reader.onload = function () {
          resolve(reader.result);
        };
        reader.readAsText(file);
      });
    }
    function populateLineSelect() {
      var colorLineSelect = document.getElementById('colorLineSelect');
      var sortLineSelect = document.getElementById('sortLineSelect');
      var optList = dataSet.germplasmList.slice(); // Shallow copy
      optList.sort(function (a, b) {
        return a.name < b.name ? -1 : a.name > b.name ? 1 : 0;
      }); // Alphabetic sort
      optList.forEach(function (germplasm) {
        var opt = document.createElement('option');
        opt.value = germplasm.name;
        opt.text = germplasm.name;
        colorLineSelect.add(opt);
        sortLineSelect.add(opt.cloneNode(true));
      });
    }
    function populateTraitSelect() {
      var sortTraitSelect = document.getElementById('sortTraitSelect');
      var displayTraitSelect = document.getElementById('displayTraitSelect');
      dataSet.traitNames.forEach(function (name) {
        var opt = document.createElement('option');
        opt.value = name;
        opt.text = name;
        sortTraitSelect.add(opt);
        var clone = opt.cloneNode(true);
        clone.selected = true;
        displayTraitSelect.add(clone);
      });
    }
    function populateChromosomeSelect() {
      var chromosomeSelect = document.getElementById('chromosomeSelect');
      dataSet.genomeMap.chromosomes.forEach(function (chromosome, index) {
        var opt = document.createElement('option');
        opt.value = index;
        opt.text = chromosome.name;
        opt.selected = true;
        chromosomeSelect.add(opt);
      });
      chromosomeSelect.selectedIndex = 0;
    }
    genotypeRenderer.renderGenotypesFile = function renderGenotypesFile(config,
    // domParent in positional
    // Old positional arguments, kept for backwards compatibility
    width, height, mapFileDom, genotypeFileDom, overviewWidth, overviewHeight, minGenotypeAutoWidth, minOverviewAutoWidth) {
      if (!(config instanceof Object)) {
        config = {
          domParent: config,
          // Position for domParent
          mapFileDom: mapFileDom,
          genotypeFileDom: genotypeFileDom,
          minGenotypeAutoWidth: minGenotypeAutoWidth,
          minOverviewAutoWidth: minOverviewAutoWidth
        };
        config.width = width !== undefined ? width : null;
        config.height = height !== undefined ? height : 600;
        config.overviewWidth = overviewWidth !== undefined ? overviewWidth : config.width;
        config.overviewHeight = overviewHeight !== undefined ? overviewHeight : 200;
      }
      clearParent(config.domParent);
      createRendererComponents(config, true);
      // let qtls = [];
      var germplasmData;
      setProgressBarLabel("Loading file contents...");
      var loadingPromises = [];
      if (config.mapFileDom !== undefined) {
        var mapFile = document.getElementById(config.mapFileDom.replace('#', '')).files[0];
        var mapPromise = loadFromFile(mapFile);

        // Load map data
        mapPromise = mapPromise.then(function (result) {
          var mapImporter = new MapImporter();
          genomeMap = mapImporter.parseFile(result);
        })["catch"](function (reason) {
          console.error(reason);
          genomeMap = undefined;
        });
        loadingPromises.push(mapPromise);
      }
      if (config.phenotypeFileDom !== undefined) {
        var phenotypeFile = document.getElementById(config.phenotypeFileDom.replace('#', '')).files[0];
        var phenotypePromise = loadFromFile(phenotypeFile);

        // Load phenotype data
        phenotypePromise = phenotypePromise.then(function (result) {
          var phenotypeImporter = new PhenotypeImporter();
          phenotypes = phenotypeImporter.parseFile(result);
          traits = phenotypeImporter.traits;
        })["catch"](function (reason) {
          console.error(reason, reason.name);
          phenotypes = undefined;
          traits = undefined;
        });
        loadingPromises.push(phenotypePromise);
      }

      // const qtlPromise = loadFromFile(qtlFileDom);
      var genotypeFile = document.getElementById(config.genotypeFileDom.replace('#', '')).files[0];
      var genotypePromise = loadFromFile(genotypeFile);
      loadingPromises.push(genotypePromise);

      // // Then QTL data
      // qtlPromise.then((result) => {
      //   const qtlImporter = new QtlImporter();
      //   qtlImporter.parseFile(result);
      //   qtls = qtlImporter.qtls;
      // });

      // Then genotype data
      // Must be executed after the map file has been parsed *and* the genotype file has been read
      Promise.all(loadingPromises).then(function (results) {
        var result = results[results.length - 1]; // The genotype promise is last
        genotypeImporter = new GenotypeImporter(genomeMap);
        if (genomeMap === undefined) {
          genomeMap = genotypeImporter.createFakeMap(result);
        }
        setProgressBarLabel("Processing genotypes...");
        setAdvancement(0);
        genotypeImporter.parseFile(result, setAdvancement, removeAdvancement).then(function (germplasmList) {
          germplasmData = germplasmList;
          var _genotypeImporter4 = genotypeImporter,
            stateTable = _genotypeImporter4.stateTable;
          var dataSetId = config.dataSetId === undefined ? genotypeFile.name : config.dataSetId;
          dataSet = new DataSet(dataSetId, genomeMap, germplasmData, stateTable, traits, phenotypes);
          populateLineSelect();
          if (phenotypes !== undefined) populateTraitSelect();
          populateChromosomeSelect();
          canvasController.init(dataSet);

          // Tells the dom parent that Flapjack has finished loading. Allows spinners
          // or similar to be disabled
          sendEvent('FlapjackFinished', config.domParent);
        });
      });
      return genotypeRenderer;
    };
    genotypeRenderer.getRenderingProgressPercentage = function getRenderingProgressPercentage() {
      return genotypeImporter == null ? -1 : genotypeImporter.getImportProgressPercentage();
    };
    return genotypeRenderer;
  }

  return GenotypeRenderer;

})));
