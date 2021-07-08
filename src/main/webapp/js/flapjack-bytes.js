(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global = global || self, global.GenotypeRenderer = factory());
}(this, (function () { 'use strict';

  function _typeof(obj) {
    if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") {
      _typeof = function (obj) {
        return typeof obj;
      };
    } else {
      _typeof = function (obj) {
        return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
      };
    }

    return _typeof(obj);
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
    return Constructor;
  }

  function _toConsumableArray(arr) {
    return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _nonIterableSpread();
  }

  function _arrayWithoutHoles(arr) {
    if (Array.isArray(arr)) {
      for (var i = 0, arr2 = new Array(arr.length); i < arr.length; i++) arr2[i] = arr[i];

      return arr2;
    }
  }

  function _iterableToArray(iter) {
    if (Symbol.iterator in Object(iter) || Object.prototype.toString.call(iter) === "[object Arguments]") return Array.from(iter);
  }

  function _nonIterableSpread() {
    throw new TypeError("Invalid attempt to spread non-iterable instance");
  }

  var bind = function bind(fn, thisArg) {
    return function wrap() {
      var args = new Array(arguments.length);
      for (var i = 0; i < args.length; i++) {
        args[i] = arguments[i];
      }
      return fn.apply(thisArg, args);
    };
  };

  /*!
   * Determine if an object is a Buffer
   *
   * @author   Feross Aboukhadijeh <https://feross.org>
   * @license  MIT
   */

  var isBuffer = function isBuffer (obj) {
    return obj != null && obj.constructor != null &&
      typeof obj.constructor.isBuffer === 'function' && obj.constructor.isBuffer(obj)
  };

  /*global toString:true*/

  // utils is a library of generic helper functions non-specific to axios

  var toString = Object.prototype.toString;

  /**
   * Determine if a value is an Array
   *
   * @param {Object} val The value to test
   * @returns {boolean} True if value is an Array, otherwise false
   */
  function isArray(val) {
    return toString.call(val) === '[object Array]';
  }

  /**
   * Determine if a value is an ArrayBuffer
   *
   * @param {Object} val The value to test
   * @returns {boolean} True if value is an ArrayBuffer, otherwise false
   */
  function isArrayBuffer(val) {
    return toString.call(val) === '[object ArrayBuffer]';
  }

  /**
   * Determine if a value is a FormData
   *
   * @param {Object} val The value to test
   * @returns {boolean} True if value is an FormData, otherwise false
   */
  function isFormData(val) {
    return (typeof FormData !== 'undefined') && (val instanceof FormData);
  }

  /**
   * Determine if a value is a view on an ArrayBuffer
   *
   * @param {Object} val The value to test
   * @returns {boolean} True if value is a view on an ArrayBuffer, otherwise false
   */
  function isArrayBufferView(val) {
    var result;
    if ((typeof ArrayBuffer !== 'undefined') && (ArrayBuffer.isView)) {
      result = ArrayBuffer.isView(val);
    } else {
      result = (val) && (val.buffer) && (val.buffer instanceof ArrayBuffer);
    }
    return result;
  }

  /**
   * Determine if a value is a String
   *
   * @param {Object} val The value to test
   * @returns {boolean} True if value is a String, otherwise false
   */
  function isString(val) {
    return typeof val === 'string';
  }

  /**
   * Determine if a value is a Number
   *
   * @param {Object} val The value to test
   * @returns {boolean} True if value is a Number, otherwise false
   */
  function isNumber(val) {
    return typeof val === 'number';
  }

  /**
   * Determine if a value is undefined
   *
   * @param {Object} val The value to test
   * @returns {boolean} True if the value is undefined, otherwise false
   */
  function isUndefined(val) {
    return typeof val === 'undefined';
  }

  /**
   * Determine if a value is an Object
   *
   * @param {Object} val The value to test
   * @returns {boolean} True if value is an Object, otherwise false
   */
  function isObject(val) {
    return val !== null && typeof val === 'object';
  }

  /**
   * Determine if a value is a Date
   *
   * @param {Object} val The value to test
   * @returns {boolean} True if value is a Date, otherwise false
   */
  function isDate(val) {
    return toString.call(val) === '[object Date]';
  }

  /**
   * Determine if a value is a File
   *
   * @param {Object} val The value to test
   * @returns {boolean} True if value is a File, otherwise false
   */
  function isFile(val) {
    return toString.call(val) === '[object File]';
  }

  /**
   * Determine if a value is a Blob
   *
   * @param {Object} val The value to test
   * @returns {boolean} True if value is a Blob, otherwise false
   */
  function isBlob(val) {
    return toString.call(val) === '[object Blob]';
  }

  /**
   * Determine if a value is a Function
   *
   * @param {Object} val The value to test
   * @returns {boolean} True if value is a Function, otherwise false
   */
  function isFunction(val) {
    return toString.call(val) === '[object Function]';
  }

  /**
   * Determine if a value is a Stream
   *
   * @param {Object} val The value to test
   * @returns {boolean} True if value is a Stream, otherwise false
   */
  function isStream(val) {
    return isObject(val) && isFunction(val.pipe);
  }

  /**
   * Determine if a value is a URLSearchParams object
   *
   * @param {Object} val The value to test
   * @returns {boolean} True if value is a URLSearchParams object, otherwise false
   */
  function isURLSearchParams(val) {
    return typeof URLSearchParams !== 'undefined' && val instanceof URLSearchParams;
  }

  /**
   * Trim excess whitespace off the beginning and end of a string
   *
   * @param {String} str The String to trim
   * @returns {String} The String freed of excess whitespace
   */
  function trim(str) {
    return str.replace(/^\s*/, '').replace(/\s*$/, '');
  }

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
   */
  function isStandardBrowserEnv() {
    if (typeof navigator !== 'undefined' && (navigator.product === 'ReactNative' ||
                                             navigator.product === 'NativeScript' ||
                                             navigator.product === 'NS')) {
      return false;
    }
    return (
      typeof window !== 'undefined' &&
      typeof document !== 'undefined'
    );
  }

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
   */
  function forEach(obj, fn) {
    // Don't bother if no value provided
    if (obj === null || typeof obj === 'undefined') {
      return;
    }

    // Force an array if not already something iterable
    if (typeof obj !== 'object') {
      /*eslint no-param-reassign:0*/
      obj = [obj];
    }

    if (isArray(obj)) {
      // Iterate over array values
      for (var i = 0, l = obj.length; i < l; i++) {
        fn.call(null, obj[i], i, obj);
      }
    } else {
      // Iterate over object keys
      for (var key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
          fn.call(null, obj[key], key, obj);
        }
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
   * @returns {Object} Result of all merge properties
   */
  function merge(/* obj1, obj2, obj3, ... */) {
    var result = {};
    function assignValue(val, key) {
      if (typeof result[key] === 'object' && typeof val === 'object') {
        result[key] = merge(result[key], val);
      } else {
        result[key] = val;
      }
    }

    for (var i = 0, l = arguments.length; i < l; i++) {
      forEach(arguments[i], assignValue);
    }
    return result;
  }

  /**
   * Function equal to merge with the difference being that no reference
   * to original objects is kept.
   *
   * @see merge
   * @param {Object} obj1 Object to merge
   * @returns {Object} Result of all merge properties
   */
  function deepMerge(/* obj1, obj2, obj3, ... */) {
    var result = {};
    function assignValue(val, key) {
      if (typeof result[key] === 'object' && typeof val === 'object') {
        result[key] = deepMerge(result[key], val);
      } else if (typeof val === 'object') {
        result[key] = deepMerge({}, val);
      } else {
        result[key] = val;
      }
    }

    for (var i = 0, l = arguments.length; i < l; i++) {
      forEach(arguments[i], assignValue);
    }
    return result;
  }

  /**
   * Extends object a by mutably adding to it the properties of object b.
   *
   * @param {Object} a The object to be extended
   * @param {Object} b The object to copy properties from
   * @param {Object} thisArg The object to bind function to
   * @return {Object} The resulting value of object a
   */
  function extend(a, b, thisArg) {
    forEach(b, function assignValue(val, key) {
      if (thisArg && typeof val === 'function') {
        a[key] = bind(val, thisArg);
      } else {
        a[key] = val;
      }
    });
    return a;
  }

  var utils = {
    isArray: isArray,
    isArrayBuffer: isArrayBuffer,
    isBuffer: isBuffer,
    isFormData: isFormData,
    isArrayBufferView: isArrayBufferView,
    isString: isString,
    isNumber: isNumber,
    isObject: isObject,
    isUndefined: isUndefined,
    isDate: isDate,
    isFile: isFile,
    isBlob: isBlob,
    isFunction: isFunction,
    isStream: isStream,
    isURLSearchParams: isURLSearchParams,
    isStandardBrowserEnv: isStandardBrowserEnv,
    forEach: forEach,
    merge: merge,
    deepMerge: deepMerge,
    extend: extend,
    trim: trim
  };

  function encode(val) {
    return encodeURIComponent(val).
      replace(/%40/gi, '@').
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
   * @returns {string} The formatted url
   */
  var buildURL = function buildURL(url, params, paramsSerializer) {
    /*eslint no-param-reassign:0*/
    if (!params) {
      return url;
    }

    var serializedParams;
    if (paramsSerializer) {
      serializedParams = paramsSerializer(params);
    } else if (utils.isURLSearchParams(params)) {
      serializedParams = params.toString();
    } else {
      var parts = [];

      utils.forEach(params, function serialize(val, key) {
        if (val === null || typeof val === 'undefined') {
          return;
        }

        if (utils.isArray(val)) {
          key = key + '[]';
        } else {
          val = [val];
        }

        utils.forEach(val, function parseValue(v) {
          if (utils.isDate(v)) {
            v = v.toISOString();
          } else if (utils.isObject(v)) {
            v = JSON.stringify(v);
          }
          parts.push(encode(key) + '=' + encode(v));
        });
      });

      serializedParams = parts.join('&');
    }

    if (serializedParams) {
      var hashmarkIndex = url.indexOf('#');
      if (hashmarkIndex !== -1) {
        url = url.slice(0, hashmarkIndex);
      }

      url += (url.indexOf('?') === -1 ? '?' : '&') + serializedParams;
    }

    return url;
  };

  function InterceptorManager() {
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
  InterceptorManager.prototype.use = function use(fulfilled, rejected) {
    this.handlers.push({
      fulfilled: fulfilled,
      rejected: rejected
    });
    return this.handlers.length - 1;
  };

  /**
   * Remove an interceptor from the stack
   *
   * @param {Number} id The ID that was returned by `use`
   */
  InterceptorManager.prototype.eject = function eject(id) {
    if (this.handlers[id]) {
      this.handlers[id] = null;
    }
  };

  /**
   * Iterate over all the registered interceptors
   *
   * This method is particularly useful for skipping over any
   * interceptors that may have become `null` calling `eject`.
   *
   * @param {Function} fn The function to call for each interceptor
   */
  InterceptorManager.prototype.forEach = function forEach(fn) {
    utils.forEach(this.handlers, function forEachHandler(h) {
      if (h !== null) {
        fn(h);
      }
    });
  };

  var InterceptorManager_1 = InterceptorManager;

  /**
   * Transform the data for a request or a response
   *
   * @param {Object|String} data The data to be transformed
   * @param {Array} headers The headers for the request or response
   * @param {Array|Function} fns A single function or Array of functions
   * @returns {*} The resulting transformed data
   */
  var transformData = function transformData(data, headers, fns) {
    /*eslint no-param-reassign:0*/
    utils.forEach(fns, function transform(fn) {
      data = fn(data, headers);
    });

    return data;
  };

  var isCancel = function isCancel(value) {
    return !!(value && value.__CANCEL__);
  };

  var normalizeHeaderName = function normalizeHeaderName(headers, normalizedName) {
    utils.forEach(headers, function processHeader(value, name) {
      if (name !== normalizedName && name.toUpperCase() === normalizedName.toUpperCase()) {
        headers[normalizedName] = value;
        delete headers[name];
      }
    });
  };

  /**
   * Update an Error with the specified config, error code, and response.
   *
   * @param {Error} error The error to update.
   * @param {Object} config The config.
   * @param {string} [code] The error code (for example, 'ECONNABORTED').
   * @param {Object} [request] The request.
   * @param {Object} [response] The response.
   * @returns {Error} The error.
   */
  var enhanceError = function enhanceError(error, config, code, request, response) {
    error.config = config;
    if (code) {
      error.code = code;
    }

    error.request = request;
    error.response = response;
    error.isAxiosError = true;

    error.toJSON = function() {
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
        code: this.code
      };
    };
    return error;
  };

  /**
   * Create an Error with the specified message, config, error code, request and response.
   *
   * @param {string} message The error message.
   * @param {Object} config The config.
   * @param {string} [code] The error code (for example, 'ECONNABORTED').
   * @param {Object} [request] The request.
   * @param {Object} [response] The response.
   * @returns {Error} The created error.
   */
  var createError = function createError(message, config, code, request, response) {
    var error = new Error(message);
    return enhanceError(error, config, code, request, response);
  };

  /**
   * Resolve or reject a Promise based on response status.
   *
   * @param {Function} resolve A function that resolves the promise.
   * @param {Function} reject A function that rejects the promise.
   * @param {object} response The response.
   */
  var settle = function settle(resolve, reject, response) {
    var validateStatus = response.config.validateStatus;
    if (!validateStatus || validateStatus(response.status)) {
      resolve(response);
    } else {
      reject(createError(
        'Request failed with status code ' + response.status,
        response.config,
        null,
        response.request,
        response
      ));
    }
  };

  // Headers whose duplicates are ignored by node
  // c.f. https://nodejs.org/api/http.html#http_message_headers
  var ignoreDuplicateOf = [
    'age', 'authorization', 'content-length', 'content-type', 'etag',
    'expires', 'from', 'host', 'if-modified-since', 'if-unmodified-since',
    'last-modified', 'location', 'max-forwards', 'proxy-authorization',
    'referer', 'retry-after', 'user-agent'
  ];

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
   * @param {String} headers Headers needing to be parsed
   * @returns {Object} Headers parsed into an object
   */
  var parseHeaders = function parseHeaders(headers) {
    var parsed = {};
    var key;
    var val;
    var i;

    if (!headers) { return parsed; }

    utils.forEach(headers.split('\n'), function parser(line) {
      i = line.indexOf(':');
      key = utils.trim(line.substr(0, i)).toLowerCase();
      val = utils.trim(line.substr(i + 1));

      if (key) {
        if (parsed[key] && ignoreDuplicateOf.indexOf(key) >= 0) {
          return;
        }
        if (key === 'set-cookie') {
          parsed[key] = (parsed[key] ? parsed[key] : []).concat([val]);
        } else {
          parsed[key] = parsed[key] ? parsed[key] + ', ' + val : val;
        }
      }
    });

    return parsed;
  };

  var isURLSameOrigin = (
    utils.isStandardBrowserEnv() ?

    // Standard browser envs have full support of the APIs needed to test
    // whether the request URL is of the same origin as current location.
      (function standardBrowserEnv() {
        var msie = /(msie|trident)/i.test(navigator.userAgent);
        var urlParsingNode = document.createElement('a');
        var originURL;

        /**
      * Parse a URL to discover it's components
      *
      * @param {String} url The URL to be parsed
      * @returns {Object}
      */
        function resolveURL(url) {
          var href = url;

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
          var parsed = (utils.isString(requestURL)) ? resolveURL(requestURL) : requestURL;
          return (parsed.protocol === originURL.protocol &&
              parsed.host === originURL.host);
        };
      })() :

    // Non standard browser envs (web workers, react-native) lack needed support.
      (function nonStandardBrowserEnv() {
        return function isURLSameOrigin() {
          return true;
        };
      })()
  );

  var cookies = (
    utils.isStandardBrowserEnv() ?

    // Standard browser envs support document.cookie
      (function standardBrowserEnv() {
        return {
          write: function write(name, value, expires, path, domain, secure) {
            var cookie = [];
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
            var match = document.cookie.match(new RegExp('(^|;\\s*)(' + name + ')=([^;]*)'));
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
      })()
  );

  var xhr = function xhrAdapter(config) {
    return new Promise(function dispatchXhrRequest(resolve, reject) {
      var requestData = config.data;
      var requestHeaders = config.headers;

      if (utils.isFormData(requestData)) {
        delete requestHeaders['Content-Type']; // Let the browser set it
      }

      var request = new XMLHttpRequest();

      // HTTP basic authentication
      if (config.auth) {
        var username = config.auth.username || '';
        var password = config.auth.password || '';
        requestHeaders.Authorization = 'Basic ' + btoa(username + ':' + password);
      }

      request.open(config.method.toUpperCase(), buildURL(config.url, config.params, config.paramsSerializer), true);

      // Set the request timeout in MS
      request.timeout = config.timeout;

      // Listen for ready state
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

        // Prepare the response
        var responseHeaders = 'getAllResponseHeaders' in request ? parseHeaders(request.getAllResponseHeaders()) : null;
        var responseData = !config.responseType || config.responseType === 'text' ? request.responseText : request.response;
        var response = {
          data: responseData,
          status: request.status,
          statusText: request.statusText,
          headers: responseHeaders,
          config: config,
          request: request
        };

        settle(resolve, reject, response);

        // Clean up request
        request = null;
      };

      // Handle browser request cancellation (as opposed to a manual cancellation)
      request.onabort = function handleAbort() {
        if (!request) {
          return;
        }

        reject(createError('Request aborted', config, 'ECONNABORTED', request));

        // Clean up request
        request = null;
      };

      // Handle low level network errors
      request.onerror = function handleError() {
        // Real errors are hidden from us by the browser
        // onerror should only fire if it's a network error
        reject(createError('Network Error', config, null, request));

        // Clean up request
        request = null;
      };

      // Handle timeout
      request.ontimeout = function handleTimeout() {
        reject(createError('timeout of ' + config.timeout + 'ms exceeded', config, 'ECONNABORTED',
          request));

        // Clean up request
        request = null;
      };

      // Add xsrf header
      // This is only done if running in a standard browser environment.
      // Specifically not if we're in a web worker, or react-native.
      if (utils.isStandardBrowserEnv()) {
        var cookies$1 = cookies;

        // Add xsrf header
        var xsrfValue = (config.withCredentials || isURLSameOrigin(config.url)) && config.xsrfCookieName ?
          cookies$1.read(config.xsrfCookieName) :
          undefined;

        if (xsrfValue) {
          requestHeaders[config.xsrfHeaderName] = xsrfValue;
        }
      }

      // Add headers to the request
      if ('setRequestHeader' in request) {
        utils.forEach(requestHeaders, function setRequestHeader(val, key) {
          if (typeof requestData === 'undefined' && key.toLowerCase() === 'content-type') {
            // Remove Content-Type if data is undefined
            delete requestHeaders[key];
          } else {
            // Otherwise add header to the request
            request.setRequestHeader(key, val);
          }
        });
      }

      // Add withCredentials to request if needed
      if (config.withCredentials) {
        request.withCredentials = true;
      }

      // Add responseType to request if needed
      if (config.responseType) {
        try {
          request.responseType = config.responseType;
        } catch (e) {
          // Expected DOMException thrown by browsers not compatible XMLHttpRequest Level 2.
          // But, this can be suppressed for 'json' type as it can be parsed by default 'transformResponse' function.
          if (config.responseType !== 'json') {
            throw e;
          }
        }
      }

      // Handle progress if needed
      if (typeof config.onDownloadProgress === 'function') {
        request.addEventListener('progress', config.onDownloadProgress);
      }

      // Not all browsers support upload events
      if (typeof config.onUploadProgress === 'function' && request.upload) {
        request.upload.addEventListener('progress', config.onUploadProgress);
      }

      if (config.cancelToken) {
        // Handle cancellation
        config.cancelToken.promise.then(function onCanceled(cancel) {
          if (!request) {
            return;
          }

          request.abort();
          reject(cancel);
          // Clean up request
          request = null;
        });
      }

      if (requestData === undefined) {
        requestData = null;
      }

      // Send the request
      request.send(requestData);
    });
  };

  var DEFAULT_CONTENT_TYPE = {
    'Content-Type': 'application/x-www-form-urlencoded'
  };

  function setContentTypeIfUnset(headers, value) {
    if (!utils.isUndefined(headers) && utils.isUndefined(headers['Content-Type'])) {
      headers['Content-Type'] = value;
    }
  }

  function getDefaultAdapter() {
    var adapter;
    // Only Node.JS has a process variable that is of [[Class]] process
    if (typeof process !== 'undefined' && Object.prototype.toString.call(process) === '[object process]') {
      // For node use HTTP adapter
      adapter = xhr;
    } else if (typeof XMLHttpRequest !== 'undefined') {
      // For browsers use XHR adapter
      adapter = xhr;
    }
    return adapter;
  }

  var defaults = {
    adapter: getDefaultAdapter(),

    transformRequest: [function transformRequest(data, headers) {
      normalizeHeaderName(headers, 'Accept');
      normalizeHeaderName(headers, 'Content-Type');
      if (utils.isFormData(data) ||
        utils.isArrayBuffer(data) ||
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
        setContentTypeIfUnset(headers, 'application/x-www-form-urlencoded;charset=utf-8');
        return data.toString();
      }
      if (utils.isObject(data)) {
        setContentTypeIfUnset(headers, 'application/json;charset=utf-8');
        return JSON.stringify(data);
      }
      return data;
    }],

    transformResponse: [function transformResponse(data) {
      /*eslint no-param-reassign:0*/
      if (typeof data === 'string') {
        try {
          data = JSON.parse(data);
        } catch (e) { /* Ignore */ }
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

    validateStatus: function validateStatus(status) {
      return status >= 200 && status < 300;
    }
  };

  defaults.headers = {
    common: {
      'Accept': 'application/json, text/plain, */*'
    }
  };

  utils.forEach(['delete', 'get', 'head'], function forEachMethodNoData(method) {
    defaults.headers[method] = {};
  });

  utils.forEach(['post', 'put', 'patch'], function forEachMethodWithData(method) {
    defaults.headers[method] = utils.merge(DEFAULT_CONTENT_TYPE);
  });

  var defaults_1 = defaults;

  /**
   * Determines whether the specified URL is absolute
   *
   * @param {string} url The URL to test
   * @returns {boolean} True if the specified URL is absolute, otherwise false
   */
  var isAbsoluteURL = function isAbsoluteURL(url) {
    // A URL is considered absolute if it begins with "<scheme>://" or "//" (protocol-relative URL).
    // RFC 3986 defines scheme name as a sequence of characters beginning with a letter and followed
    // by any combination of letters, digits, plus, period, or hyphen.
    return /^([a-z][a-z\d\+\-\.]*:)?\/\//i.test(url);
  };

  /**
   * Creates a new URL by combining the specified URLs
   *
   * @param {string} baseURL The base URL
   * @param {string} relativeURL The relative URL
   * @returns {string} The combined URL
   */
  var combineURLs = function combineURLs(baseURL, relativeURL) {
    return relativeURL
      ? baseURL.replace(/\/+$/, '') + '/' + relativeURL.replace(/^\/+/, '')
      : baseURL;
  };

  /**
   * Throws a `Cancel` if cancellation has been requested.
   */
  function throwIfCancellationRequested(config) {
    if (config.cancelToken) {
      config.cancelToken.throwIfRequested();
    }
  }

  /**
   * Dispatch a request to the server using the configured adapter.
   *
   * @param {object} config The config that is to be used for the request
   * @returns {Promise} The Promise to be fulfilled
   */
  var dispatchRequest = function dispatchRequest(config) {
    throwIfCancellationRequested(config);

    // Support baseURL config
    if (config.baseURL && !isAbsoluteURL(config.url)) {
      config.url = combineURLs(config.baseURL, config.url);
    }

    // Ensure headers exist
    config.headers = config.headers || {};

    // Transform request data
    config.data = transformData(
      config.data,
      config.headers,
      config.transformRequest
    );

    // Flatten headers
    config.headers = utils.merge(
      config.headers.common || {},
      config.headers[config.method] || {},
      config.headers || {}
    );

    utils.forEach(
      ['delete', 'get', 'head', 'post', 'put', 'patch', 'common'],
      function cleanHeaderConfig(method) {
        delete config.headers[method];
      }
    );

    var adapter = config.adapter || defaults_1.adapter;

    return adapter(config).then(function onAdapterResolution(response) {
      throwIfCancellationRequested(config);

      // Transform response data
      response.data = transformData(
        response.data,
        response.headers,
        config.transformResponse
      );

      return response;
    }, function onAdapterRejection(reason) {
      if (!isCancel(reason)) {
        throwIfCancellationRequested(config);

        // Transform response data
        if (reason && reason.response) {
          reason.response.data = transformData(
            reason.response.data,
            reason.response.headers,
            config.transformResponse
          );
        }
      }

      return Promise.reject(reason);
    });
  };

  /**
   * Config-specific merge-function which creates a new config-object
   * by merging two configuration objects together.
   *
   * @param {Object} config1
   * @param {Object} config2
   * @returns {Object} New object resulting from merging config2 to config1
   */
  var mergeConfig = function mergeConfig(config1, config2) {
    // eslint-disable-next-line no-param-reassign
    config2 = config2 || {};
    var config = {};

    utils.forEach(['url', 'method', 'params', 'data'], function valueFromConfig2(prop) {
      if (typeof config2[prop] !== 'undefined') {
        config[prop] = config2[prop];
      }
    });

    utils.forEach(['headers', 'auth', 'proxy'], function mergeDeepProperties(prop) {
      if (utils.isObject(config2[prop])) {
        config[prop] = utils.deepMerge(config1[prop], config2[prop]);
      } else if (typeof config2[prop] !== 'undefined') {
        config[prop] = config2[prop];
      } else if (utils.isObject(config1[prop])) {
        config[prop] = utils.deepMerge(config1[prop]);
      } else if (typeof config1[prop] !== 'undefined') {
        config[prop] = config1[prop];
      }
    });

    utils.forEach([
      'baseURL', 'transformRequest', 'transformResponse', 'paramsSerializer',
      'timeout', 'withCredentials', 'adapter', 'responseType', 'xsrfCookieName',
      'xsrfHeaderName', 'onUploadProgress', 'onDownloadProgress', 'maxContentLength',
      'validateStatus', 'maxRedirects', 'httpAgent', 'httpsAgent', 'cancelToken',
      'socketPath'
    ], function defaultToConfig2(prop) {
      if (typeof config2[prop] !== 'undefined') {
        config[prop] = config2[prop];
      } else if (typeof config1[prop] !== 'undefined') {
        config[prop] = config1[prop];
      }
    });

    return config;
  };

  /**
   * Create a new instance of Axios
   *
   * @param {Object} instanceConfig The default config for the instance
   */
  function Axios(instanceConfig) {
    this.defaults = instanceConfig;
    this.interceptors = {
      request: new InterceptorManager_1(),
      response: new InterceptorManager_1()
    };
  }

  /**
   * Dispatch a request
   *
   * @param {Object} config The config specific for this request (merged with this.defaults)
   */
  Axios.prototype.request = function request(config) {
    /*eslint no-param-reassign:0*/
    // Allow for axios('example/url'[, config]) a la fetch API
    if (typeof config === 'string') {
      config = arguments[1] || {};
      config.url = arguments[0];
    } else {
      config = config || {};
    }

    config = mergeConfig(this.defaults, config);
    config.method = config.method ? config.method.toLowerCase() : 'get';

    // Hook up interceptors middleware
    var chain = [dispatchRequest, undefined];
    var promise = Promise.resolve(config);

    this.interceptors.request.forEach(function unshiftRequestInterceptors(interceptor) {
      chain.unshift(interceptor.fulfilled, interceptor.rejected);
    });

    this.interceptors.response.forEach(function pushResponseInterceptors(interceptor) {
      chain.push(interceptor.fulfilled, interceptor.rejected);
    });

    while (chain.length) {
      promise = promise.then(chain.shift(), chain.shift());
    }

    return promise;
  };

  Axios.prototype.getUri = function getUri(config) {
    config = mergeConfig(this.defaults, config);
    return buildURL(config.url, config.params, config.paramsSerializer).replace(/^\?/, '');
  };

  // Provide aliases for supported request methods
  utils.forEach(['delete', 'get', 'head', 'options'], function forEachMethodNoData(method) {
    /*eslint func-names:0*/
    Axios.prototype[method] = function(url, config) {
      return this.request(utils.merge(config || {}, {
        method: method,
        url: url
      }));
    };
  });

  utils.forEach(['post', 'put', 'patch'], function forEachMethodWithData(method) {
    /*eslint func-names:0*/
    Axios.prototype[method] = function(url, data, config) {
      return this.request(utils.merge(config || {}, {
        method: method,
        url: url,
        data: data
      }));
    };
  });

  var Axios_1 = Axios;

  /**
   * A `Cancel` is an object that is thrown when an operation is canceled.
   *
   * @class
   * @param {string=} message The message.
   */
  function Cancel(message) {
    this.message = message;
  }

  Cancel.prototype.toString = function toString() {
    return 'Cancel' + (this.message ? ': ' + this.message : '');
  };

  Cancel.prototype.__CANCEL__ = true;

  var Cancel_1 = Cancel;

  /**
   * A `CancelToken` is an object that can be used to request cancellation of an operation.
   *
   * @class
   * @param {Function} executor The executor function.
   */
  function CancelToken(executor) {
    if (typeof executor !== 'function') {
      throw new TypeError('executor must be a function.');
    }

    var resolvePromise;
    this.promise = new Promise(function promiseExecutor(resolve) {
      resolvePromise = resolve;
    });

    var token = this;
    executor(function cancel(message) {
      if (token.reason) {
        // Cancellation has already been requested
        return;
      }

      token.reason = new Cancel_1(message);
      resolvePromise(token.reason);
    });
  }

  /**
   * Throws a `Cancel` if cancellation has been requested.
   */
  CancelToken.prototype.throwIfRequested = function throwIfRequested() {
    if (this.reason) {
      throw this.reason;
    }
  };

  /**
   * Returns an object that contains a new `CancelToken` and a function that, when called,
   * cancels the `CancelToken`.
   */
  CancelToken.source = function source() {
    var cancel;
    var token = new CancelToken(function executor(c) {
      cancel = c;
    });
    return {
      token: token,
      cancel: cancel
    };
  };

  var CancelToken_1 = CancelToken;

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
   * @returns {Function}
   */
  var spread = function spread(callback) {
    return function wrap(arr) {
      return callback.apply(null, arr);
    };
  };

  /**
   * Create an instance of Axios
   *
   * @param {Object} defaultConfig The default config for the instance
   * @return {Axios} A new instance of Axios
   */
  function createInstance(defaultConfig) {
    var context = new Axios_1(defaultConfig);
    var instance = bind(Axios_1.prototype.request, context);

    // Copy axios.prototype to instance
    utils.extend(instance, Axios_1.prototype, context);

    // Copy context to instance
    utils.extend(instance, context);

    return instance;
  }

  // Create the default instance to be exported
  var axios = createInstance(defaults_1);

  // Expose Axios class to allow class inheritance
  axios.Axios = Axios_1;

  // Factory for creating new instances
  axios.create = function create(instanceConfig) {
    return createInstance(mergeConfig(axios.defaults, instanceConfig));
  };

  // Expose Cancel & CancelToken
  axios.Cancel = Cancel_1;
  axios.CancelToken = CancelToken_1;
  axios.isCancel = isCancel;

  // Expose all/spread
  axios.all = function all(promises) {
    return Promise.all(promises);
  };
  axios.spread = spread;

  var axios_1 = axios;

  // Allow use of default import syntax in TypeScript
  var default_1 = axios;
  axios_1.default = default_1;

  var axios$1 = axios_1;

  var ScrollBarWidget =
  /*#__PURE__*/
  function () {
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
        ctx.strokeStyle = '#aaa'; // Change origin and dimensions to match true size (a stroke makes the shape a bit larger)

        ctx.strokeRect(this.widgetX + this.corner_radius / 2, this.widgetY + this.corner_radius / 2, this.width - this.corner_radius, this.height - this.corner_radius);
        ctx.fillRect(this.widgetX + this.corner_radius / 2, this.widgetY + this.corner_radius / 2, this.width - this.corner_radius, this.height - this.corner_radius);
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

  var ScrollBar =
  /*#__PURE__*/
  function () {
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
      key: "move",
      value: function move(newX, newY) {
        this.widget.move(newX, newY);
      } // The width of the horizontal scrollbar can change depending on the width
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

  var NucleotideColorScheme =
  /*#__PURE__*/
  function () {
    function NucleotideColorScheme(dataSet) {
      _classCallCheck(this, NucleotideColorScheme);

      this.dataSet = dataSet;
      this.stateTable = this.dataSet.stateTable;
      this.colors = {
        greenLight: 'rgb(171,255,171)',
        greenDark: 'rgb(86,179,86)',
        redLight: 'rgb(255,171,171)',
        redDark: 'rgb(179,86,86)',
        blueLight: 'rgb(171,171,255)',
        blueDark: 'rgb(86,86,179)',
        orangeLight: 'rgb(255,228,171)',
        orangeDark: 'rgb(179,114,86)',
        white: 'rgb(255,255,255)',
        greyLight: 'rgb(210,210,210)',
        greyDark: 'rgb(192,192,192)'
      };
      this.colorMap = new Map();
      this.colorMap.set('A', {
        light: this.colors.greenLight,
        dark: this.colors.greenDark
      });
      this.colorMap.set('C', {
        light: this.colors.orangeLight,
        dark: this.colors.orangeDark
      });
      this.colorMap.set('G', {
        light: this.colors.redLight,
        dark: this.colors.redDark
      });
      this.colorMap.set('T', {
        light: this.colors.blueLight,
        dark: this.colors.blueDark
      });
      this.colorMap.set('', {
        light: this.colors.white,
        dark: this.colors.white
      });
      this.colorMap.set('-', {
        light: this.colors.greyLight,
        dark: this.colors.greyDark
      });
      this.colorMap.set('+', {
        light: this.colors.greyLight,
        dark: this.colors.greyDark
      });
      this.colorStamps = [];
    }

    _createClass(NucleotideColorScheme, [{
      key: "getState",
      value: function getState(germplasm, chromosome, marker) {
        var geno = this.dataSet.genotypeFor(germplasm, chromosome, marker);
        return this.colorStamps[geno];
      } // Generates a set of homozygous and heterozygous color stamps from the stateTable

    }, {
      key: "setupColorStamps",
      value: function setupColorStamps(size, font, fontSize) {
        var _this = this;

        this.colorStamps = [];
        this.stateTable.forEach(function (value, genotype) {
          var stamp;

          if (genotype.isHomozygous) {
            stamp = _this.drawGradientSquare(size, genotype, font, fontSize);
          } else {
            stamp = _this.drawHetSquare(size, genotype, font, fontSize);
          }

          _this.colorStamps.push(stamp);
        });
      }
    }, {
      key: "drawGradientSquare",
      value: function drawGradientSquare(size, genotype, font, fontSize) {
        var color = this.colorMap.get(genotype.allele1);
        var gradCanvas = document.createElement('canvas');
        gradCanvas.width = size;
        gradCanvas.height = size;
        var gradientCtx = gradCanvas.getContext('2d');
        var lingrad = gradientCtx.createLinearGradient(0, 0, size, size);
        lingrad.addColorStop(0, color.light);
        lingrad.addColorStop(1, color.dark);
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
        var color1 = this.colorMap.get(genotype.allele1);
        var color2 = this.colorMap.get(genotype.allele2);
        var gradCanvas = document.createElement('canvas');
        gradCanvas.width = size;
        gradCanvas.height = size;
        var gradientCtx = gradCanvas.getContext('2d');
        var lingrad = gradientCtx.createLinearGradient(0, 0, size, size);
        lingrad.addColorStop(0, color1.light);
        lingrad.addColorStop(1, color1.dark);
        gradientCtx.fillStyle = lingrad;
        gradientCtx.beginPath();
        gradientCtx.lineTo(size, 0);
        gradientCtx.lineTo(0, size);
        gradientCtx.lineTo(0, 0);
        gradientCtx.fill();
        var lingrad2 = gradientCtx.createLinearGradient(0, 0, size, size);
        lingrad2.addColorStop(0, color2.light);
        lingrad2.addColorStop(1, color2.dark);
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
    }]);

    return NucleotideColorScheme;
  }();

  var SimilarityColorScheme =
  /*#__PURE__*/
  function () {
    function SimilarityColorScheme(dataSet, compIndex) {
      _classCallCheck(this, SimilarityColorScheme);

      this.dataSet = dataSet;
      this.stateTable = this.dataSet.stateTable; // Line index of the line to be compared against

      this.compIndex = compIndex;
      this.colors = {
        compGreenLight: 'rgb(90,180,90)',
        compGreenDark: 'rgb(50,100,50)',
        greenLight: 'rgb(171,255,171)',
        greenDark: 'rgb(86,179,86)',
        redLight: 'rgb(255,171,171)',
        redDark: 'rgb(179,86,86)',
        white: 'rgb(255,255,255)',
        greyLight: 'rgb(210,210,210)',
        greyDark: 'rgb(192,192,192)'
      }; // These are the cases for establishing similarity to a given line

      this.misMatch = 0;
      this.compLine = 1;
      this.matchComp = 2;
      this.het1Match = 3;
      this.het2Match = 4;
      this.greyState = 5;
      var size = this.stateTable.size; // Create this lookup table once which establishes which class of color stamp
      // we should use for a given comparison between lines

      this.lookupTable = this.createLookupTable(size); // An array of color stamps for each class of comparison

      this.compStamps = [size];
      this.matchStamps = [size];
      this.misMatchStamps = [size];
      this.het1MatchStamps = [size];
      this.het2MatchStamps = [size];
      this.greyStamps = [size];
    }

    _createClass(SimilarityColorScheme, [{
      key: "createLookupTable",
      value: function createLookupTable(length) {
        var table = Array.from(Array(length), function () {
          return new Array(length);
        });
        var stateTableKeys = Array.from(this.stateTable.keys());

        for (var i = 0; i < length; i += 1) {
          for (var j = 0; j < length; j += 1) {
            // Default to misMatch
            table[i][j] = this.misMatch; // States match

            if (i === j) {
              table[i][j] = this.matchComp;
            } else {
              var iStateKey = stateTableKeys[i];
              var iStateValue = this.stateTable.get(iStateKey);
              var jStateKey = stateTableKeys[j];
              var jStateValue = this.stateTable.get(jStateKey); // Either state is missing

              if (iStateValue === 0 || jStateValue === 0) {
                table[i][j] = this.greyState; // Our state is homozygous and the comparison state is heterozygous 
              } else if (iStateKey.isHomozygous && !jStateKey.isHomozygous) {
                // if we match either allele in the comparison state give this the match class
                if (iStateKey.allele1 === jStateKey.allele1 || iStateKey.allele1 === jStateKey.allele2) {
                  table[i][j] = this.matchComp;
                } // Our state is het and comp state is homozygous

              } else if (!iStateKey.isHomozygous && jStateKey.isHomozygous) {
                // First allele matches
                if (iStateKey.allele1 === jStateKey.allele1 || iStateKey.allele1 === jStateKey.allele2) {
                  table[i][j] = this.het1Match; // Second allele matches
                } else if (iStateKey.allele2 === jStateKey.allele1 || iStateKey.allele2 === jStateKey.allele2) {
                  table[i][j] = this.het2Match;
                } // Neither state is homozygous

              } else if (!iStateKey.isHomozygous && !jStateKey.isHomozygous) {
                // First allele matches
                if (iStateKey.allele1 === jStateKey.allele1 || iStateKey.allele1 === jStateKey.allele2) {
                  table[i][j] = this.het1Match; // Second allele matches
                } else if (iStateKey.allele2 === jStateKey.allele1 || iStateKey.allele2 === jStateKey.allele2) {
                  table[i][j] = this.het2Match;
                }
              }
            }
          }
        }

        return table;
      }
    }, {
      key: "getState",
      value: function getState(germplasm, chromosome, marker) {
        var compState = this.dataSet.genotypeFor(this.compIndex, chromosome, marker);
        var genoState = this.dataSet.genotypeFor(germplasm, chromosome, marker);
        var stamp; // Use the lookup value to determine which class of color stamps we should
        // return

        var lookupValue = this.lookupTable[genoState][compState];

        if (this.compIndex === germplasm) {
          stamp = this.compStamps[genoState];
        } else if (lookupValue === this.misMatch) {
          stamp = this.misMatchStamps[genoState];
        } else if (lookupValue === this.compLine) {
          stamp = this.compStamps[genoState];
        } else if (lookupValue === this.matchComp) {
          stamp = this.matchStamps[genoState];
        } else if (lookupValue === this.het1Match) {
          stamp = this.het1MatchStamps[genoState];
        } else if (lookupValue === this.het2Match) {
          stamp = this.het2MatchStamps[genoState];
        } else if (lookupValue === this.greyState) {
          stamp = this.greyStamps[genoState];
        }

        return stamp;
      } // Generates a set of homozygous and heterozygous color stamps from the stateTable

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
            _this.compStamps[index] = _this.drawGradientSquare(size, genotype, font, fontSize, _this.colors.compGreenLight, _this.colors.compGreenDark);
            _this.matchStamps[index] = _this.drawGradientSquare(size, genotype, font, fontSize, _this.colors.greenLight, _this.colors.greenDark);
            _this.misMatchStamps[index] = _this.drawGradientSquare(size, genotype, font, fontSize, _this.colors.redLight, _this.colors.redDark);
            _this.greyStamps[index] = _this.drawGradientSquare(size, genotype, font, fontSize, _this.colors.greyLight, _this.colors.greyDark);
          } else {
            _this.compStamps[index] = _this.drawHetSquare(size, genotype, font, fontSize, _this.colors.compGreenLight, _this.colors.compGreenDark, _this.colors.compGreenLight, _this.colors.compGreenDark);
            _this.matchStamps[index] = _this.drawHetSquare(size, genotype, font, fontSize, _this.colors.greenLight, _this.colors.greenDark, _this.colors.greenLight, _this.colors.greenDark);
            _this.misMatchStamps[index] = _this.drawHetSquare(size, genotype, font, fontSize, _this.colors.redLight, _this.colors.redDark, _this.colors.redLight, _this.colors.redDark);
            _this.het1MatchStamps[index] = _this.drawHetSquare(size, genotype, font, fontSize, _this.colors.greenLight, _this.colors.greenDark, _this.colors.redLight, _this.colors.redDark);
            _this.het2MatchStamps[index] = _this.drawHetSquare(size, genotype, font, fontSize, _this.colors.redLight, _this.colors.redDark, _this.colors.greenLight, _this.colors.greenDark);
            _this.greyStamps[index] = _this.drawHetSquare(size, genotype, font, fontSize, _this.colors.greyLight, _this.colors.greyDark, _this.colors.greyLight, _this.colors.greyDark);
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
          colorLight = colorDark = this.colors.white;
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
          color1Light = color1Dark = color2Light = color2Dark = this.colors.white;
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

  var GenotypeCanvas =
  /*#__PURE__*/
  function () {
    function GenotypeCanvas(width, height, boxSize) {
      _classCallCheck(this, GenotypeCanvas);

      this.canvas = document.createElement('canvas');
      this.canvas.width = width;
      this.canvas.height = height;
      this.drawingContext = this.canvas.getContext('2d');
      this.backBuffer = document.createElement('canvas');
      this.backBuffer.width = width;
      this.backBuffer.height = height;
      this.backContext = this.backBuffer.getContext('2d');
      this.mapCanvasHeight = 60;
      this.nameCanvasWidth = 100;
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
      this.dataSet = undefined; // Visual start and end points for each chromosome

      this.chromosomeStarts = [];
      this.chromosomeEnds = [];
      this.chromosomeGapSize = 50;
      this.comparisonLineIndex = 0;
    }

    _createClass(GenotypeCanvas, [{
      key: "totalChromosomeGap",
      value: function totalChromosomeGap() {
        return (this.dataSet.genomeMap.chromosomes.length - 1) * this.chromosomeGapSize;
      }
    }, {
      key: "maxCanvasWidth",
      value: function maxCanvasWidth() {
        return Math.max(this.dataSet.markerCount() * this.boxSize + this.totalChromosomeGap(), this.alleleCanvasWidth());
      }
    }, {
      key: "maxCanvasHeight",
      value: function maxCanvasHeight() {
        return Math.max(this.dataSet.lineCount() * this.boxSize, this.alleleCanvasHeight());
      }
    }, {
      key: "alleleCanvasWidth",
      value: function alleleCanvasWidth() {
        return this.canvas.width - this.nameCanvasWidth - this.scrollbarWidth;
      }
    }, {
      key: "alleleCanvasHeight",
      value: function alleleCanvasHeight() {
        return this.canvas.height - this.mapCanvasHeight - this.scrollbarHeight;
      }
    }, {
      key: "maxDataHeight",
      value: function maxDataHeight() {
        return this.dataSet.lineCount() * this.boxSize;
      }
    }, {
      key: "maxDataWidth",
      value: function maxDataWidth() {
        return this.dataSet.markerCount() * this.boxSize + (this.dataSet.chromosomeCount() - 1) * this.chromosomeGapSize;
      }
    }, {
      key: "chromosomeOffset",
      value: function chromosomeOffset(xPos) {
        var _this = this;

        var chromStart = 0;
        this.chromosomeEnds.forEach(function (end, index) {
          if (xPos > end) {
            chromStart = (index + 1) * _this.chromosomeGapSize;
          }
        });
        return chromStart;
      }
    }, {
      key: "chromosomeIndexFor",
      value: function chromosomeIndexFor(xPos) {
        var _this2 = this;

        var chrIndex = -1;
        this.chromosomeEnds.forEach(function (end, index) {
          var start = _this2.chromosomeStarts[index];

          if (xPos >= start && xPos <= end) {
            chrIndex = index;
          }
        });
        return chrIndex;
      }
    }, {
      key: "init",
      value: function init(dataSet, colorScheme) {
        this.dataSet = dataSet;
        this.colorScheme = colorScheme;
        this.font = this.updateFontSize();
        this.updateVisualPositions();
        this.colorScheme.setupColorStamps(this.boxSize, this.font, this.fontSize);
        this.zoom(this.boxSize);
      }
    }, {
      key: "prerender",
      value: function prerender(redraw) {
        this.drawingContext.clearRect(0, 0, this.canvas.width, this.canvas.height);

        if (redraw) {
          // We need to calculate an offset because the gaps between chromosomes
          // aren't part of the data model
          var dataWidth = Math.ceil(this.alleleCanvasWidth() / this.boxSize);
          var offset = this.chromosomeOffset(this.translatedX);
          var markerStart = Math.floor((this.translatedX - offset) / this.boxSize);
          var markerEnd = Math.min(markerStart + dataWidth, this.dataSet.markerCount());
          var germplasmStart = Math.floor(this.translatedY / this.boxSize);
          var germplasmEnd = Math.min(germplasmStart + Math.floor(this.canvas.height / this.boxSize), this.dataSet.lineCount());
          var yWiggle = this.translatedY - germplasmStart * this.boxSize;
          this.render(germplasmStart, germplasmEnd, markerStart, markerEnd, yWiggle);
        }

        this.drawingContext.drawImage(this.backBuffer, 0, 0);

        if (this.chromosomeUnderMouse !== -1) {
          this.renderCrosshair();
          this.highlightMarker();
          this.highlightLineName();
        }
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
      value: function highlightMarker() {
        var _this3 = this;

        var dataWidth = Math.ceil(this.alleleCanvasWidth() / this.boxSize);
        var offset = this.chromosomeOffset(this.translatedX);
        var markerStart = Math.floor((this.translatedX - offset) / this.boxSize);
        var markerEnd = Math.min(markerStart + dataWidth, this.dataSet.markerCount());
        var renderData = this.dataSet.markersToRender(markerStart, markerEnd);
        var chrStart = this.chromosomeStarts[this.chromosomeUnderMouse];
        var chrEnd = this.chromosomeEnds[this.chromosomeUnderMouse];
        var drawStart = chrStart - this.translatedX;
        var chromosome = this.dataSet.genomeMap.chromosomes[this.chromosomeUnderMouse];
        var potentialWidth = drawStart > 0 ? this.alleleCanvasWidth() - drawStart : this.alleleCanvasWidth();
        var chromosomeWidth = Math.min(chrEnd - this.translatedX, potentialWidth, chrEnd - chrStart);
        renderData.forEach(function (chr) {
          if (chr.chromosomeIndex === _this3.chromosomeUnderMouse && _this3.markerUnderMouse) {
            // The data array can have too many markers in it due to the gaps between
            // chromosomes, this is a fudge to ensure we don't try to draw too many markers
            var chromosomeMarkerWidth = Math.max(0, Math.floor(chromosomeWidth / _this3.boxSize));
            var dW = Math.min(chr.lastMarker - chr.firstMarker, chromosomeMarkerWidth);
            var firstMarkerPos = chromosome.markers[chr.firstMarker].position;
            var lastMarkerPos = chromosome.markers[chr.firstMarker + dW].position;
            var dist = lastMarkerPos - firstMarkerPos;
            var scaleFactor = chromosomeWidth / dist;

            _this3.highlightMarkerName(firstMarkerPos, scaleFactor, drawStart);

            _this3.drawingContext.save(); // Translate to the correct position to draw the map


            _this3.drawingContext.translate(_this3.nameCanvasWidth, 10);

            var xPos = drawStart + _this3.markerIndexUnderMouse * _this3.boxSize;
            xPos += _this3.boxSize / 2;
            _this3.drawingContext.strokeStyle = '#F00';

            _this3.renderMarker(_this3.drawingContext, _this3.markerUnderMouse, xPos, firstMarkerPos, scaleFactor, drawStart);

            _this3.drawingContext.restore();
          }
        });
      }
    }, {
      key: "highlightMarkerName",
      value: function highlightMarkerName(firstMarkerPos, scaleFactor, drawStart) {
        if (this.markerUnderMouse) {
          this.drawingContext.save();
          this.drawingContext.translate(this.nameCanvasWidth, 10);
          this.drawingContext.fillStyle = '#F00';
          this.drawingContext.font = this.markerNameFont;
          var xPos = this.calcMapMarkerPos(this.markerUnderMouse, firstMarkerPos, scaleFactor, drawStart);
          var text = "".concat(this.markerUnderMouse.name, " (").concat(this.markerUnderMouse.position, ")"); // Measure the text width so we can guarantee it doesn't get drawn off
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
      value: function highlightLineName() {
        if (this.lineUnderMouse) {
          this.drawingContext.save();
          this.drawingContext.translate(0, this.mapCanvasHeight); // Prevent line name under scrollbar being highlighted

          var region = new Path2D();
          var clipHeight = this.canScrollX() ? this.alleleCanvasHeight() : this.canvas.height;
          region.rect(0, 0, this.nameCanvasWidth, clipHeight);
          this.drawingContext.clip(region);
          this.drawingContext.fillStyle = '#F00';
          this.drawingContext.font = this.font;
          var germplasmStart = Math.floor(this.translatedY / this.boxSize);
          var yWiggle = this.translatedY - germplasmStart * this.boxSize;
          var yPos = this.lineUnderMouse * this.boxSize - yWiggle;
          var name = this.dataSet.germplasmList[this.lineIndexUnderMouse].name;
          var y = yPos + (this.boxSize - this.fontSize / 2);
          this.drawingContext.fillText(name, 0, y);
          this.drawingContext.restore();
        }
      }
    }, {
      key: "renderCrosshair",
      value: function renderCrosshair() {
        // Setup crosshair drawing parameters
        this.drawingContext.save();
        this.drawingContext.translate(this.nameCanvasWidth, this.mapCanvasHeight);
        this.drawingContext.globalAlpha = 0.4;
        this.drawingContext.fillStyle = '#fff'; // Clip the canvas to prevent over-drawing of the crosshair

        var region = new Path2D();
        region.rect(0, 0, this.alleleCanvasWidth(), this.alleleCanvasHeight());
        this.drawingContext.clip(region); // Render each element of the crosshair

        this.renderVerticalCrosshairLine();
        this.renderHorizontalCrosshairLine(); // Reset the drawing parameters for the rest of the render code

        this.drawingContext.translate(-this.nameCanvasWidth, -this.mapCanvasHeight);
        this.drawingContext.globalAlpha = 1;
        this.drawingContext.restore();
      }
    }, {
      key: "renderVerticalCrosshairLine",
      value: function renderVerticalCrosshairLine() {
        var chrStart = this.chromosomeStarts[this.chromosomeUnderMouse];
        var drawStart = chrStart - this.translatedX;
        var xPos = drawStart + this.markerIndexUnderMouse * this.boxSize;
        this.drawingContext.fillRect(xPos, 0, this.boxSize, this.alleleCanvasHeight());
      }
    }, {
      key: "renderHorizontalCrosshairLine",
      value: function renderHorizontalCrosshairLine() {
        var germplasmStart = Math.floor(this.translatedY / this.boxSize);
        var yWiggle = this.translatedY - germplasmStart * this.boxSize;
        var yPos = this.lineUnderMouse * this.boxSize - yWiggle;
        this.drawingContext.fillRect(0, yPos, this.alleleCanvasWidth(), this.boxSize);
      }
    }, {
      key: "render",
      value: function render(germplasmStart, germplasmEnd, markerStart, markerEnd, yWiggle) {
        this.backContext.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.renderMap(markerStart, markerEnd);
        this.renderGermplasmNames(germplasmStart, germplasmEnd, yWiggle);
        this.renderGermplasm(germplasmStart, germplasmEnd, markerStart, markerEnd, yWiggle);
        this.renderScrollbars();
      }
    }, {
      key: "renderMarker",
      value: function renderMarker(mapCanvas, marker, genoMarkerPos, firstMarkerPos, mapScaleFactor, drawStart) {
        var mapMarkerPos = this.calcMapMarkerPos(marker, firstMarkerPos, mapScaleFactor, drawStart); // console.log(drawStart, firstMarkerPos, marker.position, mapMarkerPos);

        mapCanvas.beginPath(); // Draw vertical line on top of map rectangle

        mapCanvas.moveTo(mapMarkerPos, 0);
        mapCanvas.lineTo(mapMarkerPos, 10); // Draw diagonal line to marker position on the genotype canvas

        mapCanvas.lineTo(genoMarkerPos, 30); // Draw a vertical line down to the genotype canvas

        mapCanvas.lineTo(genoMarkerPos, 40);
        mapCanvas.stroke();
      }
    }, {
      key: "renderMarkers",
      value: function renderMarkers(renderData) {
        var _this4 = this;

        renderData.forEach(function (chr) {
          var chrStart = _this4.chromosomeStarts[chr.chromosomeIndex];
          var chrEnd = _this4.chromosomeEnds[chr.chromosomeIndex];
          var drawStart = chrStart - _this4.translatedX;
          var chromosome = _this4.dataSet.genomeMap.chromosomes[chr.chromosomeIndex];
          var potentialWidth = drawStart > 0 ? _this4.alleleCanvasWidth() - drawStart : _this4.alleleCanvasWidth();
          var chromosomeWidth = Math.min(chrEnd - _this4.translatedX, potentialWidth, chrEnd - chrStart); // The data array can have too many markers in it due to the gaps between
          // chromosomes, this is a fudge to ensure we don't try to draw too many markers

          var chromosomeMarkerWidth = Math.max(0, Math.floor(chromosomeWidth / _this4.boxSize));
          var dataWidth = Math.min(chr.lastMarker - chr.firstMarker, chromosomeMarkerWidth);
          var firstMarkerPos = chromosome.markers[chr.firstMarker].position;
          var lastMarkerPos = chromosome.markers[chr.firstMarker + dataWidth].position;
          var dist = lastMarkerPos - firstMarkerPos;
          var scaleFactor = chromosomeWidth / dist;

          for (var markerIndex = chr.firstMarker; markerIndex <= chr.lastMarker; markerIndex += 1) {
            var marker = _this4.dataSet.genomeMap.chromosomes[chr.chromosomeIndex].markers[markerIndex];
            var xPos = drawStart + markerIndex * _this4.boxSize;
            xPos += _this4.boxSize / 2;

            _this4.renderMarker(_this4.backContext, marker, xPos, firstMarkerPos, scaleFactor, drawStart);
          }
        });
      }
    }, {
      key: "renderChromosomes",
      value: function renderChromosomes(chromosomeData) {
        var _this5 = this;

        chromosomeData.forEach(function (chr) {
          var chrStart = _this5.chromosomeStarts[chr.chromosomeIndex];
          var chrEnd = _this5.chromosomeEnds[chr.chromosomeIndex];
          var drawStart = chrStart - _this5.translatedX;

          _this5.backContext.strokeRect(drawStart, 1, chrEnd - chrStart, 10);
        });
      }
    }, {
      key: "renderMap",
      value: function renderMap(markerStart, markerEnd) {
        this.backContext.save(); // Set the line style for drawing the map and markers

        this.backContext.lineWidth = 1;
        this.backContext.strokeStyle = 'gray'; // Create a clipping region so that lineNames can't creep up above the line
        // name canvas

        var region = new Path2D();
        region.rect(this.nameCanvasWidth, 0, this.alleleCanvasWidth(), this.mapCanvasHeight);
        this.backContext.clip(region); // Translate to the correct position to draw the map

        this.backContext.translate(this.nameCanvasWidth, 10);
        var renderData = this.dataSet.markersToRender(markerStart, markerEnd);
        this.renderChromosomes(renderData);
        this.renderMarkers(renderData);
        this.backContext.restore();
      }
    }, {
      key: "renderGermplasmNames",
      value: function renderGermplasmNames(germplasmStart, germplasmEnd, yWiggle) {
        var _this6 = this;

        this.backContext.save(); // Create a clipping region so that lineNames can't creep up above the line
        // name canvas

        var region = new Path2D(); // We need to take account of the scrollbar potentially disappearing when
        //zoomed out

        var clipHeight = this.canScrollX() ? this.alleleCanvasHeight() : this.canvas.height;
        region.rect(0, this.mapCanvasHeight, this.nameCanvasWidth, clipHeight);
        this.backContext.clip(region);
        var lineNames = this.dataSet.germplasmFor(germplasmStart, germplasmEnd).map(function (germplasm) {
          return germplasm.name;
        });
        this.backContext.fillStyle = '#333';
        this.backContext.font = this.font;
        this.backContext.translate(0, this.mapCanvasHeight);
        lineNames.forEach(function (name, idx) {
          var y = idx * _this6.boxSize - yWiggle + (_this6.boxSize - _this6.fontSize / 2);

          _this6.backContext.fillText(name, 0, y);
        });
        this.backContext.restore();
      }
    }, {
      key: "renderGermplasm",
      value: function renderGermplasm(germplasmStart, germplasmEnd, markerStart, markerEnd, yWiggle) {
        var _this7 = this;

        this.backContext.save();
        var renderData = this.dataSet.markersToRender(markerStart, markerEnd); // Clip so that we can only draw into the region that is intended to be the
        // genotype canvas

        var region = new Path2D();
        region.rect(this.nameCanvasWidth, this.mapCanvasHeight, this.canvas.width, this.canvas.height);
        this.backContext.clip(region);
        this.backContext.translate(this.nameCanvasWidth, this.mapCanvasHeight);

        var _loop = function _loop(germplasm, line) {
          var yPos = line * _this7.boxSize - yWiggle;
          renderData.forEach(function (chr) {
            var chrStart = _this7.chromosomeStarts[chr.chromosomeIndex] - _this7.translatedX;

            for (var marker = chr.firstMarker; marker <= chr.lastMarker; marker += 1) {
              var xPos = chrStart + marker * _this7.boxSize;

              var stamp = _this7.colorScheme.getState(germplasm, chr.chromosomeIndex, marker);

              _this7.backContext.drawImage(stamp, xPos, yPos);
            }
          });
        };

        for (var germplasm = germplasmStart, line = 0; germplasm < germplasmEnd; germplasm += 1, line += 1) {
          _loop(germplasm, line);
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
          this.backContext.translate(this.nameCanvasWidth, 0);
          this.horizontalScrollbar.render(this.backContext);
        }

        this.backContext.restore();
        this.backContext.save();

        if (this.canScrollX() || this.canScrollY()) {
          this.backContext.translate(this.nameCanvasWidth, this.mapCanvasHeight);
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
      // We can only scroll horizontally if the render size of our data horizontally
      // is wider than the canvas itself
      value: function canScrollX() {
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
        var xScrollMax = this.maxCanvasWidth() - this.alleleCanvasWidth();

        if (this.canScrollX()) {
          this.translatedX -= diffX; // Prevent scrolling beyond start or end of data

          if (this.translatedX < 0) {
            this.translatedX = 0;
          } else if (this.translatedX >= xScrollMax) {
            this.translatedX = xScrollMax;
          }

          var scrollWidth = this.alleleCanvasWidth() - this.horizontalScrollbar.widget.width;
          var scrollX = Math.floor(this.mapToRange(this.translatedX, 0, xScrollMax, 0, scrollWidth));
          this.horizontalScrollbar.move(scrollX, this.horizontalScrollbar.y);
        }
      }
    }, {
      key: "moveY",
      value: function moveY(diffY) {
        var yScrollMax = this.maxCanvasHeight() - this.alleleCanvasHeight();

        if (this.canScrollY()) {
          this.translatedY -= diffY; // Prevent scrolling beyond start or end of data

          if (this.translatedY < 0) {
            this.translatedY = 0;
          } else if (this.translatedY >= yScrollMax) {
            this.translatedY = yScrollMax;
          }

          var scrollHeight = this.alleleCanvasHeight() - this.verticalScrollbar.widget.height;
          var scrollY = Math.floor(this.mapToRange(this.translatedY, 0, yScrollMax, 0, scrollHeight));
          this.verticalScrollbar.move(this.verticalScrollbar.x, scrollY);
        }
      }
    }, {
      key: "dragVerticalScrollbar",
      value: function dragVerticalScrollbar(y) {
        if (this.canScrollY()) {
          var yScrollMax = this.maxCanvasHeight() - this.alleleCanvasHeight();
          this.translatedY = y / this.verticalScrollbar.height * yScrollMax; // Prevent scrolling beyond start or end of data

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
      }
    }, {
      key: "dragHorizontalScrollbar",
      value: function dragHorizontalScrollbar(x) {
        if (this.canScrollX()) {
          var xScrollMax = this.maxCanvasWidth() - this.alleleCanvasWidth();
          this.translatedX = x / this.horizontalScrollbar.width * xScrollMax; // Prevent scrolling beyond start or end of data

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
      }
    }, {
      key: "move",
      value: function move(diffX, diffY) {
        this.moveX(diffX);
        this.moveY(diffY);
        this.prerender(true);
      }
    }, {
      key: "mouseOver",
      value: function mouseOver(x, y) {
        // We need to calculate an offset because the gaps between chromosomes
        // aren't part of the data model
        var mouseXPos = x - this.nameCanvasWidth;
        var mouseXPosCanvas = this.translatedX + mouseXPos;
        var mouseYPos = y - this.mapCanvasHeight;

        if (mouseXPos > 0 && mouseXPos < this.alleleCanvasWidth() && mouseXPos < this.maxDataWidth()) {
          // Calculate the marker's index in the dataset and get the marker data
          var offset = this.chromosomeOffset(mouseXPosCanvas);
          var markerIndex = Math.floor((this.translatedX - offset + mouseXPos) / this.boxSize);
          var marker = this.dataSet.markerAt(markerIndex);
          this.markerUnderMouse = marker.marker;
          this.markerIndexUnderMouse = marker.markerIndex;
        } else {
          this.markerUnderMouse = undefined;
          this.markerIndexUnderMouse = undefined;
          this.lineUnderMouse = undefined;
        } // Used as a flag to not render the crosshair when the mouse is between
        // chromosomes


        this.chromosomeUnderMouse = this.chromosomeIndexFor(mouseXPosCanvas);

        if (mouseYPos > 0 && mouseYPos < this.alleleCanvasHeight() && mouseYPos < this.maxDataHeight()) {
          this.lineUnderMouse = Math.max(0, Math.floor(mouseYPos / this.boxSize));
          this.lineIndexUnderMouse = this.lineUnderMouse + Math.floor(this.translatedY / this.boxSize);
        } else {
          this.markerUnderMouse = undefined;
          this.markerIndexUnderMouse = undefined;
          this.lineUnderMouse = undefined;
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
        fontContext.font = "".concat(this.fontSize, "px ").concat(fontface); // Iteratrively reduce the font size until the sample text fits in the
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
        var _this8 = this;

        // Find the longest germplasm name and adjust the width of the germplasm name
        // rendering area accordingly
        var germplasm = this.dataSet.germplasmList;
        var longestName = Math.max.apply(Math, _toConsumableArray(germplasm.map(function (g) {
          return _this8.backContext.measureText(g.name).width;
        })));
        this.nameCanvasWidth = longestName;
        this.horizontalScrollbar.updateWidth(this.alleleCanvasWidth());
      }
    }, {
      key: "updateVisualPositions",
      value: function updateVisualPositions() {
        var _this9 = this;

        this.chromosomeStarts = Array.from(this.dataSet.genomeMap.chromosomeStarts.values()).map(function (v, idx) {
          return v * _this9.boxSize + idx * _this9.chromosomeGapSize;
        });
        this.chromosomeEnds = [];
        this.dataSet.genomeMap.chromosomes.forEach(function (chr, idx) {
          _this9.chromosomeEnds.push(_this9.chromosomeStarts[idx] + chr.markerCount() * _this9.boxSize);
        });
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
      key: "zoom",
      value: function zoom(size) {
        this.boxSize = size;
        this.updateFontSize();
        this.colorScheme.setupColorStamps(this.boxSize, this.font, this.fontSize);
        this.updateCanvasWidths();
        this.updateVisualPositions();
        this.updateScrollBarSizes(); // If zooming out means the genotypes don't take up the full canvas, return
        // the display to its horizontal origin

        if (!this.canScrollX()) {
          this.translatedX = 0;
          this.horizontalScrollbar.move(0, this.horizontalScrollbar.y);
        } // If zooming out means the genotypes don't take up the full canvas, return
        // the display to its vertical origin


        if (!this.canScrollY()) {
          this.translatedY = 0;
          this.verticalScrollbar.move(this.verticalScrollbar.x, 0);
        }

        this.prerender(true);
      }
    }, {
      key: "setColorScheme",
      value: function setColorScheme(scheme) {
        if (scheme === 'nucleotideScheme') {
          this.colorScheme = new NucleotideColorScheme(this.dataSet);
          this.colorScheme.setupColorStamps(this.boxSize, this.font, this.fontSize);
          this.prerender(true);
        } else if (scheme === 'similarityScheme') {
          this.colorScheme = new SimilarityColorScheme(this.dataSet, this.comparisonLineIndex);
          this.colorScheme.setupColorStamps(this.boxSize, this.font, this.fontSize);
          this.prerender(true);
        }
      }
    }, {
      key: "setComparisonLineIndex",
      value: function setComparisonLineIndex(newIndex) {
        this.comparisonLineIndex = newIndex;
        this.colorScheme.setComparisonLineIndex(newIndex);
        this.prerender(true);
      } //   rainbowColor(numOfSteps, step) {
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

  var CanvasController =
  /*#__PURE__*/
  function () {
    function CanvasController(genotypeCanvas) {
      var _this = this;

      _classCallCheck(this, CanvasController);

      this.genotypeCanvas = genotypeCanvas;
      this.dragStartX = null;
      this.dragStartY = null;
      this.draggingCanvas = false;
      this.draggingVerticalScrollbar = false;
      this.draggingHorizontalScrollbar = false;
      this.contextMenuY = null;
      this.genotypeCanvas.canvas.addEventListener('mousedown', function (e) {
        // The following block of code is used to determine if we are scrolling
        // using the scrollbar widget, rather than grabbing the canvas
        var rect = _this.genotypeCanvas.canvas.getBoundingClientRect();

        var x = (e.clientX - rect.left) / (rect.right - rect.left) * _this.genotypeCanvas.backBuffer.width;
        var y = (e.clientY - rect.top) / (rect.bottom - rect.top) * _this.genotypeCanvas.backBuffer.height;
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
          _this.draggingCanvas = true;
        }
      });
      this.genotypeCanvas.canvas.addEventListener('mousemove', function (e) {
        var mousePos = _this.getCanvasMouseLocation(e.clientX, e.clientY);

        _this.genotypeCanvas.mouseOver(mousePos.x, mousePos.y);
      });
      this.genotypeCanvas.canvas.addEventListener('mouseleave', function () {
        _this.genotypeCanvas.mouseOver(undefined, undefined);
      });
      window.addEventListener('mouseup', function () {
        _this.draggingCanvas = false;
        _this.draggingVerticalScrollbar = false;
        _this.draggingHorizontalScrollbar = false;
      });
      window.addEventListener('mousemove', function (e) {
        if (_this.draggingVerticalScrollbar) {
          _this.dragVerticalScrollbar(e.clientY);
        } else if (_this.draggingHorizontalScrollbar) {
          _this.dragHorizontalScrollbar(e.clientX);
        } else if (_this.draggingCanvas) {
          _this.dragCanvas(e.pageX, e.pageY);
        }
      });
      var nucleotideRadio = document.getElementById('nucleotideScheme');
      nucleotideRadio.addEventListener('change', function () {
        var lineSelect = document.getElementById('lineSelect');
        lineSelect.disabled = true;

        _this.genotypeCanvas.setColorScheme('nucleotideScheme');
      });
      var similarityRadio = document.getElementById('similarityScheme');
      similarityRadio.addEventListener('change', function () {
        var lineSelect = document.getElementById('lineSelect');
        lineSelect.disabled = false;

        _this.genotypeCanvas.setColorScheme('similarityScheme');
      });
      var lineSelect = document.getElementById('lineSelect');
      lineSelect.addEventListener('change', function (event) {
        _this.genotypeCanvas.setComparisonLineIndex(event.target.selectedIndex);
      });
    }

    _createClass(CanvasController, [{
      key: "getCanvasMouseLocation",
      value: function getCanvasMouseLocation(clientX, clientY) {
        var rect = this.genotypeCanvas.canvas.getBoundingClientRect();
        var x = (clientX - rect.left) / (rect.right - rect.left) * this.genotypeCanvas.backBuffer.width;
        var y = (clientY - rect.top) / (rect.bottom - rect.top) * this.genotypeCanvas.backBuffer.height;
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
        var rectTop = rect.top + mapCanvasHeight; // Calculate the y coordinate of the mouse on the allele canvas

        var y = (clientY - rectTop) / (rect.bottom - rectTop) * alleleCanvasHeight; // Move the vertical scrollbar to coorodinate y

        this.genotypeCanvas.dragVerticalScrollbar(y);
      }
    }, {
      key: "dragHorizontalScrollbar",
      value: function dragHorizontalScrollbar(clientX) {
        // Grab various variables which allow us to calculate the x coordinate
        // relative to the allele canvas
        var rect = this.genotypeCanvas.canvas.getBoundingClientRect();
        var alleleCanvasWidth = this.genotypeCanvas.alleleCanvasWidth();
        var nameCanvasWidth = this.genotypeCanvas.nameCanvasWidth;
        var rectLeft = rect.left + nameCanvasWidth; // Calculate the x coordinate of the mouse on the allele canvas

        var x = (clientX - rectLeft) / (rect.right - rectLeft) * alleleCanvasWidth; // Move the vertical scrollbar to coorodinate x

        this.genotypeCanvas.dragHorizontalScrollbar(x);
      }
    }, {
      key: "dragCanvas",
      value: function dragCanvas(x, y) {
        var diffX = x - this.dragStartX;
        var diffY = y - this.dragStartY;
        this.dragStartX = x;
        this.dragStartY = y;
        this.genotypeCanvas.move(diffX, diffY);
      }
    }]);

    return CanvasController;
  }();

  var Genotype =
  /*#__PURE__*/
  function () {
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
      } // Factory method for creating Genotypes from string input, has a default
      // heterozygous genotype separator of /

    }], [{
      key: "fromString",
      value: function fromString(genotypeString) {
        var hetSeparator = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : '/';
        var upperCased = genotypeString.toUpperCase();
        var geno;

        if (upperCased.length === 3 && !upperCased.includes(hetSeparator)) {
          throw Error('Encounctered a string which could not be converted into a Genotype');
        }

        if (upperCased === '-' || upperCased === 'NN' || upperCased === 'N/N' || !upperCased || upperCased.length === 0) {
          geno = new Genotype('', '', true);
        } else if (upperCased.length === 1) {
          geno = new Genotype(upperCased, upperCased, true);
        } else if (upperCased.length === 2) {
          geno = new Genotype(upperCased[0], upperCased[1], upperCased[0] === upperCased[1]);
        } else if (upperCased.includes(hetSeparator)) {
          var alleles = upperCased.split(hetSeparator);
          geno = new Genotype(alleles[0], alleles[1], alleles[0] === alleles[1]);
        }

        return geno;
      }
    }]);

    return Genotype;
  }();

  var Germplasm = function Germplasm(name, genotypeData) {
    _classCallCheck(this, Germplasm);

    this.name = name;
    this.genotypeData = genotypeData;
  };

  var Marker = function Marker(name, chromosome, position) {
    _classCallCheck(this, Marker);

    this.name = name;
    this.chromosome = chromosome;
    this.position = position;
  };

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

  var GenomeMap =
  /*#__PURE__*/
  function () {
    function GenomeMap(chromosomes) {
      _classCallCheck(this, GenomeMap);

      this.chromosomes = chromosomes; // TODO: initialise this value

      this.intervalTree = this.createIntervalTree();
      this.chromosomeStarts = this.calculateChromosomeStarts();
      this.markerIndices = this.calculateMarkerIndices();
    } // Creates an interval tree where the key is the range of the start and end of
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
      key: "markerByName",
      value: function markerByName(markerName) {
        var found = -1;
        this.chromosomes.forEach(function (chromosome, idx) {
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

  var Chromosome =
  /*#__PURE__*/
  function () {
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

  var GenotypeImporter =
  /*#__PURE__*/
  function () {
    function GenotypeImporter(genomeMap) {
      _classCallCheck(this, GenotypeImporter);

      this.rawToGenoMap = new Map();
      this.rawToGenoMap.set('', Genotype.fromString(''));
      this.stateTable = new Map();
      this.stateTable.set(this.rawToGenoMap.get(''), 0);
      this.genomeMap = genomeMap;
      this.markerIndices = new Map();
      this.germplasmList = [];
    }

    _createClass(GenotypeImporter, [{
      key: "getState",
      value: function getState(genoString) {
        var index = 0;

        try {
          var genotype = this.rawToGenoMap.get(genoString);

          if (genotype === undefined) {
            genotype = Genotype.fromString(genoString);
            this.rawToGenoMap.set(genoString, genotype);
          }

          index = this.stateTable.get(genotype); // If the genotype is not found in the map, we have a new genotype, so set
          // its index in the map to the size of the map

          if (index === undefined) {
            index = this.stateTable.size;
            this.stateTable.set(genotype, index);
          }
        } catch (error) {
          console.log(error);
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
      value: function processFileLine(line) {
        var _this = this;

        if (line.startsWith('#') || !line || line.length === 0) {
          return;
        }

        if (line.startsWith('Accession') || line.startsWith('\t')) {
          var markerNames = line.split('\t');
          markerNames.slice(1).forEach(function (name, idx) {
            var indices = _this.genomeMap.markerByName(name);

            if (indices !== -1) {
              _this.markerIndices.set(idx, indices);
            }
          }); // TODO: write code to deal with cases where we don't have a map here...
          // console.log(this.genomeMap.totalMarkerCount());

          return;
        }

        var tokens = line.split('\t');
        var lineName = tokens[0];
        var genotypeData = this.initGenotypeData();
        tokens.slice(1).forEach(function (state, idx) {
          var indices = _this.markerIndices.get(idx); // console.log(indices);


          if (indices !== undefined && indices !== -1) {
            genotypeData[indices.chromosome][indices.markerIndex] = _this.getState(state);
          }
        });
        var germplasm = new Germplasm(lineName, genotypeData);
        this.germplasmList.push(germplasm);
      }
    }, {
      key: "parseFile",
      value: function parseFile(fileContents) {
        var lines = fileContents.split(/\r?\n/);

        for (var line = 0; line < lines.length; line += 1) {
          this.processFileLine(lines[line]);
        }

        return this.germplasmList;
      } // In situations where a map hasn't been provided, we want to create a fake or
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
                var markerNames = line.split('\t'); // Use the genotype data format's header line to map marker names to
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
      } // A method to create a fake map from BrAPI variantset calls

    }, {
      key: "createFakeMapFromVariantSets",
      value: function createFakeMapFromVariantSets(variantSetCalls) {
        var firstGenoName = variantSetCalls[0].callSetName;
        var firstGenoCalls = variantSetCalls.filter(function (v) {
          return v.callSetName === firstGenoName;
        }).map(function (v) {
          return v.markerName;
        }); // Make sure we only have unique markerNames

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
      } // A method which converts BrAPI variantSetsCalls into Flapjack genotypes for
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

  var MapImporter =
  /*#__PURE__*/
  function () {
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
        } // Only parse our default map file lines (i.e. not the special fixes for
        // exactly specifying the chromosome length)
        // http://flapjack.hutton.ac.uk/en/latest/projects_&_data_formats.html#data-sets-maps-and-genotypes


        var tokens = line.split('\t');

        if (tokens.length === 3) {
          var markerName = tokens[0];
          var chromosome = tokens[1];
          var pos = tokens[2]; // Keep track of the chromosomes that we've found

          this.chromosomeNames.add(chromosome); // Create a marker object and add it to our array of markers

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
          var chromosomeEnd = Math.max.apply(Math, _toConsumableArray(markerPositions));
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
      } // A method which converts BrAPI markerpositions into Flapjack markers for
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
            position = markerposition.position; // Keep track of the chromosomes that we've found

        this.chromosomeNames.add(chromosome); // Create a marker object and add it to our array of markers

        var marker = new Marker(name, chromosome, position);
        this.markerData.push(marker);
      }
    }]);

    return MapImporter;
  }();

  var DataSet =
  /*#__PURE__*/
  function () {
    function DataSet(genomeMap, germplasmList, stateTable) {
      _classCallCheck(this, DataSet);

      this.genomeMap = genomeMap;
      this.germplasmList = germplasmList;
      this.stateTable = stateTable;
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
      key: "markerAt",
      value: function markerAt(markerIndex) {
        return this.genomeMap.markerAt(markerIndex);
      }
    }, {
      key: "chromosomeCount",
      value: function chromosomeCount() {
        return this.genomeMap.chromosomes.length;
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
    }]);

    return DataSet;
  }();

  function GenotypeRenderer() {
    var genotypeRenderer = {}; // Variables for referring to the genotype canvas

    var genotypeCanvas; // TODO: need to investigate a proper clean way to implement this controller
    // functionality
    // eslint-disable-next-line no-unused-vars

    var canvasController;
    var boxSize = 16;
    var colorScheme;
    var genomeMap;
    var dataSet;

    function sendEvent(eventName, domParent) {
      // TODO: Invesitgate using older event emitting code for IE support
      var canvasHolder = document.getElementById(domParent.slice(1)); // Create the event.

      var event = new Event(eventName);
      canvasHolder.dispatchEvent(event);
    }

    function zoom(size) {
      genotypeCanvas.zoom(size, colorScheme);
    }

    function createRendererComponents(domParent, width, height) {
      var canvasHolder = document.getElementById(domParent.slice(1));
      genotypeCanvas = new GenotypeCanvas(width, height, boxSize);
      canvasHolder.append(genotypeCanvas.canvas);
      var zoomDiv = document.createElement('div');
      zoomDiv.id = 'zoom-holder';
      var form = document.createElement('form');
      var formRow = document.createElement('div');
      formRow.classList.add('row');
      var zoomCol = document.createElement('div');
      zoomCol.classList.add('col');
      var formZoomDiv = document.createElement('div');
      formZoomDiv.classList.add('form-group');
      var zoomFieldSet = document.createElement('fieldset');
      zoomFieldSet.classList.add('bytes-fieldset');
      var zoomLegend = document.createElement('legend');
      var zoomLegendText = document.createTextNode('Controls');
      zoomLegend.appendChild(zoomLegendText);
      var zoomLabel = document.createElement('label');
      zoomLabel.setAttribute('for', 'zoom-control');
      zoomLabel.innerHTML = 'Zoom:';
      var range = document.createElement('input');
      range.setAttribute('type', 'range');
      range.min = 2;
      range.max = 64;
      range.value = 16;
      range.addEventListener('change', function () {
        zoom(range.value);
      });
      range.addEventListener('input', function () {
        zoom(range.value);
      });
      var colorButton = document.createElement('button');
      colorButton.id = 'colorButton';
      var textnode = document.createTextNode('Color schemes...');
      colorButton.appendChild(textnode);
      var colorFieldSet = createColorSchemeFieldset();
      zoomFieldSet.appendChild(zoomLegend);
      zoomFieldSet.appendChild(zoomLabel);
      zoomFieldSet.appendChild(range);
      formZoomDiv.appendChild(zoomFieldSet);
      zoomCol.appendChild(formZoomDiv);
      formRow.appendChild(zoomCol);
      formRow.appendChild(colorFieldSet);
      form.appendChild(formRow);
      zoomDiv.appendChild(form);
      canvasHolder.appendChild(zoomDiv);
      addStyleSheet();
      canvasController = new CanvasController(genotypeCanvas);
    }

    function addRadioButton(name, id, text, checked, parent) {
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
      var labelText = document.createTextNode(text);
      radioLabel.appendChild(labelText);
      formCheck.appendChild(radio);
      formCheck.appendChild(radioLabel);
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
        var style = document.createElement("style"); // WebKit hack :(

        style.appendChild(document.createTextNode("")); // Add the <style> element to the page

        document.head.appendChild(style);
        return style.sheet;
      }();

      addCSSRule(sheet, '.bytes-fieldset > legend', 'border-style: none; border-width: 0; font-size: 14px; line-height: 20px; margin-bottom: 0; width: auto; padding: 0 10px; border: 1px solid #e0e0e0;');
      addCSSRule(sheet, '.bytes-fieldset', 'border: 1px solid #e0e0e0; padding: 10px;'); // addCSSRule(sheet, 'input', 'margin: .4rem;');
    }

    function createColorSchemeFieldset() {
      var formCol = document.createElement('div');
      formCol.classList.add('col');
      var formGroup = document.createElement('div');
      formGroup.classList.add('form-group');
      var fieldset = document.createElement('fieldset');
      fieldset.classList.add('bytes-fieldset');
      var legend = document.createElement('legend');
      var legendText = document.createTextNode('Color Schemes');
      legend.appendChild(legendText);
      var radioCol = document.createElement('div');
      radioCol.classList.add('col');
      addRadioButton('selectedScheme', 'nucleotideScheme', 'Nucleotide', true, radioCol);
      addRadioButton('selectedScheme', 'similarityScheme', 'Similarity to line', false, radioCol);
      var selectLabel = document.createElement('label');
      selectLabel.htmlFor = 'lineSelect';
      selectLabel.classList.add('col-form-label');
      var labelText = document.createTextNode('Comparison line:');
      selectLabel.appendChild(labelText);
      var lineSelect = document.createElement('select');
      lineSelect.id = 'lineSelect';
      lineSelect.disabled = true;
      fieldset.appendChild(legend);
      fieldset.appendChild(radioCol);
      fieldset.appendChild(selectLabel);
      fieldset.appendChild(lineSelect);
      formGroup.appendChild(fieldset);
      formCol.appendChild(formGroup);
      return formCol;
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

    genotypeRenderer.renderGenotypesBrapi = function renderGenotypesBrapi(domParent, width, height, server, matrixId, mapId, authToken) {
      createRendererComponents(domParent, width, height);
      var germplasmData;
      var client = axios$1.create({
        baseURL: server
      });
      client.defaults.headers.common.Authorization = "Bearer ".concat(authToken);

      if (mapId !== null) {
        // TODO: GOBii don't have the markerpositions call implemented yet so I
        // can't load map data
        processMarkerPositionsCall(client, "/markerpositions?mapDbId=".concat(mapId)).then(function (markerpositions) {
          var mapImporter = new MapImporter();
          genomeMap = mapImporter.parseMarkerpositions(markerpositions);
          processVariantSetCall(client, "/variantsets/".concat(matrixId, "/calls")).then(function (variantSetCalls) {
            var genotypeImporter = new GenotypeImporter(genomeMap);

            if (genomeMap === undefined) {
              genomeMap = genotypeImporter.createFakeMapFromVariantSets(variantSetCalls);
            }

            germplasmData = genotypeImporter.parseVariantSetCalls(variantSetCalls);
            var stateTable = genotypeImporter.stateTable;
            dataSet = new DataSet(genomeMap, germplasmData, stateTable);
            colorScheme = new NucleotideColorScheme(dataSet);
            populateLineSelect();
            genotypeCanvas.init(dataSet, colorScheme);
            genotypeCanvas.prerender(); // Tells the dom parent that Flapjack has finished loading. Allows spinners
            // or similar to be disabled

            sendEvent('FlapjackFinished', domParent);
          })["catch"](function (error) {
            sendEvent('FlapjackError', domParent); // eslint-disable-next-line no-console

            console.log(error);
          });
        })["catch"](function (error) {
          sendEvent('FlapjackError', domParent); // eslint-disable-next-line no-console

          console.log(error);
        });
      } else {
        processVariantSetCall(client, "/variantsets/".concat(matrixId, "/calls")).then(function (variantSetCalls) {
          var genotypeImporter = new GenotypeImporter(genomeMap);

          if (genomeMap === undefined) {
            genomeMap = genotypeImporter.createFakeMapFromVariantSets(variantSetCalls);
          }

          germplasmData = genotypeImporter.parseVariantSetCalls(variantSetCalls);
          var stateTable = genotypeImporter.stateTable;
          dataSet = new DataSet(genomeMap, germplasmData, stateTable);
          colorScheme = new NucleotideColorScheme(dataSet);
          populateLineSelect();
          genotypeCanvas.init(dataSet, colorScheme);
          genotypeCanvas.prerender(); // Tells the dom parent that Flapjack has finished loading. Allows spinners
          // or similar to be disabled

          sendEvent('FlapjackFinished', domParent);
        })["catch"](function (error) {
          sendEvent('FlapjackError', domParent); // eslint-disable-next-line no-console

          console.log(error);
        });
      }

      return genotypeRenderer;
    };

    genotypeRenderer.renderGenotypesUrl = function renderGenotypesUrl(domParent, width, height, mapFileURL, genotypeFileURL, authToken) {
      createRendererComponents(domParent, width, height);
      var mapFile;
      var genotypeFile;
      axios$1.get(mapFileURL, {}, {
        headers: {
          'Content-Type': 'text/plain'
        }
      }).then(function (response) {
        mapFile = response.data;
      })["catch"](function (error) {
        console.log(error);
      }).then(function () {
        if (mapFile !== undefined) {
          var mapImporter = new MapImporter();
          genomeMap = mapImporter.parseFile(mapFile);
        }

        axios$1.get(genotypeFileURL, {}, {
          headers: {
            'Content-Type': 'text/plain'
          }
        }).then(function (response) {
          genotypeFile = response.data;
        }).then(function () {
          var genotypeImporter = new GenotypeImporter(genomeMap);

          if (genomeMap === undefined) {
            genomeMap = genotypeImporter.createFakeMap(genotypeFile);
          }

          var germplasmData = genotypeImporter.parseFile(genotypeFile);
          var stateTable = genotypeImporter.stateTable;
          dataSet = new DataSet(genomeMap, germplasmData, stateTable);
          colorScheme = new NucleotideColorScheme(dataSet);
          populateLineSelect();
          genotypeCanvas.init(dataSet, colorScheme);
          genotypeCanvas.prerender();

          // Tells the dom parent that Flapjack has finished loading. Allows spinners
          // or similar to be disabled
          sendEvent('FlapjackFinished', domParent);
        }).catch((error) => {
            sendEvent('FlapjackError', domParent);
            // eslint-disable-next-line no-console
            console.log(error);
        });
      });
      return genotypeRenderer;
    };

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
      var lineSelect = document.getElementById('lineSelect');
      dataSet.germplasmList.forEach(function (germplasm, idx) {
        var opt = document.createElement('option');
        opt.value = idx;
        opt.text = germplasm.name;
        lineSelect.add(opt);
      });
    }

    genotypeRenderer.renderGenotypesFile = function renderGenotypesFile(domParent, width, height, mapFileDom, genotypeFileDom) {
      createRendererComponents(domParent, width, height); // let qtls = [];

      var germplasmData;
      var mapFile = document.getElementById(mapFileDom.slice(1)).files[0];
      var mapPromise = loadFromFile(mapFile); // const qtlPromise = loadFromFile(qtlFileDom);

      var genotypeFile = document.getElementById(genotypeFileDom.slice(1)).files[0];
      var genotypePromise = loadFromFile(genotypeFile); // Load map data

      mapPromise.then(function (result) {
        var mapImporter = new MapImporter();
        genomeMap = mapImporter.parseFile(result);
      }); // // Then QTL data
      // qtlPromise.then((result) => {
      //   const qtlImporter = new QtlImporter();
      //   qtlImporter.parseFile(result);
      //   qtls = qtlImporter.qtls;
      // });
      // Then genotype data

      genotypePromise.then(function (result) {
        var genotypeImporter = new GenotypeImporter(genomeMap);

        if (genomeMap === undefined) {
          genomeMap = genotypeImporter.createFakeMap(result);
        }

        germplasmData = genotypeImporter.parseFile(result);
        var stateTable = genotypeImporter.stateTable;
        dataSet = new DataSet(genomeMap, germplasmData, stateTable);
        colorScheme = new NucleotideColorScheme(dataSet);
        populateLineSelect();
        genotypeCanvas.init(dataSet, colorScheme);
        genotypeCanvas.prerender();
      });
      return genotypeRenderer;
    };

    return genotypeRenderer;
  }

  return GenotypeRenderer;

})));
