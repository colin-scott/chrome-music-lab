webpackJsonp([1],[
/* 0 */,
/* 1 */
/*!*****************************!*\
  !*** ./~/domready/ready.js ***!
  \*****************************/
/***/ (function(module, exports, __webpack_require__) {

	/*!
	  * domready (c) Dustin Diaz 2014 - License MIT
	  */
	!function (name, definition) {
	
	  if (true) module.exports = definition()
	  else if (typeof define == 'function' && typeof define.amd == 'object') define(definition)
	  else this[name] = definition()
	
	}('domready', function () {
	
	  var fns = [], listener
	    , doc = document
	    , hack = doc.documentElement.doScroll
	    , domContentLoaded = 'DOMContentLoaded'
	    , loaded = (hack ? /^loaded|^c/ : /^loaded|^i|^c/).test(doc.readyState)
	
	
	  if (!loaded)
	  doc.addEventListener(domContentLoaded, listener = function () {
	    doc.removeEventListener(domContentLoaded, listener)
	    loaded = 1
	    while (listener = fns.shift()) listener()
	  })
	
	  return function (fn) {
	    loaded ? setTimeout(fn, 0) : fns.push(fn)
	  }
	
	});


/***/ }),
/* 2 */
/*!****************************************!*\
  !*** ./app/interface/UserInterface.js ***!
  \****************************************/
/***/ (function(module, exports, __webpack_require__) {

	/**
	 * Copyright 2016 Google Inc.
	 *
	 * Licensed under the Apache License, Version 2.0 (the "License");
	 * you may not use this file except in compliance with the License.
	 * You may obtain a copy of the License at
	 *
	 *     http://www.apache.org/licenses/LICENSE-2.0
	 *
	 * Unless required by applicable law or agreed to in writing, software
	 * distributed under the License is distributed on an "AS IS" BASIS,
	 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
	 * See the License for the specific language governing permissions and
	 * limitations under the License.
	 */
	
	
	'use strict';
	
	// Events:
	// SpeedControllUpdate
	// Play
	// Pause
	// Resize
	// StartRecord
	// StopRecord
	var MathUtils = __webpack_require__(/*! util/MathUtils */ 3);
	var $ = __webpack_require__(/*! jquery */ 4);
	var controlsStyle = __webpack_require__(/*! controls.scss */ 5);
	var Slider = __webpack_require__(/*! interface/Slider */ 10);
	var OrientationChange = __webpack_require__(/*! interface/Orientation */ 15);
	
	module.exports = function(maxRecordTime, container) {
	
		var _self = this;
			_self.speedSlider 		= undefined;
			_self.bindings 			= {};
			_self.waveDisplayDrag 	= false;
			_self.needsUpdate 		= false;
			_self.ploc 				= undefined;
			_self.slideZeroLock		= 0.1;
			_self.smoothedRotation = 0;
	
		_self.init = function() {
			_self.attachControls();
			_self.attachEvents();
			//start the update
			_self.update();
		},
	
		_self.attachControls = function() {
			// _self.precisionSlider 	= $("#precisionSlider");
			_self.waveDisplay 	= $('<div>').prop('id', 'WaveDisplay').appendTo(container);
			_self.recordButton 	= $('<div>').prop('id', 'RecordButton').appendTo(_self.waveDisplay);
			//_self.recordButton.addClass("png_micpuppy");
	
			// _self.speedSliderContainer = $("<div>").prop("id", "SliderContainer").appendTo(container);
	
			// _self.speedSlider 	= $('<input>').prop('id', 'SpeedSlider').appendTo(_self.speedSliderContainer)
			// 	.prop("type", "range").prop("min", "-2").prop("max", 2).prop("step", "0.01").prop("value", 0);
	
			_self.speedSlider = new Slider(container, -2, 2, 0);
	
			_self.oreitnationListener = new OrientationChange(function(){
				_self.speedSlider.setValue(0);
				_self.doEvent('SpeedControllUpdate',0);
				_self.doEvent('EndWaveDrag');
			});
		},
	
		_self.disableRecording = function(callback) {
			_self.recordButton.addClass('disabled');
			//_self.recordButton.removeClass("icon-svg_record");
			//_self.recordButton.addClass("icon-svg_no_record");
			_self.recordButton.on("click", function(e){
				e.preventDefault();
				callback();
			});
		},
	
		_self.animateIn = function(callback) {
			_self.recordButton.addClass("Visible");
			_self.speedSlider.animateIn();
		},
	
		_self.stopRecording = function(){
			_self.recordButton.removeClass('recording');
		},
	
	
		_self.attachEvents = function() {
			_self.speedSlider.onchange = function(val){
				_self.doEvent('SpeedControllUpdate',val);
			};
	
			_self.recordButton.on("click", function(e){
				e.preventDefault();
				
				if(_self.recordButton.hasClass('disabled')) return false;
	
				if(_self.recordButton.hasClass('recording')){
					_self.doEvent('StopRecord',e);
					_self.stopRecording();
				}else{
					_self.doEvent('StartRecord',e);
					_self.recordButton.addClass('recording');
				}
				return false;
			}).on("mousedown touchstart", function(e){
				// e.preventDefault();
				e.stopPropagation();
			});
	
			/*_self.playButton.click(function(e){
				_self.doEvent('Play',e);
				_self.playButton.hide(0);
				_self.pauseButton.show(0);
				return false;
			});
			_self.pauseButton.click(function(e){
				_self.doEvent('Pause',e);
				_self.playButton.show(0);
				_self.pauseButton.hide(0);
				return false;
			});*/
	
			_self.waveDisplay.on("mousedown",_self.mouseDown);
			_self.waveDisplay.on("touchstart",_self.mouseDown);
			_self.waveDisplay.on("touchmove",_self.setMousePosition);
			$(window).on("mouseup",_self.mouseUp);
			$(window).on("touchend",_self.mouseUp);
	
			$(window).on("blur", function() {
	            _self.speedSlider.setValue(0);
	            _self.doEvent('SpeedControllUpdate', 0);
			});
			
			$(window).resize(function(e){
				_self.doEvent('ReizeWindow',[$(window).width(),$(window).height()]);
			});
		},
	
		_self.setSliderValue = function(val) {
			// _self.speedSlider[0].value = val;
		},
	
		_self.mouseDown = function(e){
			_self.waveDisplayDrag = true;
			_self.needsUpdate = true;
			_self.pRad = MathUtils.getAngle(_self.getViewCenter(),[e.pageX,e.pageY]);
			_self.pLoc =[e.pageX,e.pageY];
			_self.setMousePosition(e);
			_self.waveDisplay.mousemove(_self.setMousePosition);
			_self.doEvent('StartWaveDrag',e);
			return false;
		},
		
		_self.mouseUp = function(e){
			_self.waveDisplayDrag = false;
			_self.needsUpdate = false;
			_self.waveDisplay.off('mousemove');
			_self.smoothedRotation = 0;
			_self.doEvent('EndWaveDrag',e);
		},
	
		_self._updateSmoothRotation = function(newVal){
			var alpha = 0.1;
			_self.smoothedRotation = newVal * alpha + _self.smoothedRotation * (1 - alpha);
			if (Math.abs(_self.smoothedRotation) < 0.005){
				_self.smoothedRotation = 0;
			}
		},
		
		_self.setMousePosition = function(e) {
			if(e.type === 'touchmove'){
				_self.mousePos = [e.originalEvent.targetTouches[0].pageX,e.originalEvent.targetTouches[0].pageY];
			}else{
				_self.mousePos = [e.pageX,e.pageY];	
			}
			_self.needsUpdate = true;
		},
	
		_self.getViewCenter = function() {
			return [$(container).width() * 0.5,  $(container).height() * 0.5];
		},
	
		_self.rotationDragUpdate = function() {
			var cRad = MathUtils.getAngle(_self.getViewCenter(),_self.mousePos);
			var rotMax = 0.5;
			if(_self.mousePos[0] == _self.pLoc[0] && _self.mousePos[1] == _self.pLoc[1]) {
				_self._updateSmoothRotation(0);
				_self.doEvent('dragRateUpdate',0);
				return false;
			}
			if(_self.pRad != cRad) {
				var relRad = _self.pRad - cRad;
				var rotation = _self.pRelRad + relRad;
				if( isNaN(rotation) ) rotation = 0;
				if( rotation < -rotMax)rotation = _self.pRotation;
				if( rotation > rotMax)rotation = _self.pRotation;
				_self._updateSmoothRotation(-rotation);
				_self.doEvent('dragRateUpdate',_self.smoothedRotation);
			}else {
				_self._updateSmoothRotation(0);
				_self.doEvent('dragRateUpdate',0);
			}
	
			_self.pRad = cRad;
			_self.pLoc = _self.mousePos;
			_self.pRelRad = relRad;
			_self.pRotation = rotation;
	
		},
		
		_self.update = function() {
			requestAnimationFrame(_self.update);
			if(_self.needsUpdate == false) return false;		
			_self.rotationDragUpdate();
		},
	
		_self.on = function(binding,callback) {
			
			if(_self.bindings[binding] == undefined) {
				_self.bindings[binding] = [];
			}
			_self.bindings[binding].push(callback);
		},
	
		_self.doEvent = function(binding, result) {
			if(_self.bindings[binding] == undefined ) return false;
			for(var i=0; i <  _self.bindings[binding].length; ++i){
				_self.bindings[binding][i](result);
			}
		},
	
		_self.init();
	};


/***/ }),
/* 3 */
/*!*******************************!*\
  !*** ./app/util/MathUtils.js ***!
  \*******************************/
/***/ (function(module, exports) {

	/**
	 * Copyright 2016 Google Inc.
	 *
	 * Licensed under the Apache License, Version 2.0 (the "License");
	 * you may not use this file except in compliance with the License.
	 * You may obtain a copy of the License at
	 *
	 *     http://www.apache.org/licenses/LICENSE-2.0
	 *
	 * Unless required by applicable law or agreed to in writing, software
	 * distributed under the License is distributed on an "AS IS" BASIS,
	 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
	 * See the License for the specific language governing permissions and
	 * limitations under the License.
	 */
	
	'use strict';
	
	module.exports = new (function(){
		var _self = this;
		var _MAX_RAD = Math.PI * 2;
		var _RAD_TO_DEGREE = 57.2957795;
	
		_self.lineDistance = function( point1, point2 ){
			var xs = 0;
			var ys = 0;
			xs = point2.x - point1.x;
			xs = xs * xs;
			ys = point2.y - point1.y;
			ys = ys * ys;
			return Math.sqrt( xs + ys );
		},
	
		_self.lerp = function( a, b, percent ) { 
			return a + percent * ( b - a ); 
		},
	
		_self.getAngle = function(centerAxis,point) {
			var rad;
			rad = Math.atan2( 
				point[1]-centerAxis[1],
				point[0]-centerAxis[0]
			);
			rad += _MAX_RAD/4;
			if(rad<0) rad += _MAX_RAD;
			return rad;
		},
	
		_self.getRadialPoint = function(radius, deg) {
			return [ radius * Math.cos(_MAX_RAD * deg), radius * Math.sin(_MAX_RAD * deg) ];
		};
	
		_self.pol2cart = function(radius, rads) {
			return [ radius * Math.cos(rads), radius * Math.sin(rads) ];
		};
	
		_self.getMaxRad = function() {
			return _MAX_RAD;
		},
	
		_self.convertRadToDegree = function(rad) {
			return rad * _RAD_TO_DEGREE;
		}
	
	})();

/***/ }),
/* 4 */
/*!*********************************!*\
  !*** ./~/jquery/dist/jquery.js ***!
  \*********************************/
/***/ (function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;/*!
	 * jQuery JavaScript Library v2.2.4
	 * http://jquery.com/
	 *
	 * Includes Sizzle.js
	 * http://sizzlejs.com/
	 *
	 * Copyright jQuery Foundation and other contributors
	 * Released under the MIT license
	 * http://jquery.org/license
	 *
	 * Date: 2016-05-20T17:23Z
	 */
	
	(function( global, factory ) {
	
		if ( typeof module === "object" && typeof module.exports === "object" ) {
			// For CommonJS and CommonJS-like environments where a proper `window`
			// is present, execute the factory and get jQuery.
			// For environments that do not have a `window` with a `document`
			// (such as Node.js), expose a factory as module.exports.
			// This accentuates the need for the creation of a real `window`.
			// e.g. var jQuery = require("jquery")(window);
			// See ticket #14549 for more info.
			module.exports = global.document ?
				factory( global, true ) :
				function( w ) {
					if ( !w.document ) {
						throw new Error( "jQuery requires a window with a document" );
					}
					return factory( w );
				};
		} else {
			factory( global );
		}
	
	// Pass this if window is not defined yet
	}(typeof window !== "undefined" ? window : this, function( window, noGlobal ) {
	
	// Support: Firefox 18+
	// Can't be in strict mode, several libs including ASP.NET trace
	// the stack via arguments.caller.callee and Firefox dies if
	// you try to trace through "use strict" call chains. (#13335)
	//"use strict";
	var arr = [];
	
	var document = window.document;
	
	var slice = arr.slice;
	
	var concat = arr.concat;
	
	var push = arr.push;
	
	var indexOf = arr.indexOf;
	
	var class2type = {};
	
	var toString = class2type.toString;
	
	var hasOwn = class2type.hasOwnProperty;
	
	var support = {};
	
	
	
	var
		version = "2.2.4",
	
		// Define a local copy of jQuery
		jQuery = function( selector, context ) {
	
			// The jQuery object is actually just the init constructor 'enhanced'
			// Need init if jQuery is called (just allow error to be thrown if not included)
			return new jQuery.fn.init( selector, context );
		},
	
		// Support: Android<4.1
		// Make sure we trim BOM and NBSP
		rtrim = /^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g,
	
		// Matches dashed string for camelizing
		rmsPrefix = /^-ms-/,
		rdashAlpha = /-([\da-z])/gi,
	
		// Used by jQuery.camelCase as callback to replace()
		fcamelCase = function( all, letter ) {
			return letter.toUpperCase();
		};
	
	jQuery.fn = jQuery.prototype = {
	
		// The current version of jQuery being used
		jquery: version,
	
		constructor: jQuery,
	
		// Start with an empty selector
		selector: "",
	
		// The default length of a jQuery object is 0
		length: 0,
	
		toArray: function() {
			return slice.call( this );
		},
	
		// Get the Nth element in the matched element set OR
		// Get the whole matched element set as a clean array
		get: function( num ) {
			return num != null ?
	
				// Return just the one element from the set
				( num < 0 ? this[ num + this.length ] : this[ num ] ) :
	
				// Return all the elements in a clean array
				slice.call( this );
		},
	
		// Take an array of elements and push it onto the stack
		// (returning the new matched element set)
		pushStack: function( elems ) {
	
			// Build a new jQuery matched element set
			var ret = jQuery.merge( this.constructor(), elems );
	
			// Add the old object onto the stack (as a reference)
			ret.prevObject = this;
			ret.context = this.context;
	
			// Return the newly-formed element set
			return ret;
		},
	
		// Execute a callback for every element in the matched set.
		each: function( callback ) {
			return jQuery.each( this, callback );
		},
	
		map: function( callback ) {
			return this.pushStack( jQuery.map( this, function( elem, i ) {
				return callback.call( elem, i, elem );
			} ) );
		},
	
		slice: function() {
			return this.pushStack( slice.apply( this, arguments ) );
		},
	
		first: function() {
			return this.eq( 0 );
		},
	
		last: function() {
			return this.eq( -1 );
		},
	
		eq: function( i ) {
			var len = this.length,
				j = +i + ( i < 0 ? len : 0 );
			return this.pushStack( j >= 0 && j < len ? [ this[ j ] ] : [] );
		},
	
		end: function() {
			return this.prevObject || this.constructor();
		},
	
		// For internal use only.
		// Behaves like an Array's method, not like a jQuery method.
		push: push,
		sort: arr.sort,
		splice: arr.splice
	};
	
	jQuery.extend = jQuery.fn.extend = function() {
		var options, name, src, copy, copyIsArray, clone,
			target = arguments[ 0 ] || {},
			i = 1,
			length = arguments.length,
			deep = false;
	
		// Handle a deep copy situation
		if ( typeof target === "boolean" ) {
			deep = target;
	
			// Skip the boolean and the target
			target = arguments[ i ] || {};
			i++;
		}
	
		// Handle case when target is a string or something (possible in deep copy)
		if ( typeof target !== "object" && !jQuery.isFunction( target ) ) {
			target = {};
		}
	
		// Extend jQuery itself if only one argument is passed
		if ( i === length ) {
			target = this;
			i--;
		}
	
		for ( ; i < length; i++ ) {
	
			// Only deal with non-null/undefined values
			if ( ( options = arguments[ i ] ) != null ) {
	
				// Extend the base object
				for ( name in options ) {
					src = target[ name ];
					copy = options[ name ];
	
					// Prevent never-ending loop
					if ( target === copy ) {
						continue;
					}
	
					// Recurse if we're merging plain objects or arrays
					if ( deep && copy && ( jQuery.isPlainObject( copy ) ||
						( copyIsArray = jQuery.isArray( copy ) ) ) ) {
	
						if ( copyIsArray ) {
							copyIsArray = false;
							clone = src && jQuery.isArray( src ) ? src : [];
	
						} else {
							clone = src && jQuery.isPlainObject( src ) ? src : {};
						}
	
						// Never move original objects, clone them
						target[ name ] = jQuery.extend( deep, clone, copy );
	
					// Don't bring in undefined values
					} else if ( copy !== undefined ) {
						target[ name ] = copy;
					}
				}
			}
		}
	
		// Return the modified object
		return target;
	};
	
	jQuery.extend( {
	
		// Unique for each copy of jQuery on the page
		expando: "jQuery" + ( version + Math.random() ).replace( /\D/g, "" ),
	
		// Assume jQuery is ready without the ready module
		isReady: true,
	
		error: function( msg ) {
			throw new Error( msg );
		},
	
		noop: function() {},
	
		isFunction: function( obj ) {
			return jQuery.type( obj ) === "function";
		},
	
		isArray: Array.isArray,
	
		isWindow: function( obj ) {
			return obj != null && obj === obj.window;
		},
	
		isNumeric: function( obj ) {
	
			// parseFloat NaNs numeric-cast false positives (null|true|false|"")
			// ...but misinterprets leading-number strings, particularly hex literals ("0x...")
			// subtraction forces infinities to NaN
			// adding 1 corrects loss of precision from parseFloat (#15100)
			var realStringObj = obj && obj.toString();
			return !jQuery.isArray( obj ) && ( realStringObj - parseFloat( realStringObj ) + 1 ) >= 0;
		},
	
		isPlainObject: function( obj ) {
			var key;
	
			// Not plain objects:
			// - Any object or value whose internal [[Class]] property is not "[object Object]"
			// - DOM nodes
			// - window
			if ( jQuery.type( obj ) !== "object" || obj.nodeType || jQuery.isWindow( obj ) ) {
				return false;
			}
	
			// Not own constructor property must be Object
			if ( obj.constructor &&
					!hasOwn.call( obj, "constructor" ) &&
					!hasOwn.call( obj.constructor.prototype || {}, "isPrototypeOf" ) ) {
				return false;
			}
	
			// Own properties are enumerated firstly, so to speed up,
			// if last one is own, then all properties are own
			for ( key in obj ) {}
	
			return key === undefined || hasOwn.call( obj, key );
		},
	
		isEmptyObject: function( obj ) {
			var name;
			for ( name in obj ) {
				return false;
			}
			return true;
		},
	
		type: function( obj ) {
			if ( obj == null ) {
				return obj + "";
			}
	
			// Support: Android<4.0, iOS<6 (functionish RegExp)
			return typeof obj === "object" || typeof obj === "function" ?
				class2type[ toString.call( obj ) ] || "object" :
				typeof obj;
		},
	
		// Evaluates a script in a global context
		globalEval: function( code ) {
			var script,
				indirect = eval;
	
			code = jQuery.trim( code );
	
			if ( code ) {
	
				// If the code includes a valid, prologue position
				// strict mode pragma, execute code by injecting a
				// script tag into the document.
				if ( code.indexOf( "use strict" ) === 1 ) {
					script = document.createElement( "script" );
					script.text = code;
					document.head.appendChild( script ).parentNode.removeChild( script );
				} else {
	
					// Otherwise, avoid the DOM node creation, insertion
					// and removal by using an indirect global eval
	
					indirect( code );
				}
			}
		},
	
		// Convert dashed to camelCase; used by the css and data modules
		// Support: IE9-11+
		// Microsoft forgot to hump their vendor prefix (#9572)
		camelCase: function( string ) {
			return string.replace( rmsPrefix, "ms-" ).replace( rdashAlpha, fcamelCase );
		},
	
		nodeName: function( elem, name ) {
			return elem.nodeName && elem.nodeName.toLowerCase() === name.toLowerCase();
		},
	
		each: function( obj, callback ) {
			var length, i = 0;
	
			if ( isArrayLike( obj ) ) {
				length = obj.length;
				for ( ; i < length; i++ ) {
					if ( callback.call( obj[ i ], i, obj[ i ] ) === false ) {
						break;
					}
				}
			} else {
				for ( i in obj ) {
					if ( callback.call( obj[ i ], i, obj[ i ] ) === false ) {
						break;
					}
				}
			}
	
			return obj;
		},
	
		// Support: Android<4.1
		trim: function( text ) {
			return text == null ?
				"" :
				( text + "" ).replace( rtrim, "" );
		},
	
		// results is for internal usage only
		makeArray: function( arr, results ) {
			var ret = results || [];
	
			if ( arr != null ) {
				if ( isArrayLike( Object( arr ) ) ) {
					jQuery.merge( ret,
						typeof arr === "string" ?
						[ arr ] : arr
					);
				} else {
					push.call( ret, arr );
				}
			}
	
			return ret;
		},
	
		inArray: function( elem, arr, i ) {
			return arr == null ? -1 : indexOf.call( arr, elem, i );
		},
	
		merge: function( first, second ) {
			var len = +second.length,
				j = 0,
				i = first.length;
	
			for ( ; j < len; j++ ) {
				first[ i++ ] = second[ j ];
			}
	
			first.length = i;
	
			return first;
		},
	
		grep: function( elems, callback, invert ) {
			var callbackInverse,
				matches = [],
				i = 0,
				length = elems.length,
				callbackExpect = !invert;
	
			// Go through the array, only saving the items
			// that pass the validator function
			for ( ; i < length; i++ ) {
				callbackInverse = !callback( elems[ i ], i );
				if ( callbackInverse !== callbackExpect ) {
					matches.push( elems[ i ] );
				}
			}
	
			return matches;
		},
	
		// arg is for internal usage only
		map: function( elems, callback, arg ) {
			var length, value,
				i = 0,
				ret = [];
	
			// Go through the array, translating each of the items to their new values
			if ( isArrayLike( elems ) ) {
				length = elems.length;
				for ( ; i < length; i++ ) {
					value = callback( elems[ i ], i, arg );
	
					if ( value != null ) {
						ret.push( value );
					}
				}
	
			// Go through every key on the object,
			} else {
				for ( i in elems ) {
					value = callback( elems[ i ], i, arg );
	
					if ( value != null ) {
						ret.push( value );
					}
				}
			}
	
			// Flatten any nested arrays
			return concat.apply( [], ret );
		},
	
		// A global GUID counter for objects
		guid: 1,
	
		// Bind a function to a context, optionally partially applying any
		// arguments.
		proxy: function( fn, context ) {
			var tmp, args, proxy;
	
			if ( typeof context === "string" ) {
				tmp = fn[ context ];
				context = fn;
				fn = tmp;
			}
	
			// Quick check to determine if target is callable, in the spec
			// this throws a TypeError, but we will just return undefined.
			if ( !jQuery.isFunction( fn ) ) {
				return undefined;
			}
	
			// Simulated bind
			args = slice.call( arguments, 2 );
			proxy = function() {
				return fn.apply( context || this, args.concat( slice.call( arguments ) ) );
			};
	
			// Set the guid of unique handler to the same of original handler, so it can be removed
			proxy.guid = fn.guid = fn.guid || jQuery.guid++;
	
			return proxy;
		},
	
		now: Date.now,
	
		// jQuery.support is not used in Core but other projects attach their
		// properties to it so it needs to exist.
		support: support
	} );
	
	// JSHint would error on this code due to the Symbol not being defined in ES5.
	// Defining this global in .jshintrc would create a danger of using the global
	// unguarded in another place, it seems safer to just disable JSHint for these
	// three lines.
	/* jshint ignore: start */
	if ( typeof Symbol === "function" ) {
		jQuery.fn[ Symbol.iterator ] = arr[ Symbol.iterator ];
	}
	/* jshint ignore: end */
	
	// Populate the class2type map
	jQuery.each( "Boolean Number String Function Array Date RegExp Object Error Symbol".split( " " ),
	function( i, name ) {
		class2type[ "[object " + name + "]" ] = name.toLowerCase();
	} );
	
	function isArrayLike( obj ) {
	
		// Support: iOS 8.2 (not reproducible in simulator)
		// `in` check used to prevent JIT error (gh-2145)
		// hasOwn isn't used here due to false negatives
		// regarding Nodelist length in IE
		var length = !!obj && "length" in obj && obj.length,
			type = jQuery.type( obj );
	
		if ( type === "function" || jQuery.isWindow( obj ) ) {
			return false;
		}
	
		return type === "array" || length === 0 ||
			typeof length === "number" && length > 0 && ( length - 1 ) in obj;
	}
	var Sizzle =
	/*!
	 * Sizzle CSS Selector Engine v2.2.1
	 * http://sizzlejs.com/
	 *
	 * Copyright jQuery Foundation and other contributors
	 * Released under the MIT license
	 * http://jquery.org/license
	 *
	 * Date: 2015-10-17
	 */
	(function( window ) {
	
	var i,
		support,
		Expr,
		getText,
		isXML,
		tokenize,
		compile,
		select,
		outermostContext,
		sortInput,
		hasDuplicate,
	
		// Local document vars
		setDocument,
		document,
		docElem,
		documentIsHTML,
		rbuggyQSA,
		rbuggyMatches,
		matches,
		contains,
	
		// Instance-specific data
		expando = "sizzle" + 1 * new Date(),
		preferredDoc = window.document,
		dirruns = 0,
		done = 0,
		classCache = createCache(),
		tokenCache = createCache(),
		compilerCache = createCache(),
		sortOrder = function( a, b ) {
			if ( a === b ) {
				hasDuplicate = true;
			}
			return 0;
		},
	
		// General-purpose constants
		MAX_NEGATIVE = 1 << 31,
	
		// Instance methods
		hasOwn = ({}).hasOwnProperty,
		arr = [],
		pop = arr.pop,
		push_native = arr.push,
		push = arr.push,
		slice = arr.slice,
		// Use a stripped-down indexOf as it's faster than native
		// http://jsperf.com/thor-indexof-vs-for/5
		indexOf = function( list, elem ) {
			var i = 0,
				len = list.length;
			for ( ; i < len; i++ ) {
				if ( list[i] === elem ) {
					return i;
				}
			}
			return -1;
		},
	
		booleans = "checked|selected|async|autofocus|autoplay|controls|defer|disabled|hidden|ismap|loop|multiple|open|readonly|required|scoped",
	
		// Regular expressions
	
		// http://www.w3.org/TR/css3-selectors/#whitespace
		whitespace = "[\\x20\\t\\r\\n\\f]",
	
		// http://www.w3.org/TR/CSS21/syndata.html#value-def-identifier
		identifier = "(?:\\\\.|[\\w-]|[^\\x00-\\xa0])+",
	
		// Attribute selectors: http://www.w3.org/TR/selectors/#attribute-selectors
		attributes = "\\[" + whitespace + "*(" + identifier + ")(?:" + whitespace +
			// Operator (capture 2)
			"*([*^$|!~]?=)" + whitespace +
			// "Attribute values must be CSS identifiers [capture 5] or strings [capture 3 or capture 4]"
			"*(?:'((?:\\\\.|[^\\\\'])*)'|\"((?:\\\\.|[^\\\\\"])*)\"|(" + identifier + "))|)" + whitespace +
			"*\\]",
	
		pseudos = ":(" + identifier + ")(?:\\((" +
			// To reduce the number of selectors needing tokenize in the preFilter, prefer arguments:
			// 1. quoted (capture 3; capture 4 or capture 5)
			"('((?:\\\\.|[^\\\\'])*)'|\"((?:\\\\.|[^\\\\\"])*)\")|" +
			// 2. simple (capture 6)
			"((?:\\\\.|[^\\\\()[\\]]|" + attributes + ")*)|" +
			// 3. anything else (capture 2)
			".*" +
			")\\)|)",
	
		// Leading and non-escaped trailing whitespace, capturing some non-whitespace characters preceding the latter
		rwhitespace = new RegExp( whitespace + "+", "g" ),
		rtrim = new RegExp( "^" + whitespace + "+|((?:^|[^\\\\])(?:\\\\.)*)" + whitespace + "+$", "g" ),
	
		rcomma = new RegExp( "^" + whitespace + "*," + whitespace + "*" ),
		rcombinators = new RegExp( "^" + whitespace + "*([>+~]|" + whitespace + ")" + whitespace + "*" ),
	
		rattributeQuotes = new RegExp( "=" + whitespace + "*([^\\]'\"]*?)" + whitespace + "*\\]", "g" ),
	
		rpseudo = new RegExp( pseudos ),
		ridentifier = new RegExp( "^" + identifier + "$" ),
	
		matchExpr = {
			"ID": new RegExp( "^#(" + identifier + ")" ),
			"CLASS": new RegExp( "^\\.(" + identifier + ")" ),
			"TAG": new RegExp( "^(" + identifier + "|[*])" ),
			"ATTR": new RegExp( "^" + attributes ),
			"PSEUDO": new RegExp( "^" + pseudos ),
			"CHILD": new RegExp( "^:(only|first|last|nth|nth-last)-(child|of-type)(?:\\(" + whitespace +
				"*(even|odd|(([+-]|)(\\d*)n|)" + whitespace + "*(?:([+-]|)" + whitespace +
				"*(\\d+)|))" + whitespace + "*\\)|)", "i" ),
			"bool": new RegExp( "^(?:" + booleans + ")$", "i" ),
			// For use in libraries implementing .is()
			// We use this for POS matching in `select`
			"needsContext": new RegExp( "^" + whitespace + "*[>+~]|:(even|odd|eq|gt|lt|nth|first|last)(?:\\(" +
				whitespace + "*((?:-\\d)?\\d*)" + whitespace + "*\\)|)(?=[^-]|$)", "i" )
		},
	
		rinputs = /^(?:input|select|textarea|button)$/i,
		rheader = /^h\d$/i,
	
		rnative = /^[^{]+\{\s*\[native \w/,
	
		// Easily-parseable/retrievable ID or TAG or CLASS selectors
		rquickExpr = /^(?:#([\w-]+)|(\w+)|\.([\w-]+))$/,
	
		rsibling = /[+~]/,
		rescape = /'|\\/g,
	
		// CSS escapes http://www.w3.org/TR/CSS21/syndata.html#escaped-characters
		runescape = new RegExp( "\\\\([\\da-f]{1,6}" + whitespace + "?|(" + whitespace + ")|.)", "ig" ),
		funescape = function( _, escaped, escapedWhitespace ) {
			var high = "0x" + escaped - 0x10000;
			// NaN means non-codepoint
			// Support: Firefox<24
			// Workaround erroneous numeric interpretation of +"0x"
			return high !== high || escapedWhitespace ?
				escaped :
				high < 0 ?
					// BMP codepoint
					String.fromCharCode( high + 0x10000 ) :
					// Supplemental Plane codepoint (surrogate pair)
					String.fromCharCode( high >> 10 | 0xD800, high & 0x3FF | 0xDC00 );
		},
	
		// Used for iframes
		// See setDocument()
		// Removing the function wrapper causes a "Permission Denied"
		// error in IE
		unloadHandler = function() {
			setDocument();
		};
	
	// Optimize for push.apply( _, NodeList )
	try {
		push.apply(
			(arr = slice.call( preferredDoc.childNodes )),
			preferredDoc.childNodes
		);
		// Support: Android<4.0
		// Detect silently failing push.apply
		arr[ preferredDoc.childNodes.length ].nodeType;
	} catch ( e ) {
		push = { apply: arr.length ?
	
			// Leverage slice if possible
			function( target, els ) {
				push_native.apply( target, slice.call(els) );
			} :
	
			// Support: IE<9
			// Otherwise append directly
			function( target, els ) {
				var j = target.length,
					i = 0;
				// Can't trust NodeList.length
				while ( (target[j++] = els[i++]) ) {}
				target.length = j - 1;
			}
		};
	}
	
	function Sizzle( selector, context, results, seed ) {
		var m, i, elem, nid, nidselect, match, groups, newSelector,
			newContext = context && context.ownerDocument,
	
			// nodeType defaults to 9, since context defaults to document
			nodeType = context ? context.nodeType : 9;
	
		results = results || [];
	
		// Return early from calls with invalid selector or context
		if ( typeof selector !== "string" || !selector ||
			nodeType !== 1 && nodeType !== 9 && nodeType !== 11 ) {
	
			return results;
		}
	
		// Try to shortcut find operations (as opposed to filters) in HTML documents
		if ( !seed ) {
	
			if ( ( context ? context.ownerDocument || context : preferredDoc ) !== document ) {
				setDocument( context );
			}
			context = context || document;
	
			if ( documentIsHTML ) {
	
				// If the selector is sufficiently simple, try using a "get*By*" DOM method
				// (excepting DocumentFragment context, where the methods don't exist)
				if ( nodeType !== 11 && (match = rquickExpr.exec( selector )) ) {
	
					// ID selector
					if ( (m = match[1]) ) {
	
						// Document context
						if ( nodeType === 9 ) {
							if ( (elem = context.getElementById( m )) ) {
	
								// Support: IE, Opera, Webkit
								// TODO: identify versions
								// getElementById can match elements by name instead of ID
								if ( elem.id === m ) {
									results.push( elem );
									return results;
								}
							} else {
								return results;
							}
	
						// Element context
						} else {
	
							// Support: IE, Opera, Webkit
							// TODO: identify versions
							// getElementById can match elements by name instead of ID
							if ( newContext && (elem = newContext.getElementById( m )) &&
								contains( context, elem ) &&
								elem.id === m ) {
	
								results.push( elem );
								return results;
							}
						}
	
					// Type selector
					} else if ( match[2] ) {
						push.apply( results, context.getElementsByTagName( selector ) );
						return results;
	
					// Class selector
					} else if ( (m = match[3]) && support.getElementsByClassName &&
						context.getElementsByClassName ) {
	
						push.apply( results, context.getElementsByClassName( m ) );
						return results;
					}
				}
	
				// Take advantage of querySelectorAll
				if ( support.qsa &&
					!compilerCache[ selector + " " ] &&
					(!rbuggyQSA || !rbuggyQSA.test( selector )) ) {
	
					if ( nodeType !== 1 ) {
						newContext = context;
						newSelector = selector;
	
					// qSA looks outside Element context, which is not what we want
					// Thanks to Andrew Dupont for this workaround technique
					// Support: IE <=8
					// Exclude object elements
					} else if ( context.nodeName.toLowerCase() !== "object" ) {
	
						// Capture the context ID, setting it first if necessary
						if ( (nid = context.getAttribute( "id" )) ) {
							nid = nid.replace( rescape, "\\$&" );
						} else {
							context.setAttribute( "id", (nid = expando) );
						}
	
						// Prefix every selector in the list
						groups = tokenize( selector );
						i = groups.length;
						nidselect = ridentifier.test( nid ) ? "#" + nid : "[id='" + nid + "']";
						while ( i-- ) {
							groups[i] = nidselect + " " + toSelector( groups[i] );
						}
						newSelector = groups.join( "," );
	
						// Expand context for sibling selectors
						newContext = rsibling.test( selector ) && testContext( context.parentNode ) ||
							context;
					}
	
					if ( newSelector ) {
						try {
							push.apply( results,
								newContext.querySelectorAll( newSelector )
							);
							return results;
						} catch ( qsaError ) {
						} finally {
							if ( nid === expando ) {
								context.removeAttribute( "id" );
							}
						}
					}
				}
			}
		}
	
		// All others
		return select( selector.replace( rtrim, "$1" ), context, results, seed );
	}
	
	/**
	 * Create key-value caches of limited size
	 * @returns {function(string, object)} Returns the Object data after storing it on itself with
	 *	property name the (space-suffixed) string and (if the cache is larger than Expr.cacheLength)
	 *	deleting the oldest entry
	 */
	function createCache() {
		var keys = [];
	
		function cache( key, value ) {
			// Use (key + " ") to avoid collision with native prototype properties (see Issue #157)
			if ( keys.push( key + " " ) > Expr.cacheLength ) {
				// Only keep the most recent entries
				delete cache[ keys.shift() ];
			}
			return (cache[ key + " " ] = value);
		}
		return cache;
	}
	
	/**
	 * Mark a function for special use by Sizzle
	 * @param {Function} fn The function to mark
	 */
	function markFunction( fn ) {
		fn[ expando ] = true;
		return fn;
	}
	
	/**
	 * Support testing using an element
	 * @param {Function} fn Passed the created div and expects a boolean result
	 */
	function assert( fn ) {
		var div = document.createElement("div");
	
		try {
			return !!fn( div );
		} catch (e) {
			return false;
		} finally {
			// Remove from its parent by default
			if ( div.parentNode ) {
				div.parentNode.removeChild( div );
			}
			// release memory in IE
			div = null;
		}
	}
	
	/**
	 * Adds the same handler for all of the specified attrs
	 * @param {String} attrs Pipe-separated list of attributes
	 * @param {Function} handler The method that will be applied
	 */
	function addHandle( attrs, handler ) {
		var arr = attrs.split("|"),
			i = arr.length;
	
		while ( i-- ) {
			Expr.attrHandle[ arr[i] ] = handler;
		}
	}
	
	/**
	 * Checks document order of two siblings
	 * @param {Element} a
	 * @param {Element} b
	 * @returns {Number} Returns less than 0 if a precedes b, greater than 0 if a follows b
	 */
	function siblingCheck( a, b ) {
		var cur = b && a,
			diff = cur && a.nodeType === 1 && b.nodeType === 1 &&
				( ~b.sourceIndex || MAX_NEGATIVE ) -
				( ~a.sourceIndex || MAX_NEGATIVE );
	
		// Use IE sourceIndex if available on both nodes
		if ( diff ) {
			return diff;
		}
	
		// Check if b follows a
		if ( cur ) {
			while ( (cur = cur.nextSibling) ) {
				if ( cur === b ) {
					return -1;
				}
			}
		}
	
		return a ? 1 : -1;
	}
	
	/**
	 * Returns a function to use in pseudos for input types
	 * @param {String} type
	 */
	function createInputPseudo( type ) {
		return function( elem ) {
			var name = elem.nodeName.toLowerCase();
			return name === "input" && elem.type === type;
		};
	}
	
	/**
	 * Returns a function to use in pseudos for buttons
	 * @param {String} type
	 */
	function createButtonPseudo( type ) {
		return function( elem ) {
			var name = elem.nodeName.toLowerCase();
			return (name === "input" || name === "button") && elem.type === type;
		};
	}
	
	/**
	 * Returns a function to use in pseudos for positionals
	 * @param {Function} fn
	 */
	function createPositionalPseudo( fn ) {
		return markFunction(function( argument ) {
			argument = +argument;
			return markFunction(function( seed, matches ) {
				var j,
					matchIndexes = fn( [], seed.length, argument ),
					i = matchIndexes.length;
	
				// Match elements found at the specified indexes
				while ( i-- ) {
					if ( seed[ (j = matchIndexes[i]) ] ) {
						seed[j] = !(matches[j] = seed[j]);
					}
				}
			});
		});
	}
	
	/**
	 * Checks a node for validity as a Sizzle context
	 * @param {Element|Object=} context
	 * @returns {Element|Object|Boolean} The input node if acceptable, otherwise a falsy value
	 */
	function testContext( context ) {
		return context && typeof context.getElementsByTagName !== "undefined" && context;
	}
	
	// Expose support vars for convenience
	support = Sizzle.support = {};
	
	/**
	 * Detects XML nodes
	 * @param {Element|Object} elem An element or a document
	 * @returns {Boolean} True iff elem is a non-HTML XML node
	 */
	isXML = Sizzle.isXML = function( elem ) {
		// documentElement is verified for cases where it doesn't yet exist
		// (such as loading iframes in IE - #4833)
		var documentElement = elem && (elem.ownerDocument || elem).documentElement;
		return documentElement ? documentElement.nodeName !== "HTML" : false;
	};
	
	/**
	 * Sets document-related variables once based on the current document
	 * @param {Element|Object} [doc] An element or document object to use to set the document
	 * @returns {Object} Returns the current document
	 */
	setDocument = Sizzle.setDocument = function( node ) {
		var hasCompare, parent,
			doc = node ? node.ownerDocument || node : preferredDoc;
	
		// Return early if doc is invalid or already selected
		if ( doc === document || doc.nodeType !== 9 || !doc.documentElement ) {
			return document;
		}
	
		// Update global variables
		document = doc;
		docElem = document.documentElement;
		documentIsHTML = !isXML( document );
	
		// Support: IE 9-11, Edge
		// Accessing iframe documents after unload throws "permission denied" errors (jQuery #13936)
		if ( (parent = document.defaultView) && parent.top !== parent ) {
			// Support: IE 11
			if ( parent.addEventListener ) {
				parent.addEventListener( "unload", unloadHandler, false );
	
			// Support: IE 9 - 10 only
			} else if ( parent.attachEvent ) {
				parent.attachEvent( "onunload", unloadHandler );
			}
		}
	
		/* Attributes
		---------------------------------------------------------------------- */
	
		// Support: IE<8
		// Verify that getAttribute really returns attributes and not properties
		// (excepting IE8 booleans)
		support.attributes = assert(function( div ) {
			div.className = "i";
			return !div.getAttribute("className");
		});
	
		/* getElement(s)By*
		---------------------------------------------------------------------- */
	
		// Check if getElementsByTagName("*") returns only elements
		support.getElementsByTagName = assert(function( div ) {
			div.appendChild( document.createComment("") );
			return !div.getElementsByTagName("*").length;
		});
	
		// Support: IE<9
		support.getElementsByClassName = rnative.test( document.getElementsByClassName );
	
		// Support: IE<10
		// Check if getElementById returns elements by name
		// The broken getElementById methods don't pick up programatically-set names,
		// so use a roundabout getElementsByName test
		support.getById = assert(function( div ) {
			docElem.appendChild( div ).id = expando;
			return !document.getElementsByName || !document.getElementsByName( expando ).length;
		});
	
		// ID find and filter
		if ( support.getById ) {
			Expr.find["ID"] = function( id, context ) {
				if ( typeof context.getElementById !== "undefined" && documentIsHTML ) {
					var m = context.getElementById( id );
					return m ? [ m ] : [];
				}
			};
			Expr.filter["ID"] = function( id ) {
				var attrId = id.replace( runescape, funescape );
				return function( elem ) {
					return elem.getAttribute("id") === attrId;
				};
			};
		} else {
			// Support: IE6/7
			// getElementById is not reliable as a find shortcut
			delete Expr.find["ID"];
	
			Expr.filter["ID"] =  function( id ) {
				var attrId = id.replace( runescape, funescape );
				return function( elem ) {
					var node = typeof elem.getAttributeNode !== "undefined" &&
						elem.getAttributeNode("id");
					return node && node.value === attrId;
				};
			};
		}
	
		// Tag
		Expr.find["TAG"] = support.getElementsByTagName ?
			function( tag, context ) {
				if ( typeof context.getElementsByTagName !== "undefined" ) {
					return context.getElementsByTagName( tag );
	
				// DocumentFragment nodes don't have gEBTN
				} else if ( support.qsa ) {
					return context.querySelectorAll( tag );
				}
			} :
	
			function( tag, context ) {
				var elem,
					tmp = [],
					i = 0,
					// By happy coincidence, a (broken) gEBTN appears on DocumentFragment nodes too
					results = context.getElementsByTagName( tag );
	
				// Filter out possible comments
				if ( tag === "*" ) {
					while ( (elem = results[i++]) ) {
						if ( elem.nodeType === 1 ) {
							tmp.push( elem );
						}
					}
	
					return tmp;
				}
				return results;
			};
	
		// Class
		Expr.find["CLASS"] = support.getElementsByClassName && function( className, context ) {
			if ( typeof context.getElementsByClassName !== "undefined" && documentIsHTML ) {
				return context.getElementsByClassName( className );
			}
		};
	
		/* QSA/matchesSelector
		---------------------------------------------------------------------- */
	
		// QSA and matchesSelector support
	
		// matchesSelector(:active) reports false when true (IE9/Opera 11.5)
		rbuggyMatches = [];
	
		// qSa(:focus) reports false when true (Chrome 21)
		// We allow this because of a bug in IE8/9 that throws an error
		// whenever `document.activeElement` is accessed on an iframe
		// So, we allow :focus to pass through QSA all the time to avoid the IE error
		// See http://bugs.jquery.com/ticket/13378
		rbuggyQSA = [];
	
		if ( (support.qsa = rnative.test( document.querySelectorAll )) ) {
			// Build QSA regex
			// Regex strategy adopted from Diego Perini
			assert(function( div ) {
				// Select is set to empty string on purpose
				// This is to test IE's treatment of not explicitly
				// setting a boolean content attribute,
				// since its presence should be enough
				// http://bugs.jquery.com/ticket/12359
				docElem.appendChild( div ).innerHTML = "<a id='" + expando + "'></a>" +
					"<select id='" + expando + "-\r\\' msallowcapture=''>" +
					"<option selected=''></option></select>";
	
				// Support: IE8, Opera 11-12.16
				// Nothing should be selected when empty strings follow ^= or $= or *=
				// The test attribute must be unknown in Opera but "safe" for WinRT
				// http://msdn.microsoft.com/en-us/library/ie/hh465388.aspx#attribute_section
				if ( div.querySelectorAll("[msallowcapture^='']").length ) {
					rbuggyQSA.push( "[*^$]=" + whitespace + "*(?:''|\"\")" );
				}
	
				// Support: IE8
				// Boolean attributes and "value" are not treated correctly
				if ( !div.querySelectorAll("[selected]").length ) {
					rbuggyQSA.push( "\\[" + whitespace + "*(?:value|" + booleans + ")" );
				}
	
				// Support: Chrome<29, Android<4.4, Safari<7.0+, iOS<7.0+, PhantomJS<1.9.8+
				if ( !div.querySelectorAll( "[id~=" + expando + "-]" ).length ) {
					rbuggyQSA.push("~=");
				}
	
				// Webkit/Opera - :checked should return selected option elements
				// http://www.w3.org/TR/2011/REC-css3-selectors-20110929/#checked
				// IE8 throws error here and will not see later tests
				if ( !div.querySelectorAll(":checked").length ) {
					rbuggyQSA.push(":checked");
				}
	
				// Support: Safari 8+, iOS 8+
				// https://bugs.webkit.org/show_bug.cgi?id=136851
				// In-page `selector#id sibing-combinator selector` fails
				if ( !div.querySelectorAll( "a#" + expando + "+*" ).length ) {
					rbuggyQSA.push(".#.+[+~]");
				}
			});
	
			assert(function( div ) {
				// Support: Windows 8 Native Apps
				// The type and name attributes are restricted during .innerHTML assignment
				var input = document.createElement("input");
				input.setAttribute( "type", "hidden" );
				div.appendChild( input ).setAttribute( "name", "D" );
	
				// Support: IE8
				// Enforce case-sensitivity of name attribute
				if ( div.querySelectorAll("[name=d]").length ) {
					rbuggyQSA.push( "name" + whitespace + "*[*^$|!~]?=" );
				}
	
				// FF 3.5 - :enabled/:disabled and hidden elements (hidden elements are still enabled)
				// IE8 throws error here and will not see later tests
				if ( !div.querySelectorAll(":enabled").length ) {
					rbuggyQSA.push( ":enabled", ":disabled" );
				}
	
				// Opera 10-11 does not throw on post-comma invalid pseudos
				div.querySelectorAll("*,:x");
				rbuggyQSA.push(",.*:");
			});
		}
	
		if ( (support.matchesSelector = rnative.test( (matches = docElem.matches ||
			docElem.webkitMatchesSelector ||
			docElem.mozMatchesSelector ||
			docElem.oMatchesSelector ||
			docElem.msMatchesSelector) )) ) {
	
			assert(function( div ) {
				// Check to see if it's possible to do matchesSelector
				// on a disconnected node (IE 9)
				support.disconnectedMatch = matches.call( div, "div" );
	
				// This should fail with an exception
				// Gecko does not error, returns false instead
				matches.call( div, "[s!='']:x" );
				rbuggyMatches.push( "!=", pseudos );
			});
		}
	
		rbuggyQSA = rbuggyQSA.length && new RegExp( rbuggyQSA.join("|") );
		rbuggyMatches = rbuggyMatches.length && new RegExp( rbuggyMatches.join("|") );
	
		/* Contains
		---------------------------------------------------------------------- */
		hasCompare = rnative.test( docElem.compareDocumentPosition );
	
		// Element contains another
		// Purposefully self-exclusive
		// As in, an element does not contain itself
		contains = hasCompare || rnative.test( docElem.contains ) ?
			function( a, b ) {
				var adown = a.nodeType === 9 ? a.documentElement : a,
					bup = b && b.parentNode;
				return a === bup || !!( bup && bup.nodeType === 1 && (
					adown.contains ?
						adown.contains( bup ) :
						a.compareDocumentPosition && a.compareDocumentPosition( bup ) & 16
				));
			} :
			function( a, b ) {
				if ( b ) {
					while ( (b = b.parentNode) ) {
						if ( b === a ) {
							return true;
						}
					}
				}
				return false;
			};
	
		/* Sorting
		---------------------------------------------------------------------- */
	
		// Document order sorting
		sortOrder = hasCompare ?
		function( a, b ) {
	
			// Flag for duplicate removal
			if ( a === b ) {
				hasDuplicate = true;
				return 0;
			}
	
			// Sort on method existence if only one input has compareDocumentPosition
			var compare = !a.compareDocumentPosition - !b.compareDocumentPosition;
			if ( compare ) {
				return compare;
			}
	
			// Calculate position if both inputs belong to the same document
			compare = ( a.ownerDocument || a ) === ( b.ownerDocument || b ) ?
				a.compareDocumentPosition( b ) :
	
				// Otherwise we know they are disconnected
				1;
	
			// Disconnected nodes
			if ( compare & 1 ||
				(!support.sortDetached && b.compareDocumentPosition( a ) === compare) ) {
	
				// Choose the first element that is related to our preferred document
				if ( a === document || a.ownerDocument === preferredDoc && contains(preferredDoc, a) ) {
					return -1;
				}
				if ( b === document || b.ownerDocument === preferredDoc && contains(preferredDoc, b) ) {
					return 1;
				}
	
				// Maintain original order
				return sortInput ?
					( indexOf( sortInput, a ) - indexOf( sortInput, b ) ) :
					0;
			}
	
			return compare & 4 ? -1 : 1;
		} :
		function( a, b ) {
			// Exit early if the nodes are identical
			if ( a === b ) {
				hasDuplicate = true;
				return 0;
			}
	
			var cur,
				i = 0,
				aup = a.parentNode,
				bup = b.parentNode,
				ap = [ a ],
				bp = [ b ];
	
			// Parentless nodes are either documents or disconnected
			if ( !aup || !bup ) {
				return a === document ? -1 :
					b === document ? 1 :
					aup ? -1 :
					bup ? 1 :
					sortInput ?
					( indexOf( sortInput, a ) - indexOf( sortInput, b ) ) :
					0;
	
			// If the nodes are siblings, we can do a quick check
			} else if ( aup === bup ) {
				return siblingCheck( a, b );
			}
	
			// Otherwise we need full lists of their ancestors for comparison
			cur = a;
			while ( (cur = cur.parentNode) ) {
				ap.unshift( cur );
			}
			cur = b;
			while ( (cur = cur.parentNode) ) {
				bp.unshift( cur );
			}
	
			// Walk down the tree looking for a discrepancy
			while ( ap[i] === bp[i] ) {
				i++;
			}
	
			return i ?
				// Do a sibling check if the nodes have a common ancestor
				siblingCheck( ap[i], bp[i] ) :
	
				// Otherwise nodes in our document sort first
				ap[i] === preferredDoc ? -1 :
				bp[i] === preferredDoc ? 1 :
				0;
		};
	
		return document;
	};
	
	Sizzle.matches = function( expr, elements ) {
		return Sizzle( expr, null, null, elements );
	};
	
	Sizzle.matchesSelector = function( elem, expr ) {
		// Set document vars if needed
		if ( ( elem.ownerDocument || elem ) !== document ) {
			setDocument( elem );
		}
	
		// Make sure that attribute selectors are quoted
		expr = expr.replace( rattributeQuotes, "='$1']" );
	
		if ( support.matchesSelector && documentIsHTML &&
			!compilerCache[ expr + " " ] &&
			( !rbuggyMatches || !rbuggyMatches.test( expr ) ) &&
			( !rbuggyQSA     || !rbuggyQSA.test( expr ) ) ) {
	
			try {
				var ret = matches.call( elem, expr );
	
				// IE 9's matchesSelector returns false on disconnected nodes
				if ( ret || support.disconnectedMatch ||
						// As well, disconnected nodes are said to be in a document
						// fragment in IE 9
						elem.document && elem.document.nodeType !== 11 ) {
					return ret;
				}
			} catch (e) {}
		}
	
		return Sizzle( expr, document, null, [ elem ] ).length > 0;
	};
	
	Sizzle.contains = function( context, elem ) {
		// Set document vars if needed
		if ( ( context.ownerDocument || context ) !== document ) {
			setDocument( context );
		}
		return contains( context, elem );
	};
	
	Sizzle.attr = function( elem, name ) {
		// Set document vars if needed
		if ( ( elem.ownerDocument || elem ) !== document ) {
			setDocument( elem );
		}
	
		var fn = Expr.attrHandle[ name.toLowerCase() ],
			// Don't get fooled by Object.prototype properties (jQuery #13807)
			val = fn && hasOwn.call( Expr.attrHandle, name.toLowerCase() ) ?
				fn( elem, name, !documentIsHTML ) :
				undefined;
	
		return val !== undefined ?
			val :
			support.attributes || !documentIsHTML ?
				elem.getAttribute( name ) :
				(val = elem.getAttributeNode(name)) && val.specified ?
					val.value :
					null;
	};
	
	Sizzle.error = function( msg ) {
		throw new Error( "Syntax error, unrecognized expression: " + msg );
	};
	
	/**
	 * Document sorting and removing duplicates
	 * @param {ArrayLike} results
	 */
	Sizzle.uniqueSort = function( results ) {
		var elem,
			duplicates = [],
			j = 0,
			i = 0;
	
		// Unless we *know* we can detect duplicates, assume their presence
		hasDuplicate = !support.detectDuplicates;
		sortInput = !support.sortStable && results.slice( 0 );
		results.sort( sortOrder );
	
		if ( hasDuplicate ) {
			while ( (elem = results[i++]) ) {
				if ( elem === results[ i ] ) {
					j = duplicates.push( i );
				}
			}
			while ( j-- ) {
				results.splice( duplicates[ j ], 1 );
			}
		}
	
		// Clear input after sorting to release objects
		// See https://github.com/jquery/sizzle/pull/225
		sortInput = null;
	
		return results;
	};
	
	/**
	 * Utility function for retrieving the text value of an array of DOM nodes
	 * @param {Array|Element} elem
	 */
	getText = Sizzle.getText = function( elem ) {
		var node,
			ret = "",
			i = 0,
			nodeType = elem.nodeType;
	
		if ( !nodeType ) {
			// If no nodeType, this is expected to be an array
			while ( (node = elem[i++]) ) {
				// Do not traverse comment nodes
				ret += getText( node );
			}
		} else if ( nodeType === 1 || nodeType === 9 || nodeType === 11 ) {
			// Use textContent for elements
			// innerText usage removed for consistency of new lines (jQuery #11153)
			if ( typeof elem.textContent === "string" ) {
				return elem.textContent;
			} else {
				// Traverse its children
				for ( elem = elem.firstChild; elem; elem = elem.nextSibling ) {
					ret += getText( elem );
				}
			}
		} else if ( nodeType === 3 || nodeType === 4 ) {
			return elem.nodeValue;
		}
		// Do not include comment or processing instruction nodes
	
		return ret;
	};
	
	Expr = Sizzle.selectors = {
	
		// Can be adjusted by the user
		cacheLength: 50,
	
		createPseudo: markFunction,
	
		match: matchExpr,
	
		attrHandle: {},
	
		find: {},
	
		relative: {
			">": { dir: "parentNode", first: true },
			" ": { dir: "parentNode" },
			"+": { dir: "previousSibling", first: true },
			"~": { dir: "previousSibling" }
		},
	
		preFilter: {
			"ATTR": function( match ) {
				match[1] = match[1].replace( runescape, funescape );
	
				// Move the given value to match[3] whether quoted or unquoted
				match[3] = ( match[3] || match[4] || match[5] || "" ).replace( runescape, funescape );
	
				if ( match[2] === "~=" ) {
					match[3] = " " + match[3] + " ";
				}
	
				return match.slice( 0, 4 );
			},
	
			"CHILD": function( match ) {
				/* matches from matchExpr["CHILD"]
					1 type (only|nth|...)
					2 what (child|of-type)
					3 argument (even|odd|\d*|\d*n([+-]\d+)?|...)
					4 xn-component of xn+y argument ([+-]?\d*n|)
					5 sign of xn-component
					6 x of xn-component
					7 sign of y-component
					8 y of y-component
				*/
				match[1] = match[1].toLowerCase();
	
				if ( match[1].slice( 0, 3 ) === "nth" ) {
					// nth-* requires argument
					if ( !match[3] ) {
						Sizzle.error( match[0] );
					}
	
					// numeric x and y parameters for Expr.filter.CHILD
					// remember that false/true cast respectively to 0/1
					match[4] = +( match[4] ? match[5] + (match[6] || 1) : 2 * ( match[3] === "even" || match[3] === "odd" ) );
					match[5] = +( ( match[7] + match[8] ) || match[3] === "odd" );
	
				// other types prohibit arguments
				} else if ( match[3] ) {
					Sizzle.error( match[0] );
				}
	
				return match;
			},
	
			"PSEUDO": function( match ) {
				var excess,
					unquoted = !match[6] && match[2];
	
				if ( matchExpr["CHILD"].test( match[0] ) ) {
					return null;
				}
	
				// Accept quoted arguments as-is
				if ( match[3] ) {
					match[2] = match[4] || match[5] || "";
	
				// Strip excess characters from unquoted arguments
				} else if ( unquoted && rpseudo.test( unquoted ) &&
					// Get excess from tokenize (recursively)
					(excess = tokenize( unquoted, true )) &&
					// advance to the next closing parenthesis
					(excess = unquoted.indexOf( ")", unquoted.length - excess ) - unquoted.length) ) {
	
					// excess is a negative index
					match[0] = match[0].slice( 0, excess );
					match[2] = unquoted.slice( 0, excess );
				}
	
				// Return only captures needed by the pseudo filter method (type and argument)
				return match.slice( 0, 3 );
			}
		},
	
		filter: {
	
			"TAG": function( nodeNameSelector ) {
				var nodeName = nodeNameSelector.replace( runescape, funescape ).toLowerCase();
				return nodeNameSelector === "*" ?
					function() { return true; } :
					function( elem ) {
						return elem.nodeName && elem.nodeName.toLowerCase() === nodeName;
					};
			},
	
			"CLASS": function( className ) {
				var pattern = classCache[ className + " " ];
	
				return pattern ||
					(pattern = new RegExp( "(^|" + whitespace + ")" + className + "(" + whitespace + "|$)" )) &&
					classCache( className, function( elem ) {
						return pattern.test( typeof elem.className === "string" && elem.className || typeof elem.getAttribute !== "undefined" && elem.getAttribute("class") || "" );
					});
			},
	
			"ATTR": function( name, operator, check ) {
				return function( elem ) {
					var result = Sizzle.attr( elem, name );
	
					if ( result == null ) {
						return operator === "!=";
					}
					if ( !operator ) {
						return true;
					}
	
					result += "";
	
					return operator === "=" ? result === check :
						operator === "!=" ? result !== check :
						operator === "^=" ? check && result.indexOf( check ) === 0 :
						operator === "*=" ? check && result.indexOf( check ) > -1 :
						operator === "$=" ? check && result.slice( -check.length ) === check :
						operator === "~=" ? ( " " + result.replace( rwhitespace, " " ) + " " ).indexOf( check ) > -1 :
						operator === "|=" ? result === check || result.slice( 0, check.length + 1 ) === check + "-" :
						false;
				};
			},
	
			"CHILD": function( type, what, argument, first, last ) {
				var simple = type.slice( 0, 3 ) !== "nth",
					forward = type.slice( -4 ) !== "last",
					ofType = what === "of-type";
	
				return first === 1 && last === 0 ?
	
					// Shortcut for :nth-*(n)
					function( elem ) {
						return !!elem.parentNode;
					} :
	
					function( elem, context, xml ) {
						var cache, uniqueCache, outerCache, node, nodeIndex, start,
							dir = simple !== forward ? "nextSibling" : "previousSibling",
							parent = elem.parentNode,
							name = ofType && elem.nodeName.toLowerCase(),
							useCache = !xml && !ofType,
							diff = false;
	
						if ( parent ) {
	
							// :(first|last|only)-(child|of-type)
							if ( simple ) {
								while ( dir ) {
									node = elem;
									while ( (node = node[ dir ]) ) {
										if ( ofType ?
											node.nodeName.toLowerCase() === name :
											node.nodeType === 1 ) {
	
											return false;
										}
									}
									// Reverse direction for :only-* (if we haven't yet done so)
									start = dir = type === "only" && !start && "nextSibling";
								}
								return true;
							}
	
							start = [ forward ? parent.firstChild : parent.lastChild ];
	
							// non-xml :nth-child(...) stores cache data on `parent`
							if ( forward && useCache ) {
	
								// Seek `elem` from a previously-cached index
	
								// ...in a gzip-friendly way
								node = parent;
								outerCache = node[ expando ] || (node[ expando ] = {});
	
								// Support: IE <9 only
								// Defend against cloned attroperties (jQuery gh-1709)
								uniqueCache = outerCache[ node.uniqueID ] ||
									(outerCache[ node.uniqueID ] = {});
	
								cache = uniqueCache[ type ] || [];
								nodeIndex = cache[ 0 ] === dirruns && cache[ 1 ];
								diff = nodeIndex && cache[ 2 ];
								node = nodeIndex && parent.childNodes[ nodeIndex ];
	
								while ( (node = ++nodeIndex && node && node[ dir ] ||
	
									// Fallback to seeking `elem` from the start
									(diff = nodeIndex = 0) || start.pop()) ) {
	
									// When found, cache indexes on `parent` and break
									if ( node.nodeType === 1 && ++diff && node === elem ) {
										uniqueCache[ type ] = [ dirruns, nodeIndex, diff ];
										break;
									}
								}
	
							} else {
								// Use previously-cached element index if available
								if ( useCache ) {
									// ...in a gzip-friendly way
									node = elem;
									outerCache = node[ expando ] || (node[ expando ] = {});
	
									// Support: IE <9 only
									// Defend against cloned attroperties (jQuery gh-1709)
									uniqueCache = outerCache[ node.uniqueID ] ||
										(outerCache[ node.uniqueID ] = {});
	
									cache = uniqueCache[ type ] || [];
									nodeIndex = cache[ 0 ] === dirruns && cache[ 1 ];
									diff = nodeIndex;
								}
	
								// xml :nth-child(...)
								// or :nth-last-child(...) or :nth(-last)?-of-type(...)
								if ( diff === false ) {
									// Use the same loop as above to seek `elem` from the start
									while ( (node = ++nodeIndex && node && node[ dir ] ||
										(diff = nodeIndex = 0) || start.pop()) ) {
	
										if ( ( ofType ?
											node.nodeName.toLowerCase() === name :
											node.nodeType === 1 ) &&
											++diff ) {
	
											// Cache the index of each encountered element
											if ( useCache ) {
												outerCache = node[ expando ] || (node[ expando ] = {});
	
												// Support: IE <9 only
												// Defend against cloned attroperties (jQuery gh-1709)
												uniqueCache = outerCache[ node.uniqueID ] ||
													(outerCache[ node.uniqueID ] = {});
	
												uniqueCache[ type ] = [ dirruns, diff ];
											}
	
											if ( node === elem ) {
												break;
											}
										}
									}
								}
							}
	
							// Incorporate the offset, then check against cycle size
							diff -= last;
							return diff === first || ( diff % first === 0 && diff / first >= 0 );
						}
					};
			},
	
			"PSEUDO": function( pseudo, argument ) {
				// pseudo-class names are case-insensitive
				// http://www.w3.org/TR/selectors/#pseudo-classes
				// Prioritize by case sensitivity in case custom pseudos are added with uppercase letters
				// Remember that setFilters inherits from pseudos
				var args,
					fn = Expr.pseudos[ pseudo ] || Expr.setFilters[ pseudo.toLowerCase() ] ||
						Sizzle.error( "unsupported pseudo: " + pseudo );
	
				// The user may use createPseudo to indicate that
				// arguments are needed to create the filter function
				// just as Sizzle does
				if ( fn[ expando ] ) {
					return fn( argument );
				}
	
				// But maintain support for old signatures
				if ( fn.length > 1 ) {
					args = [ pseudo, pseudo, "", argument ];
					return Expr.setFilters.hasOwnProperty( pseudo.toLowerCase() ) ?
						markFunction(function( seed, matches ) {
							var idx,
								matched = fn( seed, argument ),
								i = matched.length;
							while ( i-- ) {
								idx = indexOf( seed, matched[i] );
								seed[ idx ] = !( matches[ idx ] = matched[i] );
							}
						}) :
						function( elem ) {
							return fn( elem, 0, args );
						};
				}
	
				return fn;
			}
		},
	
		pseudos: {
			// Potentially complex pseudos
			"not": markFunction(function( selector ) {
				// Trim the selector passed to compile
				// to avoid treating leading and trailing
				// spaces as combinators
				var input = [],
					results = [],
					matcher = compile( selector.replace( rtrim, "$1" ) );
	
				return matcher[ expando ] ?
					markFunction(function( seed, matches, context, xml ) {
						var elem,
							unmatched = matcher( seed, null, xml, [] ),
							i = seed.length;
	
						// Match elements unmatched by `matcher`
						while ( i-- ) {
							if ( (elem = unmatched[i]) ) {
								seed[i] = !(matches[i] = elem);
							}
						}
					}) :
					function( elem, context, xml ) {
						input[0] = elem;
						matcher( input, null, xml, results );
						// Don't keep the element (issue #299)
						input[0] = null;
						return !results.pop();
					};
			}),
	
			"has": markFunction(function( selector ) {
				return function( elem ) {
					return Sizzle( selector, elem ).length > 0;
				};
			}),
	
			"contains": markFunction(function( text ) {
				text = text.replace( runescape, funescape );
				return function( elem ) {
					return ( elem.textContent || elem.innerText || getText( elem ) ).indexOf( text ) > -1;
				};
			}),
	
			// "Whether an element is represented by a :lang() selector
			// is based solely on the element's language value
			// being equal to the identifier C,
			// or beginning with the identifier C immediately followed by "-".
			// The matching of C against the element's language value is performed case-insensitively.
			// The identifier C does not have to be a valid language name."
			// http://www.w3.org/TR/selectors/#lang-pseudo
			"lang": markFunction( function( lang ) {
				// lang value must be a valid identifier
				if ( !ridentifier.test(lang || "") ) {
					Sizzle.error( "unsupported lang: " + lang );
				}
				lang = lang.replace( runescape, funescape ).toLowerCase();
				return function( elem ) {
					var elemLang;
					do {
						if ( (elemLang = documentIsHTML ?
							elem.lang :
							elem.getAttribute("xml:lang") || elem.getAttribute("lang")) ) {
	
							elemLang = elemLang.toLowerCase();
							return elemLang === lang || elemLang.indexOf( lang + "-" ) === 0;
						}
					} while ( (elem = elem.parentNode) && elem.nodeType === 1 );
					return false;
				};
			}),
	
			// Miscellaneous
			"target": function( elem ) {
				var hash = window.location && window.location.hash;
				return hash && hash.slice( 1 ) === elem.id;
			},
	
			"root": function( elem ) {
				return elem === docElem;
			},
	
			"focus": function( elem ) {
				return elem === document.activeElement && (!document.hasFocus || document.hasFocus()) && !!(elem.type || elem.href || ~elem.tabIndex);
			},
	
			// Boolean properties
			"enabled": function( elem ) {
				return elem.disabled === false;
			},
	
			"disabled": function( elem ) {
				return elem.disabled === true;
			},
	
			"checked": function( elem ) {
				// In CSS3, :checked should return both checked and selected elements
				// http://www.w3.org/TR/2011/REC-css3-selectors-20110929/#checked
				var nodeName = elem.nodeName.toLowerCase();
				return (nodeName === "input" && !!elem.checked) || (nodeName === "option" && !!elem.selected);
			},
	
			"selected": function( elem ) {
				// Accessing this property makes selected-by-default
				// options in Safari work properly
				if ( elem.parentNode ) {
					elem.parentNode.selectedIndex;
				}
	
				return elem.selected === true;
			},
	
			// Contents
			"empty": function( elem ) {
				// http://www.w3.org/TR/selectors/#empty-pseudo
				// :empty is negated by element (1) or content nodes (text: 3; cdata: 4; entity ref: 5),
				//   but not by others (comment: 8; processing instruction: 7; etc.)
				// nodeType < 6 works because attributes (2) do not appear as children
				for ( elem = elem.firstChild; elem; elem = elem.nextSibling ) {
					if ( elem.nodeType < 6 ) {
						return false;
					}
				}
				return true;
			},
	
			"parent": function( elem ) {
				return !Expr.pseudos["empty"]( elem );
			},
	
			// Element/input types
			"header": function( elem ) {
				return rheader.test( elem.nodeName );
			},
	
			"input": function( elem ) {
				return rinputs.test( elem.nodeName );
			},
	
			"button": function( elem ) {
				var name = elem.nodeName.toLowerCase();
				return name === "input" && elem.type === "button" || name === "button";
			},
	
			"text": function( elem ) {
				var attr;
				return elem.nodeName.toLowerCase() === "input" &&
					elem.type === "text" &&
	
					// Support: IE<8
					// New HTML5 attribute values (e.g., "search") appear with elem.type === "text"
					( (attr = elem.getAttribute("type")) == null || attr.toLowerCase() === "text" );
			},
	
			// Position-in-collection
			"first": createPositionalPseudo(function() {
				return [ 0 ];
			}),
	
			"last": createPositionalPseudo(function( matchIndexes, length ) {
				return [ length - 1 ];
			}),
	
			"eq": createPositionalPseudo(function( matchIndexes, length, argument ) {
				return [ argument < 0 ? argument + length : argument ];
			}),
	
			"even": createPositionalPseudo(function( matchIndexes, length ) {
				var i = 0;
				for ( ; i < length; i += 2 ) {
					matchIndexes.push( i );
				}
				return matchIndexes;
			}),
	
			"odd": createPositionalPseudo(function( matchIndexes, length ) {
				var i = 1;
				for ( ; i < length; i += 2 ) {
					matchIndexes.push( i );
				}
				return matchIndexes;
			}),
	
			"lt": createPositionalPseudo(function( matchIndexes, length, argument ) {
				var i = argument < 0 ? argument + length : argument;
				for ( ; --i >= 0; ) {
					matchIndexes.push( i );
				}
				return matchIndexes;
			}),
	
			"gt": createPositionalPseudo(function( matchIndexes, length, argument ) {
				var i = argument < 0 ? argument + length : argument;
				for ( ; ++i < length; ) {
					matchIndexes.push( i );
				}
				return matchIndexes;
			})
		}
	};
	
	Expr.pseudos["nth"] = Expr.pseudos["eq"];
	
	// Add button/input type pseudos
	for ( i in { radio: true, checkbox: true, file: true, password: true, image: true } ) {
		Expr.pseudos[ i ] = createInputPseudo( i );
	}
	for ( i in { submit: true, reset: true } ) {
		Expr.pseudos[ i ] = createButtonPseudo( i );
	}
	
	// Easy API for creating new setFilters
	function setFilters() {}
	setFilters.prototype = Expr.filters = Expr.pseudos;
	Expr.setFilters = new setFilters();
	
	tokenize = Sizzle.tokenize = function( selector, parseOnly ) {
		var matched, match, tokens, type,
			soFar, groups, preFilters,
			cached = tokenCache[ selector + " " ];
	
		if ( cached ) {
			return parseOnly ? 0 : cached.slice( 0 );
		}
	
		soFar = selector;
		groups = [];
		preFilters = Expr.preFilter;
	
		while ( soFar ) {
	
			// Comma and first run
			if ( !matched || (match = rcomma.exec( soFar )) ) {
				if ( match ) {
					// Don't consume trailing commas as valid
					soFar = soFar.slice( match[0].length ) || soFar;
				}
				groups.push( (tokens = []) );
			}
	
			matched = false;
	
			// Combinators
			if ( (match = rcombinators.exec( soFar )) ) {
				matched = match.shift();
				tokens.push({
					value: matched,
					// Cast descendant combinators to space
					type: match[0].replace( rtrim, " " )
				});
				soFar = soFar.slice( matched.length );
			}
	
			// Filters
			for ( type in Expr.filter ) {
				if ( (match = matchExpr[ type ].exec( soFar )) && (!preFilters[ type ] ||
					(match = preFilters[ type ]( match ))) ) {
					matched = match.shift();
					tokens.push({
						value: matched,
						type: type,
						matches: match
					});
					soFar = soFar.slice( matched.length );
				}
			}
	
			if ( !matched ) {
				break;
			}
		}
	
		// Return the length of the invalid excess
		// if we're just parsing
		// Otherwise, throw an error or return tokens
		return parseOnly ?
			soFar.length :
			soFar ?
				Sizzle.error( selector ) :
				// Cache the tokens
				tokenCache( selector, groups ).slice( 0 );
	};
	
	function toSelector( tokens ) {
		var i = 0,
			len = tokens.length,
			selector = "";
		for ( ; i < len; i++ ) {
			selector += tokens[i].value;
		}
		return selector;
	}
	
	function addCombinator( matcher, combinator, base ) {
		var dir = combinator.dir,
			checkNonElements = base && dir === "parentNode",
			doneName = done++;
	
		return combinator.first ?
			// Check against closest ancestor/preceding element
			function( elem, context, xml ) {
				while ( (elem = elem[ dir ]) ) {
					if ( elem.nodeType === 1 || checkNonElements ) {
						return matcher( elem, context, xml );
					}
				}
			} :
	
			// Check against all ancestor/preceding elements
			function( elem, context, xml ) {
				var oldCache, uniqueCache, outerCache,
					newCache = [ dirruns, doneName ];
	
				// We can't set arbitrary data on XML nodes, so they don't benefit from combinator caching
				if ( xml ) {
					while ( (elem = elem[ dir ]) ) {
						if ( elem.nodeType === 1 || checkNonElements ) {
							if ( matcher( elem, context, xml ) ) {
								return true;
							}
						}
					}
				} else {
					while ( (elem = elem[ dir ]) ) {
						if ( elem.nodeType === 1 || checkNonElements ) {
							outerCache = elem[ expando ] || (elem[ expando ] = {});
	
							// Support: IE <9 only
							// Defend against cloned attroperties (jQuery gh-1709)
							uniqueCache = outerCache[ elem.uniqueID ] || (outerCache[ elem.uniqueID ] = {});
	
							if ( (oldCache = uniqueCache[ dir ]) &&
								oldCache[ 0 ] === dirruns && oldCache[ 1 ] === doneName ) {
	
								// Assign to newCache so results back-propagate to previous elements
								return (newCache[ 2 ] = oldCache[ 2 ]);
							} else {
								// Reuse newcache so results back-propagate to previous elements
								uniqueCache[ dir ] = newCache;
	
								// A match means we're done; a fail means we have to keep checking
								if ( (newCache[ 2 ] = matcher( elem, context, xml )) ) {
									return true;
								}
							}
						}
					}
				}
			};
	}
	
	function elementMatcher( matchers ) {
		return matchers.length > 1 ?
			function( elem, context, xml ) {
				var i = matchers.length;
				while ( i-- ) {
					if ( !matchers[i]( elem, context, xml ) ) {
						return false;
					}
				}
				return true;
			} :
			matchers[0];
	}
	
	function multipleContexts( selector, contexts, results ) {
		var i = 0,
			len = contexts.length;
		for ( ; i < len; i++ ) {
			Sizzle( selector, contexts[i], results );
		}
		return results;
	}
	
	function condense( unmatched, map, filter, context, xml ) {
		var elem,
			newUnmatched = [],
			i = 0,
			len = unmatched.length,
			mapped = map != null;
	
		for ( ; i < len; i++ ) {
			if ( (elem = unmatched[i]) ) {
				if ( !filter || filter( elem, context, xml ) ) {
					newUnmatched.push( elem );
					if ( mapped ) {
						map.push( i );
					}
				}
			}
		}
	
		return newUnmatched;
	}
	
	function setMatcher( preFilter, selector, matcher, postFilter, postFinder, postSelector ) {
		if ( postFilter && !postFilter[ expando ] ) {
			postFilter = setMatcher( postFilter );
		}
		if ( postFinder && !postFinder[ expando ] ) {
			postFinder = setMatcher( postFinder, postSelector );
		}
		return markFunction(function( seed, results, context, xml ) {
			var temp, i, elem,
				preMap = [],
				postMap = [],
				preexisting = results.length,
	
				// Get initial elements from seed or context
				elems = seed || multipleContexts( selector || "*", context.nodeType ? [ context ] : context, [] ),
	
				// Prefilter to get matcher input, preserving a map for seed-results synchronization
				matcherIn = preFilter && ( seed || !selector ) ?
					condense( elems, preMap, preFilter, context, xml ) :
					elems,
	
				matcherOut = matcher ?
					// If we have a postFinder, or filtered seed, or non-seed postFilter or preexisting results,
					postFinder || ( seed ? preFilter : preexisting || postFilter ) ?
	
						// ...intermediate processing is necessary
						[] :
	
						// ...otherwise use results directly
						results :
					matcherIn;
	
			// Find primary matches
			if ( matcher ) {
				matcher( matcherIn, matcherOut, context, xml );
			}
	
			// Apply postFilter
			if ( postFilter ) {
				temp = condense( matcherOut, postMap );
				postFilter( temp, [], context, xml );
	
				// Un-match failing elements by moving them back to matcherIn
				i = temp.length;
				while ( i-- ) {
					if ( (elem = temp[i]) ) {
						matcherOut[ postMap[i] ] = !(matcherIn[ postMap[i] ] = elem);
					}
				}
			}
	
			if ( seed ) {
				if ( postFinder || preFilter ) {
					if ( postFinder ) {
						// Get the final matcherOut by condensing this intermediate into postFinder contexts
						temp = [];
						i = matcherOut.length;
						while ( i-- ) {
							if ( (elem = matcherOut[i]) ) {
								// Restore matcherIn since elem is not yet a final match
								temp.push( (matcherIn[i] = elem) );
							}
						}
						postFinder( null, (matcherOut = []), temp, xml );
					}
	
					// Move matched elements from seed to results to keep them synchronized
					i = matcherOut.length;
					while ( i-- ) {
						if ( (elem = matcherOut[i]) &&
							(temp = postFinder ? indexOf( seed, elem ) : preMap[i]) > -1 ) {
	
							seed[temp] = !(results[temp] = elem);
						}
					}
				}
	
			// Add elements to results, through postFinder if defined
			} else {
				matcherOut = condense(
					matcherOut === results ?
						matcherOut.splice( preexisting, matcherOut.length ) :
						matcherOut
				);
				if ( postFinder ) {
					postFinder( null, results, matcherOut, xml );
				} else {
					push.apply( results, matcherOut );
				}
			}
		});
	}
	
	function matcherFromTokens( tokens ) {
		var checkContext, matcher, j,
			len = tokens.length,
			leadingRelative = Expr.relative[ tokens[0].type ],
			implicitRelative = leadingRelative || Expr.relative[" "],
			i = leadingRelative ? 1 : 0,
	
			// The foundational matcher ensures that elements are reachable from top-level context(s)
			matchContext = addCombinator( function( elem ) {
				return elem === checkContext;
			}, implicitRelative, true ),
			matchAnyContext = addCombinator( function( elem ) {
				return indexOf( checkContext, elem ) > -1;
			}, implicitRelative, true ),
			matchers = [ function( elem, context, xml ) {
				var ret = ( !leadingRelative && ( xml || context !== outermostContext ) ) || (
					(checkContext = context).nodeType ?
						matchContext( elem, context, xml ) :
						matchAnyContext( elem, context, xml ) );
				// Avoid hanging onto element (issue #299)
				checkContext = null;
				return ret;
			} ];
	
		for ( ; i < len; i++ ) {
			if ( (matcher = Expr.relative[ tokens[i].type ]) ) {
				matchers = [ addCombinator(elementMatcher( matchers ), matcher) ];
			} else {
				matcher = Expr.filter[ tokens[i].type ].apply( null, tokens[i].matches );
	
				// Return special upon seeing a positional matcher
				if ( matcher[ expando ] ) {
					// Find the next relative operator (if any) for proper handling
					j = ++i;
					for ( ; j < len; j++ ) {
						if ( Expr.relative[ tokens[j].type ] ) {
							break;
						}
					}
					return setMatcher(
						i > 1 && elementMatcher( matchers ),
						i > 1 && toSelector(
							// If the preceding token was a descendant combinator, insert an implicit any-element `*`
							tokens.slice( 0, i - 1 ).concat({ value: tokens[ i - 2 ].type === " " ? "*" : "" })
						).replace( rtrim, "$1" ),
						matcher,
						i < j && matcherFromTokens( tokens.slice( i, j ) ),
						j < len && matcherFromTokens( (tokens = tokens.slice( j )) ),
						j < len && toSelector( tokens )
					);
				}
				matchers.push( matcher );
			}
		}
	
		return elementMatcher( matchers );
	}
	
	function matcherFromGroupMatchers( elementMatchers, setMatchers ) {
		var bySet = setMatchers.length > 0,
			byElement = elementMatchers.length > 0,
			superMatcher = function( seed, context, xml, results, outermost ) {
				var elem, j, matcher,
					matchedCount = 0,
					i = "0",
					unmatched = seed && [],
					setMatched = [],
					contextBackup = outermostContext,
					// We must always have either seed elements or outermost context
					elems = seed || byElement && Expr.find["TAG"]( "*", outermost ),
					// Use integer dirruns iff this is the outermost matcher
					dirrunsUnique = (dirruns += contextBackup == null ? 1 : Math.random() || 0.1),
					len = elems.length;
	
				if ( outermost ) {
					outermostContext = context === document || context || outermost;
				}
	
				// Add elements passing elementMatchers directly to results
				// Support: IE<9, Safari
				// Tolerate NodeList properties (IE: "length"; Safari: <number>) matching elements by id
				for ( ; i !== len && (elem = elems[i]) != null; i++ ) {
					if ( byElement && elem ) {
						j = 0;
						if ( !context && elem.ownerDocument !== document ) {
							setDocument( elem );
							xml = !documentIsHTML;
						}
						while ( (matcher = elementMatchers[j++]) ) {
							if ( matcher( elem, context || document, xml) ) {
								results.push( elem );
								break;
							}
						}
						if ( outermost ) {
							dirruns = dirrunsUnique;
						}
					}
	
					// Track unmatched elements for set filters
					if ( bySet ) {
						// They will have gone through all possible matchers
						if ( (elem = !matcher && elem) ) {
							matchedCount--;
						}
	
						// Lengthen the array for every element, matched or not
						if ( seed ) {
							unmatched.push( elem );
						}
					}
				}
	
				// `i` is now the count of elements visited above, and adding it to `matchedCount`
				// makes the latter nonnegative.
				matchedCount += i;
	
				// Apply set filters to unmatched elements
				// NOTE: This can be skipped if there are no unmatched elements (i.e., `matchedCount`
				// equals `i`), unless we didn't visit _any_ elements in the above loop because we have
				// no element matchers and no seed.
				// Incrementing an initially-string "0" `i` allows `i` to remain a string only in that
				// case, which will result in a "00" `matchedCount` that differs from `i` but is also
				// numerically zero.
				if ( bySet && i !== matchedCount ) {
					j = 0;
					while ( (matcher = setMatchers[j++]) ) {
						matcher( unmatched, setMatched, context, xml );
					}
	
					if ( seed ) {
						// Reintegrate element matches to eliminate the need for sorting
						if ( matchedCount > 0 ) {
							while ( i-- ) {
								if ( !(unmatched[i] || setMatched[i]) ) {
									setMatched[i] = pop.call( results );
								}
							}
						}
	
						// Discard index placeholder values to get only actual matches
						setMatched = condense( setMatched );
					}
	
					// Add matches to results
					push.apply( results, setMatched );
	
					// Seedless set matches succeeding multiple successful matchers stipulate sorting
					if ( outermost && !seed && setMatched.length > 0 &&
						( matchedCount + setMatchers.length ) > 1 ) {
	
						Sizzle.uniqueSort( results );
					}
				}
	
				// Override manipulation of globals by nested matchers
				if ( outermost ) {
					dirruns = dirrunsUnique;
					outermostContext = contextBackup;
				}
	
				return unmatched;
			};
	
		return bySet ?
			markFunction( superMatcher ) :
			superMatcher;
	}
	
	compile = Sizzle.compile = function( selector, match /* Internal Use Only */ ) {
		var i,
			setMatchers = [],
			elementMatchers = [],
			cached = compilerCache[ selector + " " ];
	
		if ( !cached ) {
			// Generate a function of recursive functions that can be used to check each element
			if ( !match ) {
				match = tokenize( selector );
			}
			i = match.length;
			while ( i-- ) {
				cached = matcherFromTokens( match[i] );
				if ( cached[ expando ] ) {
					setMatchers.push( cached );
				} else {
					elementMatchers.push( cached );
				}
			}
	
			// Cache the compiled function
			cached = compilerCache( selector, matcherFromGroupMatchers( elementMatchers, setMatchers ) );
	
			// Save selector and tokenization
			cached.selector = selector;
		}
		return cached;
	};
	
	/**
	 * A low-level selection function that works with Sizzle's compiled
	 *  selector functions
	 * @param {String|Function} selector A selector or a pre-compiled
	 *  selector function built with Sizzle.compile
	 * @param {Element} context
	 * @param {Array} [results]
	 * @param {Array} [seed] A set of elements to match against
	 */
	select = Sizzle.select = function( selector, context, results, seed ) {
		var i, tokens, token, type, find,
			compiled = typeof selector === "function" && selector,
			match = !seed && tokenize( (selector = compiled.selector || selector) );
	
		results = results || [];
	
		// Try to minimize operations if there is only one selector in the list and no seed
		// (the latter of which guarantees us context)
		if ( match.length === 1 ) {
	
			// Reduce context if the leading compound selector is an ID
			tokens = match[0] = match[0].slice( 0 );
			if ( tokens.length > 2 && (token = tokens[0]).type === "ID" &&
					support.getById && context.nodeType === 9 && documentIsHTML &&
					Expr.relative[ tokens[1].type ] ) {
	
				context = ( Expr.find["ID"]( token.matches[0].replace(runescape, funescape), context ) || [] )[0];
				if ( !context ) {
					return results;
	
				// Precompiled matchers will still verify ancestry, so step up a level
				} else if ( compiled ) {
					context = context.parentNode;
				}
	
				selector = selector.slice( tokens.shift().value.length );
			}
	
			// Fetch a seed set for right-to-left matching
			i = matchExpr["needsContext"].test( selector ) ? 0 : tokens.length;
			while ( i-- ) {
				token = tokens[i];
	
				// Abort if we hit a combinator
				if ( Expr.relative[ (type = token.type) ] ) {
					break;
				}
				if ( (find = Expr.find[ type ]) ) {
					// Search, expanding context for leading sibling combinators
					if ( (seed = find(
						token.matches[0].replace( runescape, funescape ),
						rsibling.test( tokens[0].type ) && testContext( context.parentNode ) || context
					)) ) {
	
						// If seed is empty or no tokens remain, we can return early
						tokens.splice( i, 1 );
						selector = seed.length && toSelector( tokens );
						if ( !selector ) {
							push.apply( results, seed );
							return results;
						}
	
						break;
					}
				}
			}
		}
	
		// Compile and execute a filtering function if one is not provided
		// Provide `match` to avoid retokenization if we modified the selector above
		( compiled || compile( selector, match ) )(
			seed,
			context,
			!documentIsHTML,
			results,
			!context || rsibling.test( selector ) && testContext( context.parentNode ) || context
		);
		return results;
	};
	
	// One-time assignments
	
	// Sort stability
	support.sortStable = expando.split("").sort( sortOrder ).join("") === expando;
	
	// Support: Chrome 14-35+
	// Always assume duplicates if they aren't passed to the comparison function
	support.detectDuplicates = !!hasDuplicate;
	
	// Initialize against the default document
	setDocument();
	
	// Support: Webkit<537.32 - Safari 6.0.3/Chrome 25 (fixed in Chrome 27)
	// Detached nodes confoundingly follow *each other*
	support.sortDetached = assert(function( div1 ) {
		// Should return 1, but returns 4 (following)
		return div1.compareDocumentPosition( document.createElement("div") ) & 1;
	});
	
	// Support: IE<8
	// Prevent attribute/property "interpolation"
	// http://msdn.microsoft.com/en-us/library/ms536429%28VS.85%29.aspx
	if ( !assert(function( div ) {
		div.innerHTML = "<a href='#'></a>";
		return div.firstChild.getAttribute("href") === "#" ;
	}) ) {
		addHandle( "type|href|height|width", function( elem, name, isXML ) {
			if ( !isXML ) {
				return elem.getAttribute( name, name.toLowerCase() === "type" ? 1 : 2 );
			}
		});
	}
	
	// Support: IE<9
	// Use defaultValue in place of getAttribute("value")
	if ( !support.attributes || !assert(function( div ) {
		div.innerHTML = "<input/>";
		div.firstChild.setAttribute( "value", "" );
		return div.firstChild.getAttribute( "value" ) === "";
	}) ) {
		addHandle( "value", function( elem, name, isXML ) {
			if ( !isXML && elem.nodeName.toLowerCase() === "input" ) {
				return elem.defaultValue;
			}
		});
	}
	
	// Support: IE<9
	// Use getAttributeNode to fetch booleans when getAttribute lies
	if ( !assert(function( div ) {
		return div.getAttribute("disabled") == null;
	}) ) {
		addHandle( booleans, function( elem, name, isXML ) {
			var val;
			if ( !isXML ) {
				return elem[ name ] === true ? name.toLowerCase() :
						(val = elem.getAttributeNode( name )) && val.specified ?
						val.value :
					null;
			}
		});
	}
	
	return Sizzle;
	
	})( window );
	
	
	
	jQuery.find = Sizzle;
	jQuery.expr = Sizzle.selectors;
	jQuery.expr[ ":" ] = jQuery.expr.pseudos;
	jQuery.uniqueSort = jQuery.unique = Sizzle.uniqueSort;
	jQuery.text = Sizzle.getText;
	jQuery.isXMLDoc = Sizzle.isXML;
	jQuery.contains = Sizzle.contains;
	
	
	
	var dir = function( elem, dir, until ) {
		var matched = [],
			truncate = until !== undefined;
	
		while ( ( elem = elem[ dir ] ) && elem.nodeType !== 9 ) {
			if ( elem.nodeType === 1 ) {
				if ( truncate && jQuery( elem ).is( until ) ) {
					break;
				}
				matched.push( elem );
			}
		}
		return matched;
	};
	
	
	var siblings = function( n, elem ) {
		var matched = [];
	
		for ( ; n; n = n.nextSibling ) {
			if ( n.nodeType === 1 && n !== elem ) {
				matched.push( n );
			}
		}
	
		return matched;
	};
	
	
	var rneedsContext = jQuery.expr.match.needsContext;
	
	var rsingleTag = ( /^<([\w-]+)\s*\/?>(?:<\/\1>|)$/ );
	
	
	
	var risSimple = /^.[^:#\[\.,]*$/;
	
	// Implement the identical functionality for filter and not
	function winnow( elements, qualifier, not ) {
		if ( jQuery.isFunction( qualifier ) ) {
			return jQuery.grep( elements, function( elem, i ) {
				/* jshint -W018 */
				return !!qualifier.call( elem, i, elem ) !== not;
			} );
	
		}
	
		if ( qualifier.nodeType ) {
			return jQuery.grep( elements, function( elem ) {
				return ( elem === qualifier ) !== not;
			} );
	
		}
	
		if ( typeof qualifier === "string" ) {
			if ( risSimple.test( qualifier ) ) {
				return jQuery.filter( qualifier, elements, not );
			}
	
			qualifier = jQuery.filter( qualifier, elements );
		}
	
		return jQuery.grep( elements, function( elem ) {
			return ( indexOf.call( qualifier, elem ) > -1 ) !== not;
		} );
	}
	
	jQuery.filter = function( expr, elems, not ) {
		var elem = elems[ 0 ];
	
		if ( not ) {
			expr = ":not(" + expr + ")";
		}
	
		return elems.length === 1 && elem.nodeType === 1 ?
			jQuery.find.matchesSelector( elem, expr ) ? [ elem ] : [] :
			jQuery.find.matches( expr, jQuery.grep( elems, function( elem ) {
				return elem.nodeType === 1;
			} ) );
	};
	
	jQuery.fn.extend( {
		find: function( selector ) {
			var i,
				len = this.length,
				ret = [],
				self = this;
	
			if ( typeof selector !== "string" ) {
				return this.pushStack( jQuery( selector ).filter( function() {
					for ( i = 0; i < len; i++ ) {
						if ( jQuery.contains( self[ i ], this ) ) {
							return true;
						}
					}
				} ) );
			}
	
			for ( i = 0; i < len; i++ ) {
				jQuery.find( selector, self[ i ], ret );
			}
	
			// Needed because $( selector, context ) becomes $( context ).find( selector )
			ret = this.pushStack( len > 1 ? jQuery.unique( ret ) : ret );
			ret.selector = this.selector ? this.selector + " " + selector : selector;
			return ret;
		},
		filter: function( selector ) {
			return this.pushStack( winnow( this, selector || [], false ) );
		},
		not: function( selector ) {
			return this.pushStack( winnow( this, selector || [], true ) );
		},
		is: function( selector ) {
			return !!winnow(
				this,
	
				// If this is a positional/relative selector, check membership in the returned set
				// so $("p:first").is("p:last") won't return true for a doc with two "p".
				typeof selector === "string" && rneedsContext.test( selector ) ?
					jQuery( selector ) :
					selector || [],
				false
			).length;
		}
	} );
	
	
	// Initialize a jQuery object
	
	
	// A central reference to the root jQuery(document)
	var rootjQuery,
	
		// A simple way to check for HTML strings
		// Prioritize #id over <tag> to avoid XSS via location.hash (#9521)
		// Strict HTML recognition (#11290: must start with <)
		rquickExpr = /^(?:\s*(<[\w\W]+>)[^>]*|#([\w-]*))$/,
	
		init = jQuery.fn.init = function( selector, context, root ) {
			var match, elem;
	
			// HANDLE: $(""), $(null), $(undefined), $(false)
			if ( !selector ) {
				return this;
			}
	
			// Method init() accepts an alternate rootjQuery
			// so migrate can support jQuery.sub (gh-2101)
			root = root || rootjQuery;
	
			// Handle HTML strings
			if ( typeof selector === "string" ) {
				if ( selector[ 0 ] === "<" &&
					selector[ selector.length - 1 ] === ">" &&
					selector.length >= 3 ) {
	
					// Assume that strings that start and end with <> are HTML and skip the regex check
					match = [ null, selector, null ];
	
				} else {
					match = rquickExpr.exec( selector );
				}
	
				// Match html or make sure no context is specified for #id
				if ( match && ( match[ 1 ] || !context ) ) {
	
					// HANDLE: $(html) -> $(array)
					if ( match[ 1 ] ) {
						context = context instanceof jQuery ? context[ 0 ] : context;
	
						// Option to run scripts is true for back-compat
						// Intentionally let the error be thrown if parseHTML is not present
						jQuery.merge( this, jQuery.parseHTML(
							match[ 1 ],
							context && context.nodeType ? context.ownerDocument || context : document,
							true
						) );
	
						// HANDLE: $(html, props)
						if ( rsingleTag.test( match[ 1 ] ) && jQuery.isPlainObject( context ) ) {
							for ( match in context ) {
	
								// Properties of context are called as methods if possible
								if ( jQuery.isFunction( this[ match ] ) ) {
									this[ match ]( context[ match ] );
	
								// ...and otherwise set as attributes
								} else {
									this.attr( match, context[ match ] );
								}
							}
						}
	
						return this;
	
					// HANDLE: $(#id)
					} else {
						elem = document.getElementById( match[ 2 ] );
	
						// Support: Blackberry 4.6
						// gEBID returns nodes no longer in the document (#6963)
						if ( elem && elem.parentNode ) {
	
							// Inject the element directly into the jQuery object
							this.length = 1;
							this[ 0 ] = elem;
						}
	
						this.context = document;
						this.selector = selector;
						return this;
					}
	
				// HANDLE: $(expr, $(...))
				} else if ( !context || context.jquery ) {
					return ( context || root ).find( selector );
	
				// HANDLE: $(expr, context)
				// (which is just equivalent to: $(context).find(expr)
				} else {
					return this.constructor( context ).find( selector );
				}
	
			// HANDLE: $(DOMElement)
			} else if ( selector.nodeType ) {
				this.context = this[ 0 ] = selector;
				this.length = 1;
				return this;
	
			// HANDLE: $(function)
			// Shortcut for document ready
			} else if ( jQuery.isFunction( selector ) ) {
				return root.ready !== undefined ?
					root.ready( selector ) :
	
					// Execute immediately if ready is not present
					selector( jQuery );
			}
	
			if ( selector.selector !== undefined ) {
				this.selector = selector.selector;
				this.context = selector.context;
			}
	
			return jQuery.makeArray( selector, this );
		};
	
	// Give the init function the jQuery prototype for later instantiation
	init.prototype = jQuery.fn;
	
	// Initialize central reference
	rootjQuery = jQuery( document );
	
	
	var rparentsprev = /^(?:parents|prev(?:Until|All))/,
	
		// Methods guaranteed to produce a unique set when starting from a unique set
		guaranteedUnique = {
			children: true,
			contents: true,
			next: true,
			prev: true
		};
	
	jQuery.fn.extend( {
		has: function( target ) {
			var targets = jQuery( target, this ),
				l = targets.length;
	
			return this.filter( function() {
				var i = 0;
				for ( ; i < l; i++ ) {
					if ( jQuery.contains( this, targets[ i ] ) ) {
						return true;
					}
				}
			} );
		},
	
		closest: function( selectors, context ) {
			var cur,
				i = 0,
				l = this.length,
				matched = [],
				pos = rneedsContext.test( selectors ) || typeof selectors !== "string" ?
					jQuery( selectors, context || this.context ) :
					0;
	
			for ( ; i < l; i++ ) {
				for ( cur = this[ i ]; cur && cur !== context; cur = cur.parentNode ) {
	
					// Always skip document fragments
					if ( cur.nodeType < 11 && ( pos ?
						pos.index( cur ) > -1 :
	
						// Don't pass non-elements to Sizzle
						cur.nodeType === 1 &&
							jQuery.find.matchesSelector( cur, selectors ) ) ) {
	
						matched.push( cur );
						break;
					}
				}
			}
	
			return this.pushStack( matched.length > 1 ? jQuery.uniqueSort( matched ) : matched );
		},
	
		// Determine the position of an element within the set
		index: function( elem ) {
	
			// No argument, return index in parent
			if ( !elem ) {
				return ( this[ 0 ] && this[ 0 ].parentNode ) ? this.first().prevAll().length : -1;
			}
	
			// Index in selector
			if ( typeof elem === "string" ) {
				return indexOf.call( jQuery( elem ), this[ 0 ] );
			}
	
			// Locate the position of the desired element
			return indexOf.call( this,
	
				// If it receives a jQuery object, the first element is used
				elem.jquery ? elem[ 0 ] : elem
			);
		},
	
		add: function( selector, context ) {
			return this.pushStack(
				jQuery.uniqueSort(
					jQuery.merge( this.get(), jQuery( selector, context ) )
				)
			);
		},
	
		addBack: function( selector ) {
			return this.add( selector == null ?
				this.prevObject : this.prevObject.filter( selector )
			);
		}
	} );
	
	function sibling( cur, dir ) {
		while ( ( cur = cur[ dir ] ) && cur.nodeType !== 1 ) {}
		return cur;
	}
	
	jQuery.each( {
		parent: function( elem ) {
			var parent = elem.parentNode;
			return parent && parent.nodeType !== 11 ? parent : null;
		},
		parents: function( elem ) {
			return dir( elem, "parentNode" );
		},
		parentsUntil: function( elem, i, until ) {
			return dir( elem, "parentNode", until );
		},
		next: function( elem ) {
			return sibling( elem, "nextSibling" );
		},
		prev: function( elem ) {
			return sibling( elem, "previousSibling" );
		},
		nextAll: function( elem ) {
			return dir( elem, "nextSibling" );
		},
		prevAll: function( elem ) {
			return dir( elem, "previousSibling" );
		},
		nextUntil: function( elem, i, until ) {
			return dir( elem, "nextSibling", until );
		},
		prevUntil: function( elem, i, until ) {
			return dir( elem, "previousSibling", until );
		},
		siblings: function( elem ) {
			return siblings( ( elem.parentNode || {} ).firstChild, elem );
		},
		children: function( elem ) {
			return siblings( elem.firstChild );
		},
		contents: function( elem ) {
			return elem.contentDocument || jQuery.merge( [], elem.childNodes );
		}
	}, function( name, fn ) {
		jQuery.fn[ name ] = function( until, selector ) {
			var matched = jQuery.map( this, fn, until );
	
			if ( name.slice( -5 ) !== "Until" ) {
				selector = until;
			}
	
			if ( selector && typeof selector === "string" ) {
				matched = jQuery.filter( selector, matched );
			}
	
			if ( this.length > 1 ) {
	
				// Remove duplicates
				if ( !guaranteedUnique[ name ] ) {
					jQuery.uniqueSort( matched );
				}
	
				// Reverse order for parents* and prev-derivatives
				if ( rparentsprev.test( name ) ) {
					matched.reverse();
				}
			}
	
			return this.pushStack( matched );
		};
	} );
	var rnotwhite = ( /\S+/g );
	
	
	
	// Convert String-formatted options into Object-formatted ones
	function createOptions( options ) {
		var object = {};
		jQuery.each( options.match( rnotwhite ) || [], function( _, flag ) {
			object[ flag ] = true;
		} );
		return object;
	}
	
	/*
	 * Create a callback list using the following parameters:
	 *
	 *	options: an optional list of space-separated options that will change how
	 *			the callback list behaves or a more traditional option object
	 *
	 * By default a callback list will act like an event callback list and can be
	 * "fired" multiple times.
	 *
	 * Possible options:
	 *
	 *	once:			will ensure the callback list can only be fired once (like a Deferred)
	 *
	 *	memory:			will keep track of previous values and will call any callback added
	 *					after the list has been fired right away with the latest "memorized"
	 *					values (like a Deferred)
	 *
	 *	unique:			will ensure a callback can only be added once (no duplicate in the list)
	 *
	 *	stopOnFalse:	interrupt callings when a callback returns false
	 *
	 */
	jQuery.Callbacks = function( options ) {
	
		// Convert options from String-formatted to Object-formatted if needed
		// (we check in cache first)
		options = typeof options === "string" ?
			createOptions( options ) :
			jQuery.extend( {}, options );
	
		var // Flag to know if list is currently firing
			firing,
	
			// Last fire value for non-forgettable lists
			memory,
	
			// Flag to know if list was already fired
			fired,
	
			// Flag to prevent firing
			locked,
	
			// Actual callback list
			list = [],
	
			// Queue of execution data for repeatable lists
			queue = [],
	
			// Index of currently firing callback (modified by add/remove as needed)
			firingIndex = -1,
	
			// Fire callbacks
			fire = function() {
	
				// Enforce single-firing
				locked = options.once;
	
				// Execute callbacks for all pending executions,
				// respecting firingIndex overrides and runtime changes
				fired = firing = true;
				for ( ; queue.length; firingIndex = -1 ) {
					memory = queue.shift();
					while ( ++firingIndex < list.length ) {
	
						// Run callback and check for early termination
						if ( list[ firingIndex ].apply( memory[ 0 ], memory[ 1 ] ) === false &&
							options.stopOnFalse ) {
	
							// Jump to end and forget the data so .add doesn't re-fire
							firingIndex = list.length;
							memory = false;
						}
					}
				}
	
				// Forget the data if we're done with it
				if ( !options.memory ) {
					memory = false;
				}
	
				firing = false;
	
				// Clean up if we're done firing for good
				if ( locked ) {
	
					// Keep an empty list if we have data for future add calls
					if ( memory ) {
						list = [];
	
					// Otherwise, this object is spent
					} else {
						list = "";
					}
				}
			},
	
			// Actual Callbacks object
			self = {
	
				// Add a callback or a collection of callbacks to the list
				add: function() {
					if ( list ) {
	
						// If we have memory from a past run, we should fire after adding
						if ( memory && !firing ) {
							firingIndex = list.length - 1;
							queue.push( memory );
						}
	
						( function add( args ) {
							jQuery.each( args, function( _, arg ) {
								if ( jQuery.isFunction( arg ) ) {
									if ( !options.unique || !self.has( arg ) ) {
										list.push( arg );
									}
								} else if ( arg && arg.length && jQuery.type( arg ) !== "string" ) {
	
									// Inspect recursively
									add( arg );
								}
							} );
						} )( arguments );
	
						if ( memory && !firing ) {
							fire();
						}
					}
					return this;
				},
	
				// Remove a callback from the list
				remove: function() {
					jQuery.each( arguments, function( _, arg ) {
						var index;
						while ( ( index = jQuery.inArray( arg, list, index ) ) > -1 ) {
							list.splice( index, 1 );
	
							// Handle firing indexes
							if ( index <= firingIndex ) {
								firingIndex--;
							}
						}
					} );
					return this;
				},
	
				// Check if a given callback is in the list.
				// If no argument is given, return whether or not list has callbacks attached.
				has: function( fn ) {
					return fn ?
						jQuery.inArray( fn, list ) > -1 :
						list.length > 0;
				},
	
				// Remove all callbacks from the list
				empty: function() {
					if ( list ) {
						list = [];
					}
					return this;
				},
	
				// Disable .fire and .add
				// Abort any current/pending executions
				// Clear all callbacks and values
				disable: function() {
					locked = queue = [];
					list = memory = "";
					return this;
				},
				disabled: function() {
					return !list;
				},
	
				// Disable .fire
				// Also disable .add unless we have memory (since it would have no effect)
				// Abort any pending executions
				lock: function() {
					locked = queue = [];
					if ( !memory ) {
						list = memory = "";
					}
					return this;
				},
				locked: function() {
					return !!locked;
				},
	
				// Call all callbacks with the given context and arguments
				fireWith: function( context, args ) {
					if ( !locked ) {
						args = args || [];
						args = [ context, args.slice ? args.slice() : args ];
						queue.push( args );
						if ( !firing ) {
							fire();
						}
					}
					return this;
				},
	
				// Call all the callbacks with the given arguments
				fire: function() {
					self.fireWith( this, arguments );
					return this;
				},
	
				// To know if the callbacks have already been called at least once
				fired: function() {
					return !!fired;
				}
			};
	
		return self;
	};
	
	
	jQuery.extend( {
	
		Deferred: function( func ) {
			var tuples = [
	
					// action, add listener, listener list, final state
					[ "resolve", "done", jQuery.Callbacks( "once memory" ), "resolved" ],
					[ "reject", "fail", jQuery.Callbacks( "once memory" ), "rejected" ],
					[ "notify", "progress", jQuery.Callbacks( "memory" ) ]
				],
				state = "pending",
				promise = {
					state: function() {
						return state;
					},
					always: function() {
						deferred.done( arguments ).fail( arguments );
						return this;
					},
					then: function( /* fnDone, fnFail, fnProgress */ ) {
						var fns = arguments;
						return jQuery.Deferred( function( newDefer ) {
							jQuery.each( tuples, function( i, tuple ) {
								var fn = jQuery.isFunction( fns[ i ] ) && fns[ i ];
	
								// deferred[ done | fail | progress ] for forwarding actions to newDefer
								deferred[ tuple[ 1 ] ]( function() {
									var returned = fn && fn.apply( this, arguments );
									if ( returned && jQuery.isFunction( returned.promise ) ) {
										returned.promise()
											.progress( newDefer.notify )
											.done( newDefer.resolve )
											.fail( newDefer.reject );
									} else {
										newDefer[ tuple[ 0 ] + "With" ](
											this === promise ? newDefer.promise() : this,
											fn ? [ returned ] : arguments
										);
									}
								} );
							} );
							fns = null;
						} ).promise();
					},
	
					// Get a promise for this deferred
					// If obj is provided, the promise aspect is added to the object
					promise: function( obj ) {
						return obj != null ? jQuery.extend( obj, promise ) : promise;
					}
				},
				deferred = {};
	
			// Keep pipe for back-compat
			promise.pipe = promise.then;
	
			// Add list-specific methods
			jQuery.each( tuples, function( i, tuple ) {
				var list = tuple[ 2 ],
					stateString = tuple[ 3 ];
	
				// promise[ done | fail | progress ] = list.add
				promise[ tuple[ 1 ] ] = list.add;
	
				// Handle state
				if ( stateString ) {
					list.add( function() {
	
						// state = [ resolved | rejected ]
						state = stateString;
	
					// [ reject_list | resolve_list ].disable; progress_list.lock
					}, tuples[ i ^ 1 ][ 2 ].disable, tuples[ 2 ][ 2 ].lock );
				}
	
				// deferred[ resolve | reject | notify ]
				deferred[ tuple[ 0 ] ] = function() {
					deferred[ tuple[ 0 ] + "With" ]( this === deferred ? promise : this, arguments );
					return this;
				};
				deferred[ tuple[ 0 ] + "With" ] = list.fireWith;
			} );
	
			// Make the deferred a promise
			promise.promise( deferred );
	
			// Call given func if any
			if ( func ) {
				func.call( deferred, deferred );
			}
	
			// All done!
			return deferred;
		},
	
		// Deferred helper
		when: function( subordinate /* , ..., subordinateN */ ) {
			var i = 0,
				resolveValues = slice.call( arguments ),
				length = resolveValues.length,
	
				// the count of uncompleted subordinates
				remaining = length !== 1 ||
					( subordinate && jQuery.isFunction( subordinate.promise ) ) ? length : 0,
	
				// the master Deferred.
				// If resolveValues consist of only a single Deferred, just use that.
				deferred = remaining === 1 ? subordinate : jQuery.Deferred(),
	
				// Update function for both resolve and progress values
				updateFunc = function( i, contexts, values ) {
					return function( value ) {
						contexts[ i ] = this;
						values[ i ] = arguments.length > 1 ? slice.call( arguments ) : value;
						if ( values === progressValues ) {
							deferred.notifyWith( contexts, values );
						} else if ( !( --remaining ) ) {
							deferred.resolveWith( contexts, values );
						}
					};
				},
	
				progressValues, progressContexts, resolveContexts;
	
			// Add listeners to Deferred subordinates; treat others as resolved
			if ( length > 1 ) {
				progressValues = new Array( length );
				progressContexts = new Array( length );
				resolveContexts = new Array( length );
				for ( ; i < length; i++ ) {
					if ( resolveValues[ i ] && jQuery.isFunction( resolveValues[ i ].promise ) ) {
						resolveValues[ i ].promise()
							.progress( updateFunc( i, progressContexts, progressValues ) )
							.done( updateFunc( i, resolveContexts, resolveValues ) )
							.fail( deferred.reject );
					} else {
						--remaining;
					}
				}
			}
	
			// If we're not waiting on anything, resolve the master
			if ( !remaining ) {
				deferred.resolveWith( resolveContexts, resolveValues );
			}
	
			return deferred.promise();
		}
	} );
	
	
	// The deferred used on DOM ready
	var readyList;
	
	jQuery.fn.ready = function( fn ) {
	
		// Add the callback
		jQuery.ready.promise().done( fn );
	
		return this;
	};
	
	jQuery.extend( {
	
		// Is the DOM ready to be used? Set to true once it occurs.
		isReady: false,
	
		// A counter to track how many items to wait for before
		// the ready event fires. See #6781
		readyWait: 1,
	
		// Hold (or release) the ready event
		holdReady: function( hold ) {
			if ( hold ) {
				jQuery.readyWait++;
			} else {
				jQuery.ready( true );
			}
		},
	
		// Handle when the DOM is ready
		ready: function( wait ) {
	
			// Abort if there are pending holds or we're already ready
			if ( wait === true ? --jQuery.readyWait : jQuery.isReady ) {
				return;
			}
	
			// Remember that the DOM is ready
			jQuery.isReady = true;
	
			// If a normal DOM Ready event fired, decrement, and wait if need be
			if ( wait !== true && --jQuery.readyWait > 0 ) {
				return;
			}
	
			// If there are functions bound, to execute
			readyList.resolveWith( document, [ jQuery ] );
	
			// Trigger any bound ready events
			if ( jQuery.fn.triggerHandler ) {
				jQuery( document ).triggerHandler( "ready" );
				jQuery( document ).off( "ready" );
			}
		}
	} );
	
	/**
	 * The ready event handler and self cleanup method
	 */
	function completed() {
		document.removeEventListener( "DOMContentLoaded", completed );
		window.removeEventListener( "load", completed );
		jQuery.ready();
	}
	
	jQuery.ready.promise = function( obj ) {
		if ( !readyList ) {
	
			readyList = jQuery.Deferred();
	
			// Catch cases where $(document).ready() is called
			// after the browser event has already occurred.
			// Support: IE9-10 only
			// Older IE sometimes signals "interactive" too soon
			if ( document.readyState === "complete" ||
				( document.readyState !== "loading" && !document.documentElement.doScroll ) ) {
	
				// Handle it asynchronously to allow scripts the opportunity to delay ready
				window.setTimeout( jQuery.ready );
	
			} else {
	
				// Use the handy event callback
				document.addEventListener( "DOMContentLoaded", completed );
	
				// A fallback to window.onload, that will always work
				window.addEventListener( "load", completed );
			}
		}
		return readyList.promise( obj );
	};
	
	// Kick off the DOM ready check even if the user does not
	jQuery.ready.promise();
	
	
	
	
	// Multifunctional method to get and set values of a collection
	// The value/s can optionally be executed if it's a function
	var access = function( elems, fn, key, value, chainable, emptyGet, raw ) {
		var i = 0,
			len = elems.length,
			bulk = key == null;
	
		// Sets many values
		if ( jQuery.type( key ) === "object" ) {
			chainable = true;
			for ( i in key ) {
				access( elems, fn, i, key[ i ], true, emptyGet, raw );
			}
	
		// Sets one value
		} else if ( value !== undefined ) {
			chainable = true;
	
			if ( !jQuery.isFunction( value ) ) {
				raw = true;
			}
	
			if ( bulk ) {
	
				// Bulk operations run against the entire set
				if ( raw ) {
					fn.call( elems, value );
					fn = null;
	
				// ...except when executing function values
				} else {
					bulk = fn;
					fn = function( elem, key, value ) {
						return bulk.call( jQuery( elem ), value );
					};
				}
			}
	
			if ( fn ) {
				for ( ; i < len; i++ ) {
					fn(
						elems[ i ], key, raw ?
						value :
						value.call( elems[ i ], i, fn( elems[ i ], key ) )
					);
				}
			}
		}
	
		return chainable ?
			elems :
	
			// Gets
			bulk ?
				fn.call( elems ) :
				len ? fn( elems[ 0 ], key ) : emptyGet;
	};
	var acceptData = function( owner ) {
	
		// Accepts only:
		//  - Node
		//    - Node.ELEMENT_NODE
		//    - Node.DOCUMENT_NODE
		//  - Object
		//    - Any
		/* jshint -W018 */
		return owner.nodeType === 1 || owner.nodeType === 9 || !( +owner.nodeType );
	};
	
	
	
	
	function Data() {
		this.expando = jQuery.expando + Data.uid++;
	}
	
	Data.uid = 1;
	
	Data.prototype = {
	
		register: function( owner, initial ) {
			var value = initial || {};
	
			// If it is a node unlikely to be stringify-ed or looped over
			// use plain assignment
			if ( owner.nodeType ) {
				owner[ this.expando ] = value;
	
			// Otherwise secure it in a non-enumerable, non-writable property
			// configurability must be true to allow the property to be
			// deleted with the delete operator
			} else {
				Object.defineProperty( owner, this.expando, {
					value: value,
					writable: true,
					configurable: true
				} );
			}
			return owner[ this.expando ];
		},
		cache: function( owner ) {
	
			// We can accept data for non-element nodes in modern browsers,
			// but we should not, see #8335.
			// Always return an empty object.
			if ( !acceptData( owner ) ) {
				return {};
			}
	
			// Check if the owner object already has a cache
			var value = owner[ this.expando ];
	
			// If not, create one
			if ( !value ) {
				value = {};
	
				// We can accept data for non-element nodes in modern browsers,
				// but we should not, see #8335.
				// Always return an empty object.
				if ( acceptData( owner ) ) {
	
					// If it is a node unlikely to be stringify-ed or looped over
					// use plain assignment
					if ( owner.nodeType ) {
						owner[ this.expando ] = value;
	
					// Otherwise secure it in a non-enumerable property
					// configurable must be true to allow the property to be
					// deleted when data is removed
					} else {
						Object.defineProperty( owner, this.expando, {
							value: value,
							configurable: true
						} );
					}
				}
			}
	
			return value;
		},
		set: function( owner, data, value ) {
			var prop,
				cache = this.cache( owner );
	
			// Handle: [ owner, key, value ] args
			if ( typeof data === "string" ) {
				cache[ data ] = value;
	
			// Handle: [ owner, { properties } ] args
			} else {
	
				// Copy the properties one-by-one to the cache object
				for ( prop in data ) {
					cache[ prop ] = data[ prop ];
				}
			}
			return cache;
		},
		get: function( owner, key ) {
			return key === undefined ?
				this.cache( owner ) :
				owner[ this.expando ] && owner[ this.expando ][ key ];
		},
		access: function( owner, key, value ) {
			var stored;
	
			// In cases where either:
			//
			//   1. No key was specified
			//   2. A string key was specified, but no value provided
			//
			// Take the "read" path and allow the get method to determine
			// which value to return, respectively either:
			//
			//   1. The entire cache object
			//   2. The data stored at the key
			//
			if ( key === undefined ||
					( ( key && typeof key === "string" ) && value === undefined ) ) {
	
				stored = this.get( owner, key );
	
				return stored !== undefined ?
					stored : this.get( owner, jQuery.camelCase( key ) );
			}
	
			// When the key is not a string, or both a key and value
			// are specified, set or extend (existing objects) with either:
			//
			//   1. An object of properties
			//   2. A key and value
			//
			this.set( owner, key, value );
	
			// Since the "set" path can have two possible entry points
			// return the expected data based on which path was taken[*]
			return value !== undefined ? value : key;
		},
		remove: function( owner, key ) {
			var i, name, camel,
				cache = owner[ this.expando ];
	
			if ( cache === undefined ) {
				return;
			}
	
			if ( key === undefined ) {
				this.register( owner );
	
			} else {
	
				// Support array or space separated string of keys
				if ( jQuery.isArray( key ) ) {
	
					// If "name" is an array of keys...
					// When data is initially created, via ("key", "val") signature,
					// keys will be converted to camelCase.
					// Since there is no way to tell _how_ a key was added, remove
					// both plain key and camelCase key. #12786
					// This will only penalize the array argument path.
					name = key.concat( key.map( jQuery.camelCase ) );
				} else {
					camel = jQuery.camelCase( key );
	
					// Try the string as a key before any manipulation
					if ( key in cache ) {
						name = [ key, camel ];
					} else {
	
						// If a key with the spaces exists, use it.
						// Otherwise, create an array by matching non-whitespace
						name = camel;
						name = name in cache ?
							[ name ] : ( name.match( rnotwhite ) || [] );
					}
				}
	
				i = name.length;
	
				while ( i-- ) {
					delete cache[ name[ i ] ];
				}
			}
	
			// Remove the expando if there's no more data
			if ( key === undefined || jQuery.isEmptyObject( cache ) ) {
	
				// Support: Chrome <= 35-45+
				// Webkit & Blink performance suffers when deleting properties
				// from DOM nodes, so set to undefined instead
				// https://code.google.com/p/chromium/issues/detail?id=378607
				if ( owner.nodeType ) {
					owner[ this.expando ] = undefined;
				} else {
					delete owner[ this.expando ];
				}
			}
		},
		hasData: function( owner ) {
			var cache = owner[ this.expando ];
			return cache !== undefined && !jQuery.isEmptyObject( cache );
		}
	};
	var dataPriv = new Data();
	
	var dataUser = new Data();
	
	
	
	//	Implementation Summary
	//
	//	1. Enforce API surface and semantic compatibility with 1.9.x branch
	//	2. Improve the module's maintainability by reducing the storage
	//		paths to a single mechanism.
	//	3. Use the same single mechanism to support "private" and "user" data.
	//	4. _Never_ expose "private" data to user code (TODO: Drop _data, _removeData)
	//	5. Avoid exposing implementation details on user objects (eg. expando properties)
	//	6. Provide a clear path for implementation upgrade to WeakMap in 2014
	
	var rbrace = /^(?:\{[\w\W]*\}|\[[\w\W]*\])$/,
		rmultiDash = /[A-Z]/g;
	
	function dataAttr( elem, key, data ) {
		var name;
	
		// If nothing was found internally, try to fetch any
		// data from the HTML5 data-* attribute
		if ( data === undefined && elem.nodeType === 1 ) {
			name = "data-" + key.replace( rmultiDash, "-$&" ).toLowerCase();
			data = elem.getAttribute( name );
	
			if ( typeof data === "string" ) {
				try {
					data = data === "true" ? true :
						data === "false" ? false :
						data === "null" ? null :
	
						// Only convert to a number if it doesn't change the string
						+data + "" === data ? +data :
						rbrace.test( data ) ? jQuery.parseJSON( data ) :
						data;
				} catch ( e ) {}
	
				// Make sure we set the data so it isn't changed later
				dataUser.set( elem, key, data );
			} else {
				data = undefined;
			}
		}
		return data;
	}
	
	jQuery.extend( {
		hasData: function( elem ) {
			return dataUser.hasData( elem ) || dataPriv.hasData( elem );
		},
	
		data: function( elem, name, data ) {
			return dataUser.access( elem, name, data );
		},
	
		removeData: function( elem, name ) {
			dataUser.remove( elem, name );
		},
	
		// TODO: Now that all calls to _data and _removeData have been replaced
		// with direct calls to dataPriv methods, these can be deprecated.
		_data: function( elem, name, data ) {
			return dataPriv.access( elem, name, data );
		},
	
		_removeData: function( elem, name ) {
			dataPriv.remove( elem, name );
		}
	} );
	
	jQuery.fn.extend( {
		data: function( key, value ) {
			var i, name, data,
				elem = this[ 0 ],
				attrs = elem && elem.attributes;
	
			// Gets all values
			if ( key === undefined ) {
				if ( this.length ) {
					data = dataUser.get( elem );
	
					if ( elem.nodeType === 1 && !dataPriv.get( elem, "hasDataAttrs" ) ) {
						i = attrs.length;
						while ( i-- ) {
	
							// Support: IE11+
							// The attrs elements can be null (#14894)
							if ( attrs[ i ] ) {
								name = attrs[ i ].name;
								if ( name.indexOf( "data-" ) === 0 ) {
									name = jQuery.camelCase( name.slice( 5 ) );
									dataAttr( elem, name, data[ name ] );
								}
							}
						}
						dataPriv.set( elem, "hasDataAttrs", true );
					}
				}
	
				return data;
			}
	
			// Sets multiple values
			if ( typeof key === "object" ) {
				return this.each( function() {
					dataUser.set( this, key );
				} );
			}
	
			return access( this, function( value ) {
				var data, camelKey;
	
				// The calling jQuery object (element matches) is not empty
				// (and therefore has an element appears at this[ 0 ]) and the
				// `value` parameter was not undefined. An empty jQuery object
				// will result in `undefined` for elem = this[ 0 ] which will
				// throw an exception if an attempt to read a data cache is made.
				if ( elem && value === undefined ) {
	
					// Attempt to get data from the cache
					// with the key as-is
					data = dataUser.get( elem, key ) ||
	
						// Try to find dashed key if it exists (gh-2779)
						// This is for 2.2.x only
						dataUser.get( elem, key.replace( rmultiDash, "-$&" ).toLowerCase() );
	
					if ( data !== undefined ) {
						return data;
					}
	
					camelKey = jQuery.camelCase( key );
	
					// Attempt to get data from the cache
					// with the key camelized
					data = dataUser.get( elem, camelKey );
					if ( data !== undefined ) {
						return data;
					}
	
					// Attempt to "discover" the data in
					// HTML5 custom data-* attrs
					data = dataAttr( elem, camelKey, undefined );
					if ( data !== undefined ) {
						return data;
					}
	
					// We tried really hard, but the data doesn't exist.
					return;
				}
	
				// Set the data...
				camelKey = jQuery.camelCase( key );
				this.each( function() {
	
					// First, attempt to store a copy or reference of any
					// data that might've been store with a camelCased key.
					var data = dataUser.get( this, camelKey );
	
					// For HTML5 data-* attribute interop, we have to
					// store property names with dashes in a camelCase form.
					// This might not apply to all properties...*
					dataUser.set( this, camelKey, value );
	
					// *... In the case of properties that might _actually_
					// have dashes, we need to also store a copy of that
					// unchanged property.
					if ( key.indexOf( "-" ) > -1 && data !== undefined ) {
						dataUser.set( this, key, value );
					}
				} );
			}, null, value, arguments.length > 1, null, true );
		},
	
		removeData: function( key ) {
			return this.each( function() {
				dataUser.remove( this, key );
			} );
		}
	} );
	
	
	jQuery.extend( {
		queue: function( elem, type, data ) {
			var queue;
	
			if ( elem ) {
				type = ( type || "fx" ) + "queue";
				queue = dataPriv.get( elem, type );
	
				// Speed up dequeue by getting out quickly if this is just a lookup
				if ( data ) {
					if ( !queue || jQuery.isArray( data ) ) {
						queue = dataPriv.access( elem, type, jQuery.makeArray( data ) );
					} else {
						queue.push( data );
					}
				}
				return queue || [];
			}
		},
	
		dequeue: function( elem, type ) {
			type = type || "fx";
	
			var queue = jQuery.queue( elem, type ),
				startLength = queue.length,
				fn = queue.shift(),
				hooks = jQuery._queueHooks( elem, type ),
				next = function() {
					jQuery.dequeue( elem, type );
				};
	
			// If the fx queue is dequeued, always remove the progress sentinel
			if ( fn === "inprogress" ) {
				fn = queue.shift();
				startLength--;
			}
	
			if ( fn ) {
	
				// Add a progress sentinel to prevent the fx queue from being
				// automatically dequeued
				if ( type === "fx" ) {
					queue.unshift( "inprogress" );
				}
	
				// Clear up the last queue stop function
				delete hooks.stop;
				fn.call( elem, next, hooks );
			}
	
			if ( !startLength && hooks ) {
				hooks.empty.fire();
			}
		},
	
		// Not public - generate a queueHooks object, or return the current one
		_queueHooks: function( elem, type ) {
			var key = type + "queueHooks";
			return dataPriv.get( elem, key ) || dataPriv.access( elem, key, {
				empty: jQuery.Callbacks( "once memory" ).add( function() {
					dataPriv.remove( elem, [ type + "queue", key ] );
				} )
			} );
		}
	} );
	
	jQuery.fn.extend( {
		queue: function( type, data ) {
			var setter = 2;
	
			if ( typeof type !== "string" ) {
				data = type;
				type = "fx";
				setter--;
			}
	
			if ( arguments.length < setter ) {
				return jQuery.queue( this[ 0 ], type );
			}
	
			return data === undefined ?
				this :
				this.each( function() {
					var queue = jQuery.queue( this, type, data );
	
					// Ensure a hooks for this queue
					jQuery._queueHooks( this, type );
	
					if ( type === "fx" && queue[ 0 ] !== "inprogress" ) {
						jQuery.dequeue( this, type );
					}
				} );
		},
		dequeue: function( type ) {
			return this.each( function() {
				jQuery.dequeue( this, type );
			} );
		},
		clearQueue: function( type ) {
			return this.queue( type || "fx", [] );
		},
	
		// Get a promise resolved when queues of a certain type
		// are emptied (fx is the type by default)
		promise: function( type, obj ) {
			var tmp,
				count = 1,
				defer = jQuery.Deferred(),
				elements = this,
				i = this.length,
				resolve = function() {
					if ( !( --count ) ) {
						defer.resolveWith( elements, [ elements ] );
					}
				};
	
			if ( typeof type !== "string" ) {
				obj = type;
				type = undefined;
			}
			type = type || "fx";
	
			while ( i-- ) {
				tmp = dataPriv.get( elements[ i ], type + "queueHooks" );
				if ( tmp && tmp.empty ) {
					count++;
					tmp.empty.add( resolve );
				}
			}
			resolve();
			return defer.promise( obj );
		}
	} );
	var pnum = ( /[+-]?(?:\d*\.|)\d+(?:[eE][+-]?\d+|)/ ).source;
	
	var rcssNum = new RegExp( "^(?:([+-])=|)(" + pnum + ")([a-z%]*)$", "i" );
	
	
	var cssExpand = [ "Top", "Right", "Bottom", "Left" ];
	
	var isHidden = function( elem, el ) {
	
			// isHidden might be called from jQuery#filter function;
			// in that case, element will be second argument
			elem = el || elem;
			return jQuery.css( elem, "display" ) === "none" ||
				!jQuery.contains( elem.ownerDocument, elem );
		};
	
	
	
	function adjustCSS( elem, prop, valueParts, tween ) {
		var adjusted,
			scale = 1,
			maxIterations = 20,
			currentValue = tween ?
				function() { return tween.cur(); } :
				function() { return jQuery.css( elem, prop, "" ); },
			initial = currentValue(),
			unit = valueParts && valueParts[ 3 ] || ( jQuery.cssNumber[ prop ] ? "" : "px" ),
	
			// Starting value computation is required for potential unit mismatches
			initialInUnit = ( jQuery.cssNumber[ prop ] || unit !== "px" && +initial ) &&
				rcssNum.exec( jQuery.css( elem, prop ) );
	
		if ( initialInUnit && initialInUnit[ 3 ] !== unit ) {
	
			// Trust units reported by jQuery.css
			unit = unit || initialInUnit[ 3 ];
	
			// Make sure we update the tween properties later on
			valueParts = valueParts || [];
	
			// Iteratively approximate from a nonzero starting point
			initialInUnit = +initial || 1;
	
			do {
	
				// If previous iteration zeroed out, double until we get *something*.
				// Use string for doubling so we don't accidentally see scale as unchanged below
				scale = scale || ".5";
	
				// Adjust and apply
				initialInUnit = initialInUnit / scale;
				jQuery.style( elem, prop, initialInUnit + unit );
	
			// Update scale, tolerating zero or NaN from tween.cur()
			// Break the loop if scale is unchanged or perfect, or if we've just had enough.
			} while (
				scale !== ( scale = currentValue() / initial ) && scale !== 1 && --maxIterations
			);
		}
	
		if ( valueParts ) {
			initialInUnit = +initialInUnit || +initial || 0;
	
			// Apply relative offset (+=/-=) if specified
			adjusted = valueParts[ 1 ] ?
				initialInUnit + ( valueParts[ 1 ] + 1 ) * valueParts[ 2 ] :
				+valueParts[ 2 ];
			if ( tween ) {
				tween.unit = unit;
				tween.start = initialInUnit;
				tween.end = adjusted;
			}
		}
		return adjusted;
	}
	var rcheckableType = ( /^(?:checkbox|radio)$/i );
	
	var rtagName = ( /<([\w:-]+)/ );
	
	var rscriptType = ( /^$|\/(?:java|ecma)script/i );
	
	
	
	// We have to close these tags to support XHTML (#13200)
	var wrapMap = {
	
		// Support: IE9
		option: [ 1, "<select multiple='multiple'>", "</select>" ],
	
		// XHTML parsers do not magically insert elements in the
		// same way that tag soup parsers do. So we cannot shorten
		// this by omitting <tbody> or other required elements.
		thead: [ 1, "<table>", "</table>" ],
		col: [ 2, "<table><colgroup>", "</colgroup></table>" ],
		tr: [ 2, "<table><tbody>", "</tbody></table>" ],
		td: [ 3, "<table><tbody><tr>", "</tr></tbody></table>" ],
	
		_default: [ 0, "", "" ]
	};
	
	// Support: IE9
	wrapMap.optgroup = wrapMap.option;
	
	wrapMap.tbody = wrapMap.tfoot = wrapMap.colgroup = wrapMap.caption = wrapMap.thead;
	wrapMap.th = wrapMap.td;
	
	
	function getAll( context, tag ) {
	
		// Support: IE9-11+
		// Use typeof to avoid zero-argument method invocation on host objects (#15151)
		var ret = typeof context.getElementsByTagName !== "undefined" ?
				context.getElementsByTagName( tag || "*" ) :
				typeof context.querySelectorAll !== "undefined" ?
					context.querySelectorAll( tag || "*" ) :
				[];
	
		return tag === undefined || tag && jQuery.nodeName( context, tag ) ?
			jQuery.merge( [ context ], ret ) :
			ret;
	}
	
	
	// Mark scripts as having already been evaluated
	function setGlobalEval( elems, refElements ) {
		var i = 0,
			l = elems.length;
	
		for ( ; i < l; i++ ) {
			dataPriv.set(
				elems[ i ],
				"globalEval",
				!refElements || dataPriv.get( refElements[ i ], "globalEval" )
			);
		}
	}
	
	
	var rhtml = /<|&#?\w+;/;
	
	function buildFragment( elems, context, scripts, selection, ignored ) {
		var elem, tmp, tag, wrap, contains, j,
			fragment = context.createDocumentFragment(),
			nodes = [],
			i = 0,
			l = elems.length;
	
		for ( ; i < l; i++ ) {
			elem = elems[ i ];
	
			if ( elem || elem === 0 ) {
	
				// Add nodes directly
				if ( jQuery.type( elem ) === "object" ) {
	
					// Support: Android<4.1, PhantomJS<2
					// push.apply(_, arraylike) throws on ancient WebKit
					jQuery.merge( nodes, elem.nodeType ? [ elem ] : elem );
	
				// Convert non-html into a text node
				} else if ( !rhtml.test( elem ) ) {
					nodes.push( context.createTextNode( elem ) );
	
				// Convert html into DOM nodes
				} else {
					tmp = tmp || fragment.appendChild( context.createElement( "div" ) );
	
					// Deserialize a standard representation
					tag = ( rtagName.exec( elem ) || [ "", "" ] )[ 1 ].toLowerCase();
					wrap = wrapMap[ tag ] || wrapMap._default;
					tmp.innerHTML = wrap[ 1 ] + jQuery.htmlPrefilter( elem ) + wrap[ 2 ];
	
					// Descend through wrappers to the right content
					j = wrap[ 0 ];
					while ( j-- ) {
						tmp = tmp.lastChild;
					}
	
					// Support: Android<4.1, PhantomJS<2
					// push.apply(_, arraylike) throws on ancient WebKit
					jQuery.merge( nodes, tmp.childNodes );
	
					// Remember the top-level container
					tmp = fragment.firstChild;
	
					// Ensure the created nodes are orphaned (#12392)
					tmp.textContent = "";
				}
			}
		}
	
		// Remove wrapper from fragment
		fragment.textContent = "";
	
		i = 0;
		while ( ( elem = nodes[ i++ ] ) ) {
	
			// Skip elements already in the context collection (trac-4087)
			if ( selection && jQuery.inArray( elem, selection ) > -1 ) {
				if ( ignored ) {
					ignored.push( elem );
				}
				continue;
			}
	
			contains = jQuery.contains( elem.ownerDocument, elem );
	
			// Append to fragment
			tmp = getAll( fragment.appendChild( elem ), "script" );
	
			// Preserve script evaluation history
			if ( contains ) {
				setGlobalEval( tmp );
			}
	
			// Capture executables
			if ( scripts ) {
				j = 0;
				while ( ( elem = tmp[ j++ ] ) ) {
					if ( rscriptType.test( elem.type || "" ) ) {
						scripts.push( elem );
					}
				}
			}
		}
	
		return fragment;
	}
	
	
	( function() {
		var fragment = document.createDocumentFragment(),
			div = fragment.appendChild( document.createElement( "div" ) ),
			input = document.createElement( "input" );
	
		// Support: Android 4.0-4.3, Safari<=5.1
		// Check state lost if the name is set (#11217)
		// Support: Windows Web Apps (WWA)
		// `name` and `type` must use .setAttribute for WWA (#14901)
		input.setAttribute( "type", "radio" );
		input.setAttribute( "checked", "checked" );
		input.setAttribute( "name", "t" );
	
		div.appendChild( input );
	
		// Support: Safari<=5.1, Android<4.2
		// Older WebKit doesn't clone checked state correctly in fragments
		support.checkClone = div.cloneNode( true ).cloneNode( true ).lastChild.checked;
	
		// Support: IE<=11+
		// Make sure textarea (and checkbox) defaultValue is properly cloned
		div.innerHTML = "<textarea>x</textarea>";
		support.noCloneChecked = !!div.cloneNode( true ).lastChild.defaultValue;
	} )();
	
	
	var
		rkeyEvent = /^key/,
		rmouseEvent = /^(?:mouse|pointer|contextmenu|drag|drop)|click/,
		rtypenamespace = /^([^.]*)(?:\.(.+)|)/;
	
	function returnTrue() {
		return true;
	}
	
	function returnFalse() {
		return false;
	}
	
	// Support: IE9
	// See #13393 for more info
	function safeActiveElement() {
		try {
			return document.activeElement;
		} catch ( err ) { }
	}
	
	function on( elem, types, selector, data, fn, one ) {
		var origFn, type;
	
		// Types can be a map of types/handlers
		if ( typeof types === "object" ) {
	
			// ( types-Object, selector, data )
			if ( typeof selector !== "string" ) {
	
				// ( types-Object, data )
				data = data || selector;
				selector = undefined;
			}
			for ( type in types ) {
				on( elem, type, selector, data, types[ type ], one );
			}
			return elem;
		}
	
		if ( data == null && fn == null ) {
	
			// ( types, fn )
			fn = selector;
			data = selector = undefined;
		} else if ( fn == null ) {
			if ( typeof selector === "string" ) {
	
				// ( types, selector, fn )
				fn = data;
				data = undefined;
			} else {
	
				// ( types, data, fn )
				fn = data;
				data = selector;
				selector = undefined;
			}
		}
		if ( fn === false ) {
			fn = returnFalse;
		} else if ( !fn ) {
			return elem;
		}
	
		if ( one === 1 ) {
			origFn = fn;
			fn = function( event ) {
	
				// Can use an empty set, since event contains the info
				jQuery().off( event );
				return origFn.apply( this, arguments );
			};
	
			// Use same guid so caller can remove using origFn
			fn.guid = origFn.guid || ( origFn.guid = jQuery.guid++ );
		}
		return elem.each( function() {
			jQuery.event.add( this, types, fn, data, selector );
		} );
	}
	
	/*
	 * Helper functions for managing events -- not part of the public interface.
	 * Props to Dean Edwards' addEvent library for many of the ideas.
	 */
	jQuery.event = {
	
		global: {},
	
		add: function( elem, types, handler, data, selector ) {
	
			var handleObjIn, eventHandle, tmp,
				events, t, handleObj,
				special, handlers, type, namespaces, origType,
				elemData = dataPriv.get( elem );
	
			// Don't attach events to noData or text/comment nodes (but allow plain objects)
			if ( !elemData ) {
				return;
			}
	
			// Caller can pass in an object of custom data in lieu of the handler
			if ( handler.handler ) {
				handleObjIn = handler;
				handler = handleObjIn.handler;
				selector = handleObjIn.selector;
			}
	
			// Make sure that the handler has a unique ID, used to find/remove it later
			if ( !handler.guid ) {
				handler.guid = jQuery.guid++;
			}
	
			// Init the element's event structure and main handler, if this is the first
			if ( !( events = elemData.events ) ) {
				events = elemData.events = {};
			}
			if ( !( eventHandle = elemData.handle ) ) {
				eventHandle = elemData.handle = function( e ) {
	
					// Discard the second event of a jQuery.event.trigger() and
					// when an event is called after a page has unloaded
					return typeof jQuery !== "undefined" && jQuery.event.triggered !== e.type ?
						jQuery.event.dispatch.apply( elem, arguments ) : undefined;
				};
			}
	
			// Handle multiple events separated by a space
			types = ( types || "" ).match( rnotwhite ) || [ "" ];
			t = types.length;
			while ( t-- ) {
				tmp = rtypenamespace.exec( types[ t ] ) || [];
				type = origType = tmp[ 1 ];
				namespaces = ( tmp[ 2 ] || "" ).split( "." ).sort();
	
				// There *must* be a type, no attaching namespace-only handlers
				if ( !type ) {
					continue;
				}
	
				// If event changes its type, use the special event handlers for the changed type
				special = jQuery.event.special[ type ] || {};
	
				// If selector defined, determine special event api type, otherwise given type
				type = ( selector ? special.delegateType : special.bindType ) || type;
	
				// Update special based on newly reset type
				special = jQuery.event.special[ type ] || {};
	
				// handleObj is passed to all event handlers
				handleObj = jQuery.extend( {
					type: type,
					origType: origType,
					data: data,
					handler: handler,
					guid: handler.guid,
					selector: selector,
					needsContext: selector && jQuery.expr.match.needsContext.test( selector ),
					namespace: namespaces.join( "." )
				}, handleObjIn );
	
				// Init the event handler queue if we're the first
				if ( !( handlers = events[ type ] ) ) {
					handlers = events[ type ] = [];
					handlers.delegateCount = 0;
	
					// Only use addEventListener if the special events handler returns false
					if ( !special.setup ||
						special.setup.call( elem, data, namespaces, eventHandle ) === false ) {
	
						if ( elem.addEventListener ) {
							elem.addEventListener( type, eventHandle );
						}
					}
				}
	
				if ( special.add ) {
					special.add.call( elem, handleObj );
	
					if ( !handleObj.handler.guid ) {
						handleObj.handler.guid = handler.guid;
					}
				}
	
				// Add to the element's handler list, delegates in front
				if ( selector ) {
					handlers.splice( handlers.delegateCount++, 0, handleObj );
				} else {
					handlers.push( handleObj );
				}
	
				// Keep track of which events have ever been used, for event optimization
				jQuery.event.global[ type ] = true;
			}
	
		},
	
		// Detach an event or set of events from an element
		remove: function( elem, types, handler, selector, mappedTypes ) {
	
			var j, origCount, tmp,
				events, t, handleObj,
				special, handlers, type, namespaces, origType,
				elemData = dataPriv.hasData( elem ) && dataPriv.get( elem );
	
			if ( !elemData || !( events = elemData.events ) ) {
				return;
			}
	
			// Once for each type.namespace in types; type may be omitted
			types = ( types || "" ).match( rnotwhite ) || [ "" ];
			t = types.length;
			while ( t-- ) {
				tmp = rtypenamespace.exec( types[ t ] ) || [];
				type = origType = tmp[ 1 ];
				namespaces = ( tmp[ 2 ] || "" ).split( "." ).sort();
	
				// Unbind all events (on this namespace, if provided) for the element
				if ( !type ) {
					for ( type in events ) {
						jQuery.event.remove( elem, type + types[ t ], handler, selector, true );
					}
					continue;
				}
	
				special = jQuery.event.special[ type ] || {};
				type = ( selector ? special.delegateType : special.bindType ) || type;
				handlers = events[ type ] || [];
				tmp = tmp[ 2 ] &&
					new RegExp( "(^|\\.)" + namespaces.join( "\\.(?:.*\\.|)" ) + "(\\.|$)" );
	
				// Remove matching events
				origCount = j = handlers.length;
				while ( j-- ) {
					handleObj = handlers[ j ];
	
					if ( ( mappedTypes || origType === handleObj.origType ) &&
						( !handler || handler.guid === handleObj.guid ) &&
						( !tmp || tmp.test( handleObj.namespace ) ) &&
						( !selector || selector === handleObj.selector ||
							selector === "**" && handleObj.selector ) ) {
						handlers.splice( j, 1 );
	
						if ( handleObj.selector ) {
							handlers.delegateCount--;
						}
						if ( special.remove ) {
							special.remove.call( elem, handleObj );
						}
					}
				}
	
				// Remove generic event handler if we removed something and no more handlers exist
				// (avoids potential for endless recursion during removal of special event handlers)
				if ( origCount && !handlers.length ) {
					if ( !special.teardown ||
						special.teardown.call( elem, namespaces, elemData.handle ) === false ) {
	
						jQuery.removeEvent( elem, type, elemData.handle );
					}
	
					delete events[ type ];
				}
			}
	
			// Remove data and the expando if it's no longer used
			if ( jQuery.isEmptyObject( events ) ) {
				dataPriv.remove( elem, "handle events" );
			}
		},
	
		dispatch: function( event ) {
	
			// Make a writable jQuery.Event from the native event object
			event = jQuery.event.fix( event );
	
			var i, j, ret, matched, handleObj,
				handlerQueue = [],
				args = slice.call( arguments ),
				handlers = ( dataPriv.get( this, "events" ) || {} )[ event.type ] || [],
				special = jQuery.event.special[ event.type ] || {};
	
			// Use the fix-ed jQuery.Event rather than the (read-only) native event
			args[ 0 ] = event;
			event.delegateTarget = this;
	
			// Call the preDispatch hook for the mapped type, and let it bail if desired
			if ( special.preDispatch && special.preDispatch.call( this, event ) === false ) {
				return;
			}
	
			// Determine handlers
			handlerQueue = jQuery.event.handlers.call( this, event, handlers );
	
			// Run delegates first; they may want to stop propagation beneath us
			i = 0;
			while ( ( matched = handlerQueue[ i++ ] ) && !event.isPropagationStopped() ) {
				event.currentTarget = matched.elem;
	
				j = 0;
				while ( ( handleObj = matched.handlers[ j++ ] ) &&
					!event.isImmediatePropagationStopped() ) {
	
					// Triggered event must either 1) have no namespace, or 2) have namespace(s)
					// a subset or equal to those in the bound event (both can have no namespace).
					if ( !event.rnamespace || event.rnamespace.test( handleObj.namespace ) ) {
	
						event.handleObj = handleObj;
						event.data = handleObj.data;
	
						ret = ( ( jQuery.event.special[ handleObj.origType ] || {} ).handle ||
							handleObj.handler ).apply( matched.elem, args );
	
						if ( ret !== undefined ) {
							if ( ( event.result = ret ) === false ) {
								event.preventDefault();
								event.stopPropagation();
							}
						}
					}
				}
			}
	
			// Call the postDispatch hook for the mapped type
			if ( special.postDispatch ) {
				special.postDispatch.call( this, event );
			}
	
			return event.result;
		},
	
		handlers: function( event, handlers ) {
			var i, matches, sel, handleObj,
				handlerQueue = [],
				delegateCount = handlers.delegateCount,
				cur = event.target;
	
			// Support (at least): Chrome, IE9
			// Find delegate handlers
			// Black-hole SVG <use> instance trees (#13180)
			//
			// Support: Firefox<=42+
			// Avoid non-left-click in FF but don't block IE radio events (#3861, gh-2343)
			if ( delegateCount && cur.nodeType &&
				( event.type !== "click" || isNaN( event.button ) || event.button < 1 ) ) {
	
				for ( ; cur !== this; cur = cur.parentNode || this ) {
	
					// Don't check non-elements (#13208)
					// Don't process clicks on disabled elements (#6911, #8165, #11382, #11764)
					if ( cur.nodeType === 1 && ( cur.disabled !== true || event.type !== "click" ) ) {
						matches = [];
						for ( i = 0; i < delegateCount; i++ ) {
							handleObj = handlers[ i ];
	
							// Don't conflict with Object.prototype properties (#13203)
							sel = handleObj.selector + " ";
	
							if ( matches[ sel ] === undefined ) {
								matches[ sel ] = handleObj.needsContext ?
									jQuery( sel, this ).index( cur ) > -1 :
									jQuery.find( sel, this, null, [ cur ] ).length;
							}
							if ( matches[ sel ] ) {
								matches.push( handleObj );
							}
						}
						if ( matches.length ) {
							handlerQueue.push( { elem: cur, handlers: matches } );
						}
					}
				}
			}
	
			// Add the remaining (directly-bound) handlers
			if ( delegateCount < handlers.length ) {
				handlerQueue.push( { elem: this, handlers: handlers.slice( delegateCount ) } );
			}
	
			return handlerQueue;
		},
	
		// Includes some event props shared by KeyEvent and MouseEvent
		props: ( "altKey bubbles cancelable ctrlKey currentTarget detail eventPhase " +
			"metaKey relatedTarget shiftKey target timeStamp view which" ).split( " " ),
	
		fixHooks: {},
	
		keyHooks: {
			props: "char charCode key keyCode".split( " " ),
			filter: function( event, original ) {
	
				// Add which for key events
				if ( event.which == null ) {
					event.which = original.charCode != null ? original.charCode : original.keyCode;
				}
	
				return event;
			}
		},
	
		mouseHooks: {
			props: ( "button buttons clientX clientY offsetX offsetY pageX pageY " +
				"screenX screenY toElement" ).split( " " ),
			filter: function( event, original ) {
				var eventDoc, doc, body,
					button = original.button;
	
				// Calculate pageX/Y if missing and clientX/Y available
				if ( event.pageX == null && original.clientX != null ) {
					eventDoc = event.target.ownerDocument || document;
					doc = eventDoc.documentElement;
					body = eventDoc.body;
	
					event.pageX = original.clientX +
						( doc && doc.scrollLeft || body && body.scrollLeft || 0 ) -
						( doc && doc.clientLeft || body && body.clientLeft || 0 );
					event.pageY = original.clientY +
						( doc && doc.scrollTop  || body && body.scrollTop  || 0 ) -
						( doc && doc.clientTop  || body && body.clientTop  || 0 );
				}
	
				// Add which for click: 1 === left; 2 === middle; 3 === right
				// Note: button is not normalized, so don't use it
				if ( !event.which && button !== undefined ) {
					event.which = ( button & 1 ? 1 : ( button & 2 ? 3 : ( button & 4 ? 2 : 0 ) ) );
				}
	
				return event;
			}
		},
	
		fix: function( event ) {
			if ( event[ jQuery.expando ] ) {
				return event;
			}
	
			// Create a writable copy of the event object and normalize some properties
			var i, prop, copy,
				type = event.type,
				originalEvent = event,
				fixHook = this.fixHooks[ type ];
	
			if ( !fixHook ) {
				this.fixHooks[ type ] = fixHook =
					rmouseEvent.test( type ) ? this.mouseHooks :
					rkeyEvent.test( type ) ? this.keyHooks :
					{};
			}
			copy = fixHook.props ? this.props.concat( fixHook.props ) : this.props;
	
			event = new jQuery.Event( originalEvent );
	
			i = copy.length;
			while ( i-- ) {
				prop = copy[ i ];
				event[ prop ] = originalEvent[ prop ];
			}
	
			// Support: Cordova 2.5 (WebKit) (#13255)
			// All events should have a target; Cordova deviceready doesn't
			if ( !event.target ) {
				event.target = document;
			}
	
			// Support: Safari 6.0+, Chrome<28
			// Target should not be a text node (#504, #13143)
			if ( event.target.nodeType === 3 ) {
				event.target = event.target.parentNode;
			}
	
			return fixHook.filter ? fixHook.filter( event, originalEvent ) : event;
		},
	
		special: {
			load: {
	
				// Prevent triggered image.load events from bubbling to window.load
				noBubble: true
			},
			focus: {
	
				// Fire native event if possible so blur/focus sequence is correct
				trigger: function() {
					if ( this !== safeActiveElement() && this.focus ) {
						this.focus();
						return false;
					}
				},
				delegateType: "focusin"
			},
			blur: {
				trigger: function() {
					if ( this === safeActiveElement() && this.blur ) {
						this.blur();
						return false;
					}
				},
				delegateType: "focusout"
			},
			click: {
	
				// For checkbox, fire native event so checked state will be right
				trigger: function() {
					if ( this.type === "checkbox" && this.click && jQuery.nodeName( this, "input" ) ) {
						this.click();
						return false;
					}
				},
	
				// For cross-browser consistency, don't fire native .click() on links
				_default: function( event ) {
					return jQuery.nodeName( event.target, "a" );
				}
			},
	
			beforeunload: {
				postDispatch: function( event ) {
	
					// Support: Firefox 20+
					// Firefox doesn't alert if the returnValue field is not set.
					if ( event.result !== undefined && event.originalEvent ) {
						event.originalEvent.returnValue = event.result;
					}
				}
			}
		}
	};
	
	jQuery.removeEvent = function( elem, type, handle ) {
	
		// This "if" is needed for plain objects
		if ( elem.removeEventListener ) {
			elem.removeEventListener( type, handle );
		}
	};
	
	jQuery.Event = function( src, props ) {
	
		// Allow instantiation without the 'new' keyword
		if ( !( this instanceof jQuery.Event ) ) {
			return new jQuery.Event( src, props );
		}
	
		// Event object
		if ( src && src.type ) {
			this.originalEvent = src;
			this.type = src.type;
	
			// Events bubbling up the document may have been marked as prevented
			// by a handler lower down the tree; reflect the correct value.
			this.isDefaultPrevented = src.defaultPrevented ||
					src.defaultPrevented === undefined &&
	
					// Support: Android<4.0
					src.returnValue === false ?
				returnTrue :
				returnFalse;
	
		// Event type
		} else {
			this.type = src;
		}
	
		// Put explicitly provided properties onto the event object
		if ( props ) {
			jQuery.extend( this, props );
		}
	
		// Create a timestamp if incoming event doesn't have one
		this.timeStamp = src && src.timeStamp || jQuery.now();
	
		// Mark it as fixed
		this[ jQuery.expando ] = true;
	};
	
	// jQuery.Event is based on DOM3 Events as specified by the ECMAScript Language Binding
	// http://www.w3.org/TR/2003/WD-DOM-Level-3-Events-20030331/ecma-script-binding.html
	jQuery.Event.prototype = {
		constructor: jQuery.Event,
		isDefaultPrevented: returnFalse,
		isPropagationStopped: returnFalse,
		isImmediatePropagationStopped: returnFalse,
		isSimulated: false,
	
		preventDefault: function() {
			var e = this.originalEvent;
	
			this.isDefaultPrevented = returnTrue;
	
			if ( e && !this.isSimulated ) {
				e.preventDefault();
			}
		},
		stopPropagation: function() {
			var e = this.originalEvent;
	
			this.isPropagationStopped = returnTrue;
	
			if ( e && !this.isSimulated ) {
				e.stopPropagation();
			}
		},
		stopImmediatePropagation: function() {
			var e = this.originalEvent;
	
			this.isImmediatePropagationStopped = returnTrue;
	
			if ( e && !this.isSimulated ) {
				e.stopImmediatePropagation();
			}
	
			this.stopPropagation();
		}
	};
	
	// Create mouseenter/leave events using mouseover/out and event-time checks
	// so that event delegation works in jQuery.
	// Do the same for pointerenter/pointerleave and pointerover/pointerout
	//
	// Support: Safari 7 only
	// Safari sends mouseenter too often; see:
	// https://code.google.com/p/chromium/issues/detail?id=470258
	// for the description of the bug (it existed in older Chrome versions as well).
	jQuery.each( {
		mouseenter: "mouseover",
		mouseleave: "mouseout",
		pointerenter: "pointerover",
		pointerleave: "pointerout"
	}, function( orig, fix ) {
		jQuery.event.special[ orig ] = {
			delegateType: fix,
			bindType: fix,
	
			handle: function( event ) {
				var ret,
					target = this,
					related = event.relatedTarget,
					handleObj = event.handleObj;
	
				// For mouseenter/leave call the handler if related is outside the target.
				// NB: No relatedTarget if the mouse left/entered the browser window
				if ( !related || ( related !== target && !jQuery.contains( target, related ) ) ) {
					event.type = handleObj.origType;
					ret = handleObj.handler.apply( this, arguments );
					event.type = fix;
				}
				return ret;
			}
		};
	} );
	
	jQuery.fn.extend( {
		on: function( types, selector, data, fn ) {
			return on( this, types, selector, data, fn );
		},
		one: function( types, selector, data, fn ) {
			return on( this, types, selector, data, fn, 1 );
		},
		off: function( types, selector, fn ) {
			var handleObj, type;
			if ( types && types.preventDefault && types.handleObj ) {
	
				// ( event )  dispatched jQuery.Event
				handleObj = types.handleObj;
				jQuery( types.delegateTarget ).off(
					handleObj.namespace ?
						handleObj.origType + "." + handleObj.namespace :
						handleObj.origType,
					handleObj.selector,
					handleObj.handler
				);
				return this;
			}
			if ( typeof types === "object" ) {
	
				// ( types-object [, selector] )
				for ( type in types ) {
					this.off( type, selector, types[ type ] );
				}
				return this;
			}
			if ( selector === false || typeof selector === "function" ) {
	
				// ( types [, fn] )
				fn = selector;
				selector = undefined;
			}
			if ( fn === false ) {
				fn = returnFalse;
			}
			return this.each( function() {
				jQuery.event.remove( this, types, fn, selector );
			} );
		}
	} );
	
	
	var
		rxhtmlTag = /<(?!area|br|col|embed|hr|img|input|link|meta|param)(([\w:-]+)[^>]*)\/>/gi,
	
		// Support: IE 10-11, Edge 10240+
		// In IE/Edge using regex groups here causes severe slowdowns.
		// See https://connect.microsoft.com/IE/feedback/details/1736512/
		rnoInnerhtml = /<script|<style|<link/i,
	
		// checked="checked" or checked
		rchecked = /checked\s*(?:[^=]|=\s*.checked.)/i,
		rscriptTypeMasked = /^true\/(.*)/,
		rcleanScript = /^\s*<!(?:\[CDATA\[|--)|(?:\]\]|--)>\s*$/g;
	
	// Manipulating tables requires a tbody
	function manipulationTarget( elem, content ) {
		return jQuery.nodeName( elem, "table" ) &&
			jQuery.nodeName( content.nodeType !== 11 ? content : content.firstChild, "tr" ) ?
	
			elem.getElementsByTagName( "tbody" )[ 0 ] ||
				elem.appendChild( elem.ownerDocument.createElement( "tbody" ) ) :
			elem;
	}
	
	// Replace/restore the type attribute of script elements for safe DOM manipulation
	function disableScript( elem ) {
		elem.type = ( elem.getAttribute( "type" ) !== null ) + "/" + elem.type;
		return elem;
	}
	function restoreScript( elem ) {
		var match = rscriptTypeMasked.exec( elem.type );
	
		if ( match ) {
			elem.type = match[ 1 ];
		} else {
			elem.removeAttribute( "type" );
		}
	
		return elem;
	}
	
	function cloneCopyEvent( src, dest ) {
		var i, l, type, pdataOld, pdataCur, udataOld, udataCur, events;
	
		if ( dest.nodeType !== 1 ) {
			return;
		}
	
		// 1. Copy private data: events, handlers, etc.
		if ( dataPriv.hasData( src ) ) {
			pdataOld = dataPriv.access( src );
			pdataCur = dataPriv.set( dest, pdataOld );
			events = pdataOld.events;
	
			if ( events ) {
				delete pdataCur.handle;
				pdataCur.events = {};
	
				for ( type in events ) {
					for ( i = 0, l = events[ type ].length; i < l; i++ ) {
						jQuery.event.add( dest, type, events[ type ][ i ] );
					}
				}
			}
		}
	
		// 2. Copy user data
		if ( dataUser.hasData( src ) ) {
			udataOld = dataUser.access( src );
			udataCur = jQuery.extend( {}, udataOld );
	
			dataUser.set( dest, udataCur );
		}
	}
	
	// Fix IE bugs, see support tests
	function fixInput( src, dest ) {
		var nodeName = dest.nodeName.toLowerCase();
	
		// Fails to persist the checked state of a cloned checkbox or radio button.
		if ( nodeName === "input" && rcheckableType.test( src.type ) ) {
			dest.checked = src.checked;
	
		// Fails to return the selected option to the default selected state when cloning options
		} else if ( nodeName === "input" || nodeName === "textarea" ) {
			dest.defaultValue = src.defaultValue;
		}
	}
	
	function domManip( collection, args, callback, ignored ) {
	
		// Flatten any nested arrays
		args = concat.apply( [], args );
	
		var fragment, first, scripts, hasScripts, node, doc,
			i = 0,
			l = collection.length,
			iNoClone = l - 1,
			value = args[ 0 ],
			isFunction = jQuery.isFunction( value );
	
		// We can't cloneNode fragments that contain checked, in WebKit
		if ( isFunction ||
				( l > 1 && typeof value === "string" &&
					!support.checkClone && rchecked.test( value ) ) ) {
			return collection.each( function( index ) {
				var self = collection.eq( index );
				if ( isFunction ) {
					args[ 0 ] = value.call( this, index, self.html() );
				}
				domManip( self, args, callback, ignored );
			} );
		}
	
		if ( l ) {
			fragment = buildFragment( args, collection[ 0 ].ownerDocument, false, collection, ignored );
			first = fragment.firstChild;
	
			if ( fragment.childNodes.length === 1 ) {
				fragment = first;
			}
	
			// Require either new content or an interest in ignored elements to invoke the callback
			if ( first || ignored ) {
				scripts = jQuery.map( getAll( fragment, "script" ), disableScript );
				hasScripts = scripts.length;
	
				// Use the original fragment for the last item
				// instead of the first because it can end up
				// being emptied incorrectly in certain situations (#8070).
				for ( ; i < l; i++ ) {
					node = fragment;
	
					if ( i !== iNoClone ) {
						node = jQuery.clone( node, true, true );
	
						// Keep references to cloned scripts for later restoration
						if ( hasScripts ) {
	
							// Support: Android<4.1, PhantomJS<2
							// push.apply(_, arraylike) throws on ancient WebKit
							jQuery.merge( scripts, getAll( node, "script" ) );
						}
					}
	
					callback.call( collection[ i ], node, i );
				}
	
				if ( hasScripts ) {
					doc = scripts[ scripts.length - 1 ].ownerDocument;
	
					// Reenable scripts
					jQuery.map( scripts, restoreScript );
	
					// Evaluate executable scripts on first document insertion
					for ( i = 0; i < hasScripts; i++ ) {
						node = scripts[ i ];
						if ( rscriptType.test( node.type || "" ) &&
							!dataPriv.access( node, "globalEval" ) &&
							jQuery.contains( doc, node ) ) {
	
							if ( node.src ) {
	
								// Optional AJAX dependency, but won't run scripts if not present
								if ( jQuery._evalUrl ) {
									jQuery._evalUrl( node.src );
								}
							} else {
								jQuery.globalEval( node.textContent.replace( rcleanScript, "" ) );
							}
						}
					}
				}
			}
		}
	
		return collection;
	}
	
	function remove( elem, selector, keepData ) {
		var node,
			nodes = selector ? jQuery.filter( selector, elem ) : elem,
			i = 0;
	
		for ( ; ( node = nodes[ i ] ) != null; i++ ) {
			if ( !keepData && node.nodeType === 1 ) {
				jQuery.cleanData( getAll( node ) );
			}
	
			if ( node.parentNode ) {
				if ( keepData && jQuery.contains( node.ownerDocument, node ) ) {
					setGlobalEval( getAll( node, "script" ) );
				}
				node.parentNode.removeChild( node );
			}
		}
	
		return elem;
	}
	
	jQuery.extend( {
		htmlPrefilter: function( html ) {
			return html.replace( rxhtmlTag, "<$1></$2>" );
		},
	
		clone: function( elem, dataAndEvents, deepDataAndEvents ) {
			var i, l, srcElements, destElements,
				clone = elem.cloneNode( true ),
				inPage = jQuery.contains( elem.ownerDocument, elem );
	
			// Fix IE cloning issues
			if ( !support.noCloneChecked && ( elem.nodeType === 1 || elem.nodeType === 11 ) &&
					!jQuery.isXMLDoc( elem ) ) {
	
				// We eschew Sizzle here for performance reasons: http://jsperf.com/getall-vs-sizzle/2
				destElements = getAll( clone );
				srcElements = getAll( elem );
	
				for ( i = 0, l = srcElements.length; i < l; i++ ) {
					fixInput( srcElements[ i ], destElements[ i ] );
				}
			}
	
			// Copy the events from the original to the clone
			if ( dataAndEvents ) {
				if ( deepDataAndEvents ) {
					srcElements = srcElements || getAll( elem );
					destElements = destElements || getAll( clone );
	
					for ( i = 0, l = srcElements.length; i < l; i++ ) {
						cloneCopyEvent( srcElements[ i ], destElements[ i ] );
					}
				} else {
					cloneCopyEvent( elem, clone );
				}
			}
	
			// Preserve script evaluation history
			destElements = getAll( clone, "script" );
			if ( destElements.length > 0 ) {
				setGlobalEval( destElements, !inPage && getAll( elem, "script" ) );
			}
	
			// Return the cloned set
			return clone;
		},
	
		cleanData: function( elems ) {
			var data, elem, type,
				special = jQuery.event.special,
				i = 0;
	
			for ( ; ( elem = elems[ i ] ) !== undefined; i++ ) {
				if ( acceptData( elem ) ) {
					if ( ( data = elem[ dataPriv.expando ] ) ) {
						if ( data.events ) {
							for ( type in data.events ) {
								if ( special[ type ] ) {
									jQuery.event.remove( elem, type );
	
								// This is a shortcut to avoid jQuery.event.remove's overhead
								} else {
									jQuery.removeEvent( elem, type, data.handle );
								}
							}
						}
	
						// Support: Chrome <= 35-45+
						// Assign undefined instead of using delete, see Data#remove
						elem[ dataPriv.expando ] = undefined;
					}
					if ( elem[ dataUser.expando ] ) {
	
						// Support: Chrome <= 35-45+
						// Assign undefined instead of using delete, see Data#remove
						elem[ dataUser.expando ] = undefined;
					}
				}
			}
		}
	} );
	
	jQuery.fn.extend( {
	
		// Keep domManip exposed until 3.0 (gh-2225)
		domManip: domManip,
	
		detach: function( selector ) {
			return remove( this, selector, true );
		},
	
		remove: function( selector ) {
			return remove( this, selector );
		},
	
		text: function( value ) {
			return access( this, function( value ) {
				return value === undefined ?
					jQuery.text( this ) :
					this.empty().each( function() {
						if ( this.nodeType === 1 || this.nodeType === 11 || this.nodeType === 9 ) {
							this.textContent = value;
						}
					} );
			}, null, value, arguments.length );
		},
	
		append: function() {
			return domManip( this, arguments, function( elem ) {
				if ( this.nodeType === 1 || this.nodeType === 11 || this.nodeType === 9 ) {
					var target = manipulationTarget( this, elem );
					target.appendChild( elem );
				}
			} );
		},
	
		prepend: function() {
			return domManip( this, arguments, function( elem ) {
				if ( this.nodeType === 1 || this.nodeType === 11 || this.nodeType === 9 ) {
					var target = manipulationTarget( this, elem );
					target.insertBefore( elem, target.firstChild );
				}
			} );
		},
	
		before: function() {
			return domManip( this, arguments, function( elem ) {
				if ( this.parentNode ) {
					this.parentNode.insertBefore( elem, this );
				}
			} );
		},
	
		after: function() {
			return domManip( this, arguments, function( elem ) {
				if ( this.parentNode ) {
					this.parentNode.insertBefore( elem, this.nextSibling );
				}
			} );
		},
	
		empty: function() {
			var elem,
				i = 0;
	
			for ( ; ( elem = this[ i ] ) != null; i++ ) {
				if ( elem.nodeType === 1 ) {
	
					// Prevent memory leaks
					jQuery.cleanData( getAll( elem, false ) );
	
					// Remove any remaining nodes
					elem.textContent = "";
				}
			}
	
			return this;
		},
	
		clone: function( dataAndEvents, deepDataAndEvents ) {
			dataAndEvents = dataAndEvents == null ? false : dataAndEvents;
			deepDataAndEvents = deepDataAndEvents == null ? dataAndEvents : deepDataAndEvents;
	
			return this.map( function() {
				return jQuery.clone( this, dataAndEvents, deepDataAndEvents );
			} );
		},
	
		html: function( value ) {
			return access( this, function( value ) {
				var elem = this[ 0 ] || {},
					i = 0,
					l = this.length;
	
				if ( value === undefined && elem.nodeType === 1 ) {
					return elem.innerHTML;
				}
	
				// See if we can take a shortcut and just use innerHTML
				if ( typeof value === "string" && !rnoInnerhtml.test( value ) &&
					!wrapMap[ ( rtagName.exec( value ) || [ "", "" ] )[ 1 ].toLowerCase() ] ) {
	
					value = jQuery.htmlPrefilter( value );
	
					try {
						for ( ; i < l; i++ ) {
							elem = this[ i ] || {};
	
							// Remove element nodes and prevent memory leaks
							if ( elem.nodeType === 1 ) {
								jQuery.cleanData( getAll( elem, false ) );
								elem.innerHTML = value;
							}
						}
	
						elem = 0;
	
					// If using innerHTML throws an exception, use the fallback method
					} catch ( e ) {}
				}
	
				if ( elem ) {
					this.empty().append( value );
				}
			}, null, value, arguments.length );
		},
	
		replaceWith: function() {
			var ignored = [];
	
			// Make the changes, replacing each non-ignored context element with the new content
			return domManip( this, arguments, function( elem ) {
				var parent = this.parentNode;
	
				if ( jQuery.inArray( this, ignored ) < 0 ) {
					jQuery.cleanData( getAll( this ) );
					if ( parent ) {
						parent.replaceChild( elem, this );
					}
				}
	
			// Force callback invocation
			}, ignored );
		}
	} );
	
	jQuery.each( {
		appendTo: "append",
		prependTo: "prepend",
		insertBefore: "before",
		insertAfter: "after",
		replaceAll: "replaceWith"
	}, function( name, original ) {
		jQuery.fn[ name ] = function( selector ) {
			var elems,
				ret = [],
				insert = jQuery( selector ),
				last = insert.length - 1,
				i = 0;
	
			for ( ; i <= last; i++ ) {
				elems = i === last ? this : this.clone( true );
				jQuery( insert[ i ] )[ original ]( elems );
	
				// Support: QtWebKit
				// .get() because push.apply(_, arraylike) throws
				push.apply( ret, elems.get() );
			}
	
			return this.pushStack( ret );
		};
	} );
	
	
	var iframe,
		elemdisplay = {
	
			// Support: Firefox
			// We have to pre-define these values for FF (#10227)
			HTML: "block",
			BODY: "block"
		};
	
	/**
	 * Retrieve the actual display of a element
	 * @param {String} name nodeName of the element
	 * @param {Object} doc Document object
	 */
	
	// Called only from within defaultDisplay
	function actualDisplay( name, doc ) {
		var elem = jQuery( doc.createElement( name ) ).appendTo( doc.body ),
	
			display = jQuery.css( elem[ 0 ], "display" );
	
		// We don't have any data stored on the element,
		// so use "detach" method as fast way to get rid of the element
		elem.detach();
	
		return display;
	}
	
	/**
	 * Try to determine the default display value of an element
	 * @param {String} nodeName
	 */
	function defaultDisplay( nodeName ) {
		var doc = document,
			display = elemdisplay[ nodeName ];
	
		if ( !display ) {
			display = actualDisplay( nodeName, doc );
	
			// If the simple way fails, read from inside an iframe
			if ( display === "none" || !display ) {
	
				// Use the already-created iframe if possible
				iframe = ( iframe || jQuery( "<iframe frameborder='0' width='0' height='0'/>" ) )
					.appendTo( doc.documentElement );
	
				// Always write a new HTML skeleton so Webkit and Firefox don't choke on reuse
				doc = iframe[ 0 ].contentDocument;
	
				// Support: IE
				doc.write();
				doc.close();
	
				display = actualDisplay( nodeName, doc );
				iframe.detach();
			}
	
			// Store the correct default display
			elemdisplay[ nodeName ] = display;
		}
	
		return display;
	}
	var rmargin = ( /^margin/ );
	
	var rnumnonpx = new RegExp( "^(" + pnum + ")(?!px)[a-z%]+$", "i" );
	
	var getStyles = function( elem ) {
	
			// Support: IE<=11+, Firefox<=30+ (#15098, #14150)
			// IE throws on elements created in popups
			// FF meanwhile throws on frame elements through "defaultView.getComputedStyle"
			var view = elem.ownerDocument.defaultView;
	
			if ( !view || !view.opener ) {
				view = window;
			}
	
			return view.getComputedStyle( elem );
		};
	
	var swap = function( elem, options, callback, args ) {
		var ret, name,
			old = {};
	
		// Remember the old values, and insert the new ones
		for ( name in options ) {
			old[ name ] = elem.style[ name ];
			elem.style[ name ] = options[ name ];
		}
	
		ret = callback.apply( elem, args || [] );
	
		// Revert the old values
		for ( name in options ) {
			elem.style[ name ] = old[ name ];
		}
	
		return ret;
	};
	
	
	var documentElement = document.documentElement;
	
	
	
	( function() {
		var pixelPositionVal, boxSizingReliableVal, pixelMarginRightVal, reliableMarginLeftVal,
			container = document.createElement( "div" ),
			div = document.createElement( "div" );
	
		// Finish early in limited (non-browser) environments
		if ( !div.style ) {
			return;
		}
	
		// Support: IE9-11+
		// Style of cloned element affects source element cloned (#8908)
		div.style.backgroundClip = "content-box";
		div.cloneNode( true ).style.backgroundClip = "";
		support.clearCloneStyle = div.style.backgroundClip === "content-box";
	
		container.style.cssText = "border:0;width:8px;height:0;top:0;left:-9999px;" +
			"padding:0;margin-top:1px;position:absolute";
		container.appendChild( div );
	
		// Executing both pixelPosition & boxSizingReliable tests require only one layout
		// so they're executed at the same time to save the second computation.
		function computeStyleTests() {
			div.style.cssText =
	
				// Support: Firefox<29, Android 2.3
				// Vendor-prefix box-sizing
				"-webkit-box-sizing:border-box;-moz-box-sizing:border-box;box-sizing:border-box;" +
				"position:relative;display:block;" +
				"margin:auto;border:1px;padding:1px;" +
				"top:1%;width:50%";
			div.innerHTML = "";
			documentElement.appendChild( container );
	
			var divStyle = window.getComputedStyle( div );
			pixelPositionVal = divStyle.top !== "1%";
			reliableMarginLeftVal = divStyle.marginLeft === "2px";
			boxSizingReliableVal = divStyle.width === "4px";
	
			// Support: Android 4.0 - 4.3 only
			// Some styles come back with percentage values, even though they shouldn't
			div.style.marginRight = "50%";
			pixelMarginRightVal = divStyle.marginRight === "4px";
	
			documentElement.removeChild( container );
		}
	
		jQuery.extend( support, {
			pixelPosition: function() {
	
				// This test is executed only once but we still do memoizing
				// since we can use the boxSizingReliable pre-computing.
				// No need to check if the test was already performed, though.
				computeStyleTests();
				return pixelPositionVal;
			},
			boxSizingReliable: function() {
				if ( boxSizingReliableVal == null ) {
					computeStyleTests();
				}
				return boxSizingReliableVal;
			},
			pixelMarginRight: function() {
	
				// Support: Android 4.0-4.3
				// We're checking for boxSizingReliableVal here instead of pixelMarginRightVal
				// since that compresses better and they're computed together anyway.
				if ( boxSizingReliableVal == null ) {
					computeStyleTests();
				}
				return pixelMarginRightVal;
			},
			reliableMarginLeft: function() {
	
				// Support: IE <=8 only, Android 4.0 - 4.3 only, Firefox <=3 - 37
				if ( boxSizingReliableVal == null ) {
					computeStyleTests();
				}
				return reliableMarginLeftVal;
			},
			reliableMarginRight: function() {
	
				// Support: Android 2.3
				// Check if div with explicit width and no margin-right incorrectly
				// gets computed margin-right based on width of container. (#3333)
				// WebKit Bug 13343 - getComputedStyle returns wrong value for margin-right
				// This support function is only executed once so no memoizing is needed.
				var ret,
					marginDiv = div.appendChild( document.createElement( "div" ) );
	
				// Reset CSS: box-sizing; display; margin; border; padding
				marginDiv.style.cssText = div.style.cssText =
	
					// Support: Android 2.3
					// Vendor-prefix box-sizing
					"-webkit-box-sizing:content-box;box-sizing:content-box;" +
					"display:block;margin:0;border:0;padding:0";
				marginDiv.style.marginRight = marginDiv.style.width = "0";
				div.style.width = "1px";
				documentElement.appendChild( container );
	
				ret = !parseFloat( window.getComputedStyle( marginDiv ).marginRight );
	
				documentElement.removeChild( container );
				div.removeChild( marginDiv );
	
				return ret;
			}
		} );
	} )();
	
	
	function curCSS( elem, name, computed ) {
		var width, minWidth, maxWidth, ret,
			style = elem.style;
	
		computed = computed || getStyles( elem );
		ret = computed ? computed.getPropertyValue( name ) || computed[ name ] : undefined;
	
		// Support: Opera 12.1x only
		// Fall back to style even without computed
		// computed is undefined for elems on document fragments
		if ( ( ret === "" || ret === undefined ) && !jQuery.contains( elem.ownerDocument, elem ) ) {
			ret = jQuery.style( elem, name );
		}
	
		// Support: IE9
		// getPropertyValue is only needed for .css('filter') (#12537)
		if ( computed ) {
	
			// A tribute to the "awesome hack by Dean Edwards"
			// Android Browser returns percentage for some values,
			// but width seems to be reliably pixels.
			// This is against the CSSOM draft spec:
			// http://dev.w3.org/csswg/cssom/#resolved-values
			if ( !support.pixelMarginRight() && rnumnonpx.test( ret ) && rmargin.test( name ) ) {
	
				// Remember the original values
				width = style.width;
				minWidth = style.minWidth;
				maxWidth = style.maxWidth;
	
				// Put in the new values to get a computed value out
				style.minWidth = style.maxWidth = style.width = ret;
				ret = computed.width;
	
				// Revert the changed values
				style.width = width;
				style.minWidth = minWidth;
				style.maxWidth = maxWidth;
			}
		}
	
		return ret !== undefined ?
	
			// Support: IE9-11+
			// IE returns zIndex value as an integer.
			ret + "" :
			ret;
	}
	
	
	function addGetHookIf( conditionFn, hookFn ) {
	
		// Define the hook, we'll check on the first run if it's really needed.
		return {
			get: function() {
				if ( conditionFn() ) {
	
					// Hook not needed (or it's not possible to use it due
					// to missing dependency), remove it.
					delete this.get;
					return;
				}
	
				// Hook needed; redefine it so that the support test is not executed again.
				return ( this.get = hookFn ).apply( this, arguments );
			}
		};
	}
	
	
	var
	
		// Swappable if display is none or starts with table
		// except "table", "table-cell", or "table-caption"
		// See here for display values: https://developer.mozilla.org/en-US/docs/CSS/display
		rdisplayswap = /^(none|table(?!-c[ea]).+)/,
	
		cssShow = { position: "absolute", visibility: "hidden", display: "block" },
		cssNormalTransform = {
			letterSpacing: "0",
			fontWeight: "400"
		},
	
		cssPrefixes = [ "Webkit", "O", "Moz", "ms" ],
		emptyStyle = document.createElement( "div" ).style;
	
	// Return a css property mapped to a potentially vendor prefixed property
	function vendorPropName( name ) {
	
		// Shortcut for names that are not vendor prefixed
		if ( name in emptyStyle ) {
			return name;
		}
	
		// Check for vendor prefixed names
		var capName = name[ 0 ].toUpperCase() + name.slice( 1 ),
			i = cssPrefixes.length;
	
		while ( i-- ) {
			name = cssPrefixes[ i ] + capName;
			if ( name in emptyStyle ) {
				return name;
			}
		}
	}
	
	function setPositiveNumber( elem, value, subtract ) {
	
		// Any relative (+/-) values have already been
		// normalized at this point
		var matches = rcssNum.exec( value );
		return matches ?
	
			// Guard against undefined "subtract", e.g., when used as in cssHooks
			Math.max( 0, matches[ 2 ] - ( subtract || 0 ) ) + ( matches[ 3 ] || "px" ) :
			value;
	}
	
	function augmentWidthOrHeight( elem, name, extra, isBorderBox, styles ) {
		var i = extra === ( isBorderBox ? "border" : "content" ) ?
	
			// If we already have the right measurement, avoid augmentation
			4 :
	
			// Otherwise initialize for horizontal or vertical properties
			name === "width" ? 1 : 0,
	
			val = 0;
	
		for ( ; i < 4; i += 2 ) {
	
			// Both box models exclude margin, so add it if we want it
			if ( extra === "margin" ) {
				val += jQuery.css( elem, extra + cssExpand[ i ], true, styles );
			}
	
			if ( isBorderBox ) {
	
				// border-box includes padding, so remove it if we want content
				if ( extra === "content" ) {
					val -= jQuery.css( elem, "padding" + cssExpand[ i ], true, styles );
				}
	
				// At this point, extra isn't border nor margin, so remove border
				if ( extra !== "margin" ) {
					val -= jQuery.css( elem, "border" + cssExpand[ i ] + "Width", true, styles );
				}
			} else {
	
				// At this point, extra isn't content, so add padding
				val += jQuery.css( elem, "padding" + cssExpand[ i ], true, styles );
	
				// At this point, extra isn't content nor padding, so add border
				if ( extra !== "padding" ) {
					val += jQuery.css( elem, "border" + cssExpand[ i ] + "Width", true, styles );
				}
			}
		}
	
		return val;
	}
	
	function getWidthOrHeight( elem, name, extra ) {
	
		// Start with offset property, which is equivalent to the border-box value
		var valueIsBorderBox = true,
			val = name === "width" ? elem.offsetWidth : elem.offsetHeight,
			styles = getStyles( elem ),
			isBorderBox = jQuery.css( elem, "boxSizing", false, styles ) === "border-box";
	
		// Some non-html elements return undefined for offsetWidth, so check for null/undefined
		// svg - https://bugzilla.mozilla.org/show_bug.cgi?id=649285
		// MathML - https://bugzilla.mozilla.org/show_bug.cgi?id=491668
		if ( val <= 0 || val == null ) {
	
			// Fall back to computed then uncomputed css if necessary
			val = curCSS( elem, name, styles );
			if ( val < 0 || val == null ) {
				val = elem.style[ name ];
			}
	
			// Computed unit is not pixels. Stop here and return.
			if ( rnumnonpx.test( val ) ) {
				return val;
			}
	
			// Check for style in case a browser which returns unreliable values
			// for getComputedStyle silently falls back to the reliable elem.style
			valueIsBorderBox = isBorderBox &&
				( support.boxSizingReliable() || val === elem.style[ name ] );
	
			// Normalize "", auto, and prepare for extra
			val = parseFloat( val ) || 0;
		}
	
		// Use the active box-sizing model to add/subtract irrelevant styles
		return ( val +
			augmentWidthOrHeight(
				elem,
				name,
				extra || ( isBorderBox ? "border" : "content" ),
				valueIsBorderBox,
				styles
			)
		) + "px";
	}
	
	function showHide( elements, show ) {
		var display, elem, hidden,
			values = [],
			index = 0,
			length = elements.length;
	
		for ( ; index < length; index++ ) {
			elem = elements[ index ];
			if ( !elem.style ) {
				continue;
			}
	
			values[ index ] = dataPriv.get( elem, "olddisplay" );
			display = elem.style.display;
			if ( show ) {
	
				// Reset the inline display of this element to learn if it is
				// being hidden by cascaded rules or not
				if ( !values[ index ] && display === "none" ) {
					elem.style.display = "";
				}
	
				// Set elements which have been overridden with display: none
				// in a stylesheet to whatever the default browser style is
				// for such an element
				if ( elem.style.display === "" && isHidden( elem ) ) {
					values[ index ] = dataPriv.access(
						elem,
						"olddisplay",
						defaultDisplay( elem.nodeName )
					);
				}
			} else {
				hidden = isHidden( elem );
	
				if ( display !== "none" || !hidden ) {
					dataPriv.set(
						elem,
						"olddisplay",
						hidden ? display : jQuery.css( elem, "display" )
					);
				}
			}
		}
	
		// Set the display of most of the elements in a second loop
		// to avoid the constant reflow
		for ( index = 0; index < length; index++ ) {
			elem = elements[ index ];
			if ( !elem.style ) {
				continue;
			}
			if ( !show || elem.style.display === "none" || elem.style.display === "" ) {
				elem.style.display = show ? values[ index ] || "" : "none";
			}
		}
	
		return elements;
	}
	
	jQuery.extend( {
	
		// Add in style property hooks for overriding the default
		// behavior of getting and setting a style property
		cssHooks: {
			opacity: {
				get: function( elem, computed ) {
					if ( computed ) {
	
						// We should always get a number back from opacity
						var ret = curCSS( elem, "opacity" );
						return ret === "" ? "1" : ret;
					}
				}
			}
		},
	
		// Don't automatically add "px" to these possibly-unitless properties
		cssNumber: {
			"animationIterationCount": true,
			"columnCount": true,
			"fillOpacity": true,
			"flexGrow": true,
			"flexShrink": true,
			"fontWeight": true,
			"lineHeight": true,
			"opacity": true,
			"order": true,
			"orphans": true,
			"widows": true,
			"zIndex": true,
			"zoom": true
		},
	
		// Add in properties whose names you wish to fix before
		// setting or getting the value
		cssProps: {
			"float": "cssFloat"
		},
	
		// Get and set the style property on a DOM Node
		style: function( elem, name, value, extra ) {
	
			// Don't set styles on text and comment nodes
			if ( !elem || elem.nodeType === 3 || elem.nodeType === 8 || !elem.style ) {
				return;
			}
	
			// Make sure that we're working with the right name
			var ret, type, hooks,
				origName = jQuery.camelCase( name ),
				style = elem.style;
	
			name = jQuery.cssProps[ origName ] ||
				( jQuery.cssProps[ origName ] = vendorPropName( origName ) || origName );
	
			// Gets hook for the prefixed version, then unprefixed version
			hooks = jQuery.cssHooks[ name ] || jQuery.cssHooks[ origName ];
	
			// Check if we're setting a value
			if ( value !== undefined ) {
				type = typeof value;
	
				// Convert "+=" or "-=" to relative numbers (#7345)
				if ( type === "string" && ( ret = rcssNum.exec( value ) ) && ret[ 1 ] ) {
					value = adjustCSS( elem, name, ret );
	
					// Fixes bug #9237
					type = "number";
				}
	
				// Make sure that null and NaN values aren't set (#7116)
				if ( value == null || value !== value ) {
					return;
				}
	
				// If a number was passed in, add the unit (except for certain CSS properties)
				if ( type === "number" ) {
					value += ret && ret[ 3 ] || ( jQuery.cssNumber[ origName ] ? "" : "px" );
				}
	
				// Support: IE9-11+
				// background-* props affect original clone's values
				if ( !support.clearCloneStyle && value === "" && name.indexOf( "background" ) === 0 ) {
					style[ name ] = "inherit";
				}
	
				// If a hook was provided, use that value, otherwise just set the specified value
				if ( !hooks || !( "set" in hooks ) ||
					( value = hooks.set( elem, value, extra ) ) !== undefined ) {
	
					style[ name ] = value;
				}
	
			} else {
	
				// If a hook was provided get the non-computed value from there
				if ( hooks && "get" in hooks &&
					( ret = hooks.get( elem, false, extra ) ) !== undefined ) {
	
					return ret;
				}
	
				// Otherwise just get the value from the style object
				return style[ name ];
			}
		},
	
		css: function( elem, name, extra, styles ) {
			var val, num, hooks,
				origName = jQuery.camelCase( name );
	
			// Make sure that we're working with the right name
			name = jQuery.cssProps[ origName ] ||
				( jQuery.cssProps[ origName ] = vendorPropName( origName ) || origName );
	
			// Try prefixed name followed by the unprefixed name
			hooks = jQuery.cssHooks[ name ] || jQuery.cssHooks[ origName ];
	
			// If a hook was provided get the computed value from there
			if ( hooks && "get" in hooks ) {
				val = hooks.get( elem, true, extra );
			}
	
			// Otherwise, if a way to get the computed value exists, use that
			if ( val === undefined ) {
				val = curCSS( elem, name, styles );
			}
	
			// Convert "normal" to computed value
			if ( val === "normal" && name in cssNormalTransform ) {
				val = cssNormalTransform[ name ];
			}
	
			// Make numeric if forced or a qualifier was provided and val looks numeric
			if ( extra === "" || extra ) {
				num = parseFloat( val );
				return extra === true || isFinite( num ) ? num || 0 : val;
			}
			return val;
		}
	} );
	
	jQuery.each( [ "height", "width" ], function( i, name ) {
		jQuery.cssHooks[ name ] = {
			get: function( elem, computed, extra ) {
				if ( computed ) {
	
					// Certain elements can have dimension info if we invisibly show them
					// but it must have a current display style that would benefit
					return rdisplayswap.test( jQuery.css( elem, "display" ) ) &&
						elem.offsetWidth === 0 ?
							swap( elem, cssShow, function() {
								return getWidthOrHeight( elem, name, extra );
							} ) :
							getWidthOrHeight( elem, name, extra );
				}
			},
	
			set: function( elem, value, extra ) {
				var matches,
					styles = extra && getStyles( elem ),
					subtract = extra && augmentWidthOrHeight(
						elem,
						name,
						extra,
						jQuery.css( elem, "boxSizing", false, styles ) === "border-box",
						styles
					);
	
				// Convert to pixels if value adjustment is needed
				if ( subtract && ( matches = rcssNum.exec( value ) ) &&
					( matches[ 3 ] || "px" ) !== "px" ) {
	
					elem.style[ name ] = value;
					value = jQuery.css( elem, name );
				}
	
				return setPositiveNumber( elem, value, subtract );
			}
		};
	} );
	
	jQuery.cssHooks.marginLeft = addGetHookIf( support.reliableMarginLeft,
		function( elem, computed ) {
			if ( computed ) {
				return ( parseFloat( curCSS( elem, "marginLeft" ) ) ||
					elem.getBoundingClientRect().left -
						swap( elem, { marginLeft: 0 }, function() {
							return elem.getBoundingClientRect().left;
						} )
					) + "px";
			}
		}
	);
	
	// Support: Android 2.3
	jQuery.cssHooks.marginRight = addGetHookIf( support.reliableMarginRight,
		function( elem, computed ) {
			if ( computed ) {
				return swap( elem, { "display": "inline-block" },
					curCSS, [ elem, "marginRight" ] );
			}
		}
	);
	
	// These hooks are used by animate to expand properties
	jQuery.each( {
		margin: "",
		padding: "",
		border: "Width"
	}, function( prefix, suffix ) {
		jQuery.cssHooks[ prefix + suffix ] = {
			expand: function( value ) {
				var i = 0,
					expanded = {},
	
					// Assumes a single number if not a string
					parts = typeof value === "string" ? value.split( " " ) : [ value ];
	
				for ( ; i < 4; i++ ) {
					expanded[ prefix + cssExpand[ i ] + suffix ] =
						parts[ i ] || parts[ i - 2 ] || parts[ 0 ];
				}
	
				return expanded;
			}
		};
	
		if ( !rmargin.test( prefix ) ) {
			jQuery.cssHooks[ prefix + suffix ].set = setPositiveNumber;
		}
	} );
	
	jQuery.fn.extend( {
		css: function( name, value ) {
			return access( this, function( elem, name, value ) {
				var styles, len,
					map = {},
					i = 0;
	
				if ( jQuery.isArray( name ) ) {
					styles = getStyles( elem );
					len = name.length;
	
					for ( ; i < len; i++ ) {
						map[ name[ i ] ] = jQuery.css( elem, name[ i ], false, styles );
					}
	
					return map;
				}
	
				return value !== undefined ?
					jQuery.style( elem, name, value ) :
					jQuery.css( elem, name );
			}, name, value, arguments.length > 1 );
		},
		show: function() {
			return showHide( this, true );
		},
		hide: function() {
			return showHide( this );
		},
		toggle: function( state ) {
			if ( typeof state === "boolean" ) {
				return state ? this.show() : this.hide();
			}
	
			return this.each( function() {
				if ( isHidden( this ) ) {
					jQuery( this ).show();
				} else {
					jQuery( this ).hide();
				}
			} );
		}
	} );
	
	
	function Tween( elem, options, prop, end, easing ) {
		return new Tween.prototype.init( elem, options, prop, end, easing );
	}
	jQuery.Tween = Tween;
	
	Tween.prototype = {
		constructor: Tween,
		init: function( elem, options, prop, end, easing, unit ) {
			this.elem = elem;
			this.prop = prop;
			this.easing = easing || jQuery.easing._default;
			this.options = options;
			this.start = this.now = this.cur();
			this.end = end;
			this.unit = unit || ( jQuery.cssNumber[ prop ] ? "" : "px" );
		},
		cur: function() {
			var hooks = Tween.propHooks[ this.prop ];
	
			return hooks && hooks.get ?
				hooks.get( this ) :
				Tween.propHooks._default.get( this );
		},
		run: function( percent ) {
			var eased,
				hooks = Tween.propHooks[ this.prop ];
	
			if ( this.options.duration ) {
				this.pos = eased = jQuery.easing[ this.easing ](
					percent, this.options.duration * percent, 0, 1, this.options.duration
				);
			} else {
				this.pos = eased = percent;
			}
			this.now = ( this.end - this.start ) * eased + this.start;
	
			if ( this.options.step ) {
				this.options.step.call( this.elem, this.now, this );
			}
	
			if ( hooks && hooks.set ) {
				hooks.set( this );
			} else {
				Tween.propHooks._default.set( this );
			}
			return this;
		}
	};
	
	Tween.prototype.init.prototype = Tween.prototype;
	
	Tween.propHooks = {
		_default: {
			get: function( tween ) {
				var result;
	
				// Use a property on the element directly when it is not a DOM element,
				// or when there is no matching style property that exists.
				if ( tween.elem.nodeType !== 1 ||
					tween.elem[ tween.prop ] != null && tween.elem.style[ tween.prop ] == null ) {
					return tween.elem[ tween.prop ];
				}
	
				// Passing an empty string as a 3rd parameter to .css will automatically
				// attempt a parseFloat and fallback to a string if the parse fails.
				// Simple values such as "10px" are parsed to Float;
				// complex values such as "rotate(1rad)" are returned as-is.
				result = jQuery.css( tween.elem, tween.prop, "" );
	
				// Empty strings, null, undefined and "auto" are converted to 0.
				return !result || result === "auto" ? 0 : result;
			},
			set: function( tween ) {
	
				// Use step hook for back compat.
				// Use cssHook if its there.
				// Use .style if available and use plain properties where available.
				if ( jQuery.fx.step[ tween.prop ] ) {
					jQuery.fx.step[ tween.prop ]( tween );
				} else if ( tween.elem.nodeType === 1 &&
					( tween.elem.style[ jQuery.cssProps[ tween.prop ] ] != null ||
						jQuery.cssHooks[ tween.prop ] ) ) {
					jQuery.style( tween.elem, tween.prop, tween.now + tween.unit );
				} else {
					tween.elem[ tween.prop ] = tween.now;
				}
			}
		}
	};
	
	// Support: IE9
	// Panic based approach to setting things on disconnected nodes
	Tween.propHooks.scrollTop = Tween.propHooks.scrollLeft = {
		set: function( tween ) {
			if ( tween.elem.nodeType && tween.elem.parentNode ) {
				tween.elem[ tween.prop ] = tween.now;
			}
		}
	};
	
	jQuery.easing = {
		linear: function( p ) {
			return p;
		},
		swing: function( p ) {
			return 0.5 - Math.cos( p * Math.PI ) / 2;
		},
		_default: "swing"
	};
	
	jQuery.fx = Tween.prototype.init;
	
	// Back Compat <1.8 extension point
	jQuery.fx.step = {};
	
	
	
	
	var
		fxNow, timerId,
		rfxtypes = /^(?:toggle|show|hide)$/,
		rrun = /queueHooks$/;
	
	// Animations created synchronously will run synchronously
	function createFxNow() {
		window.setTimeout( function() {
			fxNow = undefined;
		} );
		return ( fxNow = jQuery.now() );
	}
	
	// Generate parameters to create a standard animation
	function genFx( type, includeWidth ) {
		var which,
			i = 0,
			attrs = { height: type };
	
		// If we include width, step value is 1 to do all cssExpand values,
		// otherwise step value is 2 to skip over Left and Right
		includeWidth = includeWidth ? 1 : 0;
		for ( ; i < 4 ; i += 2 - includeWidth ) {
			which = cssExpand[ i ];
			attrs[ "margin" + which ] = attrs[ "padding" + which ] = type;
		}
	
		if ( includeWidth ) {
			attrs.opacity = attrs.width = type;
		}
	
		return attrs;
	}
	
	function createTween( value, prop, animation ) {
		var tween,
			collection = ( Animation.tweeners[ prop ] || [] ).concat( Animation.tweeners[ "*" ] ),
			index = 0,
			length = collection.length;
		for ( ; index < length; index++ ) {
			if ( ( tween = collection[ index ].call( animation, prop, value ) ) ) {
	
				// We're done with this property
				return tween;
			}
		}
	}
	
	function defaultPrefilter( elem, props, opts ) {
		/* jshint validthis: true */
		var prop, value, toggle, tween, hooks, oldfire, display, checkDisplay,
			anim = this,
			orig = {},
			style = elem.style,
			hidden = elem.nodeType && isHidden( elem ),
			dataShow = dataPriv.get( elem, "fxshow" );
	
		// Handle queue: false promises
		if ( !opts.queue ) {
			hooks = jQuery._queueHooks( elem, "fx" );
			if ( hooks.unqueued == null ) {
				hooks.unqueued = 0;
				oldfire = hooks.empty.fire;
				hooks.empty.fire = function() {
					if ( !hooks.unqueued ) {
						oldfire();
					}
				};
			}
			hooks.unqueued++;
	
			anim.always( function() {
	
				// Ensure the complete handler is called before this completes
				anim.always( function() {
					hooks.unqueued--;
					if ( !jQuery.queue( elem, "fx" ).length ) {
						hooks.empty.fire();
					}
				} );
			} );
		}
	
		// Height/width overflow pass
		if ( elem.nodeType === 1 && ( "height" in props || "width" in props ) ) {
	
			// Make sure that nothing sneaks out
			// Record all 3 overflow attributes because IE9-10 do not
			// change the overflow attribute when overflowX and
			// overflowY are set to the same value
			opts.overflow = [ style.overflow, style.overflowX, style.overflowY ];
	
			// Set display property to inline-block for height/width
			// animations on inline elements that are having width/height animated
			display = jQuery.css( elem, "display" );
	
			// Test default display if display is currently "none"
			checkDisplay = display === "none" ?
				dataPriv.get( elem, "olddisplay" ) || defaultDisplay( elem.nodeName ) : display;
	
			if ( checkDisplay === "inline" && jQuery.css( elem, "float" ) === "none" ) {
				style.display = "inline-block";
			}
		}
	
		if ( opts.overflow ) {
			style.overflow = "hidden";
			anim.always( function() {
				style.overflow = opts.overflow[ 0 ];
				style.overflowX = opts.overflow[ 1 ];
				style.overflowY = opts.overflow[ 2 ];
			} );
		}
	
		// show/hide pass
		for ( prop in props ) {
			value = props[ prop ];
			if ( rfxtypes.exec( value ) ) {
				delete props[ prop ];
				toggle = toggle || value === "toggle";
				if ( value === ( hidden ? "hide" : "show" ) ) {
	
					// If there is dataShow left over from a stopped hide or show
					// and we are going to proceed with show, we should pretend to be hidden
					if ( value === "show" && dataShow && dataShow[ prop ] !== undefined ) {
						hidden = true;
					} else {
						continue;
					}
				}
				orig[ prop ] = dataShow && dataShow[ prop ] || jQuery.style( elem, prop );
	
			// Any non-fx value stops us from restoring the original display value
			} else {
				display = undefined;
			}
		}
	
		if ( !jQuery.isEmptyObject( orig ) ) {
			if ( dataShow ) {
				if ( "hidden" in dataShow ) {
					hidden = dataShow.hidden;
				}
			} else {
				dataShow = dataPriv.access( elem, "fxshow", {} );
			}
	
			// Store state if its toggle - enables .stop().toggle() to "reverse"
			if ( toggle ) {
				dataShow.hidden = !hidden;
			}
			if ( hidden ) {
				jQuery( elem ).show();
			} else {
				anim.done( function() {
					jQuery( elem ).hide();
				} );
			}
			anim.done( function() {
				var prop;
	
				dataPriv.remove( elem, "fxshow" );
				for ( prop in orig ) {
					jQuery.style( elem, prop, orig[ prop ] );
				}
			} );
			for ( prop in orig ) {
				tween = createTween( hidden ? dataShow[ prop ] : 0, prop, anim );
	
				if ( !( prop in dataShow ) ) {
					dataShow[ prop ] = tween.start;
					if ( hidden ) {
						tween.end = tween.start;
						tween.start = prop === "width" || prop === "height" ? 1 : 0;
					}
				}
			}
	
		// If this is a noop like .hide().hide(), restore an overwritten display value
		} else if ( ( display === "none" ? defaultDisplay( elem.nodeName ) : display ) === "inline" ) {
			style.display = display;
		}
	}
	
	function propFilter( props, specialEasing ) {
		var index, name, easing, value, hooks;
	
		// camelCase, specialEasing and expand cssHook pass
		for ( index in props ) {
			name = jQuery.camelCase( index );
			easing = specialEasing[ name ];
			value = props[ index ];
			if ( jQuery.isArray( value ) ) {
				easing = value[ 1 ];
				value = props[ index ] = value[ 0 ];
			}
	
			if ( index !== name ) {
				props[ name ] = value;
				delete props[ index ];
			}
	
			hooks = jQuery.cssHooks[ name ];
			if ( hooks && "expand" in hooks ) {
				value = hooks.expand( value );
				delete props[ name ];
	
				// Not quite $.extend, this won't overwrite existing keys.
				// Reusing 'index' because we have the correct "name"
				for ( index in value ) {
					if ( !( index in props ) ) {
						props[ index ] = value[ index ];
						specialEasing[ index ] = easing;
					}
				}
			} else {
				specialEasing[ name ] = easing;
			}
		}
	}
	
	function Animation( elem, properties, options ) {
		var result,
			stopped,
			index = 0,
			length = Animation.prefilters.length,
			deferred = jQuery.Deferred().always( function() {
	
				// Don't match elem in the :animated selector
				delete tick.elem;
			} ),
			tick = function() {
				if ( stopped ) {
					return false;
				}
				var currentTime = fxNow || createFxNow(),
					remaining = Math.max( 0, animation.startTime + animation.duration - currentTime ),
	
					// Support: Android 2.3
					// Archaic crash bug won't allow us to use `1 - ( 0.5 || 0 )` (#12497)
					temp = remaining / animation.duration || 0,
					percent = 1 - temp,
					index = 0,
					length = animation.tweens.length;
	
				for ( ; index < length ; index++ ) {
					animation.tweens[ index ].run( percent );
				}
	
				deferred.notifyWith( elem, [ animation, percent, remaining ] );
	
				if ( percent < 1 && length ) {
					return remaining;
				} else {
					deferred.resolveWith( elem, [ animation ] );
					return false;
				}
			},
			animation = deferred.promise( {
				elem: elem,
				props: jQuery.extend( {}, properties ),
				opts: jQuery.extend( true, {
					specialEasing: {},
					easing: jQuery.easing._default
				}, options ),
				originalProperties: properties,
				originalOptions: options,
				startTime: fxNow || createFxNow(),
				duration: options.duration,
				tweens: [],
				createTween: function( prop, end ) {
					var tween = jQuery.Tween( elem, animation.opts, prop, end,
							animation.opts.specialEasing[ prop ] || animation.opts.easing );
					animation.tweens.push( tween );
					return tween;
				},
				stop: function( gotoEnd ) {
					var index = 0,
	
						// If we are going to the end, we want to run all the tweens
						// otherwise we skip this part
						length = gotoEnd ? animation.tweens.length : 0;
					if ( stopped ) {
						return this;
					}
					stopped = true;
					for ( ; index < length ; index++ ) {
						animation.tweens[ index ].run( 1 );
					}
	
					// Resolve when we played the last frame; otherwise, reject
					if ( gotoEnd ) {
						deferred.notifyWith( elem, [ animation, 1, 0 ] );
						deferred.resolveWith( elem, [ animation, gotoEnd ] );
					} else {
						deferred.rejectWith( elem, [ animation, gotoEnd ] );
					}
					return this;
				}
			} ),
			props = animation.props;
	
		propFilter( props, animation.opts.specialEasing );
	
		for ( ; index < length ; index++ ) {
			result = Animation.prefilters[ index ].call( animation, elem, props, animation.opts );
			if ( result ) {
				if ( jQuery.isFunction( result.stop ) ) {
					jQuery._queueHooks( animation.elem, animation.opts.queue ).stop =
						jQuery.proxy( result.stop, result );
				}
				return result;
			}
		}
	
		jQuery.map( props, createTween, animation );
	
		if ( jQuery.isFunction( animation.opts.start ) ) {
			animation.opts.start.call( elem, animation );
		}
	
		jQuery.fx.timer(
			jQuery.extend( tick, {
				elem: elem,
				anim: animation,
				queue: animation.opts.queue
			} )
		);
	
		// attach callbacks from options
		return animation.progress( animation.opts.progress )
			.done( animation.opts.done, animation.opts.complete )
			.fail( animation.opts.fail )
			.always( animation.opts.always );
	}
	
	jQuery.Animation = jQuery.extend( Animation, {
		tweeners: {
			"*": [ function( prop, value ) {
				var tween = this.createTween( prop, value );
				adjustCSS( tween.elem, prop, rcssNum.exec( value ), tween );
				return tween;
			} ]
		},
	
		tweener: function( props, callback ) {
			if ( jQuery.isFunction( props ) ) {
				callback = props;
				props = [ "*" ];
			} else {
				props = props.match( rnotwhite );
			}
	
			var prop,
				index = 0,
				length = props.length;
	
			for ( ; index < length ; index++ ) {
				prop = props[ index ];
				Animation.tweeners[ prop ] = Animation.tweeners[ prop ] || [];
				Animation.tweeners[ prop ].unshift( callback );
			}
		},
	
		prefilters: [ defaultPrefilter ],
	
		prefilter: function( callback, prepend ) {
			if ( prepend ) {
				Animation.prefilters.unshift( callback );
			} else {
				Animation.prefilters.push( callback );
			}
		}
	} );
	
	jQuery.speed = function( speed, easing, fn ) {
		var opt = speed && typeof speed === "object" ? jQuery.extend( {}, speed ) : {
			complete: fn || !fn && easing ||
				jQuery.isFunction( speed ) && speed,
			duration: speed,
			easing: fn && easing || easing && !jQuery.isFunction( easing ) && easing
		};
	
		opt.duration = jQuery.fx.off ? 0 : typeof opt.duration === "number" ?
			opt.duration : opt.duration in jQuery.fx.speeds ?
				jQuery.fx.speeds[ opt.duration ] : jQuery.fx.speeds._default;
	
		// Normalize opt.queue - true/undefined/null -> "fx"
		if ( opt.queue == null || opt.queue === true ) {
			opt.queue = "fx";
		}
	
		// Queueing
		opt.old = opt.complete;
	
		opt.complete = function() {
			if ( jQuery.isFunction( opt.old ) ) {
				opt.old.call( this );
			}
	
			if ( opt.queue ) {
				jQuery.dequeue( this, opt.queue );
			}
		};
	
		return opt;
	};
	
	jQuery.fn.extend( {
		fadeTo: function( speed, to, easing, callback ) {
	
			// Show any hidden elements after setting opacity to 0
			return this.filter( isHidden ).css( "opacity", 0 ).show()
	
				// Animate to the value specified
				.end().animate( { opacity: to }, speed, easing, callback );
		},
		animate: function( prop, speed, easing, callback ) {
			var empty = jQuery.isEmptyObject( prop ),
				optall = jQuery.speed( speed, easing, callback ),
				doAnimation = function() {
	
					// Operate on a copy of prop so per-property easing won't be lost
					var anim = Animation( this, jQuery.extend( {}, prop ), optall );
	
					// Empty animations, or finishing resolves immediately
					if ( empty || dataPriv.get( this, "finish" ) ) {
						anim.stop( true );
					}
				};
				doAnimation.finish = doAnimation;
	
			return empty || optall.queue === false ?
				this.each( doAnimation ) :
				this.queue( optall.queue, doAnimation );
		},
		stop: function( type, clearQueue, gotoEnd ) {
			var stopQueue = function( hooks ) {
				var stop = hooks.stop;
				delete hooks.stop;
				stop( gotoEnd );
			};
	
			if ( typeof type !== "string" ) {
				gotoEnd = clearQueue;
				clearQueue = type;
				type = undefined;
			}
			if ( clearQueue && type !== false ) {
				this.queue( type || "fx", [] );
			}
	
			return this.each( function() {
				var dequeue = true,
					index = type != null && type + "queueHooks",
					timers = jQuery.timers,
					data = dataPriv.get( this );
	
				if ( index ) {
					if ( data[ index ] && data[ index ].stop ) {
						stopQueue( data[ index ] );
					}
				} else {
					for ( index in data ) {
						if ( data[ index ] && data[ index ].stop && rrun.test( index ) ) {
							stopQueue( data[ index ] );
						}
					}
				}
	
				for ( index = timers.length; index--; ) {
					if ( timers[ index ].elem === this &&
						( type == null || timers[ index ].queue === type ) ) {
	
						timers[ index ].anim.stop( gotoEnd );
						dequeue = false;
						timers.splice( index, 1 );
					}
				}
	
				// Start the next in the queue if the last step wasn't forced.
				// Timers currently will call their complete callbacks, which
				// will dequeue but only if they were gotoEnd.
				if ( dequeue || !gotoEnd ) {
					jQuery.dequeue( this, type );
				}
			} );
		},
		finish: function( type ) {
			if ( type !== false ) {
				type = type || "fx";
			}
			return this.each( function() {
				var index,
					data = dataPriv.get( this ),
					queue = data[ type + "queue" ],
					hooks = data[ type + "queueHooks" ],
					timers = jQuery.timers,
					length = queue ? queue.length : 0;
	
				// Enable finishing flag on private data
				data.finish = true;
	
				// Empty the queue first
				jQuery.queue( this, type, [] );
	
				if ( hooks && hooks.stop ) {
					hooks.stop.call( this, true );
				}
	
				// Look for any active animations, and finish them
				for ( index = timers.length; index--; ) {
					if ( timers[ index ].elem === this && timers[ index ].queue === type ) {
						timers[ index ].anim.stop( true );
						timers.splice( index, 1 );
					}
				}
	
				// Look for any animations in the old queue and finish them
				for ( index = 0; index < length; index++ ) {
					if ( queue[ index ] && queue[ index ].finish ) {
						queue[ index ].finish.call( this );
					}
				}
	
				// Turn off finishing flag
				delete data.finish;
			} );
		}
	} );
	
	jQuery.each( [ "toggle", "show", "hide" ], function( i, name ) {
		var cssFn = jQuery.fn[ name ];
		jQuery.fn[ name ] = function( speed, easing, callback ) {
			return speed == null || typeof speed === "boolean" ?
				cssFn.apply( this, arguments ) :
				this.animate( genFx( name, true ), speed, easing, callback );
		};
	} );
	
	// Generate shortcuts for custom animations
	jQuery.each( {
		slideDown: genFx( "show" ),
		slideUp: genFx( "hide" ),
		slideToggle: genFx( "toggle" ),
		fadeIn: { opacity: "show" },
		fadeOut: { opacity: "hide" },
		fadeToggle: { opacity: "toggle" }
	}, function( name, props ) {
		jQuery.fn[ name ] = function( speed, easing, callback ) {
			return this.animate( props, speed, easing, callback );
		};
	} );
	
	jQuery.timers = [];
	jQuery.fx.tick = function() {
		var timer,
			i = 0,
			timers = jQuery.timers;
	
		fxNow = jQuery.now();
	
		for ( ; i < timers.length; i++ ) {
			timer = timers[ i ];
	
			// Checks the timer has not already been removed
			if ( !timer() && timers[ i ] === timer ) {
				timers.splice( i--, 1 );
			}
		}
	
		if ( !timers.length ) {
			jQuery.fx.stop();
		}
		fxNow = undefined;
	};
	
	jQuery.fx.timer = function( timer ) {
		jQuery.timers.push( timer );
		if ( timer() ) {
			jQuery.fx.start();
		} else {
			jQuery.timers.pop();
		}
	};
	
	jQuery.fx.interval = 13;
	jQuery.fx.start = function() {
		if ( !timerId ) {
			timerId = window.setInterval( jQuery.fx.tick, jQuery.fx.interval );
		}
	};
	
	jQuery.fx.stop = function() {
		window.clearInterval( timerId );
	
		timerId = null;
	};
	
	jQuery.fx.speeds = {
		slow: 600,
		fast: 200,
	
		// Default speed
		_default: 400
	};
	
	
	// Based off of the plugin by Clint Helfers, with permission.
	// http://web.archive.org/web/20100324014747/http://blindsignals.com/index.php/2009/07/jquery-delay/
	jQuery.fn.delay = function( time, type ) {
		time = jQuery.fx ? jQuery.fx.speeds[ time ] || time : time;
		type = type || "fx";
	
		return this.queue( type, function( next, hooks ) {
			var timeout = window.setTimeout( next, time );
			hooks.stop = function() {
				window.clearTimeout( timeout );
			};
		} );
	};
	
	
	( function() {
		var input = document.createElement( "input" ),
			select = document.createElement( "select" ),
			opt = select.appendChild( document.createElement( "option" ) );
	
		input.type = "checkbox";
	
		// Support: iOS<=5.1, Android<=4.2+
		// Default value for a checkbox should be "on"
		support.checkOn = input.value !== "";
	
		// Support: IE<=11+
		// Must access selectedIndex to make default options select
		support.optSelected = opt.selected;
	
		// Support: Android<=2.3
		// Options inside disabled selects are incorrectly marked as disabled
		select.disabled = true;
		support.optDisabled = !opt.disabled;
	
		// Support: IE<=11+
		// An input loses its value after becoming a radio
		input = document.createElement( "input" );
		input.value = "t";
		input.type = "radio";
		support.radioValue = input.value === "t";
	} )();
	
	
	var boolHook,
		attrHandle = jQuery.expr.attrHandle;
	
	jQuery.fn.extend( {
		attr: function( name, value ) {
			return access( this, jQuery.attr, name, value, arguments.length > 1 );
		},
	
		removeAttr: function( name ) {
			return this.each( function() {
				jQuery.removeAttr( this, name );
			} );
		}
	} );
	
	jQuery.extend( {
		attr: function( elem, name, value ) {
			var ret, hooks,
				nType = elem.nodeType;
	
			// Don't get/set attributes on text, comment and attribute nodes
			if ( nType === 3 || nType === 8 || nType === 2 ) {
				return;
			}
	
			// Fallback to prop when attributes are not supported
			if ( typeof elem.getAttribute === "undefined" ) {
				return jQuery.prop( elem, name, value );
			}
	
			// All attributes are lowercase
			// Grab necessary hook if one is defined
			if ( nType !== 1 || !jQuery.isXMLDoc( elem ) ) {
				name = name.toLowerCase();
				hooks = jQuery.attrHooks[ name ] ||
					( jQuery.expr.match.bool.test( name ) ? boolHook : undefined );
			}
	
			if ( value !== undefined ) {
				if ( value === null ) {
					jQuery.removeAttr( elem, name );
					return;
				}
	
				if ( hooks && "set" in hooks &&
					( ret = hooks.set( elem, value, name ) ) !== undefined ) {
					return ret;
				}
	
				elem.setAttribute( name, value + "" );
				return value;
			}
	
			if ( hooks && "get" in hooks && ( ret = hooks.get( elem, name ) ) !== null ) {
				return ret;
			}
	
			ret = jQuery.find.attr( elem, name );
	
			// Non-existent attributes return null, we normalize to undefined
			return ret == null ? undefined : ret;
		},
	
		attrHooks: {
			type: {
				set: function( elem, value ) {
					if ( !support.radioValue && value === "radio" &&
						jQuery.nodeName( elem, "input" ) ) {
						var val = elem.value;
						elem.setAttribute( "type", value );
						if ( val ) {
							elem.value = val;
						}
						return value;
					}
				}
			}
		},
	
		removeAttr: function( elem, value ) {
			var name, propName,
				i = 0,
				attrNames = value && value.match( rnotwhite );
	
			if ( attrNames && elem.nodeType === 1 ) {
				while ( ( name = attrNames[ i++ ] ) ) {
					propName = jQuery.propFix[ name ] || name;
	
					// Boolean attributes get special treatment (#10870)
					if ( jQuery.expr.match.bool.test( name ) ) {
	
						// Set corresponding property to false
						elem[ propName ] = false;
					}
	
					elem.removeAttribute( name );
				}
			}
		}
	} );
	
	// Hooks for boolean attributes
	boolHook = {
		set: function( elem, value, name ) {
			if ( value === false ) {
	
				// Remove boolean attributes when set to false
				jQuery.removeAttr( elem, name );
			} else {
				elem.setAttribute( name, name );
			}
			return name;
		}
	};
	jQuery.each( jQuery.expr.match.bool.source.match( /\w+/g ), function( i, name ) {
		var getter = attrHandle[ name ] || jQuery.find.attr;
	
		attrHandle[ name ] = function( elem, name, isXML ) {
			var ret, handle;
			if ( !isXML ) {
	
				// Avoid an infinite loop by temporarily removing this function from the getter
				handle = attrHandle[ name ];
				attrHandle[ name ] = ret;
				ret = getter( elem, name, isXML ) != null ?
					name.toLowerCase() :
					null;
				attrHandle[ name ] = handle;
			}
			return ret;
		};
	} );
	
	
	
	
	var rfocusable = /^(?:input|select|textarea|button)$/i,
		rclickable = /^(?:a|area)$/i;
	
	jQuery.fn.extend( {
		prop: function( name, value ) {
			return access( this, jQuery.prop, name, value, arguments.length > 1 );
		},
	
		removeProp: function( name ) {
			return this.each( function() {
				delete this[ jQuery.propFix[ name ] || name ];
			} );
		}
	} );
	
	jQuery.extend( {
		prop: function( elem, name, value ) {
			var ret, hooks,
				nType = elem.nodeType;
	
			// Don't get/set properties on text, comment and attribute nodes
			if ( nType === 3 || nType === 8 || nType === 2 ) {
				return;
			}
	
			if ( nType !== 1 || !jQuery.isXMLDoc( elem ) ) {
	
				// Fix name and attach hooks
				name = jQuery.propFix[ name ] || name;
				hooks = jQuery.propHooks[ name ];
			}
	
			if ( value !== undefined ) {
				if ( hooks && "set" in hooks &&
					( ret = hooks.set( elem, value, name ) ) !== undefined ) {
					return ret;
				}
	
				return ( elem[ name ] = value );
			}
	
			if ( hooks && "get" in hooks && ( ret = hooks.get( elem, name ) ) !== null ) {
				return ret;
			}
	
			return elem[ name ];
		},
	
		propHooks: {
			tabIndex: {
				get: function( elem ) {
	
					// elem.tabIndex doesn't always return the
					// correct value when it hasn't been explicitly set
					// http://fluidproject.org/blog/2008/01/09/getting-setting-and-removing-tabindex-values-with-javascript/
					// Use proper attribute retrieval(#12072)
					var tabindex = jQuery.find.attr( elem, "tabindex" );
	
					return tabindex ?
						parseInt( tabindex, 10 ) :
						rfocusable.test( elem.nodeName ) ||
							rclickable.test( elem.nodeName ) && elem.href ?
								0 :
								-1;
				}
			}
		},
	
		propFix: {
			"for": "htmlFor",
			"class": "className"
		}
	} );
	
	// Support: IE <=11 only
	// Accessing the selectedIndex property
	// forces the browser to respect setting selected
	// on the option
	// The getter ensures a default option is selected
	// when in an optgroup
	if ( !support.optSelected ) {
		jQuery.propHooks.selected = {
			get: function( elem ) {
				var parent = elem.parentNode;
				if ( parent && parent.parentNode ) {
					parent.parentNode.selectedIndex;
				}
				return null;
			},
			set: function( elem ) {
				var parent = elem.parentNode;
				if ( parent ) {
					parent.selectedIndex;
	
					if ( parent.parentNode ) {
						parent.parentNode.selectedIndex;
					}
				}
			}
		};
	}
	
	jQuery.each( [
		"tabIndex",
		"readOnly",
		"maxLength",
		"cellSpacing",
		"cellPadding",
		"rowSpan",
		"colSpan",
		"useMap",
		"frameBorder",
		"contentEditable"
	], function() {
		jQuery.propFix[ this.toLowerCase() ] = this;
	} );
	
	
	
	
	var rclass = /[\t\r\n\f]/g;
	
	function getClass( elem ) {
		return elem.getAttribute && elem.getAttribute( "class" ) || "";
	}
	
	jQuery.fn.extend( {
		addClass: function( value ) {
			var classes, elem, cur, curValue, clazz, j, finalValue,
				i = 0;
	
			if ( jQuery.isFunction( value ) ) {
				return this.each( function( j ) {
					jQuery( this ).addClass( value.call( this, j, getClass( this ) ) );
				} );
			}
	
			if ( typeof value === "string" && value ) {
				classes = value.match( rnotwhite ) || [];
	
				while ( ( elem = this[ i++ ] ) ) {
					curValue = getClass( elem );
					cur = elem.nodeType === 1 &&
						( " " + curValue + " " ).replace( rclass, " " );
	
					if ( cur ) {
						j = 0;
						while ( ( clazz = classes[ j++ ] ) ) {
							if ( cur.indexOf( " " + clazz + " " ) < 0 ) {
								cur += clazz + " ";
							}
						}
	
						// Only assign if different to avoid unneeded rendering.
						finalValue = jQuery.trim( cur );
						if ( curValue !== finalValue ) {
							elem.setAttribute( "class", finalValue );
						}
					}
				}
			}
	
			return this;
		},
	
		removeClass: function( value ) {
			var classes, elem, cur, curValue, clazz, j, finalValue,
				i = 0;
	
			if ( jQuery.isFunction( value ) ) {
				return this.each( function( j ) {
					jQuery( this ).removeClass( value.call( this, j, getClass( this ) ) );
				} );
			}
	
			if ( !arguments.length ) {
				return this.attr( "class", "" );
			}
	
			if ( typeof value === "string" && value ) {
				classes = value.match( rnotwhite ) || [];
	
				while ( ( elem = this[ i++ ] ) ) {
					curValue = getClass( elem );
	
					// This expression is here for better compressibility (see addClass)
					cur = elem.nodeType === 1 &&
						( " " + curValue + " " ).replace( rclass, " " );
	
					if ( cur ) {
						j = 0;
						while ( ( clazz = classes[ j++ ] ) ) {
	
							// Remove *all* instances
							while ( cur.indexOf( " " + clazz + " " ) > -1 ) {
								cur = cur.replace( " " + clazz + " ", " " );
							}
						}
	
						// Only assign if different to avoid unneeded rendering.
						finalValue = jQuery.trim( cur );
						if ( curValue !== finalValue ) {
							elem.setAttribute( "class", finalValue );
						}
					}
				}
			}
	
			return this;
		},
	
		toggleClass: function( value, stateVal ) {
			var type = typeof value;
	
			if ( typeof stateVal === "boolean" && type === "string" ) {
				return stateVal ? this.addClass( value ) : this.removeClass( value );
			}
	
			if ( jQuery.isFunction( value ) ) {
				return this.each( function( i ) {
					jQuery( this ).toggleClass(
						value.call( this, i, getClass( this ), stateVal ),
						stateVal
					);
				} );
			}
	
			return this.each( function() {
				var className, i, self, classNames;
	
				if ( type === "string" ) {
	
					// Toggle individual class names
					i = 0;
					self = jQuery( this );
					classNames = value.match( rnotwhite ) || [];
	
					while ( ( className = classNames[ i++ ] ) ) {
	
						// Check each className given, space separated list
						if ( self.hasClass( className ) ) {
							self.removeClass( className );
						} else {
							self.addClass( className );
						}
					}
	
				// Toggle whole class name
				} else if ( value === undefined || type === "boolean" ) {
					className = getClass( this );
					if ( className ) {
	
						// Store className if set
						dataPriv.set( this, "__className__", className );
					}
	
					// If the element has a class name or if we're passed `false`,
					// then remove the whole classname (if there was one, the above saved it).
					// Otherwise bring back whatever was previously saved (if anything),
					// falling back to the empty string if nothing was stored.
					if ( this.setAttribute ) {
						this.setAttribute( "class",
							className || value === false ?
							"" :
							dataPriv.get( this, "__className__" ) || ""
						);
					}
				}
			} );
		},
	
		hasClass: function( selector ) {
			var className, elem,
				i = 0;
	
			className = " " + selector + " ";
			while ( ( elem = this[ i++ ] ) ) {
				if ( elem.nodeType === 1 &&
					( " " + getClass( elem ) + " " ).replace( rclass, " " )
						.indexOf( className ) > -1
				) {
					return true;
				}
			}
	
			return false;
		}
	} );
	
	
	
	
	var rreturn = /\r/g,
		rspaces = /[\x20\t\r\n\f]+/g;
	
	jQuery.fn.extend( {
		val: function( value ) {
			var hooks, ret, isFunction,
				elem = this[ 0 ];
	
			if ( !arguments.length ) {
				if ( elem ) {
					hooks = jQuery.valHooks[ elem.type ] ||
						jQuery.valHooks[ elem.nodeName.toLowerCase() ];
	
					if ( hooks &&
						"get" in hooks &&
						( ret = hooks.get( elem, "value" ) ) !== undefined
					) {
						return ret;
					}
	
					ret = elem.value;
	
					return typeof ret === "string" ?
	
						// Handle most common string cases
						ret.replace( rreturn, "" ) :
	
						// Handle cases where value is null/undef or number
						ret == null ? "" : ret;
				}
	
				return;
			}
	
			isFunction = jQuery.isFunction( value );
	
			return this.each( function( i ) {
				var val;
	
				if ( this.nodeType !== 1 ) {
					return;
				}
	
				if ( isFunction ) {
					val = value.call( this, i, jQuery( this ).val() );
				} else {
					val = value;
				}
	
				// Treat null/undefined as ""; convert numbers to string
				if ( val == null ) {
					val = "";
	
				} else if ( typeof val === "number" ) {
					val += "";
	
				} else if ( jQuery.isArray( val ) ) {
					val = jQuery.map( val, function( value ) {
						return value == null ? "" : value + "";
					} );
				}
	
				hooks = jQuery.valHooks[ this.type ] || jQuery.valHooks[ this.nodeName.toLowerCase() ];
	
				// If set returns undefined, fall back to normal setting
				if ( !hooks || !( "set" in hooks ) || hooks.set( this, val, "value" ) === undefined ) {
					this.value = val;
				}
			} );
		}
	} );
	
	jQuery.extend( {
		valHooks: {
			option: {
				get: function( elem ) {
	
					var val = jQuery.find.attr( elem, "value" );
					return val != null ?
						val :
	
						// Support: IE10-11+
						// option.text throws exceptions (#14686, #14858)
						// Strip and collapse whitespace
						// https://html.spec.whatwg.org/#strip-and-collapse-whitespace
						jQuery.trim( jQuery.text( elem ) ).replace( rspaces, " " );
				}
			},
			select: {
				get: function( elem ) {
					var value, option,
						options = elem.options,
						index = elem.selectedIndex,
						one = elem.type === "select-one" || index < 0,
						values = one ? null : [],
						max = one ? index + 1 : options.length,
						i = index < 0 ?
							max :
							one ? index : 0;
	
					// Loop through all the selected options
					for ( ; i < max; i++ ) {
						option = options[ i ];
	
						// IE8-9 doesn't update selected after form reset (#2551)
						if ( ( option.selected || i === index ) &&
	
								// Don't return options that are disabled or in a disabled optgroup
								( support.optDisabled ?
									!option.disabled : option.getAttribute( "disabled" ) === null ) &&
								( !option.parentNode.disabled ||
									!jQuery.nodeName( option.parentNode, "optgroup" ) ) ) {
	
							// Get the specific value for the option
							value = jQuery( option ).val();
	
							// We don't need an array for one selects
							if ( one ) {
								return value;
							}
	
							// Multi-Selects return an array
							values.push( value );
						}
					}
	
					return values;
				},
	
				set: function( elem, value ) {
					var optionSet, option,
						options = elem.options,
						values = jQuery.makeArray( value ),
						i = options.length;
	
					while ( i-- ) {
						option = options[ i ];
						if ( option.selected =
							jQuery.inArray( jQuery.valHooks.option.get( option ), values ) > -1
						) {
							optionSet = true;
						}
					}
	
					// Force browsers to behave consistently when non-matching value is set
					if ( !optionSet ) {
						elem.selectedIndex = -1;
					}
					return values;
				}
			}
		}
	} );
	
	// Radios and checkboxes getter/setter
	jQuery.each( [ "radio", "checkbox" ], function() {
		jQuery.valHooks[ this ] = {
			set: function( elem, value ) {
				if ( jQuery.isArray( value ) ) {
					return ( elem.checked = jQuery.inArray( jQuery( elem ).val(), value ) > -1 );
				}
			}
		};
		if ( !support.checkOn ) {
			jQuery.valHooks[ this ].get = function( elem ) {
				return elem.getAttribute( "value" ) === null ? "on" : elem.value;
			};
		}
	} );
	
	
	
	
	// Return jQuery for attributes-only inclusion
	
	
	var rfocusMorph = /^(?:focusinfocus|focusoutblur)$/;
	
	jQuery.extend( jQuery.event, {
	
		trigger: function( event, data, elem, onlyHandlers ) {
	
			var i, cur, tmp, bubbleType, ontype, handle, special,
				eventPath = [ elem || document ],
				type = hasOwn.call( event, "type" ) ? event.type : event,
				namespaces = hasOwn.call( event, "namespace" ) ? event.namespace.split( "." ) : [];
	
			cur = tmp = elem = elem || document;
	
			// Don't do events on text and comment nodes
			if ( elem.nodeType === 3 || elem.nodeType === 8 ) {
				return;
			}
	
			// focus/blur morphs to focusin/out; ensure we're not firing them right now
			if ( rfocusMorph.test( type + jQuery.event.triggered ) ) {
				return;
			}
	
			if ( type.indexOf( "." ) > -1 ) {
	
				// Namespaced trigger; create a regexp to match event type in handle()
				namespaces = type.split( "." );
				type = namespaces.shift();
				namespaces.sort();
			}
			ontype = type.indexOf( ":" ) < 0 && "on" + type;
	
			// Caller can pass in a jQuery.Event object, Object, or just an event type string
			event = event[ jQuery.expando ] ?
				event :
				new jQuery.Event( type, typeof event === "object" && event );
	
			// Trigger bitmask: & 1 for native handlers; & 2 for jQuery (always true)
			event.isTrigger = onlyHandlers ? 2 : 3;
			event.namespace = namespaces.join( "." );
			event.rnamespace = event.namespace ?
				new RegExp( "(^|\\.)" + namespaces.join( "\\.(?:.*\\.|)" ) + "(\\.|$)" ) :
				null;
	
			// Clean up the event in case it is being reused
			event.result = undefined;
			if ( !event.target ) {
				event.target = elem;
			}
	
			// Clone any incoming data and prepend the event, creating the handler arg list
			data = data == null ?
				[ event ] :
				jQuery.makeArray( data, [ event ] );
	
			// Allow special events to draw outside the lines
			special = jQuery.event.special[ type ] || {};
			if ( !onlyHandlers && special.trigger && special.trigger.apply( elem, data ) === false ) {
				return;
			}
	
			// Determine event propagation path in advance, per W3C events spec (#9951)
			// Bubble up to document, then to window; watch for a global ownerDocument var (#9724)
			if ( !onlyHandlers && !special.noBubble && !jQuery.isWindow( elem ) ) {
	
				bubbleType = special.delegateType || type;
				if ( !rfocusMorph.test( bubbleType + type ) ) {
					cur = cur.parentNode;
				}
				for ( ; cur; cur = cur.parentNode ) {
					eventPath.push( cur );
					tmp = cur;
				}
	
				// Only add window if we got to document (e.g., not plain obj or detached DOM)
				if ( tmp === ( elem.ownerDocument || document ) ) {
					eventPath.push( tmp.defaultView || tmp.parentWindow || window );
				}
			}
	
			// Fire handlers on the event path
			i = 0;
			while ( ( cur = eventPath[ i++ ] ) && !event.isPropagationStopped() ) {
	
				event.type = i > 1 ?
					bubbleType :
					special.bindType || type;
	
				// jQuery handler
				handle = ( dataPriv.get( cur, "events" ) || {} )[ event.type ] &&
					dataPriv.get( cur, "handle" );
				if ( handle ) {
					handle.apply( cur, data );
				}
	
				// Native handler
				handle = ontype && cur[ ontype ];
				if ( handle && handle.apply && acceptData( cur ) ) {
					event.result = handle.apply( cur, data );
					if ( event.result === false ) {
						event.preventDefault();
					}
				}
			}
			event.type = type;
	
			// If nobody prevented the default action, do it now
			if ( !onlyHandlers && !event.isDefaultPrevented() ) {
	
				if ( ( !special._default ||
					special._default.apply( eventPath.pop(), data ) === false ) &&
					acceptData( elem ) ) {
	
					// Call a native DOM method on the target with the same name name as the event.
					// Don't do default actions on window, that's where global variables be (#6170)
					if ( ontype && jQuery.isFunction( elem[ type ] ) && !jQuery.isWindow( elem ) ) {
	
						// Don't re-trigger an onFOO event when we call its FOO() method
						tmp = elem[ ontype ];
	
						if ( tmp ) {
							elem[ ontype ] = null;
						}
	
						// Prevent re-triggering of the same event, since we already bubbled it above
						jQuery.event.triggered = type;
						elem[ type ]();
						jQuery.event.triggered = undefined;
	
						if ( tmp ) {
							elem[ ontype ] = tmp;
						}
					}
				}
			}
	
			return event.result;
		},
	
		// Piggyback on a donor event to simulate a different one
		// Used only for `focus(in | out)` events
		simulate: function( type, elem, event ) {
			var e = jQuery.extend(
				new jQuery.Event(),
				event,
				{
					type: type,
					isSimulated: true
				}
			);
	
			jQuery.event.trigger( e, null, elem );
		}
	
	} );
	
	jQuery.fn.extend( {
	
		trigger: function( type, data ) {
			return this.each( function() {
				jQuery.event.trigger( type, data, this );
			} );
		},
		triggerHandler: function( type, data ) {
			var elem = this[ 0 ];
			if ( elem ) {
				return jQuery.event.trigger( type, data, elem, true );
			}
		}
	} );
	
	
	jQuery.each( ( "blur focus focusin focusout load resize scroll unload click dblclick " +
		"mousedown mouseup mousemove mouseover mouseout mouseenter mouseleave " +
		"change select submit keydown keypress keyup error contextmenu" ).split( " " ),
		function( i, name ) {
	
		// Handle event binding
		jQuery.fn[ name ] = function( data, fn ) {
			return arguments.length > 0 ?
				this.on( name, null, data, fn ) :
				this.trigger( name );
		};
	} );
	
	jQuery.fn.extend( {
		hover: function( fnOver, fnOut ) {
			return this.mouseenter( fnOver ).mouseleave( fnOut || fnOver );
		}
	} );
	
	
	
	
	support.focusin = "onfocusin" in window;
	
	
	// Support: Firefox
	// Firefox doesn't have focus(in | out) events
	// Related ticket - https://bugzilla.mozilla.org/show_bug.cgi?id=687787
	//
	// Support: Chrome, Safari
	// focus(in | out) events fire after focus & blur events,
	// which is spec violation - http://www.w3.org/TR/DOM-Level-3-Events/#events-focusevent-event-order
	// Related ticket - https://code.google.com/p/chromium/issues/detail?id=449857
	if ( !support.focusin ) {
		jQuery.each( { focus: "focusin", blur: "focusout" }, function( orig, fix ) {
	
			// Attach a single capturing handler on the document while someone wants focusin/focusout
			var handler = function( event ) {
				jQuery.event.simulate( fix, event.target, jQuery.event.fix( event ) );
			};
	
			jQuery.event.special[ fix ] = {
				setup: function() {
					var doc = this.ownerDocument || this,
						attaches = dataPriv.access( doc, fix );
	
					if ( !attaches ) {
						doc.addEventListener( orig, handler, true );
					}
					dataPriv.access( doc, fix, ( attaches || 0 ) + 1 );
				},
				teardown: function() {
					var doc = this.ownerDocument || this,
						attaches = dataPriv.access( doc, fix ) - 1;
	
					if ( !attaches ) {
						doc.removeEventListener( orig, handler, true );
						dataPriv.remove( doc, fix );
	
					} else {
						dataPriv.access( doc, fix, attaches );
					}
				}
			};
		} );
	}
	var location = window.location;
	
	var nonce = jQuery.now();
	
	var rquery = ( /\?/ );
	
	
	
	// Support: Android 2.3
	// Workaround failure to string-cast null input
	jQuery.parseJSON = function( data ) {
		return JSON.parse( data + "" );
	};
	
	
	// Cross-browser xml parsing
	jQuery.parseXML = function( data ) {
		var xml;
		if ( !data || typeof data !== "string" ) {
			return null;
		}
	
		// Support: IE9
		try {
			xml = ( new window.DOMParser() ).parseFromString( data, "text/xml" );
		} catch ( e ) {
			xml = undefined;
		}
	
		if ( !xml || xml.getElementsByTagName( "parsererror" ).length ) {
			jQuery.error( "Invalid XML: " + data );
		}
		return xml;
	};
	
	
	var
		rhash = /#.*$/,
		rts = /([?&])_=[^&]*/,
		rheaders = /^(.*?):[ \t]*([^\r\n]*)$/mg,
	
		// #7653, #8125, #8152: local protocol detection
		rlocalProtocol = /^(?:about|app|app-storage|.+-extension|file|res|widget):$/,
		rnoContent = /^(?:GET|HEAD)$/,
		rprotocol = /^\/\//,
	
		/* Prefilters
		 * 1) They are useful to introduce custom dataTypes (see ajax/jsonp.js for an example)
		 * 2) These are called:
		 *    - BEFORE asking for a transport
		 *    - AFTER param serialization (s.data is a string if s.processData is true)
		 * 3) key is the dataType
		 * 4) the catchall symbol "*" can be used
		 * 5) execution will start with transport dataType and THEN continue down to "*" if needed
		 */
		prefilters = {},
	
		/* Transports bindings
		 * 1) key is the dataType
		 * 2) the catchall symbol "*" can be used
		 * 3) selection will start with transport dataType and THEN go to "*" if needed
		 */
		transports = {},
	
		// Avoid comment-prolog char sequence (#10098); must appease lint and evade compression
		allTypes = "*/".concat( "*" ),
	
		// Anchor tag for parsing the document origin
		originAnchor = document.createElement( "a" );
		originAnchor.href = location.href;
	
	// Base "constructor" for jQuery.ajaxPrefilter and jQuery.ajaxTransport
	function addToPrefiltersOrTransports( structure ) {
	
		// dataTypeExpression is optional and defaults to "*"
		return function( dataTypeExpression, func ) {
	
			if ( typeof dataTypeExpression !== "string" ) {
				func = dataTypeExpression;
				dataTypeExpression = "*";
			}
	
			var dataType,
				i = 0,
				dataTypes = dataTypeExpression.toLowerCase().match( rnotwhite ) || [];
	
			if ( jQuery.isFunction( func ) ) {
	
				// For each dataType in the dataTypeExpression
				while ( ( dataType = dataTypes[ i++ ] ) ) {
	
					// Prepend if requested
					if ( dataType[ 0 ] === "+" ) {
						dataType = dataType.slice( 1 ) || "*";
						( structure[ dataType ] = structure[ dataType ] || [] ).unshift( func );
	
					// Otherwise append
					} else {
						( structure[ dataType ] = structure[ dataType ] || [] ).push( func );
					}
				}
			}
		};
	}
	
	// Base inspection function for prefilters and transports
	function inspectPrefiltersOrTransports( structure, options, originalOptions, jqXHR ) {
	
		var inspected = {},
			seekingTransport = ( structure === transports );
	
		function inspect( dataType ) {
			var selected;
			inspected[ dataType ] = true;
			jQuery.each( structure[ dataType ] || [], function( _, prefilterOrFactory ) {
				var dataTypeOrTransport = prefilterOrFactory( options, originalOptions, jqXHR );
				if ( typeof dataTypeOrTransport === "string" &&
					!seekingTransport && !inspected[ dataTypeOrTransport ] ) {
	
					options.dataTypes.unshift( dataTypeOrTransport );
					inspect( dataTypeOrTransport );
					return false;
				} else if ( seekingTransport ) {
					return !( selected = dataTypeOrTransport );
				}
			} );
			return selected;
		}
	
		return inspect( options.dataTypes[ 0 ] ) || !inspected[ "*" ] && inspect( "*" );
	}
	
	// A special extend for ajax options
	// that takes "flat" options (not to be deep extended)
	// Fixes #9887
	function ajaxExtend( target, src ) {
		var key, deep,
			flatOptions = jQuery.ajaxSettings.flatOptions || {};
	
		for ( key in src ) {
			if ( src[ key ] !== undefined ) {
				( flatOptions[ key ] ? target : ( deep || ( deep = {} ) ) )[ key ] = src[ key ];
			}
		}
		if ( deep ) {
			jQuery.extend( true, target, deep );
		}
	
		return target;
	}
	
	/* Handles responses to an ajax request:
	 * - finds the right dataType (mediates between content-type and expected dataType)
	 * - returns the corresponding response
	 */
	function ajaxHandleResponses( s, jqXHR, responses ) {
	
		var ct, type, finalDataType, firstDataType,
			contents = s.contents,
			dataTypes = s.dataTypes;
	
		// Remove auto dataType and get content-type in the process
		while ( dataTypes[ 0 ] === "*" ) {
			dataTypes.shift();
			if ( ct === undefined ) {
				ct = s.mimeType || jqXHR.getResponseHeader( "Content-Type" );
			}
		}
	
		// Check if we're dealing with a known content-type
		if ( ct ) {
			for ( type in contents ) {
				if ( contents[ type ] && contents[ type ].test( ct ) ) {
					dataTypes.unshift( type );
					break;
				}
			}
		}
	
		// Check to see if we have a response for the expected dataType
		if ( dataTypes[ 0 ] in responses ) {
			finalDataType = dataTypes[ 0 ];
		} else {
	
			// Try convertible dataTypes
			for ( type in responses ) {
				if ( !dataTypes[ 0 ] || s.converters[ type + " " + dataTypes[ 0 ] ] ) {
					finalDataType = type;
					break;
				}
				if ( !firstDataType ) {
					firstDataType = type;
				}
			}
	
			// Or just use first one
			finalDataType = finalDataType || firstDataType;
		}
	
		// If we found a dataType
		// We add the dataType to the list if needed
		// and return the corresponding response
		if ( finalDataType ) {
			if ( finalDataType !== dataTypes[ 0 ] ) {
				dataTypes.unshift( finalDataType );
			}
			return responses[ finalDataType ];
		}
	}
	
	/* Chain conversions given the request and the original response
	 * Also sets the responseXXX fields on the jqXHR instance
	 */
	function ajaxConvert( s, response, jqXHR, isSuccess ) {
		var conv2, current, conv, tmp, prev,
			converters = {},
	
			// Work with a copy of dataTypes in case we need to modify it for conversion
			dataTypes = s.dataTypes.slice();
	
		// Create converters map with lowercased keys
		if ( dataTypes[ 1 ] ) {
			for ( conv in s.converters ) {
				converters[ conv.toLowerCase() ] = s.converters[ conv ];
			}
		}
	
		current = dataTypes.shift();
	
		// Convert to each sequential dataType
		while ( current ) {
	
			if ( s.responseFields[ current ] ) {
				jqXHR[ s.responseFields[ current ] ] = response;
			}
	
			// Apply the dataFilter if provided
			if ( !prev && isSuccess && s.dataFilter ) {
				response = s.dataFilter( response, s.dataType );
			}
	
			prev = current;
			current = dataTypes.shift();
	
			if ( current ) {
	
			// There's only work to do if current dataType is non-auto
				if ( current === "*" ) {
	
					current = prev;
	
				// Convert response if prev dataType is non-auto and differs from current
				} else if ( prev !== "*" && prev !== current ) {
	
					// Seek a direct converter
					conv = converters[ prev + " " + current ] || converters[ "* " + current ];
	
					// If none found, seek a pair
					if ( !conv ) {
						for ( conv2 in converters ) {
	
							// If conv2 outputs current
							tmp = conv2.split( " " );
							if ( tmp[ 1 ] === current ) {
	
								// If prev can be converted to accepted input
								conv = converters[ prev + " " + tmp[ 0 ] ] ||
									converters[ "* " + tmp[ 0 ] ];
								if ( conv ) {
	
									// Condense equivalence converters
									if ( conv === true ) {
										conv = converters[ conv2 ];
	
									// Otherwise, insert the intermediate dataType
									} else if ( converters[ conv2 ] !== true ) {
										current = tmp[ 0 ];
										dataTypes.unshift( tmp[ 1 ] );
									}
									break;
								}
							}
						}
					}
	
					// Apply converter (if not an equivalence)
					if ( conv !== true ) {
	
						// Unless errors are allowed to bubble, catch and return them
						if ( conv && s.throws ) {
							response = conv( response );
						} else {
							try {
								response = conv( response );
							} catch ( e ) {
								return {
									state: "parsererror",
									error: conv ? e : "No conversion from " + prev + " to " + current
								};
							}
						}
					}
				}
			}
		}
	
		return { state: "success", data: response };
	}
	
	jQuery.extend( {
	
		// Counter for holding the number of active queries
		active: 0,
	
		// Last-Modified header cache for next request
		lastModified: {},
		etag: {},
	
		ajaxSettings: {
			url: location.href,
			type: "GET",
			isLocal: rlocalProtocol.test( location.protocol ),
			global: true,
			processData: true,
			async: true,
			contentType: "application/x-www-form-urlencoded; charset=UTF-8",
			/*
			timeout: 0,
			data: null,
			dataType: null,
			username: null,
			password: null,
			cache: null,
			throws: false,
			traditional: false,
			headers: {},
			*/
	
			accepts: {
				"*": allTypes,
				text: "text/plain",
				html: "text/html",
				xml: "application/xml, text/xml",
				json: "application/json, text/javascript"
			},
	
			contents: {
				xml: /\bxml\b/,
				html: /\bhtml/,
				json: /\bjson\b/
			},
	
			responseFields: {
				xml: "responseXML",
				text: "responseText",
				json: "responseJSON"
			},
	
			// Data converters
			// Keys separate source (or catchall "*") and destination types with a single space
			converters: {
	
				// Convert anything to text
				"* text": String,
	
				// Text to html (true = no transformation)
				"text html": true,
	
				// Evaluate text as a json expression
				"text json": jQuery.parseJSON,
	
				// Parse text as xml
				"text xml": jQuery.parseXML
			},
	
			// For options that shouldn't be deep extended:
			// you can add your own custom options here if
			// and when you create one that shouldn't be
			// deep extended (see ajaxExtend)
			flatOptions: {
				url: true,
				context: true
			}
		},
	
		// Creates a full fledged settings object into target
		// with both ajaxSettings and settings fields.
		// If target is omitted, writes into ajaxSettings.
		ajaxSetup: function( target, settings ) {
			return settings ?
	
				// Building a settings object
				ajaxExtend( ajaxExtend( target, jQuery.ajaxSettings ), settings ) :
	
				// Extending ajaxSettings
				ajaxExtend( jQuery.ajaxSettings, target );
		},
	
		ajaxPrefilter: addToPrefiltersOrTransports( prefilters ),
		ajaxTransport: addToPrefiltersOrTransports( transports ),
	
		// Main method
		ajax: function( url, options ) {
	
			// If url is an object, simulate pre-1.5 signature
			if ( typeof url === "object" ) {
				options = url;
				url = undefined;
			}
	
			// Force options to be an object
			options = options || {};
	
			var transport,
	
				// URL without anti-cache param
				cacheURL,
	
				// Response headers
				responseHeadersString,
				responseHeaders,
	
				// timeout handle
				timeoutTimer,
	
				// Url cleanup var
				urlAnchor,
	
				// To know if global events are to be dispatched
				fireGlobals,
	
				// Loop variable
				i,
	
				// Create the final options object
				s = jQuery.ajaxSetup( {}, options ),
	
				// Callbacks context
				callbackContext = s.context || s,
	
				// Context for global events is callbackContext if it is a DOM node or jQuery collection
				globalEventContext = s.context &&
					( callbackContext.nodeType || callbackContext.jquery ) ?
						jQuery( callbackContext ) :
						jQuery.event,
	
				// Deferreds
				deferred = jQuery.Deferred(),
				completeDeferred = jQuery.Callbacks( "once memory" ),
	
				// Status-dependent callbacks
				statusCode = s.statusCode || {},
	
				// Headers (they are sent all at once)
				requestHeaders = {},
				requestHeadersNames = {},
	
				// The jqXHR state
				state = 0,
	
				// Default abort message
				strAbort = "canceled",
	
				// Fake xhr
				jqXHR = {
					readyState: 0,
	
					// Builds headers hashtable if needed
					getResponseHeader: function( key ) {
						var match;
						if ( state === 2 ) {
							if ( !responseHeaders ) {
								responseHeaders = {};
								while ( ( match = rheaders.exec( responseHeadersString ) ) ) {
									responseHeaders[ match[ 1 ].toLowerCase() ] = match[ 2 ];
								}
							}
							match = responseHeaders[ key.toLowerCase() ];
						}
						return match == null ? null : match;
					},
	
					// Raw string
					getAllResponseHeaders: function() {
						return state === 2 ? responseHeadersString : null;
					},
	
					// Caches the header
					setRequestHeader: function( name, value ) {
						var lname = name.toLowerCase();
						if ( !state ) {
							name = requestHeadersNames[ lname ] = requestHeadersNames[ lname ] || name;
							requestHeaders[ name ] = value;
						}
						return this;
					},
	
					// Overrides response content-type header
					overrideMimeType: function( type ) {
						if ( !state ) {
							s.mimeType = type;
						}
						return this;
					},
	
					// Status-dependent callbacks
					statusCode: function( map ) {
						var code;
						if ( map ) {
							if ( state < 2 ) {
								for ( code in map ) {
	
									// Lazy-add the new callback in a way that preserves old ones
									statusCode[ code ] = [ statusCode[ code ], map[ code ] ];
								}
							} else {
	
								// Execute the appropriate callbacks
								jqXHR.always( map[ jqXHR.status ] );
							}
						}
						return this;
					},
	
					// Cancel the request
					abort: function( statusText ) {
						var finalText = statusText || strAbort;
						if ( transport ) {
							transport.abort( finalText );
						}
						done( 0, finalText );
						return this;
					}
				};
	
			// Attach deferreds
			deferred.promise( jqXHR ).complete = completeDeferred.add;
			jqXHR.success = jqXHR.done;
			jqXHR.error = jqXHR.fail;
	
			// Remove hash character (#7531: and string promotion)
			// Add protocol if not provided (prefilters might expect it)
			// Handle falsy url in the settings object (#10093: consistency with old signature)
			// We also use the url parameter if available
			s.url = ( ( url || s.url || location.href ) + "" ).replace( rhash, "" )
				.replace( rprotocol, location.protocol + "//" );
	
			// Alias method option to type as per ticket #12004
			s.type = options.method || options.type || s.method || s.type;
	
			// Extract dataTypes list
			s.dataTypes = jQuery.trim( s.dataType || "*" ).toLowerCase().match( rnotwhite ) || [ "" ];
	
			// A cross-domain request is in order when the origin doesn't match the current origin.
			if ( s.crossDomain == null ) {
				urlAnchor = document.createElement( "a" );
	
				// Support: IE8-11+
				// IE throws exception if url is malformed, e.g. http://example.com:80x/
				try {
					urlAnchor.href = s.url;
	
					// Support: IE8-11+
					// Anchor's host property isn't correctly set when s.url is relative
					urlAnchor.href = urlAnchor.href;
					s.crossDomain = originAnchor.protocol + "//" + originAnchor.host !==
						urlAnchor.protocol + "//" + urlAnchor.host;
				} catch ( e ) {
	
					// If there is an error parsing the URL, assume it is crossDomain,
					// it can be rejected by the transport if it is invalid
					s.crossDomain = true;
				}
			}
	
			// Convert data if not already a string
			if ( s.data && s.processData && typeof s.data !== "string" ) {
				s.data = jQuery.param( s.data, s.traditional );
			}
	
			// Apply prefilters
			inspectPrefiltersOrTransports( prefilters, s, options, jqXHR );
	
			// If request was aborted inside a prefilter, stop there
			if ( state === 2 ) {
				return jqXHR;
			}
	
			// We can fire global events as of now if asked to
			// Don't fire events if jQuery.event is undefined in an AMD-usage scenario (#15118)
			fireGlobals = jQuery.event && s.global;
	
			// Watch for a new set of requests
			if ( fireGlobals && jQuery.active++ === 0 ) {
				jQuery.event.trigger( "ajaxStart" );
			}
	
			// Uppercase the type
			s.type = s.type.toUpperCase();
	
			// Determine if request has content
			s.hasContent = !rnoContent.test( s.type );
	
			// Save the URL in case we're toying with the If-Modified-Since
			// and/or If-None-Match header later on
			cacheURL = s.url;
	
			// More options handling for requests with no content
			if ( !s.hasContent ) {
	
				// If data is available, append data to url
				if ( s.data ) {
					cacheURL = ( s.url += ( rquery.test( cacheURL ) ? "&" : "?" ) + s.data );
	
					// #9682: remove data so that it's not used in an eventual retry
					delete s.data;
				}
	
				// Add anti-cache in url if needed
				if ( s.cache === false ) {
					s.url = rts.test( cacheURL ) ?
	
						// If there is already a '_' parameter, set its value
						cacheURL.replace( rts, "$1_=" + nonce++ ) :
	
						// Otherwise add one to the end
						cacheURL + ( rquery.test( cacheURL ) ? "&" : "?" ) + "_=" + nonce++;
				}
			}
	
			// Set the If-Modified-Since and/or If-None-Match header, if in ifModified mode.
			if ( s.ifModified ) {
				if ( jQuery.lastModified[ cacheURL ] ) {
					jqXHR.setRequestHeader( "If-Modified-Since", jQuery.lastModified[ cacheURL ] );
				}
				if ( jQuery.etag[ cacheURL ] ) {
					jqXHR.setRequestHeader( "If-None-Match", jQuery.etag[ cacheURL ] );
				}
			}
	
			// Set the correct header, if data is being sent
			if ( s.data && s.hasContent && s.contentType !== false || options.contentType ) {
				jqXHR.setRequestHeader( "Content-Type", s.contentType );
			}
	
			// Set the Accepts header for the server, depending on the dataType
			jqXHR.setRequestHeader(
				"Accept",
				s.dataTypes[ 0 ] && s.accepts[ s.dataTypes[ 0 ] ] ?
					s.accepts[ s.dataTypes[ 0 ] ] +
						( s.dataTypes[ 0 ] !== "*" ? ", " + allTypes + "; q=0.01" : "" ) :
					s.accepts[ "*" ]
			);
	
			// Check for headers option
			for ( i in s.headers ) {
				jqXHR.setRequestHeader( i, s.headers[ i ] );
			}
	
			// Allow custom headers/mimetypes and early abort
			if ( s.beforeSend &&
				( s.beforeSend.call( callbackContext, jqXHR, s ) === false || state === 2 ) ) {
	
				// Abort if not done already and return
				return jqXHR.abort();
			}
	
			// Aborting is no longer a cancellation
			strAbort = "abort";
	
			// Install callbacks on deferreds
			for ( i in { success: 1, error: 1, complete: 1 } ) {
				jqXHR[ i ]( s[ i ] );
			}
	
			// Get transport
			transport = inspectPrefiltersOrTransports( transports, s, options, jqXHR );
	
			// If no transport, we auto-abort
			if ( !transport ) {
				done( -1, "No Transport" );
			} else {
				jqXHR.readyState = 1;
	
				// Send global event
				if ( fireGlobals ) {
					globalEventContext.trigger( "ajaxSend", [ jqXHR, s ] );
				}
	
				// If request was aborted inside ajaxSend, stop there
				if ( state === 2 ) {
					return jqXHR;
				}
	
				// Timeout
				if ( s.async && s.timeout > 0 ) {
					timeoutTimer = window.setTimeout( function() {
						jqXHR.abort( "timeout" );
					}, s.timeout );
				}
	
				try {
					state = 1;
					transport.send( requestHeaders, done );
				} catch ( e ) {
	
					// Propagate exception as error if not done
					if ( state < 2 ) {
						done( -1, e );
	
					// Simply rethrow otherwise
					} else {
						throw e;
					}
				}
			}
	
			// Callback for when everything is done
			function done( status, nativeStatusText, responses, headers ) {
				var isSuccess, success, error, response, modified,
					statusText = nativeStatusText;
	
				// Called once
				if ( state === 2 ) {
					return;
				}
	
				// State is "done" now
				state = 2;
	
				// Clear timeout if it exists
				if ( timeoutTimer ) {
					window.clearTimeout( timeoutTimer );
				}
	
				// Dereference transport for early garbage collection
				// (no matter how long the jqXHR object will be used)
				transport = undefined;
	
				// Cache response headers
				responseHeadersString = headers || "";
	
				// Set readyState
				jqXHR.readyState = status > 0 ? 4 : 0;
	
				// Determine if successful
				isSuccess = status >= 200 && status < 300 || status === 304;
	
				// Get response data
				if ( responses ) {
					response = ajaxHandleResponses( s, jqXHR, responses );
				}
	
				// Convert no matter what (that way responseXXX fields are always set)
				response = ajaxConvert( s, response, jqXHR, isSuccess );
	
				// If successful, handle type chaining
				if ( isSuccess ) {
	
					// Set the If-Modified-Since and/or If-None-Match header, if in ifModified mode.
					if ( s.ifModified ) {
						modified = jqXHR.getResponseHeader( "Last-Modified" );
						if ( modified ) {
							jQuery.lastModified[ cacheURL ] = modified;
						}
						modified = jqXHR.getResponseHeader( "etag" );
						if ( modified ) {
							jQuery.etag[ cacheURL ] = modified;
						}
					}
	
					// if no content
					if ( status === 204 || s.type === "HEAD" ) {
						statusText = "nocontent";
	
					// if not modified
					} else if ( status === 304 ) {
						statusText = "notmodified";
	
					// If we have data, let's convert it
					} else {
						statusText = response.state;
						success = response.data;
						error = response.error;
						isSuccess = !error;
					}
				} else {
	
					// Extract error from statusText and normalize for non-aborts
					error = statusText;
					if ( status || !statusText ) {
						statusText = "error";
						if ( status < 0 ) {
							status = 0;
						}
					}
				}
	
				// Set data for the fake xhr object
				jqXHR.status = status;
				jqXHR.statusText = ( nativeStatusText || statusText ) + "";
	
				// Success/Error
				if ( isSuccess ) {
					deferred.resolveWith( callbackContext, [ success, statusText, jqXHR ] );
				} else {
					deferred.rejectWith( callbackContext, [ jqXHR, statusText, error ] );
				}
	
				// Status-dependent callbacks
				jqXHR.statusCode( statusCode );
				statusCode = undefined;
	
				if ( fireGlobals ) {
					globalEventContext.trigger( isSuccess ? "ajaxSuccess" : "ajaxError",
						[ jqXHR, s, isSuccess ? success : error ] );
				}
	
				// Complete
				completeDeferred.fireWith( callbackContext, [ jqXHR, statusText ] );
	
				if ( fireGlobals ) {
					globalEventContext.trigger( "ajaxComplete", [ jqXHR, s ] );
	
					// Handle the global AJAX counter
					if ( !( --jQuery.active ) ) {
						jQuery.event.trigger( "ajaxStop" );
					}
				}
			}
	
			return jqXHR;
		},
	
		getJSON: function( url, data, callback ) {
			return jQuery.get( url, data, callback, "json" );
		},
	
		getScript: function( url, callback ) {
			return jQuery.get( url, undefined, callback, "script" );
		}
	} );
	
	jQuery.each( [ "get", "post" ], function( i, method ) {
		jQuery[ method ] = function( url, data, callback, type ) {
	
			// Shift arguments if data argument was omitted
			if ( jQuery.isFunction( data ) ) {
				type = type || callback;
				callback = data;
				data = undefined;
			}
	
			// The url can be an options object (which then must have .url)
			return jQuery.ajax( jQuery.extend( {
				url: url,
				type: method,
				dataType: type,
				data: data,
				success: callback
			}, jQuery.isPlainObject( url ) && url ) );
		};
	} );
	
	
	jQuery._evalUrl = function( url ) {
		return jQuery.ajax( {
			url: url,
	
			// Make this explicit, since user can override this through ajaxSetup (#11264)
			type: "GET",
			dataType: "script",
			async: false,
			global: false,
			"throws": true
		} );
	};
	
	
	jQuery.fn.extend( {
		wrapAll: function( html ) {
			var wrap;
	
			if ( jQuery.isFunction( html ) ) {
				return this.each( function( i ) {
					jQuery( this ).wrapAll( html.call( this, i ) );
				} );
			}
	
			if ( this[ 0 ] ) {
	
				// The elements to wrap the target around
				wrap = jQuery( html, this[ 0 ].ownerDocument ).eq( 0 ).clone( true );
	
				if ( this[ 0 ].parentNode ) {
					wrap.insertBefore( this[ 0 ] );
				}
	
				wrap.map( function() {
					var elem = this;
	
					while ( elem.firstElementChild ) {
						elem = elem.firstElementChild;
					}
	
					return elem;
				} ).append( this );
			}
	
			return this;
		},
	
		wrapInner: function( html ) {
			if ( jQuery.isFunction( html ) ) {
				return this.each( function( i ) {
					jQuery( this ).wrapInner( html.call( this, i ) );
				} );
			}
	
			return this.each( function() {
				var self = jQuery( this ),
					contents = self.contents();
	
				if ( contents.length ) {
					contents.wrapAll( html );
	
				} else {
					self.append( html );
				}
			} );
		},
	
		wrap: function( html ) {
			var isFunction = jQuery.isFunction( html );
	
			return this.each( function( i ) {
				jQuery( this ).wrapAll( isFunction ? html.call( this, i ) : html );
			} );
		},
	
		unwrap: function() {
			return this.parent().each( function() {
				if ( !jQuery.nodeName( this, "body" ) ) {
					jQuery( this ).replaceWith( this.childNodes );
				}
			} ).end();
		}
	} );
	
	
	jQuery.expr.filters.hidden = function( elem ) {
		return !jQuery.expr.filters.visible( elem );
	};
	jQuery.expr.filters.visible = function( elem ) {
	
		// Support: Opera <= 12.12
		// Opera reports offsetWidths and offsetHeights less than zero on some elements
		// Use OR instead of AND as the element is not visible if either is true
		// See tickets #10406 and #13132
		return elem.offsetWidth > 0 || elem.offsetHeight > 0 || elem.getClientRects().length > 0;
	};
	
	
	
	
	var r20 = /%20/g,
		rbracket = /\[\]$/,
		rCRLF = /\r?\n/g,
		rsubmitterTypes = /^(?:submit|button|image|reset|file)$/i,
		rsubmittable = /^(?:input|select|textarea|keygen)/i;
	
	function buildParams( prefix, obj, traditional, add ) {
		var name;
	
		if ( jQuery.isArray( obj ) ) {
	
			// Serialize array item.
			jQuery.each( obj, function( i, v ) {
				if ( traditional || rbracket.test( prefix ) ) {
	
					// Treat each array item as a scalar.
					add( prefix, v );
	
				} else {
	
					// Item is non-scalar (array or object), encode its numeric index.
					buildParams(
						prefix + "[" + ( typeof v === "object" && v != null ? i : "" ) + "]",
						v,
						traditional,
						add
					);
				}
			} );
	
		} else if ( !traditional && jQuery.type( obj ) === "object" ) {
	
			// Serialize object item.
			for ( name in obj ) {
				buildParams( prefix + "[" + name + "]", obj[ name ], traditional, add );
			}
	
		} else {
	
			// Serialize scalar item.
			add( prefix, obj );
		}
	}
	
	// Serialize an array of form elements or a set of
	// key/values into a query string
	jQuery.param = function( a, traditional ) {
		var prefix,
			s = [],
			add = function( key, value ) {
	
				// If value is a function, invoke it and return its value
				value = jQuery.isFunction( value ) ? value() : ( value == null ? "" : value );
				s[ s.length ] = encodeURIComponent( key ) + "=" + encodeURIComponent( value );
			};
	
		// Set traditional to true for jQuery <= 1.3.2 behavior.
		if ( traditional === undefined ) {
			traditional = jQuery.ajaxSettings && jQuery.ajaxSettings.traditional;
		}
	
		// If an array was passed in, assume that it is an array of form elements.
		if ( jQuery.isArray( a ) || ( a.jquery && !jQuery.isPlainObject( a ) ) ) {
	
			// Serialize the form elements
			jQuery.each( a, function() {
				add( this.name, this.value );
			} );
	
		} else {
	
			// If traditional, encode the "old" way (the way 1.3.2 or older
			// did it), otherwise encode params recursively.
			for ( prefix in a ) {
				buildParams( prefix, a[ prefix ], traditional, add );
			}
		}
	
		// Return the resulting serialization
		return s.join( "&" ).replace( r20, "+" );
	};
	
	jQuery.fn.extend( {
		serialize: function() {
			return jQuery.param( this.serializeArray() );
		},
		serializeArray: function() {
			return this.map( function() {
	
				// Can add propHook for "elements" to filter or add form elements
				var elements = jQuery.prop( this, "elements" );
				return elements ? jQuery.makeArray( elements ) : this;
			} )
			.filter( function() {
				var type = this.type;
	
				// Use .is( ":disabled" ) so that fieldset[disabled] works
				return this.name && !jQuery( this ).is( ":disabled" ) &&
					rsubmittable.test( this.nodeName ) && !rsubmitterTypes.test( type ) &&
					( this.checked || !rcheckableType.test( type ) );
			} )
			.map( function( i, elem ) {
				var val = jQuery( this ).val();
	
				return val == null ?
					null :
					jQuery.isArray( val ) ?
						jQuery.map( val, function( val ) {
							return { name: elem.name, value: val.replace( rCRLF, "\r\n" ) };
						} ) :
						{ name: elem.name, value: val.replace( rCRLF, "\r\n" ) };
			} ).get();
		}
	} );
	
	
	jQuery.ajaxSettings.xhr = function() {
		try {
			return new window.XMLHttpRequest();
		} catch ( e ) {}
	};
	
	var xhrSuccessStatus = {
	
			// File protocol always yields status code 0, assume 200
			0: 200,
	
			// Support: IE9
			// #1450: sometimes IE returns 1223 when it should be 204
			1223: 204
		},
		xhrSupported = jQuery.ajaxSettings.xhr();
	
	support.cors = !!xhrSupported && ( "withCredentials" in xhrSupported );
	support.ajax = xhrSupported = !!xhrSupported;
	
	jQuery.ajaxTransport( function( options ) {
		var callback, errorCallback;
	
		// Cross domain only allowed if supported through XMLHttpRequest
		if ( support.cors || xhrSupported && !options.crossDomain ) {
			return {
				send: function( headers, complete ) {
					var i,
						xhr = options.xhr();
	
					xhr.open(
						options.type,
						options.url,
						options.async,
						options.username,
						options.password
					);
	
					// Apply custom fields if provided
					if ( options.xhrFields ) {
						for ( i in options.xhrFields ) {
							xhr[ i ] = options.xhrFields[ i ];
						}
					}
	
					// Override mime type if needed
					if ( options.mimeType && xhr.overrideMimeType ) {
						xhr.overrideMimeType( options.mimeType );
					}
	
					// X-Requested-With header
					// For cross-domain requests, seeing as conditions for a preflight are
					// akin to a jigsaw puzzle, we simply never set it to be sure.
					// (it can always be set on a per-request basis or even using ajaxSetup)
					// For same-domain requests, won't change header if already provided.
					if ( !options.crossDomain && !headers[ "X-Requested-With" ] ) {
						headers[ "X-Requested-With" ] = "XMLHttpRequest";
					}
	
					// Set headers
					for ( i in headers ) {
						xhr.setRequestHeader( i, headers[ i ] );
					}
	
					// Callback
					callback = function( type ) {
						return function() {
							if ( callback ) {
								callback = errorCallback = xhr.onload =
									xhr.onerror = xhr.onabort = xhr.onreadystatechange = null;
	
								if ( type === "abort" ) {
									xhr.abort();
								} else if ( type === "error" ) {
	
									// Support: IE9
									// On a manual native abort, IE9 throws
									// errors on any property access that is not readyState
									if ( typeof xhr.status !== "number" ) {
										complete( 0, "error" );
									} else {
										complete(
	
											// File: protocol always yields status 0; see #8605, #14207
											xhr.status,
											xhr.statusText
										);
									}
								} else {
									complete(
										xhrSuccessStatus[ xhr.status ] || xhr.status,
										xhr.statusText,
	
										// Support: IE9 only
										// IE9 has no XHR2 but throws on binary (trac-11426)
										// For XHR2 non-text, let the caller handle it (gh-2498)
										( xhr.responseType || "text" ) !== "text"  ||
										typeof xhr.responseText !== "string" ?
											{ binary: xhr.response } :
											{ text: xhr.responseText },
										xhr.getAllResponseHeaders()
									);
								}
							}
						};
					};
	
					// Listen to events
					xhr.onload = callback();
					errorCallback = xhr.onerror = callback( "error" );
	
					// Support: IE9
					// Use onreadystatechange to replace onabort
					// to handle uncaught aborts
					if ( xhr.onabort !== undefined ) {
						xhr.onabort = errorCallback;
					} else {
						xhr.onreadystatechange = function() {
	
							// Check readyState before timeout as it changes
							if ( xhr.readyState === 4 ) {
	
								// Allow onerror to be called first,
								// but that will not handle a native abort
								// Also, save errorCallback to a variable
								// as xhr.onerror cannot be accessed
								window.setTimeout( function() {
									if ( callback ) {
										errorCallback();
									}
								} );
							}
						};
					}
	
					// Create the abort callback
					callback = callback( "abort" );
	
					try {
	
						// Do send the request (this may raise an exception)
						xhr.send( options.hasContent && options.data || null );
					} catch ( e ) {
	
						// #14683: Only rethrow if this hasn't been notified as an error yet
						if ( callback ) {
							throw e;
						}
					}
				},
	
				abort: function() {
					if ( callback ) {
						callback();
					}
				}
			};
		}
	} );
	
	
	
	
	// Install script dataType
	jQuery.ajaxSetup( {
		accepts: {
			script: "text/javascript, application/javascript, " +
				"application/ecmascript, application/x-ecmascript"
		},
		contents: {
			script: /\b(?:java|ecma)script\b/
		},
		converters: {
			"text script": function( text ) {
				jQuery.globalEval( text );
				return text;
			}
		}
	} );
	
	// Handle cache's special case and crossDomain
	jQuery.ajaxPrefilter( "script", function( s ) {
		if ( s.cache === undefined ) {
			s.cache = false;
		}
		if ( s.crossDomain ) {
			s.type = "GET";
		}
	} );
	
	// Bind script tag hack transport
	jQuery.ajaxTransport( "script", function( s ) {
	
		// This transport only deals with cross domain requests
		if ( s.crossDomain ) {
			var script, callback;
			return {
				send: function( _, complete ) {
					script = jQuery( "<script>" ).prop( {
						charset: s.scriptCharset,
						src: s.url
					} ).on(
						"load error",
						callback = function( evt ) {
							script.remove();
							callback = null;
							if ( evt ) {
								complete( evt.type === "error" ? 404 : 200, evt.type );
							}
						}
					);
	
					// Use native DOM manipulation to avoid our domManip AJAX trickery
					document.head.appendChild( script[ 0 ] );
				},
				abort: function() {
					if ( callback ) {
						callback();
					}
				}
			};
		}
	} );
	
	
	
	
	var oldCallbacks = [],
		rjsonp = /(=)\?(?=&|$)|\?\?/;
	
	// Default jsonp settings
	jQuery.ajaxSetup( {
		jsonp: "callback",
		jsonpCallback: function() {
			var callback = oldCallbacks.pop() || ( jQuery.expando + "_" + ( nonce++ ) );
			this[ callback ] = true;
			return callback;
		}
	} );
	
	// Detect, normalize options and install callbacks for jsonp requests
	jQuery.ajaxPrefilter( "json jsonp", function( s, originalSettings, jqXHR ) {
	
		var callbackName, overwritten, responseContainer,
			jsonProp = s.jsonp !== false && ( rjsonp.test( s.url ) ?
				"url" :
				typeof s.data === "string" &&
					( s.contentType || "" )
						.indexOf( "application/x-www-form-urlencoded" ) === 0 &&
					rjsonp.test( s.data ) && "data"
			);
	
		// Handle iff the expected data type is "jsonp" or we have a parameter to set
		if ( jsonProp || s.dataTypes[ 0 ] === "jsonp" ) {
	
			// Get callback name, remembering preexisting value associated with it
			callbackName = s.jsonpCallback = jQuery.isFunction( s.jsonpCallback ) ?
				s.jsonpCallback() :
				s.jsonpCallback;
	
			// Insert callback into url or form data
			if ( jsonProp ) {
				s[ jsonProp ] = s[ jsonProp ].replace( rjsonp, "$1" + callbackName );
			} else if ( s.jsonp !== false ) {
				s.url += ( rquery.test( s.url ) ? "&" : "?" ) + s.jsonp + "=" + callbackName;
			}
	
			// Use data converter to retrieve json after script execution
			s.converters[ "script json" ] = function() {
				if ( !responseContainer ) {
					jQuery.error( callbackName + " was not called" );
				}
				return responseContainer[ 0 ];
			};
	
			// Force json dataType
			s.dataTypes[ 0 ] = "json";
	
			// Install callback
			overwritten = window[ callbackName ];
			window[ callbackName ] = function() {
				responseContainer = arguments;
			};
	
			// Clean-up function (fires after converters)
			jqXHR.always( function() {
	
				// If previous value didn't exist - remove it
				if ( overwritten === undefined ) {
					jQuery( window ).removeProp( callbackName );
	
				// Otherwise restore preexisting value
				} else {
					window[ callbackName ] = overwritten;
				}
	
				// Save back as free
				if ( s[ callbackName ] ) {
	
					// Make sure that re-using the options doesn't screw things around
					s.jsonpCallback = originalSettings.jsonpCallback;
	
					// Save the callback name for future use
					oldCallbacks.push( callbackName );
				}
	
				// Call if it was a function and we have a response
				if ( responseContainer && jQuery.isFunction( overwritten ) ) {
					overwritten( responseContainer[ 0 ] );
				}
	
				responseContainer = overwritten = undefined;
			} );
	
			// Delegate to script
			return "script";
		}
	} );
	
	
	
	
	// Argument "data" should be string of html
	// context (optional): If specified, the fragment will be created in this context,
	// defaults to document
	// keepScripts (optional): If true, will include scripts passed in the html string
	jQuery.parseHTML = function( data, context, keepScripts ) {
		if ( !data || typeof data !== "string" ) {
			return null;
		}
		if ( typeof context === "boolean" ) {
			keepScripts = context;
			context = false;
		}
		context = context || document;
	
		var parsed = rsingleTag.exec( data ),
			scripts = !keepScripts && [];
	
		// Single tag
		if ( parsed ) {
			return [ context.createElement( parsed[ 1 ] ) ];
		}
	
		parsed = buildFragment( [ data ], context, scripts );
	
		if ( scripts && scripts.length ) {
			jQuery( scripts ).remove();
		}
	
		return jQuery.merge( [], parsed.childNodes );
	};
	
	
	// Keep a copy of the old load method
	var _load = jQuery.fn.load;
	
	/**
	 * Load a url into a page
	 */
	jQuery.fn.load = function( url, params, callback ) {
		if ( typeof url !== "string" && _load ) {
			return _load.apply( this, arguments );
		}
	
		var selector, type, response,
			self = this,
			off = url.indexOf( " " );
	
		if ( off > -1 ) {
			selector = jQuery.trim( url.slice( off ) );
			url = url.slice( 0, off );
		}
	
		// If it's a function
		if ( jQuery.isFunction( params ) ) {
	
			// We assume that it's the callback
			callback = params;
			params = undefined;
	
		// Otherwise, build a param string
		} else if ( params && typeof params === "object" ) {
			type = "POST";
		}
	
		// If we have elements to modify, make the request
		if ( self.length > 0 ) {
			jQuery.ajax( {
				url: url,
	
				// If "type" variable is undefined, then "GET" method will be used.
				// Make value of this field explicit since
				// user can override it through ajaxSetup method
				type: type || "GET",
				dataType: "html",
				data: params
			} ).done( function( responseText ) {
	
				// Save response for use in complete callback
				response = arguments;
	
				self.html( selector ?
	
					// If a selector was specified, locate the right elements in a dummy div
					// Exclude scripts to avoid IE 'Permission Denied' errors
					jQuery( "<div>" ).append( jQuery.parseHTML( responseText ) ).find( selector ) :
	
					// Otherwise use the full result
					responseText );
	
			// If the request succeeds, this function gets "data", "status", "jqXHR"
			// but they are ignored because response was set above.
			// If it fails, this function gets "jqXHR", "status", "error"
			} ).always( callback && function( jqXHR, status ) {
				self.each( function() {
					callback.apply( this, response || [ jqXHR.responseText, status, jqXHR ] );
				} );
			} );
		}
	
		return this;
	};
	
	
	
	
	// Attach a bunch of functions for handling common AJAX events
	jQuery.each( [
		"ajaxStart",
		"ajaxStop",
		"ajaxComplete",
		"ajaxError",
		"ajaxSuccess",
		"ajaxSend"
	], function( i, type ) {
		jQuery.fn[ type ] = function( fn ) {
			return this.on( type, fn );
		};
	} );
	
	
	
	
	jQuery.expr.filters.animated = function( elem ) {
		return jQuery.grep( jQuery.timers, function( fn ) {
			return elem === fn.elem;
		} ).length;
	};
	
	
	
	
	/**
	 * Gets a window from an element
	 */
	function getWindow( elem ) {
		return jQuery.isWindow( elem ) ? elem : elem.nodeType === 9 && elem.defaultView;
	}
	
	jQuery.offset = {
		setOffset: function( elem, options, i ) {
			var curPosition, curLeft, curCSSTop, curTop, curOffset, curCSSLeft, calculatePosition,
				position = jQuery.css( elem, "position" ),
				curElem = jQuery( elem ),
				props = {};
	
			// Set position first, in-case top/left are set even on static elem
			if ( position === "static" ) {
				elem.style.position = "relative";
			}
	
			curOffset = curElem.offset();
			curCSSTop = jQuery.css( elem, "top" );
			curCSSLeft = jQuery.css( elem, "left" );
			calculatePosition = ( position === "absolute" || position === "fixed" ) &&
				( curCSSTop + curCSSLeft ).indexOf( "auto" ) > -1;
	
			// Need to be able to calculate position if either
			// top or left is auto and position is either absolute or fixed
			if ( calculatePosition ) {
				curPosition = curElem.position();
				curTop = curPosition.top;
				curLeft = curPosition.left;
	
			} else {
				curTop = parseFloat( curCSSTop ) || 0;
				curLeft = parseFloat( curCSSLeft ) || 0;
			}
	
			if ( jQuery.isFunction( options ) ) {
	
				// Use jQuery.extend here to allow modification of coordinates argument (gh-1848)
				options = options.call( elem, i, jQuery.extend( {}, curOffset ) );
			}
	
			if ( options.top != null ) {
				props.top = ( options.top - curOffset.top ) + curTop;
			}
			if ( options.left != null ) {
				props.left = ( options.left - curOffset.left ) + curLeft;
			}
	
			if ( "using" in options ) {
				options.using.call( elem, props );
	
			} else {
				curElem.css( props );
			}
		}
	};
	
	jQuery.fn.extend( {
		offset: function( options ) {
			if ( arguments.length ) {
				return options === undefined ?
					this :
					this.each( function( i ) {
						jQuery.offset.setOffset( this, options, i );
					} );
			}
	
			var docElem, win,
				elem = this[ 0 ],
				box = { top: 0, left: 0 },
				doc = elem && elem.ownerDocument;
	
			if ( !doc ) {
				return;
			}
	
			docElem = doc.documentElement;
	
			// Make sure it's not a disconnected DOM node
			if ( !jQuery.contains( docElem, elem ) ) {
				return box;
			}
	
			box = elem.getBoundingClientRect();
			win = getWindow( doc );
			return {
				top: box.top + win.pageYOffset - docElem.clientTop,
				left: box.left + win.pageXOffset - docElem.clientLeft
			};
		},
	
		position: function() {
			if ( !this[ 0 ] ) {
				return;
			}
	
			var offsetParent, offset,
				elem = this[ 0 ],
				parentOffset = { top: 0, left: 0 };
	
			// Fixed elements are offset from window (parentOffset = {top:0, left: 0},
			// because it is its only offset parent
			if ( jQuery.css( elem, "position" ) === "fixed" ) {
	
				// Assume getBoundingClientRect is there when computed position is fixed
				offset = elem.getBoundingClientRect();
	
			} else {
	
				// Get *real* offsetParent
				offsetParent = this.offsetParent();
	
				// Get correct offsets
				offset = this.offset();
				if ( !jQuery.nodeName( offsetParent[ 0 ], "html" ) ) {
					parentOffset = offsetParent.offset();
				}
	
				// Add offsetParent borders
				parentOffset.top += jQuery.css( offsetParent[ 0 ], "borderTopWidth", true );
				parentOffset.left += jQuery.css( offsetParent[ 0 ], "borderLeftWidth", true );
			}
	
			// Subtract parent offsets and element margins
			return {
				top: offset.top - parentOffset.top - jQuery.css( elem, "marginTop", true ),
				left: offset.left - parentOffset.left - jQuery.css( elem, "marginLeft", true )
			};
		},
	
		// This method will return documentElement in the following cases:
		// 1) For the element inside the iframe without offsetParent, this method will return
		//    documentElement of the parent window
		// 2) For the hidden or detached element
		// 3) For body or html element, i.e. in case of the html node - it will return itself
		//
		// but those exceptions were never presented as a real life use-cases
		// and might be considered as more preferable results.
		//
		// This logic, however, is not guaranteed and can change at any point in the future
		offsetParent: function() {
			return this.map( function() {
				var offsetParent = this.offsetParent;
	
				while ( offsetParent && jQuery.css( offsetParent, "position" ) === "static" ) {
					offsetParent = offsetParent.offsetParent;
				}
	
				return offsetParent || documentElement;
			} );
		}
	} );
	
	// Create scrollLeft and scrollTop methods
	jQuery.each( { scrollLeft: "pageXOffset", scrollTop: "pageYOffset" }, function( method, prop ) {
		var top = "pageYOffset" === prop;
	
		jQuery.fn[ method ] = function( val ) {
			return access( this, function( elem, method, val ) {
				var win = getWindow( elem );
	
				if ( val === undefined ) {
					return win ? win[ prop ] : elem[ method ];
				}
	
				if ( win ) {
					win.scrollTo(
						!top ? val : win.pageXOffset,
						top ? val : win.pageYOffset
					);
	
				} else {
					elem[ method ] = val;
				}
			}, method, val, arguments.length );
		};
	} );
	
	// Support: Safari<7-8+, Chrome<37-44+
	// Add the top/left cssHooks using jQuery.fn.position
	// Webkit bug: https://bugs.webkit.org/show_bug.cgi?id=29084
	// Blink bug: https://code.google.com/p/chromium/issues/detail?id=229280
	// getComputedStyle returns percent when specified for top/left/bottom/right;
	// rather than make the css module depend on the offset module, just check for it here
	jQuery.each( [ "top", "left" ], function( i, prop ) {
		jQuery.cssHooks[ prop ] = addGetHookIf( support.pixelPosition,
			function( elem, computed ) {
				if ( computed ) {
					computed = curCSS( elem, prop );
	
					// If curCSS returns percentage, fallback to offset
					return rnumnonpx.test( computed ) ?
						jQuery( elem ).position()[ prop ] + "px" :
						computed;
				}
			}
		);
	} );
	
	
	// Create innerHeight, innerWidth, height, width, outerHeight and outerWidth methods
	jQuery.each( { Height: "height", Width: "width" }, function( name, type ) {
		jQuery.each( { padding: "inner" + name, content: type, "": "outer" + name },
			function( defaultExtra, funcName ) {
	
			// Margin is only for outerHeight, outerWidth
			jQuery.fn[ funcName ] = function( margin, value ) {
				var chainable = arguments.length && ( defaultExtra || typeof margin !== "boolean" ),
					extra = defaultExtra || ( margin === true || value === true ? "margin" : "border" );
	
				return access( this, function( elem, type, value ) {
					var doc;
	
					if ( jQuery.isWindow( elem ) ) {
	
						// As of 5/8/2012 this will yield incorrect results for Mobile Safari, but there
						// isn't a whole lot we can do. See pull request at this URL for discussion:
						// https://github.com/jquery/jquery/pull/764
						return elem.document.documentElement[ "client" + name ];
					}
	
					// Get document width or height
					if ( elem.nodeType === 9 ) {
						doc = elem.documentElement;
	
						// Either scroll[Width/Height] or offset[Width/Height] or client[Width/Height],
						// whichever is greatest
						return Math.max(
							elem.body[ "scroll" + name ], doc[ "scroll" + name ],
							elem.body[ "offset" + name ], doc[ "offset" + name ],
							doc[ "client" + name ]
						);
					}
	
					return value === undefined ?
	
						// Get width or height on the element, requesting but not forcing parseFloat
						jQuery.css( elem, type, extra ) :
	
						// Set width or height on the element
						jQuery.style( elem, type, value, extra );
				}, type, chainable ? margin : undefined, chainable, null );
			};
		} );
	} );
	
	
	jQuery.fn.extend( {
	
		bind: function( types, data, fn ) {
			return this.on( types, null, data, fn );
		},
		unbind: function( types, fn ) {
			return this.off( types, null, fn );
		},
	
		delegate: function( selector, types, data, fn ) {
			return this.on( types, selector, data, fn );
		},
		undelegate: function( selector, types, fn ) {
	
			// ( namespace ) or ( selector, types [, fn] )
			return arguments.length === 1 ?
				this.off( selector, "**" ) :
				this.off( types, selector || "**", fn );
		},
		size: function() {
			return this.length;
		}
	} );
	
	jQuery.fn.andSelf = jQuery.fn.addBack;
	
	
	
	
	// Register as a named AMD module, since jQuery can be concatenated with other
	// files that may use define, but not via a proper concatenation script that
	// understands anonymous AMD modules. A named AMD is safest and most robust
	// way to register. Lowercase jquery is used because AMD module names are
	// derived from file names, and jQuery is normally delivered in a lowercase
	// file name. Do this after creating the global so that if an AMD module wants
	// to call noConflict to hide this version of jQuery, it will work.
	
	// Note that for maximum portability, libraries that are not jQuery should
	// declare themselves as anonymous modules, and avoid setting a global if an
	// AMD loader is present. jQuery is a special case. For more information, see
	// https://github.com/jrburke/requirejs/wiki/Updating-existing-libraries#wiki-anon
	
	if ( true ) {
		!(__WEBPACK_AMD_DEFINE_ARRAY__ = [], __WEBPACK_AMD_DEFINE_RESULT__ = function() {
			return jQuery;
		}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
	}
	
	
	
	var
	
		// Map over jQuery in case of overwrite
		_jQuery = window.jQuery,
	
		// Map over the $ in case of overwrite
		_$ = window.$;
	
	jQuery.noConflict = function( deep ) {
		if ( window.$ === jQuery ) {
			window.$ = _$;
		}
	
		if ( deep && window.jQuery === jQuery ) {
			window.jQuery = _jQuery;
		}
	
		return jQuery;
	};
	
	// Expose jQuery and $ identifiers, even in AMD
	// (#7102#comment:10, https://github.com/jquery/jquery/pull/557)
	// and CommonJS for browser emulators (#13566)
	if ( !noGlobal ) {
		window.jQuery = window.$ = jQuery;
	}
	
	return jQuery;
	}));


/***/ }),
/* 5 */
/*!*****************************!*\
  !*** ./style/controls.scss ***!
  \*****************************/
/***/ (function(module, exports, __webpack_require__) {

	// style-loader: Adds some css to the DOM by adding a <style> tag
	
	// load the styles
	var content = __webpack_require__(/*! !../~/css-loader!../~/autoprefixer-loader!../~/sass-loader!./controls.scss */ 6);
	if(typeof content === 'string') content = [[module.id, content, '']];
	// add the styles to the DOM
	var update = __webpack_require__(/*! ../~/style-loader/addStyles.js */ 9)(content, {});
	if(content.locals) module.exports = content.locals;
	// Hot Module Replacement
	if(false) {
		// When the styles change, update the <style> tags
		if(!content.locals) {
			module.hot.accept("!!../node_modules/css-loader/index.js!../node_modules/autoprefixer-loader/index.js!../node_modules/sass-loader/index.js!./controls.scss", function() {
				var newContent = require("!!../node_modules/css-loader/index.js!../node_modules/autoprefixer-loader/index.js!../node_modules/sass-loader/index.js!./controls.scss");
				if(typeof newContent === 'string') newContent = [[module.id, newContent, '']];
				update(newContent);
			});
		}
		// When the module is disposed, remove the <style> tags
		module.hot.dispose(function() { update(); });
	}

/***/ }),
/* 6 */
/*!************************************************************************************!*\
  !*** ./~/css-loader!./~/autoprefixer-loader!./~/sass-loader!./style/controls.scss ***!
  \************************************************************************************/
/***/ (function(module, exports, __webpack_require__) {

	exports = module.exports = __webpack_require__(/*! ../~/css-loader/lib/css-base.js */ 7)();
	// imports
	
	
	// module
	exports.push([module.id, "#WaveDisplay {\n  width: 100%;\n  height: 88%;\n  position: absolute;\n  top: 0px;\n  left: 0px;\n  z-index: 1; }\n\n@keyframes AnimateIn {\n  0% {\n    top: -135px;\n    transform: scale(0.5); }\n  60% {\n    top: 55%;\n    transform: scale(0.5); }\n  80% {\n    top: 50%;\n    transform: scale(0.5); }\n  100% {\n    top: 50%;\n    transform: scale(1); } }\n\n#RecordButton {\n  z-index: 10;\n  position: absolute;\n  left: 50%;\n  top: 50%;\n  height: 135px;\n  width: 135px;\n  font-size: 135px;\n  margin-left: -67.5px;\n  margin-top: -67.5px;\n  background-color: white;\n  background-image: url(" + __webpack_require__(/*! ../images/micpuppy.png */ 8) + ");\n  background-size: 70% 70%;\n  background-repeat: no-repeat;\n  background-position: 22px 50%;\n  border-radius: 50%;\n  cursor: pointer;\n  box-shadow: 0.1rem 0.1rem 1rem 0.1rem rgba(0, 0, 0, 0.2);\n  transition: transform 0.1s;\n  color: #616161; }\n  #RecordButton:before {\n    top: -4px;\n    position: absolute; }\n  #RecordButton.disabled {\n    color: #EEEEEE; }\n  #RecordButton.recording {\n    background-color: #db4437;\n    color: white; }\n  #RecordButton:active {\n    transform: scale(1.1); }\n", ""]);
	
	// exports


/***/ }),
/* 7 */
/*!**************************************!*\
  !*** ./~/css-loader/lib/css-base.js ***!
  \**************************************/
/***/ (function(module, exports) {

	/*
		MIT License http://www.opensource.org/licenses/mit-license.php
		Author Tobias Koppers @sokra
	*/
	// css base code, injected by the css-loader
	module.exports = function() {
		var list = [];
	
		// return the list of modules as css string
		list.toString = function toString() {
			var result = [];
			for(var i = 0; i < this.length; i++) {
				var item = this[i];
				if(item[2]) {
					result.push("@media " + item[2] + "{" + item[1] + "}");
				} else {
					result.push(item[1]);
				}
			}
			return result.join("");
		};
	
		// import a list of modules into the list
		list.i = function(modules, mediaQuery) {
			if(typeof modules === "string")
				modules = [[null, modules, ""]];
			var alreadyImportedModules = {};
			for(var i = 0; i < this.length; i++) {
				var id = this[i][0];
				if(typeof id === "number")
					alreadyImportedModules[id] = true;
			}
			for(i = 0; i < modules.length; i++) {
				var item = modules[i];
				// skip already imported module
				// this implementation is not 100% perfect for weird media query combinations
				//  when a module is imported multiple times with different media queries.
				//  I hope this will never occur (Hey this way we have smaller bundles)
				if(typeof item[0] !== "number" || !alreadyImportedModules[item[0]]) {
					if(mediaQuery && !item[2]) {
						item[2] = mediaQuery;
					} else if(mediaQuery) {
						item[2] = "(" + item[2] + ") and (" + mediaQuery + ")";
					}
					list.push(item);
				}
			}
		};
		return list;
	};


/***/ }),
/* 8 */
/*!*****************************!*\
  !*** ./images/micpuppy.png ***!
  \*****************************/
/***/ (function(module, exports) {

	module.exports = "data:image/png;base64,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CIiACIiACDgjwGXYvobKNmZth78QPnJstEwEREAEREAEREAEREAEnBP4JVK03eAtGv/b8G1X50SUoAiIgAiIgAiIgAiIgAi0ETgW/xdt1NoKdz18WqjNT/0rAiIgAiIgAiIgAiIgApUR+DVS5stJbDWAs8b7KnwYCk0JyURABERABERABERABETAKwI7wpv3oayNW5PHfYx0T4L6QTIREAEREAEREAEREAER8JbA4vDM5ZJznyC9c6FFvSUix0RABERABERABERABESgjUAP/L8X9DJkshe5Na6xiPt0aDFIJgIiIAIiIAIiIAIiIAJBEpgFXh8APQm1NnaLfp+AeNh7zcZ4mVdzI7hMBERABERABERABERABIoRsPEWvGnhyqrQJtDq0HxQL6iTfYkDxkBPQHdCI6AXIJkIiIAIiIAIiIAIiIAIVEbARoO5NTN8rfZAaP4uzYbP1hUtuNIG3yDI1S6oN6DPIJkIiIAIiIAIiIAIiIAIiIAIiIAIiIAIiIAIiIAIiIDvBKb473//29t3J+VfPQlMMcUU4+uZM+VKBERABERABESgTgTYYH6rThlSXsIhgAazJnOGU1zyVAREQAREQAQaS+D/ARAzs8f6Amo4AAAAAElFTkSuQmCC"

/***/ }),
/* 9 */
/*!*************************************!*\
  !*** ./~/style-loader/addStyles.js ***!
  \*************************************/
/***/ (function(module, exports, __webpack_require__) {

	/*
		MIT License http://www.opensource.org/licenses/mit-license.php
		Author Tobias Koppers @sokra
	*/
	var stylesInDom = {},
		memoize = function(fn) {
			var memo;
			return function () {
				if (typeof memo === "undefined") memo = fn.apply(this, arguments);
				return memo;
			};
		},
		isOldIE = memoize(function() {
			return /msie [6-9]\b/.test(window.navigator.userAgent.toLowerCase());
		}),
		getHeadElement = memoize(function () {
			return document.head || document.getElementsByTagName("head")[0];
		}),
		singletonElement = null,
		singletonCounter = 0;
	
	module.exports = function(list, options) {
		if(true) {
			if(typeof document !== "object") throw new Error("The style-loader cannot be used in a non-browser environment");
		}
	
		options = options || {};
		// Force single-tag solution on IE6-9, which has a hard limit on the # of <style>
		// tags it will allow on a page
		if (typeof options.singleton === "undefined") options.singleton = isOldIE();
	
		var styles = listToStyles(list);
		addStylesToDom(styles, options);
	
		return function update(newList) {
			var mayRemove = [];
			for(var i = 0; i < styles.length; i++) {
				var item = styles[i];
				var domStyle = stylesInDom[item.id];
				domStyle.refs--;
				mayRemove.push(domStyle);
			}
			if(newList) {
				var newStyles = listToStyles(newList);
				addStylesToDom(newStyles, options);
			}
			for(var i = 0; i < mayRemove.length; i++) {
				var domStyle = mayRemove[i];
				if(domStyle.refs === 0) {
					for(var j = 0; j < domStyle.parts.length; j++)
						domStyle.parts[j]();
					delete stylesInDom[domStyle.id];
				}
			}
		};
	}
	
	function addStylesToDom(styles, options) {
		for(var i = 0; i < styles.length; i++) {
			var item = styles[i];
			var domStyle = stylesInDom[item.id];
			if(domStyle) {
				domStyle.refs++;
				for(var j = 0; j < domStyle.parts.length; j++) {
					domStyle.parts[j](item.parts[j]);
				}
				for(; j < item.parts.length; j++) {
					domStyle.parts.push(addStyle(item.parts[j], options));
				}
			} else {
				var parts = [];
				for(var j = 0; j < item.parts.length; j++) {
					parts.push(addStyle(item.parts[j], options));
				}
				stylesInDom[item.id] = {id: item.id, refs: 1, parts: parts};
			}
		}
	}
	
	function listToStyles(list) {
		var styles = [];
		var newStyles = {};
		for(var i = 0; i < list.length; i++) {
			var item = list[i];
			var id = item[0];
			var css = item[1];
			var media = item[2];
			var sourceMap = item[3];
			var part = {css: css, media: media, sourceMap: sourceMap};
			if(!newStyles[id])
				styles.push(newStyles[id] = {id: id, parts: [part]});
			else
				newStyles[id].parts.push(part);
		}
		return styles;
	}
	
	function createStyleElement() {
		var styleElement = document.createElement("style");
		var head = getHeadElement();
		styleElement.type = "text/css";
		head.appendChild(styleElement);
		return styleElement;
	}
	
	function createLinkElement() {
		var linkElement = document.createElement("link");
		var head = getHeadElement();
		linkElement.rel = "stylesheet";
		head.appendChild(linkElement);
		return linkElement;
	}
	
	function addStyle(obj, options) {
		var styleElement, update, remove;
	
		if (options.singleton) {
			var styleIndex = singletonCounter++;
			styleElement = singletonElement || (singletonElement = createStyleElement());
			update = applyToSingletonTag.bind(null, styleElement, styleIndex, false);
			remove = applyToSingletonTag.bind(null, styleElement, styleIndex, true);
		} else if(obj.sourceMap &&
			typeof URL === "function" &&
			typeof URL.createObjectURL === "function" &&
			typeof URL.revokeObjectURL === "function" &&
			typeof Blob === "function" &&
			typeof btoa === "function") {
			styleElement = createLinkElement();
			update = updateLink.bind(null, styleElement);
			remove = function() {
				styleElement.parentNode.removeChild(styleElement);
				if(styleElement.href)
					URL.revokeObjectURL(styleElement.href);
			};
		} else {
			styleElement = createStyleElement();
			update = applyToTag.bind(null, styleElement);
			remove = function() {
				styleElement.parentNode.removeChild(styleElement);
			};
		}
	
		update(obj);
	
		return function updateStyle(newObj) {
			if(newObj) {
				if(newObj.css === obj.css && newObj.media === obj.media && newObj.sourceMap === obj.sourceMap)
					return;
				update(obj = newObj);
			} else {
				remove();
			}
		};
	}
	
	var replaceText = (function () {
		var textStore = [];
	
		return function (index, replacement) {
			textStore[index] = replacement;
			return textStore.filter(Boolean).join('\n');
		};
	})();
	
	function applyToSingletonTag(styleElement, index, remove, obj) {
		var css = remove ? "" : obj.css;
	
		if (styleElement.styleSheet) {
			styleElement.styleSheet.cssText = replaceText(index, css);
		} else {
			var cssNode = document.createTextNode(css);
			var childNodes = styleElement.childNodes;
			if (childNodes[index]) styleElement.removeChild(childNodes[index]);
			if (childNodes.length) {
				styleElement.insertBefore(cssNode, childNodes[index]);
			} else {
				styleElement.appendChild(cssNode);
			}
		}
	}
	
	function applyToTag(styleElement, obj) {
		var css = obj.css;
		var media = obj.media;
		var sourceMap = obj.sourceMap;
	
		if(media) {
			styleElement.setAttribute("media", media)
		}
	
		if(styleElement.styleSheet) {
			styleElement.styleSheet.cssText = css;
		} else {
			while(styleElement.firstChild) {
				styleElement.removeChild(styleElement.firstChild);
			}
			styleElement.appendChild(document.createTextNode(css));
		}
	}
	
	function updateLink(linkElement, obj) {
		var css = obj.css;
		var media = obj.media;
		var sourceMap = obj.sourceMap;
	
		if(sourceMap) {
			// http://stackoverflow.com/a/26603875
			css += "\n/*# sourceMappingURL=data:application/json;base64," + btoa(unescape(encodeURIComponent(JSON.stringify(sourceMap)))) + " */";
		}
	
		var blob = new Blob([css], { type: "text/css" });
	
		var oldSrc = linkElement.href;
	
		linkElement.href = URL.createObjectURL(blob);
	
		if(oldSrc)
			URL.revokeObjectURL(oldSrc);
	}


/***/ }),
/* 10 */
/*!*********************************!*\
  !*** ./app/interface/Slider.js ***!
  \*********************************/
/***/ (function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;/**
	 * Copyright 2016 Google Inc.
	 *
	 * Licensed under the Apache License, Version 2.0 (the "License");
	 * you may not use this file except in compliance with the License.
	 * You may obtain a copy of the License at
	 *
	 *     http://www.apache.org/licenses/LICENSE-2.0
	 *
	 * Unless required by applicable law or agreed to in writing, software
	 * distributed under the License is distributed on an "AS IS" BASIS,
	 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
	 * See the License for the specific language governing permissions and
	 * limitations under the License.
	 */
	
	!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__(/*! slider.scss */ 11)], __WEBPACK_AMD_DEFINE_RESULT__ = function (mainStyle) {
	
		var Slider = function(container, min, max, initialValue){
	
			/**
			 * The minimum slider value
			 * @type {Number}
			 * @private
			 */
			this._min = min || 0;
	
			/**
			 * The maximum slider value
			 * @type {Number}
			 * @private
			 */
			this._max = max || 100;
	
			/**
			 * The slider container
			 * @type {Element}
			 * @private
			 */
			this._container = document.createElement("div");
			this._container.classList.add("Slider");
			this._container.id = "SpeedSlider";
			container.appendChild(this._container);
	
			/**
			 * The slider which captures the inputs
			 * @type {Element}
			 * @private
			 */
			this._range = document.createElement("input");
			this._range.type = "range";
			this._range.id = "Range";
			this._range.min = min;
			this._range.max = max;
			this._range.step = 0.01;
			this._container.appendChild(this._range);
			this._range.addEventListener("input", this._change.bind(this));
	
			/**
			 * The railing behind the handle
			 * @type {Element}
			 * @private
			 */
			this._rail = document.createElement("div");
			this._rail.id = "Rail";
			this._container.appendChild(this._rail);
	
			/**
			 * The railing behind the handle
			 * @type {Element}
			 * @private
			 */
			this._dot = document.createElement("div");
			this._dot.id = "Dot";
			this._rail.appendChild(this._dot);
	
			/**
			 * The handle of the slider
			 * @type {Element}
			 * @private
			 */
			this._handle = document.createElement("div");
			this._handle.id = "Handle";
			this._container.appendChild(this._handle);
	
			/**
			 * Internal number holder
			 * @type {Number}
			 * @private
			 */
			this._value = 0;
	
			/**
			 * Onchange handler
			 * @type {Function}
			 */
			this.onchange = function(){};
	
			//set the position initially
			this.setValue(initialValue || 0);
	
			//add a resize handler
			window.addEventListener("resize", this._update.bind(this));
		};
	
		Slider.prototype._change = function(){
			this._update();
			this._value = parseFloat(this._range.value);
			this.onchange(this._range.value);
		};
	
		Slider.prototype._update = function(){
			var percent = (this._range.value - this._min) / (this._max - this._min);
	
			if (Math.abs(this._range.value) < 0.15){
				this._range.value = 0;
				percent = 0.5;
			}
	
			var handleOffset = this._handle.offsetWidth * percent;
			var halfHandle = this._handle.offsetWidth / 2;
			var percentPixels = percent * this._container.offsetWidth;
			//computer the width in pixels
			this._handle.style.left = (percentPixels - handleOffset).toString() + "px";
		};
	
		Slider.prototype.animateIn = function(){
			this._container.classList.add("Visible");
		};
	
		Slider.prototype.setValue = function(val){
			this._value = val;
			this._range.value = val;
			this._update();
		};
	
		Slider.prototype.getValue = function(){
			return this._value;
		};
	
		return Slider;
	}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));


/***/ }),
/* 11 */
/*!***************************!*\
  !*** ./style/slider.scss ***!
  \***************************/
/***/ (function(module, exports, __webpack_require__) {

	// style-loader: Adds some css to the DOM by adding a <style> tag
	
	// load the styles
	var content = __webpack_require__(/*! !../~/css-loader!../~/autoprefixer-loader!../~/sass-loader!./slider.scss */ 12);
	if(typeof content === 'string') content = [[module.id, content, '']];
	// add the styles to the DOM
	var update = __webpack_require__(/*! ../~/style-loader/addStyles.js */ 9)(content, {});
	if(content.locals) module.exports = content.locals;
	// Hot Module Replacement
	if(false) {
		// When the styles change, update the <style> tags
		if(!content.locals) {
			module.hot.accept("!!../node_modules/css-loader/index.js!../node_modules/autoprefixer-loader/index.js!../node_modules/sass-loader/index.js!./slider.scss", function() {
				var newContent = require("!!../node_modules/css-loader/index.js!../node_modules/autoprefixer-loader/index.js!../node_modules/sass-loader/index.js!./slider.scss");
				if(typeof newContent === 'string') newContent = [[module.id, newContent, '']];
				update(newContent);
			});
		}
		// When the module is disposed, remove the <style> tags
		module.hot.dispose(function() { update(); });
	}

/***/ }),
/* 12 */
/*!**********************************************************************************!*\
  !*** ./~/css-loader!./~/autoprefixer-loader!./~/sass-loader!./style/slider.scss ***!
  \**********************************************************************************/
/***/ (function(module, exports, __webpack_require__) {

	exports = module.exports = __webpack_require__(/*! ../~/css-loader/lib/css-base.js */ 7)();
	// imports
	
	
	// module
	exports.push([module.id, "#SpeedSlider {\n  position: absolute;\n  -webkit-appearance: none;\n     -moz-appearance: none;\n          appearance: none;\n  width: calc(100% - 60px);\n  max-width: 450px;\n  left: 50%;\n  transform: translate(-50%, 0px);\n  margin: 0.5rem 0;\n  outline: none;\n  bottom: 12%; }\n  #SpeedSlider #Rail {\n    background: #E0E0E0;\n    height: 8px;\n    width: 100%;\n    left: 0px;\n    position: absolute;\n    top: 25px;\n    margin-top: -4px;\n    pointer-events: none;\n    border-radius: 4px; }\n    #SpeedSlider #Rail #Dot {\n      position: absolute;\n      left: 50%;\n      width: 8px;\n      height: 8px;\n      top: 0px;\n      margin-left: -4px;\n      background-color: #757575;\n      border-radius: 50%;\n      opacity: 0.2; }\n  #SpeedSlider #Handle {\n    position: absolute;\n    top: 0px;\n    left: 50%;\n    border-radius: 25px;\n    width: 50px;\n    height: 50px;\n    background-color: white;\n    background-image: url(" + __webpack_require__(/*! ../images/arrows_grey.png */ 13) + ");\n    background-size: 100% 100%;\n    pointer-events: none;\n    box-shadow: 0.1rem 0.1rem 1rem 0.1rem rgba(0, 0, 0, 0.2); }\n  #SpeedSlider #Handle:active:hover {\n    background-color: #FFB729;\n    background-image: url(" + __webpack_require__(/*! ../images/arrows_white.png */ 14) + "); }\n  #SpeedSlider #Range {\n    width: 100%;\n    margin: 0px;\n    height: 50px;\n    position: absolute;\n    top: 0px;\n    left: 0px;\n    opacity: 0;\n    cursor: ew-resize; }\n    #SpeedSlider #Range::-webkit-slider-thumb {\n      -webkit-appearance: none;\n              appearance: none;\n      width: 50px;\n      height: 50px; }\n", ""]);
	
	// exports


/***/ }),
/* 13 */
/*!********************************!*\
  !*** ./images/arrows_grey.png ***!
  \********************************/
/***/ (function(module, exports) {

	module.exports = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAJgAAACYCAYAAAAYwiAhAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAA0lJREFUeNrs3cFNG0EUgGGzyh1KSAfQQVwCVIB98hE6gBLCkRN2BaSDUILTgUuACsg+aRwlhyh21sjzZr9f2jPj9afZ2ScEJ+/v7xPpozoBTIAJMAkwASbAJMAEmACTABNgAkwCTIBJgAkwASYBJsAEmASYABNgEmACTAJMgAkwCTABJsAkwASYAJMAE2ACTAJMgEmACTABJgEmwASYBJgAE2ASYAJMAkyACTAJMB2pbkwfdrFYnMV1xJ//GbB2ccWX+9JfF0dcxrJfxwyw9nAFqnV/nVewnKd+PV8BawfXZdm5Tita1k2/riVg+XHF4+i5Mlzbrvv1rY95JgRsGK54DD1Vvsx4ZL+0fPjvGsUVj5+bJMsNZOtyTgQswRgiDvPXyZZ+WnayS8DqH0OcJ/0Igey5tTFG1wiumsYQQ2tqjNE1gKvGMcTQmhljdMlx1TyGGFoTY4wuMa4MY4hDvGGmHmN0SXFlGkMcAlnaMUaXDFbWMcQh3jBjJ5sCZgzxkci+ZxtjdElwtTSGGFqMMe4BM4b4yO6yjDG6ynG1PIYYWowxXmofY3QV47ofwRhiaF/K4f8MsP3HEHf87FScSze1zspq3cG+9dcbO7vfr8fHxw1gO9bfrAA2hWynHvr7NfOI3B9ZjCViPPGDob827+/TrUP+/yPblJ0Msj+Lnf2qvz/L2hda/Rysv4mv/RU72YqrX7im5RgxAexw0OKc8TByXLGTX5TjwwSwwyOL88Z8xLimtb4tNgGsIItzx9XI3jBXcUyI40K2haf8fbCRjTGqHkM0CawgW4/gDbP6MUSzwBpHlmYM0TSwguy1IFs1hCvNGKJ5YFtk5ZySHVm6McQogP0GLZDNE+NKN4YYFbCCbFmQZXrDXBVcr619H03+dZ2CbJoEWcy4Zi3iahZYojfMeeYZ16iBVY7sreBaThqv+b/RWuEYYzuGaB5X9GkMH7Igmy0Wi2MvJXbU25bGEP/Kf/oQYAJMAkyACTAJMAEmwCTABJgAkwATYBJgAkyASYAJMAEmASbABJgEmACTABNgAkwCTIAJMAkwASbAJMAEmACTABNgEmACTIBJgAkwASYBJsAEmASYAJMAE2ACTAJMgAkwad9+CjAAwcNEAjNn9eUAAAAASUVORK5CYII="

/***/ }),
/* 14 */
/*!*********************************!*\
  !*** ./images/arrows_white.png ***!
  \*********************************/
/***/ (function(module, exports) {

	module.exports = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAJgAAACYCAYAAAAYwiAhAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAA0lJREFUeNrs3P1NGzEYwOHjGIBs0GwA3SBMABsQNoANYAK6QWCDdoMwAXSDdgM6AErtykGV+sVHo/i1n59kwX8c4dGd/RLYWa1Wg7SpRi+BABNgEmACTIBJgAkwASYBJsAEmASYAJMAE2ACTAJMgAkwCTABJsAkwASYBJgAE2ASYAJMgEmACTABJgEmwASYBJgAkwATYAJMAkyACTAJMAEmwCTABJgEmAATYBJgAkyABe/x8fEsrYMtfv2LtCaAtYnrOn24SmubP+BZWvfbRA7Y/4c1Setj+vSkkkt6l9ayF2Rj67jyDzOto8oubS+tu3R9c8Di4sp3iPu09iu+zEXeFwIWE9eyPI5q76rsDwELgis/du7KYyhKJ3mf2OIJc2wMV37cLIJe/lHZ/E8Aq3sMEbn91k6YYwOwahtDQNYKsIrHEG9tryCbA2YMsUlki+jIxsC4oowh3toi8hhjDIhrXnDtDf2UxxjXEU+YY0Bci85wPSEbAo4xxkC4roe4M65uT5hjAFiTgutkUDhkY+24yn4Lrl9PmCHGGGPFuNYnxX2e/ois+jHGCFf4qh5j1HoHO+v0pPjajhOyKWDPbHd3N9/2b7h5Vl/TmqXX7AtgL0d2zs9f+5zWQXqt7j0iX4fsQ/pwytFv+1TuXA82+W9Dljewh2l9Y+qpm/S6HNeOKwSwgiyfKGeQ/ei8bB9CFOZXRWWfMS37jl47LduGAbDNIHsod7LbzmDlO/f7sl0YANswsrQyspuOcM1qPik2BewnaHkfctnBGGIaFVdoYAXZxdDuGOM2whiiaWAFWd6XtDbGyGOI8LiaAFaQLYd2xhiXkcYQXQAryFoYY5yWx/4AWKUnzCHmGCPfeQ8jjiG6ArZGFmyMsR5DLFs8qTT7/8GCjDHCjyG6BVaQ5f1MrWOMJsYQXQMryPK+prYxRjNjiO6BFWTLoZ4xRlNjiH+1s1qtevle138GN2zrzpHfN1/rW5sBk0ekBJgAE2ASYAJMgEmACTABJgEmwCTABJgAkwATYAJMAkyACTAJMAEmwCTABJgEmAATYBJgAkyASYAJMAEmASbAJMAEmACTABNgAkwCTIAJMAkwASYBJsAEmASYABNg0gv6LsAAgGoKp5ewRK0AAAAASUVORK5CYII="

/***/ }),
/* 15 */
/*!**************************************!*\
  !*** ./app/interface/Orientation.js ***!
  \**************************************/
/***/ (function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_RESULT__;/**
	 * Copyright 2016 Google Inc.
	 *
	 * Licensed under the Apache License, Version 2.0 (the "License");
	 * you may not use this file except in compliance with the License.
	 * You may obtain a copy of the License at
	 *
	 *     http://www.apache.org/licenses/LICENSE-2.0
	 *
	 * Unless required by applicable law or agreed to in writing, software
	 * distributed under the License is distributed on an "AS IS" BASIS,
	 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
	 * See the License for the specific language governing permissions and
	 * limitations under the License.
	 */
	
	!(__WEBPACK_AMD_DEFINE_RESULT__ = function () {
	
		var OrientationListener = function(callback){
	
			window.addEventListener("orientationchange", this._changed.bind(this));
			if (window.screen && window.screen.orientation){
				window.screen.orientation.addEventListener("change", this._screenChange.bind(this));
			}
	
			this._callback = callback;
		};
	
		OrientationListener.prototype._changed = function(){
			//check if it's landscape
			if (Math.abs(window.orientation) === 90){
				this._callback();
			}
		};
	
		OrientationListener.prototype._screenChange = function(){		
			//check if it's landscape
			if (Math.abs(window.screen.orientation.angle) === 90){
				this._callback();
			}
		};
	
		return OrientationListener;
	}.call(exports, __webpack_require__, exports, module), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));

/***/ }),
/* 16 */
/*!*************************!*\
  !*** ./style/main.scss ***!
  \*************************/
/***/ (function(module, exports, __webpack_require__) {

	// style-loader: Adds some css to the DOM by adding a <style> tag
	
	// load the styles
	var content = __webpack_require__(/*! !../~/css-loader!../~/autoprefixer-loader!../~/sass-loader!./main.scss */ 17);
	if(typeof content === 'string') content = [[module.id, content, '']];
	// add the styles to the DOM
	var update = __webpack_require__(/*! ../~/style-loader/addStyles.js */ 9)(content, {});
	if(content.locals) module.exports = content.locals;
	// Hot Module Replacement
	if(false) {
		// When the styles change, update the <style> tags
		if(!content.locals) {
			module.hot.accept("!!../node_modules/css-loader/index.js!../node_modules/autoprefixer-loader/index.js!../node_modules/sass-loader/index.js!./main.scss", function() {
				var newContent = require("!!../node_modules/css-loader/index.js!../node_modules/autoprefixer-loader/index.js!../node_modules/sass-loader/index.js!./main.scss");
				if(typeof newContent === 'string') newContent = [[module.id, newContent, '']];
				update(newContent);
			});
		}
		// When the module is disposed, remove the <style> tags
		module.hot.dispose(function() { update(); });
	}

/***/ }),
/* 17 */
/*!********************************************************************************!*\
  !*** ./~/css-loader!./~/autoprefixer-loader!./~/sass-loader!./style/main.scss ***!
  \********************************************************************************/
/***/ (function(module, exports, __webpack_require__) {

	exports = module.exports = __webpack_require__(/*! ../~/css-loader/lib/css-base.js */ 7)();
	// imports
	
	
	// module
	exports.push([module.id, "@charset \"UTF-8\";\n@font-face {\n  font-family: \"icons\";\n  src: url(\"https://gweb-musiclab-site.appspot.com/static/fonts/icons/icons.eot\");\n  src: url(\"https://gweb-musiclab-site.appspot.com/static/fonts/icons/icons.eot?#iefix\") format(\"eot\"), url(\"https://gweb-musiclab-site.appspot.com/static/fonts/icons/icons.woff\") format(\"woff\"), url(\"https://gweb-musiclab-site.appspot.com/static/fonts/icons/icons.ttf\") format(\"truetype\"), url(\"https://gweb-musiclab-site.appspot.com/static/fonts/icons/icons.svg#icons\") format(\"svg\"); }\n\n.icon-svg_808:before, .icon-svg_back_arrow:before, .icon-svg_bird:before, .icon-svg_close-button:before, .icon-svg_computer:before, .icon-svg_facebook:before, .icon-svg_fast_man:before, .icon-svg_flute:before, .icon-svg_frowny_face:before, .icon-svg_go_arrow:before, .icon-svg_gplus:before, .icon-svg_hamburger_menu:before, .icon-svg_hand:before, .icon-svg_harp:before, .icon-svg_horn:before, .icon-svg_left_arrow:before, .icon-svg_man:before, .icon-svg_metronome:before, .icon-svg_no_record:before, .icon-svg_pause:before, .icon-svg_piano:before, .icon-svg_play:before, .icon-svg_record:before, .icon-svg_right_arrow:before, .icon-svg_rotate_phone:before, .icon-svg_slow_man:before, .icon-svg_twitter:before, .icon-svg_wave_form:before, .icon-svg_wine_glass:before {\n  font-family: \"icons\";\n  -webkit-font-smoothing: antialiased;\n  -moz-osx-font-smoothing: grayscale;\n  font-style: normal;\n  font-variant: normal;\n  font-weight: normal;\n  text-decoration: none;\n  text-transform: none; }\n\n.icon-svg_808:before {\n  content: \"\\E001\"; }\n\n.icon-svg_back_arrow:before {\n  content: \"\\E002\"; }\n\n.icon-svg_bird:before {\n  content: \"\\E003\"; }\n\n.icon-svg_close-button:before {\n  content: \"\\E004\"; }\n\n.icon-svg_computer:before {\n  content: \"\\E005\"; }\n\n.icon-svg_facebook:before {\n  content: \"\\E006\"; }\n\n.icon-svg_fast_man:before {\n  content: \"\\E007\"; }\n\n.icon-svg_flute:before {\n  content: \"\\E008\"; }\n\n.icon-svg_frowny_face:before {\n  content: \"\\E009\"; }\n\n.icon-svg_go_arrow:before {\n  content: \"\\E00A\"; }\n\n.icon-svg_gplus:before {\n  content: \"\\E00B\"; }\n\n.icon-svg_hamburger_menu:before {\n  content: \"\\E00C\"; }\n\n.icon-svg_hand:before {\n  content: \"\\E00D\"; }\n\n.icon-svg_harp:before {\n  content: \"\\E00E\"; }\n\n.icon-svg_horn:before {\n  content: \"\\E00F\"; }\n\n.icon-svg_left_arrow:before {\n  content: \"\\E010\"; }\n\n.icon-svg_man:before {\n  content: \"\\E011\"; }\n\n.icon-svg_metronome:before {\n  content: \"\\E012\"; }\n\n.icon-svg_no_record:before {\n  content: \"\\E013\"; }\n\n.icon-svg_pause:before {\n  content: \"\\E014\"; }\n\n.icon-svg_piano:before {\n  content: \"\\E015\"; }\n\n.icon-svg_play:before {\n  content: \"\\E016\"; }\n\n.icon-svg_record:before {\n  content: \"\\E017\"; }\n\n.icon-svg_right_arrow:before {\n  content: \"\\E018\"; }\n\n.icon-svg_rotate_phone:before {\n  content: \"\\E019\"; }\n\n.icon-svg_slow_man:before {\n  content: \"\\E01A\"; }\n\n.icon-svg_twitter:before {\n  content: \"\\E01B\"; }\n\n.icon-svg_wave_form:before {\n  content: \"\\E01C\"; }\n\n.icon-svg_wine_glass:before {\n  content: \"\\E01D\"; }\n\nhtml, body {\n  position: fixed;\n  overflow: hidden;\n  margin: 0px;\n  width: 100%;\n  height: 100%;\n  background-color: white;\n  /* font-family: \"Roboto\";\n\tfont-size: 24px;\n\tfont-weight: 300; */\n  -webkit-touch-callout: none;\n  -webkit-tap-highlight-color: transparent; }\n\n#iOSTap {\n  position: absolute;\n  left: 0px;\n  top: 0px;\n  width: 100%;\n  height: 100%;\n  z-index: 10000;\n  background-color: white; }\n", ""]);
	
	// exports


/***/ }),
/* 18 */
/*!*****************************!*\
  !*** ./app/mic/Waveform.js ***!
  \*****************************/
/***/ (function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;/**
	 * Copyright 2016 Google Inc.
	 *
	 * Licensed under the Apache License, Version 2.0 (the "License");
	 * you may not use this file except in compliance with the License.
	 * You may obtain a copy of the License at
	 *
	 *     http://www.apache.org/licenses/LICENSE-2.0
	 *
	 * Unless required by applicable law or agreed to in writing, software
	 * distributed under the License is distributed on an "AS IS" BASIS,
	 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
	 * See the License for the specific language governing permissions and
	 * limitations under the License.
	 */
	
	!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__(/*! jquery */ 4), __webpack_require__(/*! waveform.scss */ 19), __webpack_require__(/*! util/MathUtils */ 3), __webpack_require__(/*! tween.js */ 21), __webpack_require__(/*! mic/Amplitude */ 23)], __WEBPACK_AMD_DEFINE_RESULT__ = function ($, waveformStyle, MathUtils, TWEEN, Amplitude) {
	
		var Waveform = function(container, recorder){
	
			this._container = $("<div>", {
				"id" : "WaveformContainer"
			}).appendTo(container);
	
			this._canvas = $("<canvas>", {
				"id" : "Waveform"
			}).appendTo(this._container);
	
			this._context = this._canvas.get(0).getContext("2d");
	
			this._rotation = 0;
	
			this._radius = 1;
	
			this._recorder = recorder;
	
			this._buffer = recorder.audioBuffer;
	
			this._resize();
			$(window).on("resize", this._resize.bind(this));
	
			this._boundDraw = this.draw.bind(this);
			this.draw();
		};
	
		Waveform.prototype.setRotation = function(rot){
			this._rotation = rot - Math.PI / 2;
		};
	
		Waveform.prototype.animateIn = function(delay){
			
		};
	
		Waveform.prototype._resize = function(){
			var min = Math.min(this._container.width(), this._container.height());
			this._canvas.width(min);
			this._canvas.height(min);
			this._context.canvas.width = min * 2;
			this._context.canvas.height = min * 2;
	
			this._centerX = min;
			this._centerY = min;
		};
	
		var twoPi = Math.PI * 2;
	
		Waveform.prototype.draw = function(){
			requestAnimationFrame(this._boundDraw);
			TWEEN.update();
	
			if (this._radius === 0){
				return;
			}
	
			var radius = this._centerX * 0.8 * this._radius;
	
			var array = this._buffer.getChannelData(0);				
	
			var context = this._context;
			context.clearRect(0, 0, this._centerX * 2, this._centerY * 2);
	
			context.save();
			context.translate( this._centerX, this._centerY );
			context.rotate( this._rotation );
	
			//drawing
			context.strokeStyle = "#FFB729";
			context.lineCap = "round";
			
			var numSlices = 500;
			var stopPosition = numSlices;
			if (this._recorder.isRecording){
				stopPosition = numSlices * this._recorder.position;
			}
			var chunkSize = array.length / numSlices;
			var maxHeight = this._centerX * 0.2;
			var lastSample = 0;
			context.lineWidth = (this._centerX / numSlices) * 7;
			context.beginPath();
			
			for (var theta = 0; theta < numSlices; theta++){
				if (theta > stopPosition){
					break;
				}
				var radians = (theta / numSlices) * twoPi;
				var amp = Math.abs(array[Math.floor(theta * chunkSize)]);
				amp = Math.pow(amp, 0.5);
				amp = Math.max(lastSample * 0.2, amp);
				lastSample = amp;
				amp *= maxHeight;
				amp = Math.max(amp, 0.01);
				var startPos = MathUtils.pol2cart(radius - amp, -radians);
				var endPos = MathUtils.pol2cart(radius + amp, -radians);
				context.moveTo(startPos[0], startPos[1]);
				context.lineTo(endPos[0], endPos[1]);
			}
			context.stroke();
	
			context.translate( -this._centerX, -this._centerY );
			context.restore();
	
			Amplitude.draw(this._context, this._centerX, this._centerY - radius, maxHeight);
	
		};
	
		return Waveform;
	}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));


/***/ }),
/* 19 */
/*!*****************************!*\
  !*** ./style/waveform.scss ***!
  \*****************************/
/***/ (function(module, exports, __webpack_require__) {

	// style-loader: Adds some css to the DOM by adding a <style> tag
	
	// load the styles
	var content = __webpack_require__(/*! !../~/css-loader!../~/autoprefixer-loader!../~/sass-loader!./waveform.scss */ 20);
	if(typeof content === 'string') content = [[module.id, content, '']];
	// add the styles to the DOM
	var update = __webpack_require__(/*! ../~/style-loader/addStyles.js */ 9)(content, {});
	if(content.locals) module.exports = content.locals;
	// Hot Module Replacement
	if(false) {
		// When the styles change, update the <style> tags
		if(!content.locals) {
			module.hot.accept("!!../node_modules/css-loader/index.js!../node_modules/autoprefixer-loader/index.js!../node_modules/sass-loader/index.js!./waveform.scss", function() {
				var newContent = require("!!../node_modules/css-loader/index.js!../node_modules/autoprefixer-loader/index.js!../node_modules/sass-loader/index.js!./waveform.scss");
				if(typeof newContent === 'string') newContent = [[module.id, newContent, '']];
				update(newContent);
			});
		}
		// When the module is disposed, remove the <style> tags
		module.hot.dispose(function() { update(); });
	}

/***/ }),
/* 20 */
/*!************************************************************************************!*\
  !*** ./~/css-loader!./~/autoprefixer-loader!./~/sass-loader!./style/waveform.scss ***!
  \************************************************************************************/
/***/ (function(module, exports, __webpack_require__) {

	exports = module.exports = __webpack_require__(/*! ../~/css-loader/lib/css-base.js */ 7)();
	// imports
	
	
	// module
	exports.push([module.id, "#WaveformContainer {\n  z-index: 0;\n  width: 100%;\n  height: 100%;\n  position: absolute;\n  top: 50%;\n  left: 50%;\n  transform: translate(-50%, -50%);\n  max-width: 400px;\n  max-height: 400px; }\n  #WaveformContainer #Waveform {\n    width: 100%;\n    height: 100%;\n    top: 50%;\n    left: 50%;\n    transform: translate(-50%, -50%);\n    position: absolute; }\n", ""]);
	
	// exports


/***/ }),
/* 21 */
/*!*********************************!*\
  !*** ./~/tween.js/src/Tween.js ***!
  \*********************************/
/***/ (function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;/* WEBPACK VAR INJECTION */(function(process) {/**
	 * Tween.js - Licensed under the MIT license
	 * https://github.com/tweenjs/tween.js
	 * ----------------------------------------------
	 *
	 * See https://github.com/tweenjs/tween.js/graphs/contributors for the full list of contributors.
	 * Thank you all, you're awesome!
	 */
	
	var TWEEN = TWEEN || (function () {
	
		var _tweens = [];
	
		return {
	
			getAll: function () {
	
				return _tweens;
	
			},
	
			removeAll: function () {
	
				_tweens = [];
	
			},
	
			add: function (tween) {
	
				_tweens.push(tween);
	
			},
	
			remove: function (tween) {
	
				var i = _tweens.indexOf(tween);
	
				if (i !== -1) {
					_tweens.splice(i, 1);
				}
	
			},
	
			update: function (time, preserve) {
	
				if (_tweens.length === 0) {
					return false;
				}
	
				var i = 0;
	
				time = time !== undefined ? time : TWEEN.now();
	
				while (i < _tweens.length) {
	
					if (_tweens[i].update(time) || preserve) {
						i++;
					} else {
						_tweens.splice(i, 1);
					}
	
				}
	
				return true;
	
			}
		};
	
	})();
	
	
	// Include a performance.now polyfill.
	// In node.js, use process.hrtime.
	if (typeof (window) === 'undefined' && typeof (process) !== 'undefined') {
		TWEEN.now = function () {
			var time = process.hrtime();
	
			// Convert [seconds, nanoseconds] to milliseconds.
			return time[0] * 1000 + time[1] / 1000000;
		};
	}
	// In a browser, use window.performance.now if it is available.
	else if (typeof (window) !== 'undefined' &&
	         window.performance !== undefined &&
			 window.performance.now !== undefined) {
		// This must be bound, because directly assigning this function
		// leads to an invocation exception in Chrome.
		TWEEN.now = window.performance.now.bind(window.performance);
	}
	// Use Date.now if it is available.
	else if (Date.now !== undefined) {
		TWEEN.now = Date.now;
	}
	// Otherwise, use 'new Date().getTime()'.
	else {
		TWEEN.now = function () {
			return new Date().getTime();
		};
	}
	
	
	TWEEN.Tween = function (object) {
	
		var _object = object;
		var _valuesStart = {};
		var _valuesEnd = {};
		var _valuesStartRepeat = {};
		var _duration = 1000;
		var _repeat = 0;
		var _repeatDelayTime;
		var _yoyo = false;
		var _isPlaying = false;
		var _reversed = false;
		var _delayTime = 0;
		var _startTime = null;
		var _easingFunction = TWEEN.Easing.Linear.None;
		var _interpolationFunction = TWEEN.Interpolation.Linear;
		var _chainedTweens = [];
		var _onStartCallback = null;
		var _onStartCallbackFired = false;
		var _onUpdateCallback = null;
		var _onCompleteCallback = null;
		var _onStopCallback = null;
	
		this.to = function (properties, duration) {
	
			_valuesEnd = properties;
	
			if (duration !== undefined) {
				_duration = duration;
			}
	
			return this;
	
		};
	
		this.start = function (time) {
	
			TWEEN.add(this);
	
			_isPlaying = true;
	
			_onStartCallbackFired = false;
	
			_startTime = time !== undefined ? time : TWEEN.now();
			_startTime += _delayTime;
	
			for (var property in _valuesEnd) {
	
				// Check if an Array was provided as property value
				if (_valuesEnd[property] instanceof Array) {
	
					if (_valuesEnd[property].length === 0) {
						continue;
					}
	
					// Create a local copy of the Array with the start value at the front
					_valuesEnd[property] = [_object[property]].concat(_valuesEnd[property]);
	
				}
	
				// If `to()` specifies a property that doesn't exist in the source object,
				// we should not set that property in the object
				if (_object[property] === undefined) {
					continue;
				}
	
				// Save the starting value.
				_valuesStart[property] = _object[property];
	
				if ((_valuesStart[property] instanceof Array) === false) {
					_valuesStart[property] *= 1.0; // Ensures we're using numbers, not strings
				}
	
				_valuesStartRepeat[property] = _valuesStart[property] || 0;
	
			}
	
			return this;
	
		};
	
		this.stop = function () {
	
			if (!_isPlaying) {
				return this;
			}
	
			TWEEN.remove(this);
			_isPlaying = false;
	
			if (_onStopCallback !== null) {
				_onStopCallback.call(_object, _object);
			}
	
			this.stopChainedTweens();
			return this;
	
		};
	
		this.end = function () {
	
			this.update(_startTime + _duration);
			return this;
	
		};
	
		this.stopChainedTweens = function () {
	
			for (var i = 0, numChainedTweens = _chainedTweens.length; i < numChainedTweens; i++) {
				_chainedTweens[i].stop();
			}
	
		};
	
		this.delay = function (amount) {
	
			_delayTime = amount;
			return this;
	
		};
	
		this.repeat = function (times) {
	
			_repeat = times;
			return this;
	
		};
	
		this.repeatDelay = function (amount) {
	
			_repeatDelayTime = amount;
			return this;
	
		};
	
		this.yoyo = function (yoyo) {
	
			_yoyo = yoyo;
			return this;
	
		};
	
	
		this.easing = function (easing) {
	
			_easingFunction = easing;
			return this;
	
		};
	
		this.interpolation = function (interpolation) {
	
			_interpolationFunction = interpolation;
			return this;
	
		};
	
		this.chain = function () {
	
			_chainedTweens = arguments;
			return this;
	
		};
	
		this.onStart = function (callback) {
	
			_onStartCallback = callback;
			return this;
	
		};
	
		this.onUpdate = function (callback) {
	
			_onUpdateCallback = callback;
			return this;
	
		};
	
		this.onComplete = function (callback) {
	
			_onCompleteCallback = callback;
			return this;
	
		};
	
		this.onStop = function (callback) {
	
			_onStopCallback = callback;
			return this;
	
		};
	
		this.update = function (time) {
	
			var property;
			var elapsed;
			var value;
	
			if (time < _startTime) {
				return true;
			}
	
			if (_onStartCallbackFired === false) {
	
				if (_onStartCallback !== null) {
					_onStartCallback.call(_object, _object);
				}
	
				_onStartCallbackFired = true;
			}
	
			elapsed = (time - _startTime) / _duration;
			elapsed = elapsed > 1 ? 1 : elapsed;
	
			value = _easingFunction(elapsed);
	
			for (property in _valuesEnd) {
	
				// Don't update properties that do not exist in the source object
				if (_valuesStart[property] === undefined) {
					continue;
				}
	
				var start = _valuesStart[property] || 0;
				var end = _valuesEnd[property];
	
				if (end instanceof Array) {
	
					_object[property] = _interpolationFunction(end, value);
	
				} else {
	
					// Parses relative end values with start as base (e.g.: +10, -3)
					if (typeof (end) === 'string') {
	
						if (end.charAt(0) === '+' || end.charAt(0) === '-') {
							end = start + parseFloat(end);
						} else {
							end = parseFloat(end);
						}
					}
	
					// Protect against non numeric properties.
					if (typeof (end) === 'number') {
						_object[property] = start + (end - start) * value;
					}
	
				}
	
			}
	
			if (_onUpdateCallback !== null) {
				_onUpdateCallback.call(_object, value);
			}
	
			if (elapsed === 1) {
	
				if (_repeat > 0) {
	
					if (isFinite(_repeat)) {
						_repeat--;
					}
	
					// Reassign starting values, restart by making startTime = now
					for (property in _valuesStartRepeat) {
	
						if (typeof (_valuesEnd[property]) === 'string') {
							_valuesStartRepeat[property] = _valuesStartRepeat[property] + parseFloat(_valuesEnd[property]);
						}
	
						if (_yoyo) {
							var tmp = _valuesStartRepeat[property];
	
							_valuesStartRepeat[property] = _valuesEnd[property];
							_valuesEnd[property] = tmp;
						}
	
						_valuesStart[property] = _valuesStartRepeat[property];
	
					}
	
					if (_yoyo) {
						_reversed = !_reversed;
					}
	
					if (_repeatDelayTime !== undefined) {
						_startTime = time + _repeatDelayTime;
					} else {
						_startTime = time + _delayTime;
					}
	
					return true;
	
				} else {
	
					if (_onCompleteCallback !== null) {
	
						_onCompleteCallback.call(_object, _object);
					}
	
					for (var i = 0, numChainedTweens = _chainedTweens.length; i < numChainedTweens; i++) {
						// Make the chained tweens start exactly at the time they should,
						// even if the `update()` method was called way past the duration of the tween
						_chainedTweens[i].start(_startTime + _duration);
					}
	
					return false;
	
				}
	
			}
	
			return true;
	
		};
	
	};
	
	
	TWEEN.Easing = {
	
		Linear: {
	
			None: function (k) {
	
				return k;
	
			}
	
		},
	
		Quadratic: {
	
			In: function (k) {
	
				return k * k;
	
			},
	
			Out: function (k) {
	
				return k * (2 - k);
	
			},
	
			InOut: function (k) {
	
				if ((k *= 2) < 1) {
					return 0.5 * k * k;
				}
	
				return - 0.5 * (--k * (k - 2) - 1);
	
			}
	
		},
	
		Cubic: {
	
			In: function (k) {
	
				return k * k * k;
	
			},
	
			Out: function (k) {
	
				return --k * k * k + 1;
	
			},
	
			InOut: function (k) {
	
				if ((k *= 2) < 1) {
					return 0.5 * k * k * k;
				}
	
				return 0.5 * ((k -= 2) * k * k + 2);
	
			}
	
		},
	
		Quartic: {
	
			In: function (k) {
	
				return k * k * k * k;
	
			},
	
			Out: function (k) {
	
				return 1 - (--k * k * k * k);
	
			},
	
			InOut: function (k) {
	
				if ((k *= 2) < 1) {
					return 0.5 * k * k * k * k;
				}
	
				return - 0.5 * ((k -= 2) * k * k * k - 2);
	
			}
	
		},
	
		Quintic: {
	
			In: function (k) {
	
				return k * k * k * k * k;
	
			},
	
			Out: function (k) {
	
				return --k * k * k * k * k + 1;
	
			},
	
			InOut: function (k) {
	
				if ((k *= 2) < 1) {
					return 0.5 * k * k * k * k * k;
				}
	
				return 0.5 * ((k -= 2) * k * k * k * k + 2);
	
			}
	
		},
	
		Sinusoidal: {
	
			In: function (k) {
	
				return 1 - Math.cos(k * Math.PI / 2);
	
			},
	
			Out: function (k) {
	
				return Math.sin(k * Math.PI / 2);
	
			},
	
			InOut: function (k) {
	
				return 0.5 * (1 - Math.cos(Math.PI * k));
	
			}
	
		},
	
		Exponential: {
	
			In: function (k) {
	
				return k === 0 ? 0 : Math.pow(1024, k - 1);
	
			},
	
			Out: function (k) {
	
				return k === 1 ? 1 : 1 - Math.pow(2, - 10 * k);
	
			},
	
			InOut: function (k) {
	
				if (k === 0) {
					return 0;
				}
	
				if (k === 1) {
					return 1;
				}
	
				if ((k *= 2) < 1) {
					return 0.5 * Math.pow(1024, k - 1);
				}
	
				return 0.5 * (- Math.pow(2, - 10 * (k - 1)) + 2);
	
			}
	
		},
	
		Circular: {
	
			In: function (k) {
	
				return 1 - Math.sqrt(1 - k * k);
	
			},
	
			Out: function (k) {
	
				return Math.sqrt(1 - (--k * k));
	
			},
	
			InOut: function (k) {
	
				if ((k *= 2) < 1) {
					return - 0.5 * (Math.sqrt(1 - k * k) - 1);
				}
	
				return 0.5 * (Math.sqrt(1 - (k -= 2) * k) + 1);
	
			}
	
		},
	
		Elastic: {
	
			In: function (k) {
	
				if (k === 0) {
					return 0;
				}
	
				if (k === 1) {
					return 1;
				}
	
				return -Math.pow(2, 10 * (k - 1)) * Math.sin((k - 1.1) * 5 * Math.PI);
	
			},
	
			Out: function (k) {
	
				if (k === 0) {
					return 0;
				}
	
				if (k === 1) {
					return 1;
				}
	
				return Math.pow(2, -10 * k) * Math.sin((k - 0.1) * 5 * Math.PI) + 1;
	
			},
	
			InOut: function (k) {
	
				if (k === 0) {
					return 0;
				}
	
				if (k === 1) {
					return 1;
				}
	
				k *= 2;
	
				if (k < 1) {
					return -0.5 * Math.pow(2, 10 * (k - 1)) * Math.sin((k - 1.1) * 5 * Math.PI);
				}
	
				return 0.5 * Math.pow(2, -10 * (k - 1)) * Math.sin((k - 1.1) * 5 * Math.PI) + 1;
	
			}
	
		},
	
		Back: {
	
			In: function (k) {
	
				var s = 1.70158;
	
				return k * k * ((s + 1) * k - s);
	
			},
	
			Out: function (k) {
	
				var s = 1.70158;
	
				return --k * k * ((s + 1) * k + s) + 1;
	
			},
	
			InOut: function (k) {
	
				var s = 1.70158 * 1.525;
	
				if ((k *= 2) < 1) {
					return 0.5 * (k * k * ((s + 1) * k - s));
				}
	
				return 0.5 * ((k -= 2) * k * ((s + 1) * k + s) + 2);
	
			}
	
		},
	
		Bounce: {
	
			In: function (k) {
	
				return 1 - TWEEN.Easing.Bounce.Out(1 - k);
	
			},
	
			Out: function (k) {
	
				if (k < (1 / 2.75)) {
					return 7.5625 * k * k;
				} else if (k < (2 / 2.75)) {
					return 7.5625 * (k -= (1.5 / 2.75)) * k + 0.75;
				} else if (k < (2.5 / 2.75)) {
					return 7.5625 * (k -= (2.25 / 2.75)) * k + 0.9375;
				} else {
					return 7.5625 * (k -= (2.625 / 2.75)) * k + 0.984375;
				}
	
			},
	
			InOut: function (k) {
	
				if (k < 0.5) {
					return TWEEN.Easing.Bounce.In(k * 2) * 0.5;
				}
	
				return TWEEN.Easing.Bounce.Out(k * 2 - 1) * 0.5 + 0.5;
	
			}
	
		}
	
	};
	
	TWEEN.Interpolation = {
	
		Linear: function (v, k) {
	
			var m = v.length - 1;
			var f = m * k;
			var i = Math.floor(f);
			var fn = TWEEN.Interpolation.Utils.Linear;
	
			if (k < 0) {
				return fn(v[0], v[1], f);
			}
	
			if (k > 1) {
				return fn(v[m], v[m - 1], m - f);
			}
	
			return fn(v[i], v[i + 1 > m ? m : i + 1], f - i);
	
		},
	
		Bezier: function (v, k) {
	
			var b = 0;
			var n = v.length - 1;
			var pw = Math.pow;
			var bn = TWEEN.Interpolation.Utils.Bernstein;
	
			for (var i = 0; i <= n; i++) {
				b += pw(1 - k, n - i) * pw(k, i) * v[i] * bn(n, i);
			}
	
			return b;
	
		},
	
		CatmullRom: function (v, k) {
	
			var m = v.length - 1;
			var f = m * k;
			var i = Math.floor(f);
			var fn = TWEEN.Interpolation.Utils.CatmullRom;
	
			if (v[0] === v[m]) {
	
				if (k < 0) {
					i = Math.floor(f = m * (1 + k));
				}
	
				return fn(v[(i - 1 + m) % m], v[i], v[(i + 1) % m], v[(i + 2) % m], f - i);
	
			} else {
	
				if (k < 0) {
					return v[0] - (fn(v[0], v[0], v[1], v[1], -f) - v[0]);
				}
	
				if (k > 1) {
					return v[m] - (fn(v[m], v[m], v[m - 1], v[m - 1], f - m) - v[m]);
				}
	
				return fn(v[i ? i - 1 : 0], v[i], v[m < i + 1 ? m : i + 1], v[m < i + 2 ? m : i + 2], f - i);
	
			}
	
		},
	
		Utils: {
	
			Linear: function (p0, p1, t) {
	
				return (p1 - p0) * t + p0;
	
			},
	
			Bernstein: function (n, i) {
	
				var fc = TWEEN.Interpolation.Utils.Factorial;
	
				return fc(n) / fc(i) / fc(n - i);
	
			},
	
			Factorial: (function () {
	
				var a = [1];
	
				return function (n) {
	
					var s = 1;
	
					if (a[n]) {
						return a[n];
					}
	
					for (var i = n; i > 1; i--) {
						s *= i;
					}
	
					a[n] = s;
					return s;
	
				};
	
			})(),
	
			CatmullRom: function (p0, p1, p2, p3, t) {
	
				var v0 = (p2 - p0) * 0.5;
				var v1 = (p3 - p1) * 0.5;
				var t2 = t * t;
				var t3 = t * t2;
	
				return (2 * p1 - 2 * p2 + v0 + v1) * t3 + (- 3 * p1 + 3 * p2 - 2 * v0 - v1) * t2 + v0 * t + p1;
	
			}
	
		}
	
	};
	
	// UMD (Universal Module Definition)
	(function (root) {
	
		if (true) {
	
			// AMD
			!(__WEBPACK_AMD_DEFINE_ARRAY__ = [], __WEBPACK_AMD_DEFINE_RESULT__ = function () {
				return TWEEN;
			}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
	
		} else if (typeof module !== 'undefined' && typeof exports === 'object') {
	
			// Node.js
			module.exports = TWEEN;
	
		} else if (root !== undefined) {
	
			// Global variable
			root.TWEEN = TWEEN;
	
		}
	
	})(this);
	
	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(/*! ./../../process/browser.js */ 22)))

/***/ }),
/* 22 */
/*!******************************!*\
  !*** ./~/process/browser.js ***!
  \******************************/
/***/ (function(module, exports) {

	// shim for using process in browser
	var process = module.exports = {};
	
	// cached from whatever global is present so that test runners that stub it
	// don't break things.  But we need to wrap it in a try catch in case it is
	// wrapped in strict mode code which doesn't define any globals.  It's inside a
	// function because try/catches deoptimize in certain engines.
	
	var cachedSetTimeout;
	var cachedClearTimeout;
	
	function defaultSetTimout() {
	    throw new Error('setTimeout has not been defined');
	}
	function defaultClearTimeout () {
	    throw new Error('clearTimeout has not been defined');
	}
	(function () {
	    try {
	        if (typeof setTimeout === 'function') {
	            cachedSetTimeout = setTimeout;
	        } else {
	            cachedSetTimeout = defaultSetTimout;
	        }
	    } catch (e) {
	        cachedSetTimeout = defaultSetTimout;
	    }
	    try {
	        if (typeof clearTimeout === 'function') {
	            cachedClearTimeout = clearTimeout;
	        } else {
	            cachedClearTimeout = defaultClearTimeout;
	        }
	    } catch (e) {
	        cachedClearTimeout = defaultClearTimeout;
	    }
	} ())
	function runTimeout(fun) {
	    if (cachedSetTimeout === setTimeout) {
	        //normal enviroments in sane situations
	        return setTimeout(fun, 0);
	    }
	    // if setTimeout wasn't available but was latter defined
	    if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
	        cachedSetTimeout = setTimeout;
	        return setTimeout(fun, 0);
	    }
	    try {
	        // when when somebody has screwed with setTimeout but no I.E. maddness
	        return cachedSetTimeout(fun, 0);
	    } catch(e){
	        try {
	            // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
	            return cachedSetTimeout.call(null, fun, 0);
	        } catch(e){
	            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
	            return cachedSetTimeout.call(this, fun, 0);
	        }
	    }
	
	
	}
	function runClearTimeout(marker) {
	    if (cachedClearTimeout === clearTimeout) {
	        //normal enviroments in sane situations
	        return clearTimeout(marker);
	    }
	    // if clearTimeout wasn't available but was latter defined
	    if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
	        cachedClearTimeout = clearTimeout;
	        return clearTimeout(marker);
	    }
	    try {
	        // when when somebody has screwed with setTimeout but no I.E. maddness
	        return cachedClearTimeout(marker);
	    } catch (e){
	        try {
	            // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
	            return cachedClearTimeout.call(null, marker);
	        } catch (e){
	            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
	            // Some versions of I.E. have different rules for clearTimeout vs setTimeout
	            return cachedClearTimeout.call(this, marker);
	        }
	    }
	
	
	
	}
	var queue = [];
	var draining = false;
	var currentQueue;
	var queueIndex = -1;
	
	function cleanUpNextTick() {
	    if (!draining || !currentQueue) {
	        return;
	    }
	    draining = false;
	    if (currentQueue.length) {
	        queue = currentQueue.concat(queue);
	    } else {
	        queueIndex = -1;
	    }
	    if (queue.length) {
	        drainQueue();
	    }
	}
	
	function drainQueue() {
	    if (draining) {
	        return;
	    }
	    var timeout = runTimeout(cleanUpNextTick);
	    draining = true;
	
	    var len = queue.length;
	    while(len) {
	        currentQueue = queue;
	        queue = [];
	        while (++queueIndex < len) {
	            if (currentQueue) {
	                currentQueue[queueIndex].run();
	            }
	        }
	        queueIndex = -1;
	        len = queue.length;
	    }
	    currentQueue = null;
	    draining = false;
	    runClearTimeout(timeout);
	}
	
	process.nextTick = function (fun) {
	    var args = new Array(arguments.length - 1);
	    if (arguments.length > 1) {
	        for (var i = 1; i < arguments.length; i++) {
	            args[i - 1] = arguments[i];
	        }
	    }
	    queue.push(new Item(fun, args));
	    if (queue.length === 1 && !draining) {
	        runTimeout(drainQueue);
	    }
	};
	
	// v8 likes predictible objects
	function Item(fun, array) {
	    this.fun = fun;
	    this.array = array;
	}
	Item.prototype.run = function () {
	    this.fun.apply(null, this.array);
	};
	process.title = 'browser';
	process.browser = true;
	process.env = {};
	process.argv = [];
	process.version = ''; // empty string to avoid regexp issues
	process.versions = {};
	
	function noop() {}
	
	process.on = noop;
	process.addListener = noop;
	process.once = noop;
	process.off = noop;
	process.removeListener = noop;
	process.removeAllListeners = noop;
	process.emit = noop;
	process.prependListener = noop;
	process.prependOnceListener = noop;
	
	process.listeners = function (name) { return [] }
	
	process.binding = function (name) {
	    throw new Error('process.binding is not supported');
	};
	
	process.cwd = function () { return '/' };
	process.chdir = function (dir) {
	    throw new Error('process.chdir is not supported');
	};
	process.umask = function() { return 0; };


/***/ }),
/* 23 */
/*!******************************!*\
  !*** ./app/mic/Amplitude.js ***!
  \******************************/
/***/ (function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_RESULT__;/**
	 * Copyright 2016 Google Inc.
	 *
	 * Licensed under the Apache License, Version 2.0 (the "License");
	 * you may not use this file except in compliance with the License.
	 * You may obtain a copy of the License at
	 *
	 *     http://www.apache.org/licenses/LICENSE-2.0
	 *
	 * Unless required by applicable law or agreed to in writing, software
	 * distributed under the License is distributed on an "AS IS" BASIS,
	 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
	 * See the License for the specific language governing permissions and
	 * limitations under the License.
	 */
	
	!(__WEBPACK_AMD_DEFINE_RESULT__ = function () {
	
		var Amplitude = function(){
			this._level = 0;
		};
	
		Amplitude.prototype.draw = function(context, centerX, centerY, height){
			// context.lineTo
			context.strokeStyle = "rgb(214, 110, 28)";
			context.lineCap = "square";
	
			var lineSize = Math.pow(this._level, 0.5) * height + height * 0.6;
			lineSize = Math.min(lineSize, height);
	
			context.beginPath();
			context.lineWidth = 10;
			context.moveTo(centerX, centerY - lineSize);
			context.lineTo(centerX, centerY + lineSize);
			context.stroke();
		};
	
		Amplitude.prototype.setRMS = function(rms){
			this._level = Math.max(rms, this._level * 0.3);
		};
	
		return new Amplitude();
	}.call(exports, __webpack_require__, exports, module), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));


/***/ }),
/* 24 */
/*!*****************************!*\
  !*** ./app/mic/Recorder.js ***!
  \*****************************/
/***/ (function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;/**
	 * Copyright 2016 Google Inc.
	 *
	 * Licensed under the Apache License, Version 2.0 (the "License");
	 * you may not use this file except in compliance with the License.
	 * You may obtain a copy of the License at
	 *
	 *     http://www.apache.org/licenses/LICENSE-2.0
	 *
	 * Unless required by applicable law or agreed to in writing, software
	 * distributed under the License is distributed on an "AS IS" BASIS,
	 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
	 * See the License for the specific language governing permissions and
	 * limitations under the License.
	 */
	
	!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__(/*! Tone/source/Microphone */ 25), __webpack_require__(/*! Tone/core/Tone */ 26)], __WEBPACK_AMD_DEFINE_RESULT__ = function (Microphone, Tone) {
	
		/**
		 *  the recorder
		 */
		var Recorder = function(bufferDuration){
	
			/**
			 *  the mic input
			 *  @type  {Tone.Microphone}
			 */
			this.mic = new Microphone();
	
			/** 
			 *  @private
			 *  @type {ScriptProcessorNode}
			 */
			this.jsNode = Tone.context.createScriptProcessor(4096, 1, 1);
			//so it doesn't get garbage collected
			this.jsNode.noGC();
	
			this.mic.connect(this.jsNode);
	
			/**
			 *  The buffer to record into
			 */
			this.audioBuffer = Tone.context.createBuffer(1, Tone.context.sampleRate * bufferDuration, Tone.context.sampleRate);
	
			/**
			 *  the array to record into
			 */
			this.bufferArray = this.audioBuffer.getChannelData(0);
	
			/**
			 *  the position of the recording head within the buffer
			 */
			this.bufferPosition = 0;
	
			/**
			 * the normalized position of the recording head
			 */
			this.position = 0;
	
			/**
			 *  if it's recording or not
			 */
			this.isRecording = false;
	
			/**
			 * the duraiton
			 */
			this._bufferDuration = bufferDuration;
	
			 /**
			  *  the callback when it's done recording
			  */
			 this.onended = Tone.noOp;
		};
	
		/**
		 *  start the microphone
		 */
		Recorder.prototype.open = function(callback, err) {
			this.jsNode.onaudioprocess = this._onprocess.bind(this);
			this.mic.open(callback, err);
		};
	
		/**
		 *  record the input
		 */
		Recorder.prototype.start = function() {
			//0 out the buffer
			for (var i = 0; i < this.bufferArray.length; i++){
				this.bufferArray[i] = 0;
			}
			this.bufferPosition = 0;
			this.isRecording = true;
			this.mic.start();
		};
	
		/**
		 *  stop recording
		 */
		Recorder.prototype.stop = function() {
			//blank callback
			this.mic.close();
			this.jsNode.onaudioprocess = function(){};
			this.isRecording = false;
		};
	
		/**
		 *  the audio process event
		 */
		Recorder.prototype._onprocess = function(event){
			//meter the input
			var bufferSize = this.jsNode.bufferSize;
			// var smoothing = 0.3;
			var input = event.inputBuffer.getChannelData(0);
			var x;
			var recordBufferLen = this.bufferArray.length;
			for (var i = 0; i < bufferSize; i++){
				x = input[i];
		    	// sum += x * x;
				//if it's recording, fill the record buffer
				if (this.isRecording){
					if (this.bufferPosition < recordBufferLen){
						this.bufferArray[this.bufferPosition] = x;
						this.bufferPosition++;
					} else {
						this.stop();
						//get out of the audio thread
						setTimeout(this.onended.bind(this), 5);
					}
				}
			}
			this.position = this.bufferPosition / recordBufferLen;
			// var rms = Math.sqrt(sum / bufferSize);
			// this.meter = Math.max(rms, this.meter * smoothing);
		};
	
		Recorder.prototype.setBuffer = function(buffer){
			var targetArray = this.audioBuffer.getChannelData(0);
			var copyArray = buffer.getChannelData(0);
			for (var i = 0; i < copyArray.length; i++){
				targetArray[i] = copyArray[i];
			}
		};
	
		return Recorder;
	}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));

/***/ }),
/* 25 */
/*!*******************************************************!*\
  !*** ./third_party/Tone.js/Tone/source/Microphone.js ***!
  \*******************************************************/
/***/ (function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__(/*! Tone/core/Tone */ 26), __webpack_require__(/*! Tone/source/ExternalInput */ 27)], __WEBPACK_AMD_DEFINE_RESULT__ = function(Tone){
	
		"use strict";
	
		/**
		 *  @class  Opens up the default source (typically the microphone).
		 *
		 *  @constructor
		 *  @extends {Tone.ExternalInput}
		 *  @example
		 *  //mic will feedback if played through master
		 *  var mic = new Tone.Microphone();
		 *  mic.open(function(){
		 *  	//start the mic at ten seconds
		 *  	mic.start(10);
		 *  });
		 *  //stop the mic
		 *  mic.stop(20);
		 */
		Tone.Microphone = function(){
	
			Tone.ExternalInput.call(this, 0);
	
		};
	
		Tone.extend(Tone.Microphone, Tone.ExternalInput);
	
		/**
		 *  If getUserMedia is supported by the browser.
		 *  @type  {Boolean}
		 *  @memberOf Tone.Microphone#
		 *  @name supported
		 *  @static
		 *  @readOnly
		 */
		Object.defineProperty(Tone.Microphone, "supported", {
			get : function(){
				return Tone.ExternalInput.supported;
			}
		});
	
		return Tone.Microphone;
	}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));

/***/ }),
/* 26 */
/*!***********************************************!*\
  !*** ./third_party/Tone.js/Tone/core/Tone.js ***!
  \***********************************************/
/***/ (function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_RESULT__;/**
	 *  Tone.js
	 *  @author Yotam Mann
	 *  @license http://opensource.org/licenses/MIT MIT License
	 *  @copyright 2014-2016 Yotam Mann
	 */
	!(__WEBPACK_AMD_DEFINE_RESULT__ = function(){
	
		"use strict";
	
		//////////////////////////////////////////////////////////////////////////
		//	WEB AUDIO CONTEXT
		///////////////////////////////////////////////////////////////////////////
	
		//borrowed from underscore.js
		function isUndef(val){
			return val === void 0;
		}
	
		//borrowed from underscore.js
		function isFunction(val){
			return typeof val === "function";
		}
	
		var audioContext;
	
		//polyfill for AudioContext and OfflineAudioContext
		if (isUndef(window.AudioContext)){
			window.AudioContext = window.webkitAudioContext;
		} 
		if (isUndef(window.OfflineAudioContext)){
			window.OfflineAudioContext = window.webkitOfflineAudioContext;
		} 
	
		if (!isUndef(AudioContext)){
			audioContext = new AudioContext();
		} else {
			throw new Error("Web Audio is not supported in this browser");
		}
	
		//SHIMS////////////////////////////////////////////////////////////////////
	
		if (!isFunction(AudioContext.prototype.createGain)){
			AudioContext.prototype.createGain = AudioContext.prototype.createGainNode;
		}
		if (!isFunction(AudioContext.prototype.createDelay)){
			AudioContext.prototype.createDelay = AudioContext.prototype.createDelayNode;
		}
		if (!isFunction(AudioContext.prototype.createPeriodicWave)){
			AudioContext.prototype.createPeriodicWave = AudioContext.prototype.createWaveTable;
		}
		if (!isFunction(AudioBufferSourceNode.prototype.start)){
			AudioBufferSourceNode.prototype.start = AudioBufferSourceNode.prototype.noteGrainOn;
		}
		if (!isFunction(AudioBufferSourceNode.prototype.stop)){
			AudioBufferSourceNode.prototype.stop = AudioBufferSourceNode.prototype.noteOff;
		}
		if (!isFunction(OscillatorNode.prototype.start)){
			OscillatorNode.prototype.start = OscillatorNode.prototype.noteOn;
		}
		if (!isFunction(OscillatorNode.prototype.stop)){
			OscillatorNode.prototype.stop = OscillatorNode.prototype.noteOff;	
		}
		if (!isFunction(OscillatorNode.prototype.setPeriodicWave)){
			OscillatorNode.prototype.setPeriodicWave = OscillatorNode.prototype.setWaveTable;	
		}
		//extend the connect function to include Tones
		AudioNode.prototype._nativeConnect = AudioNode.prototype.connect;
		AudioNode.prototype.connect = function(B, outNum, inNum){
			if (B.input){
				if (Array.isArray(B.input)){
					if (isUndef(inNum)){
						inNum = 0;
					}
					this.connect(B.input[inNum]);
				} else {
					this.connect(B.input, outNum, inNum);
				}
			} else {
				try {
					if (B instanceof AudioNode){
						this._nativeConnect(B, outNum, inNum);
					} else {
						this._nativeConnect(B, outNum);
					}
				} catch (e) {
					throw new Error("error connecting to node: "+B);
				}
			}
		};
	
		///////////////////////////////////////////////////////////////////////////
		//	TONE
		///////////////////////////////////////////////////////////////////////////
	
		/**
		 *  @class  Tone is the base class of all other classes. It provides 
		 *          a lot of methods and functionality to all classes that extend
		 *          it. 
		 *  
		 *  @constructor
		 *  @alias Tone
		 *  @param {number} [inputs=1] the number of input nodes
		 *  @param {number} [outputs=1] the number of output nodes
		 */
		var Tone = function(inputs, outputs){
	
			/**
			 *  the input node(s)
			 *  @type {GainNode|Array}
			 */
			if (isUndef(inputs) || inputs === 1){
				this.input = this.context.createGain();
			} else if (inputs > 1){
				this.input = new Array(inputs);
			}
	
			/**
			 *  the output node(s)
			 *  @type {GainNode|Array}
			 */
			if (isUndef(outputs) || outputs === 1){
				this.output = this.context.createGain();
			} else if (outputs > 1){
				this.output = new Array(inputs);
			}
		};
	
		/**
		 *  Set the parameters at once. Either pass in an
		 *  object mapping parameters to values, or to set a
		 *  single parameter, by passing in a string and value.
		 *  The last argument is an optional ramp time which 
		 *  will ramp any signal values to their destination value
		 *  over the duration of the rampTime.
		 *  @param {Object|string} params
		 *  @param {number=} value
		 *  @param {Time=} rampTime
		 *  @returns {Tone} this
		 *  @example
		 * //set values using an object
		 * filter.set({
		 * 	"frequency" : 300,
		 * 	"type" : highpass
		 * });
		 *  @example
		 * filter.set("type", "highpass");
		 *  @example
		 * //ramp to the value 220 over 3 seconds. 
		 * oscillator.set({
		 * 	"frequency" : 220
		 * }, 3);
		 */
		Tone.prototype.set = function(params, value, rampTime){
			if (this.isObject(params)){
				rampTime = value;
			} else if (this.isString(params)){
				var tmpObj = {};
				tmpObj[params] = value;
				params = tmpObj;
			}
			for (var attr in params){
				value = params[attr];
				var parent = this;
				if (attr.indexOf(".") !== -1){
					var attrSplit = attr.split(".");
					for (var i = 0; i < attrSplit.length - 1; i++){
						parent = parent[attrSplit[i]];
					}
					attr = attrSplit[attrSplit.length - 1];
				}
				var param = parent[attr];
				if (isUndef(param)){
					continue;
				}
				if ((Tone.Signal && param instanceof Tone.Signal) || 
						(Tone.Param && param instanceof Tone.Param)){
					if (param.value !== value){
						if (isUndef(rampTime)){
							param.value = value;
						} else {
							param.rampTo(value, rampTime);
						}
					}
				} else if (param instanceof AudioParam){
					if (param.value !== value){
						param.value = value;
					}				
				} else if (param instanceof Tone){
					param.set(value);
				} else if (param !== value){
					parent[attr] = value;
				}
			}
			return this;
		};
	
		/**
		 *  Get the object's attributes. Given no arguments get
		 *  will return all available object properties and their corresponding
		 *  values. Pass in a single attribute to retrieve or an array
		 *  of attributes. The attribute strings can also include a "."
		 *  to access deeper properties.
		 *  @example
		 * osc.get();
		 * //returns {"type" : "sine", "frequency" : 440, ...etc}
		 *  @example
		 * osc.get("type");
		 * //returns { "type" : "sine"}
		 * @example
		 * //use dot notation to access deep properties
		 * synth.get(["envelope.attack", "envelope.release"]);
		 * //returns {"envelope" : {"attack" : 0.2, "release" : 0.4}}
		 *  @param {Array=|string|undefined} params the parameters to get, otherwise will return 
		 *  					                  all available.
		 *  @returns {Object}
		 */
		Tone.prototype.get = function(params){
			if (isUndef(params)){
				params = this._collectDefaults(this.constructor);
			} else if (this.isString(params)){
				params = [params];
			} 
			var ret = {};
			for (var i = 0; i < params.length; i++){
				var attr = params[i];
				var parent = this;
				var subRet = ret;
				if (attr.indexOf(".") !== -1){
					var attrSplit = attr.split(".");
					for (var j = 0; j < attrSplit.length - 1; j++){
						var subAttr = attrSplit[j];
						subRet[subAttr] = subRet[subAttr] || {};
						subRet = subRet[subAttr];
						parent = parent[subAttr];
					}
					attr = attrSplit[attrSplit.length - 1];
				}
				var param = parent[attr];
				if (this.isObject(params[attr])){
					subRet[attr] = param.get();
				} else if (Tone.Signal && param instanceof Tone.Signal){
					subRet[attr] = param.value;
				} else if (Tone.Param && param instanceof Tone.Param){
					subRet[attr] = param.value;
				} else if (param instanceof AudioParam){
					subRet[attr] = param.value;
				} else if (param instanceof Tone){
					subRet[attr] = param.get();
				} else if (!isFunction(param) && !isUndef(param)){
					subRet[attr] = param;
				} 
			}
			return ret;
		};
	
		/**
		 *  collect all of the default attributes in one
		 *  @private
		 *  @param {function} constr the constructor to find the defaults from
		 *  @return {Array} all of the attributes which belong to the class
		 */
		Tone.prototype._collectDefaults = function(constr){
			var ret = [];
			if (!isUndef(constr.defaults)){
				ret = Object.keys(constr.defaults);
			}
			if (!isUndef(constr._super)){
				var superDefs = this._collectDefaults(constr._super);
				//filter out repeats
				for (var i = 0; i < superDefs.length; i++){
					if (ret.indexOf(superDefs[i]) === -1){
						ret.push(superDefs[i]);
					}
				}
			}
			return ret;
		};
	
		/**
		 *  @returns {string} returns the name of the class as a string
		 */
		Tone.prototype.toString = function(){
			for (var className in Tone){
				var isLetter = className[0].match(/^[A-Z]$/);
				var sameConstructor =  Tone[className] === this.constructor;
				if (isFunction(Tone[className]) && isLetter && sameConstructor){
					return className;
				}
			}
			return "Tone";
		};
	
		///////////////////////////////////////////////////////////////////////////
		//	CLASS VARS
		///////////////////////////////////////////////////////////////////////////
	
		/**
		 *  A static pointer to the audio context accessible as Tone.context. 
		 *  @type {AudioContext}
		 */
		Tone.context = audioContext;
	
		/**
		 *  The audio context.
		 *  @type {AudioContext}
		 */
		Tone.prototype.context = Tone.context;
	
		/**
		 *  the default buffer size
		 *  @type {number}
		 *  @static
		 *  @const
		 */
		Tone.prototype.bufferSize = 2048;
	
		/**
		 *  The delay time of a single frame (128 samples according to the spec). 
		 *  @type {number}
		 *  @static
		 *  @const
		 */
		Tone.prototype.blockTime = 128 / Tone.context.sampleRate;
	
		/**
		 *  The time of a single sample
		 *  @type {number}
		 *  @static
		 *  @const
		 */
		Tone.prototype.sampleTime = 1 / Tone.context.sampleRate;
		
		///////////////////////////////////////////////////////////////////////////
		//	CONNECTIONS
		///////////////////////////////////////////////////////////////////////////
	
		/**
		 *  disconnect and dispose
		 *  @returns {Tone} this
		 */
		Tone.prototype.dispose = function(){
			if (!this.isUndef(this.input)){
				if (this.input instanceof AudioNode){
					this.input.disconnect();
				} 
				this.input = null;
			}
			if (!this.isUndef(this.output)){
				if (this.output instanceof AudioNode){
					this.output.disconnect();
				} 
				this.output = null;
			}
			return this;
		};
	
		/**
		 *  a silent connection to the DesinationNode
		 *  which will ensure that anything connected to it
		 *  will not be garbage collected
		 *  
		 *  @private
		 */
		var _silentNode = null;
	
		/**
		 *  makes a connection to ensure that the node will not be garbage collected
		 *  until 'dispose' is explicitly called
		 *
		 *  use carefully. circumvents JS and WebAudio's normal Garbage Collection behavior
		 *  @returns {Tone} this
		 */
		Tone.prototype.noGC = function(){
			this.output.connect(_silentNode);
			return this;
		};
	
		AudioNode.prototype.noGC = function(){
			this.connect(_silentNode);
			return this;
		};
	
		/**
		 *  connect the output of a ToneNode to an AudioParam, AudioNode, or ToneNode
		 *  @param  {Tone | AudioParam | AudioNode} unit 
		 *  @param {number} [outputNum=0] optionally which output to connect from
		 *  @param {number} [inputNum=0] optionally which input to connect to
		 *  @returns {Tone} this
		 */
		Tone.prototype.connect = function(unit, outputNum, inputNum){
			if (Array.isArray(this.output)){
				outputNum = this.defaultArg(outputNum, 0);
				this.output[outputNum].connect(unit, 0, inputNum);
			} else {
				this.output.connect(unit, outputNum, inputNum);
			}
			return this;
		};
	
		/**
		 *  disconnect the output
		 *  @returns {Tone} this
		 */
		Tone.prototype.disconnect = function(outputNum){
			if (Array.isArray(this.output)){
				outputNum = this.defaultArg(outputNum, 0);
				this.output[outputNum].disconnect();
			} else {
				this.output.disconnect();
			}
			return this;
		};
	
		/**
		 *  connect together all of the arguments in series
		 *  @param {...AudioParam|Tone|AudioNode} nodes
		 *  @returns {Tone} this
		 */
		Tone.prototype.connectSeries = function(){
			if (arguments.length > 1){
				var currentUnit = arguments[0];
				for (var i = 1; i < arguments.length; i++){
					var toUnit = arguments[i];
					currentUnit.connect(toUnit);
					currentUnit = toUnit;
				}
			}
			return this;
		};
	
		/**
		 *  fan out the connection from the first argument to the rest of the arguments
		 *  @param {...AudioParam|Tone|AudioNode} nodes
		 *  @returns {Tone} this
		 */
		Tone.prototype.connectParallel = function(){
			var connectFrom = arguments[0];
			if (arguments.length > 1){
				for (var i = 1; i < arguments.length; i++){
					var connectTo = arguments[i];
					connectFrom.connect(connectTo);
				}
			}
			return this;
		};
	
		/**
		 *  Connect the output of this node to the rest of the nodes in series.
		 *  @example
		 *  //connect a node to an effect, panVol and then to the master output
		 *  node.chain(effect, panVol, Tone.Master);
		 *  @param {...AudioParam|Tone|AudioNode} nodes
		 *  @returns {Tone} this
		 */
		Tone.prototype.chain = function(){
			if (arguments.length > 0){
				var currentUnit = this;
				for (var i = 0; i < arguments.length; i++){
					var toUnit = arguments[i];
					currentUnit.connect(toUnit);
					currentUnit = toUnit;
				}
			}
			return this;
		};
	
		/**
		 *  connect the output of this node to the rest of the nodes in parallel.
		 *  @param {...AudioParam|Tone|AudioNode} nodes
		 *  @returns {Tone} this
		 */
		Tone.prototype.fan = function(){
			if (arguments.length > 0){
				for (var i = 0; i < arguments.length; i++){
					this.connect(arguments[i]);
				}
			}
			return this;
		};
	
		//give native nodes chain and fan methods
		AudioNode.prototype.chain = Tone.prototype.chain;
		AudioNode.prototype.fan = Tone.prototype.fan;
	
		///////////////////////////////////////////////////////////////////////////
		//	UTILITIES / HELPERS / MATHS
		///////////////////////////////////////////////////////////////////////////
	
		/**
		 *  If the `given` parameter is undefined, use the `fallback`. 
		 *  If both `given` and `fallback` are object literals, it will
		 *  return a deep copy which includes all of the parameters from both 
		 *  objects. If a parameter is undefined in given, it will return
		 *  the fallback property. 
		 *  <br><br>
		 *  WARNING: if object is self referential, it will go into an an 
		 *  infinite recursive loop.
		 *  
		 *  @param  {*} given    
		 *  @param  {*} fallback 
		 *  @return {*}          
		 */
		Tone.prototype.defaultArg = function(given, fallback){
			if (this.isObject(given) && this.isObject(fallback)){
				var ret = {};
				//make a deep copy of the given object
				for (var givenProp in given) {
					ret[givenProp] = this.defaultArg(fallback[givenProp], given[givenProp]);
				}
				for (var fallbackProp in fallback) {
					ret[fallbackProp] = this.defaultArg(given[fallbackProp], fallback[fallbackProp]);
				}
				return ret;
			} else {
				return isUndef(given) ? fallback : given;
			}
		};
	
		/**
		 *  returns the args as an options object with given arguments
		 *  mapped to the names provided. 
		 *
		 *  if the args given is an array containing only one object, it is assumed
		 *  that that's already the options object and will just return it. 
		 *  
		 *  @param  {Array} values  the 'arguments' object of the function
		 *  @param  {Array} keys the names of the arguments as they
		 *                                 should appear in the options object
		 *  @param {Object=} defaults optional defaults to mixin to the returned 
		 *                            options object                              
		 *  @return {Object}       the options object with the names mapped to the arguments
		 */
		Tone.prototype.optionsObject = function(values, keys, defaults){
			var options = {};
			if (values.length === 1 && this.isObject(values[0])){
				options = values[0];
			} else {
				for (var i = 0; i < keys.length; i++){
					options[keys[i]] = values[i];
				}
			}
			if (!this.isUndef(defaults)){
				return this.defaultArg(options, defaults);
			} else {
				return options;
			}
		};
	
		///////////////////////////////////////////////////////////////////////////
		// TYPE CHECKING
		///////////////////////////////////////////////////////////////////////////
	
		/**
		 *  test if the arg is undefined
		 *  @param {*} arg the argument to test
		 *  @returns {boolean} true if the arg is undefined
		 *  @function
		 */
		Tone.prototype.isUndef = isUndef;
	
		/**
		 *  test if the arg is a function
		 *  @param {*} arg the argument to test
		 *  @returns {boolean} true if the arg is a function
		 *  @function
		 */
		Tone.prototype.isFunction = isFunction;
	
		/**
		 *  Test if the argument is a number.
		 *  @param {*} arg the argument to test
		 *  @returns {boolean} true if the arg is a number
		 */
		Tone.prototype.isNumber = function(arg){
			return (typeof arg === "number");
		};
	
		/**
		 *  Test if the given argument is an object literal (i.e. `{}`);
		 *  @param {*} arg the argument to test
		 *  @returns {boolean} true if the arg is an object literal.
		 */
		Tone.prototype.isObject = function(arg){
			return (Object.prototype.toString.call(arg) === "[object Object]" && arg.constructor === Object);
		};
	
		/**
		 *  Test if the argument is a boolean.
		 *  @param {*} arg the argument to test
		 *  @returns {boolean} true if the arg is a boolean
		 */
		Tone.prototype.isBoolean = function(arg){
			return (typeof arg === "boolean");
		};
	
		/**
		 *  Test if the argument is an Array
		 *  @param {*} arg the argument to test
		 *  @returns {boolean} true if the arg is an array
		 */
		Tone.prototype.isArray = function(arg){
			return (Array.isArray(arg));
		};
	
		/**
		 *  Test if the argument is a string.
		 *  @param {*} arg the argument to test
		 *  @returns {boolean} true if the arg is a string
		 */
		Tone.prototype.isString = function(arg){
			return (typeof arg === "string");
		};
	
	 	/**
		 *  An empty function.
		 *  @static
		 */
		Tone.noOp = function(){};
	
		/**
		 *  Make the property not writable. Internal use only. 
		 *  @private
		 *  @param  {string}  property  the property to make not writable
		 */
		Tone.prototype._readOnly = function(property){
			if (Array.isArray(property)){
				for (var i = 0; i < property.length; i++){
					this._readOnly(property[i]);
				}
			} else {
				Object.defineProperty(this, property, { 
					writable: false,
					enumerable : true,
				});
			}
		};
	
		/**
		 *  Make an attribute writeable. Interal use only. 
		 *  @private
		 *  @param  {string}  property  the property to make writable
		 */
		Tone.prototype._writable = function(property){
			if (Array.isArray(property)){
				for (var i = 0; i < property.length; i++){
					this._writable(property[i]);
				}
			} else {
				Object.defineProperty(this, property, { 
					writable: true,
				});
			}
		};
	
		/**
		 * Possible play states. 
		 * @enum {string}
		 */
		Tone.State = {
			Started : "started",
			Stopped : "stopped",
			Paused : "paused",
	 	};
	
		///////////////////////////////////////////////////////////////////////////
		// GAIN CONVERSIONS
		///////////////////////////////////////////////////////////////////////////
	
		/**
		 *  Equal power gain scale. Good for cross-fading.
		 *  @param  {NormalRange} percent (0-1)
		 *  @return {Number}         output gain (0-1)
		 */
		Tone.prototype.equalPowerScale = function(percent){
			var piFactor = 0.5 * Math.PI;
			return Math.sin(percent * piFactor);
		};
	
		/**
		 *  Convert decibels into gain.
		 *  @param  {Decibels} db
		 *  @return {Number}   
		 */
		Tone.prototype.dbToGain = function(db) {
			return Math.pow(2, db / 6);
		};
	
		/**
		 *  Convert gain to decibels.
		 *  @param  {Number} gain (0-1)
		 *  @return {Decibels}   
		 */
		Tone.prototype.gainToDb = function(gain) {
			return  20 * (Math.log(gain) / Math.LN10);
		};
	
		///////////////////////////////////////////////////////////////////////////
		//	TIMING
		///////////////////////////////////////////////////////////////////////////
	
		/**
		 *  Return the current time of the AudioContext clock.
		 *  @return {Number} the currentTime from the AudioContext
		 */
		Tone.prototype.now = function(){
			return this.context.currentTime;
		};
	
		/**
		 *  Return the current time of the AudioContext clock.
		 *  @return {Number} the currentTime from the AudioContext
		 *  @static
		 */
		Tone.now = function(){
			return Tone.context.currentTime;
		};
	
		///////////////////////////////////////////////////////////////////////////
		//	INHERITANCE
		///////////////////////////////////////////////////////////////////////////
	
		/**
		 *  have a child inherit all of Tone's (or a parent's) prototype
		 *  to inherit the parent's properties, make sure to call 
		 *  Parent.call(this) in the child's constructor
		 *
		 *  based on closure library's inherit function
		 *
		 *  @static
		 *  @param  {function} 	child  
		 *  @param  {function=} parent (optional) parent to inherit from
		 *                             if no parent is supplied, the child
		 *                             will inherit from Tone
		 */
		Tone.extend = function(child, parent){
			if (isUndef(parent)){
				parent = Tone;
			}
			function TempConstructor(){}
			TempConstructor.prototype = parent.prototype;
			child.prototype = new TempConstructor();
			/** @override */
			child.prototype.constructor = child;
			child._super = parent;
		};
	
		///////////////////////////////////////////////////////////////////////////
		//	CONTEXT
		///////////////////////////////////////////////////////////////////////////
	
		/**
		 *  array of callbacks to be invoked when a new context is added
		 *  @private 
		 *  @private
		 */
		var newContextCallbacks = [];
	
		/**
		 *  invoke this callback when a new context is added
		 *  will be invoked initially with the first context
		 *  @private 
		 *  @static
		 *  @param {function(AudioContext)} callback the callback to be invoked
		 *                                           with the audio context
		 */
		Tone._initAudioContext = function(callback){
			//invoke the callback with the existing AudioContext
			callback(Tone.context);
			//add it to the array
			newContextCallbacks.push(callback);
		};
	
		/**
		 *  Tone automatically creates a context on init, but if you are working
		 *  with other libraries which also create an AudioContext, it can be
		 *  useful to set your own. If you are going to set your own context, 
		 *  be sure to do it at the start of your code, before creating any objects.
		 *  @static
		 *  @param {AudioContext} ctx The new audio context to set
		 */
		Tone.setContext = function(ctx){
			//set the prototypes
			Tone.prototype.context = ctx;
			Tone.context = ctx;
			//invoke all the callbacks
			for (var i = 0; i < newContextCallbacks.length; i++){
				newContextCallbacks[i](ctx);
			}
		};
	
		/**
		 *  Bind this to a touchstart event to start the audio on mobile devices. 
		 *  <br>
		 *  http://stackoverflow.com/questions/12517000/no-sound-on-ios-6-web-audio-api/12569290#12569290
		 *  @static
		 */
		Tone.startMobile = function(){
			var osc = Tone.context.createOscillator();
			var silent = Tone.context.createGain();
			silent.gain.value = 0;
			osc.connect(silent);
			silent.connect(Tone.context.destination);
			var now = Tone.context.currentTime;
			osc.start(now);
			osc.stop(now+1);
		};
	
		//setup the context
		Tone._initAudioContext(function(audioContext){
			//set the blockTime
			Tone.prototype.blockTime = 128 / audioContext.sampleRate;
			Tone.prototype.sampleTime = 1 / audioContext.sampleRate;
			_silentNode = audioContext.createGain();
			_silentNode.gain.value = 0;
			_silentNode.connect(audioContext.destination);
		});
	
		Tone.version = "r7-dev";
	
		console.log("%c * Tone.js " + Tone.version + " * ", "background: #000; color: #fff");
	
		return Tone;
	}.call(exports, __webpack_require__, exports, module), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));


/***/ }),
/* 27 */
/*!**********************************************************!*\
  !*** ./third_party/Tone.js/Tone/source/ExternalInput.js ***!
  \**********************************************************/
/***/ (function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__(/*! Tone/core/Tone */ 26), __webpack_require__(/*! Tone/source/Source */ 28), __webpack_require__(/*! Tone/core/Gain */ 37)], __WEBPACK_AMD_DEFINE_RESULT__ = function(Tone){
	
		"use strict";
	
		//polyfill for getUserMedia
		navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || 
			navigator.mozGetUserMedia || navigator.msGetUserMedia;
	
		/**
		 *  @class  Tone.ExternalInput is a WebRTC Audio Input. Check 
		 *          [Media Stream API Support](https://developer.mozilla.org/en-US/docs/Web/API/MediaStream_API)
		 *          to see which browsers are supported. As of
		 *          writing this, Chrome, Firefox, and Opera 
		 *          support Media Stream. Chrome allows enumeration 
		 *          of the sources, and access to device name over a 
		 *          secure (HTTPS) connection. See [https://simpl.info](https://simpl.info/getusermedia/sources/index.html) 
		 *          vs [http://simple.info](https://simpl.info/getusermedia/sources/index.html) 
		 *          on a Chrome browser for the difference.
		 *         
		 *  @constructor
		 *  @extends {Tone.Source}
		 *  @param {number} [inputNum=0] If multiple inputs are present, select the input number. Chrome only.
		 *  @example
		 * //select the third input
		 * var motu = new Tone.ExternalInput(3);
		 * 
		 * //opening the input asks the user to activate their mic
		 * motu.open(function(){
		 * 	//opening is activates the microphone
		 * 	//starting lets audio through
		 * 	motu.start(10);
		 * });
		 */
	
		Tone.ExternalInput = function(){
	
			var options = this.optionsObject(arguments, ["inputNum"], Tone.ExternalInput.defaults);
			Tone.Source.call(this, options);
	
			/**
			 *  The MediaStreamNode 
			 *  @type {MediaStreamAudioSourceNode}
			 *  @private
			 */
			this._mediaStream = null;
			
			/**
			 *  The media stream created by getUserMedia.
			 *  @type {LocalMediaStream}
			 *  @private
			 */
			this._stream = null;
			
			/**
			 *  The constraints argument for getUserMedia
			 *  @type {Object}
			 *  @private
			 */
			this._constraints = {"audio" : true};
	
			/**
			 *  The input source position in Tone.ExternalInput.sources. 
			 *  Set before ExternalInput.open().
			 *  @type {Number}
			 *  @private
			 */
			this._inputNum = options.inputNum;
	
			/**
			 *  Gates the input signal for start/stop. 
			 *  Initially closed.
			 *  @type {GainNode}
			 *  @private
			 */
			this._gate = new Tone.Gain(0).connect(this.output);
		};
	
		Tone.extend(Tone.ExternalInput, Tone.Source);
	
		/**
		 * the default parameters
		 * @type {Object}
		 */
		Tone.ExternalInput.defaults = {
			"inputNum" : 0
		};
	
		/**
		 * wrapper for getUserMedia function
		 * @param {function} callback
		 * @param {function} error
		 * @private
		 */
		Tone.ExternalInput.prototype._getUserMedia = function(callback, error){
			if (!Tone.ExternalInput.supported){
				error("browser does not support 'getUserMedia'");
			}
			if (Tone.ExternalInput.sources[this._inputNum]){
				this._constraints = {
					audio : {
						optional : [{sourceId: Tone.ExternalInput.sources[this._inputNum].id}]
					}
				};
			}
			navigator.getUserMedia(this._constraints, function(stream){
				this._onStream(stream);
				callback();
			}.bind(this), function(err){
				error(err);
			});
		};
	
		/**
		 * called when the stream is successfully setup
		 * @param  {LocalMediaStream} stream
		 * @private
		 */
		Tone.ExternalInput.prototype._onStream = function(stream){
			if (!this.isFunction(this.context.createMediaStreamSource)){
				throw new Error("browser does not support the 'MediaStreamSourceNode'");
			}
			//can only start a new source if the previous one is closed
			if (!this._stream){
				this._stream = stream;
				//Wrap a MediaStreamSourceNode around the live input stream.
				this._mediaStream = this.context.createMediaStreamSource(stream);
				//Connect the MediaStreamSourceNode to a gate gain node
				this._mediaStream.connect(this._gate);
			} 
		};
	
		/**
		 *  Open the media stream 
		 *  @param  {function=} callback The callback function to 
		 *                       execute when the stream is open
		 *  @param  {function=} error The callback function to execute
		 *                            when the media stream can't open. 
		 *                            This is fired either because the browser
		 *                            doesn't support the media stream,
		 *                            or the user blocked opening the microphone. 
		 *  @return {Tone.ExternalInput} this
		 */
		Tone.ExternalInput.prototype.open = function(callback, error){
			callback = this.defaultArg(callback, Tone.noOp);
			error = this.defaultArg(error, Tone.noOp);
			Tone.ExternalInput.getSources(function(){
				this._getUserMedia(callback, error);
			}.bind(this));
			return this;
		};
	
		/**
		 *  Close the media stream
		 *  @return {Tone.ExternalInput} this
		 */
		Tone.ExternalInput.prototype.close = function(){
			if(this._stream){
				var track = this._stream.getTracks()[this._inputNum];
				if (!this.isUndef(track)){
					track.stop();
				} 
				this._stream = null;
			}
			return this;
		};
	
		/**
		 *  Start the stream
		 *  @private
		 */
		Tone.ExternalInput.prototype._start = function(time){
			time = this.toSeconds(time);
			this._gate.gain.setValueAtTime(1, time);
			return this;
		};
	
		/**
		 *  Stops the stream.
		 *  @private
		 */
		Tone.ExternalInput.prototype._stop = function(time){
			time = this.toSeconds(time);
			this._gate.gain.setValueAtTime(0, time);
			return this;
		};
	
		/**
		 * Clean up.
		 * @return {Tone.ExternalInput} this
		 */
		Tone.ExternalInput.prototype.dispose = function(){
			Tone.Source.prototype.dispose.call(this);
			this.close();
			if (this._mediaStream){
				this._mediaStream.disconnect();
				this._mediaStream = null;
			}
			this._constraints = null;
			this._gate.dispose();
			this._gate = null;
			return this;
		};
	
		///////////////////////////////////////////////////////////////////////////
		// STATIC METHODS
		///////////////////////////////////////////////////////////////////////////
	
		/**
		 * The array of available sources, different depending on whether connection is secure
		 * @type {Array}
		 * @static
		 */
		Tone.ExternalInput.sources = [];
	
		/**
		 * indicates whether browser supports MediaStreamTrack.getSources (i.e. Chrome vs Firefox)
		 * @type {Boolean}
		 * @private
		 */
		Tone.ExternalInput._canGetSources = !Tone.prototype.isUndef(window.MediaStreamTrack) && Tone.prototype.isFunction(MediaStreamTrack.getSources);
	
		/**
		 *  If getUserMedia is supported by the browser.
		 *  @type  {Boolean}
		 *  @memberOf Tone.ExternalInput#
		 *  @name supported
		 *  @static
		 *  @readOnly
		 */
		Object.defineProperty(Tone.ExternalInput, "supported", {
			get : function(){
				return Tone.prototype.isFunction(navigator.getUserMedia);
			}
		});
	
		/**
		 *  Populates the source list. Invokes the callback with an array of 
		 *  possible audio sources.
		 *  @param  {function=} callback Callback to be executed after populating list 
		 *  @return {Tone.ExternalInput} this
		 *  @static
		 *  @example
		 * var soundflower = new Tone.ExternalInput();
		 * Tone.ExternalInput.getSources(selectSoundflower);
		 *
		 * function selectSoundflower(sources){
		 * 	for(var i = 0; i < sources.length; i++){
		 * 		if(sources[i].label === "soundflower"){
		 * 			soundflower.inputNum = i;
		 * 			soundflower.open(function(){
		 * 				soundflower.start();
		 * 			});
		 * 			break;
		 * 		}
		 * 	}
		 * };
		 */
		Tone.ExternalInput.getSources = function(callback){
			if(Tone.ExternalInput.sources.length === 0 && Tone.ExternalInput._canGetSources){
				MediaStreamTrack.getSources(function (media_sources){
					for(var i = 0; i < media_sources.length; i++) {
						if(media_sources[i].kind === "audio"){
							Tone.ExternalInput.sources[i] = media_sources[i];
						}
					}
					callback(Tone.ExternalInput.sources);
				});
			} else {
				callback(Tone.ExternalInput.sources);
			}
			return this;
		};
	
		return Tone.ExternalInput;
	}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));

/***/ }),
/* 28 */
/*!***************************************************!*\
  !*** ./third_party/Tone.js/Tone/source/Source.js ***!
  \***************************************************/
/***/ (function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__(/*! Tone/core/Tone */ 26), __webpack_require__(/*! Tone/core/Transport */ 29), __webpack_require__(/*! Tone/component/Volume */ 42), __webpack_require__(/*! Tone/core/Master */ 43),
		__webpack_require__(/*! Tone/core/Type */ 35), __webpack_require__(/*! Tone/core/TimelineState */ 39), __webpack_require__(/*! Tone/signal/Signal */ 32)], __WEBPACK_AMD_DEFINE_RESULT__ = function(Tone){
	
		"use strict";
		
		/**
		 *  @class  Base class for sources. Sources have start/stop methods
		 *          and the ability to be synced to the 
		 *          start/stop of Tone.Transport. 
		 *
		 *  @constructor
		 *  @extends {Tone}
		 *  @example
		 * //Multiple state change events can be chained together,
		 * //but must be set in the correct order and with ascending times
		 * 
		 * // OK
		 * state.start().stop("+0.2");
		 * // AND
		 * state.start().stop("+0.2").start("+0.4").stop("+0.7")
		 *
		 * // BAD
		 * state.stop("+0.2").start();
		 * // OR
		 * state.start("+0.3").stop("+0.2");
		 * 
		 */	
		Tone.Source = function(options){
			//Sources only have an output and no input
			Tone.call(this);
	
			options = this.defaultArg(options, Tone.Source.defaults);
	
			/**
			 *  The output volume node
			 *  @type  {Tone.Volume}
			 *  @private
			 */
			this._volume = this.output = new Tone.Volume(options.volume);
	
			/**
			 * The volume of the output in decibels.
			 * @type {Decibels}
			 * @signal
			 * @example
			 * source.volume.value = -6;
			 */
			this.volume = this._volume.volume;
			this._readOnly("volume");
	
			/**
			 * 	Keep track of the scheduled state.
			 *  @type {Tone.TimelineState}
			 *  @private
			 */
			this._state = new Tone.TimelineState(Tone.State.Stopped);
	
			/**
			 *  The synced `start` callback function from the transport
			 *  @type {Function}
			 *  @private
			 */
			this._syncStart = function(time, offset){
				time = this.toSeconds(time);
				time += this.toSeconds(this._startDelay);
				this.start(time, offset);
			}.bind(this);
	
			/**
			 *  The synced `stop` callback function from the transport
			 *  @type {Function}
			 *  @private
			 */
			this._syncStop = this.stop.bind(this);
	
			/**
			 *  The offset from the start of the Transport `start`
			 *  @type {Time}
			 *  @private
			 */
			this._startDelay = 0;
	
			//make the output explicitly stereo
			this._volume.output.output.channelCount = 2;
			this._volume.output.output.channelCountMode = "explicit";
		};
	
		Tone.extend(Tone.Source);
	
		/**
		 *  The default parameters
		 *  @static
		 *  @const
		 *  @type {Object}
		 */
		Tone.Source.defaults = {
			"volume" : 0,
		};
	
		/**
		 *  Returns the playback state of the source, either "started" or "stopped".
		 *  @type {Tone.State}
		 *  @readOnly
		 *  @memberOf Tone.Source#
		 *  @name state
		 */
		Object.defineProperty(Tone.Source.prototype, "state", {
			get : function(){
				return this._state.getStateAtTime(this.now());
			}
		});
	
		/**
		 *  Start the source at the specified time. If no time is given, 
		 *  start the source now.
		 *  @param  {Time} [time=now] When the source should be started.
		 *  @returns {Tone.Source} this
		 *  @example
		 * source.start("+0.5"); //starts the source 0.5 seconds from now
		 */
		Tone.Source.prototype.start = function(time){
			time = this.toSeconds(time);
			if (this._state.getStateAtTime(time) !== Tone.State.Started || this.retrigger){
				this._state.setStateAtTime(Tone.State.Started, time);
				if (this._start){
					this._start.apply(this, arguments);
				}
			}
			return this;
		};
	
		/**
		 *  Stop the source at the specified time. If no time is given, 
		 *  stop the source now.
		 *  @param  {Time} [time=now] When the source should be stopped. 
		 *  @returns {Tone.Source} this
		 *  @example
		 * source.stop(); // stops the source immediately
		 */
		Tone.Source.prototype.stop = function(time){
			time = this.toSeconds(time);
			if (this._state.getStateAtTime(time) === Tone.State.Started){
				this._state.setStateAtTime(Tone.State.Stopped, time);
				if (this._stop){
					this._stop.apply(this, arguments);
				}
			}
			return this;
		};
		
		/**
		 *  Sync the source to the Transport so that when the transport
		 *  is started, this source is started and when the transport is stopped
		 *  or paused, so is the source. 
		 *
		 *  @param {Time} [delay=0] Delay time before starting the source after the
		 *                               Transport has started. 
		 *  @returns {Tone.Source} this
		 *  @example
		 * //sync the source to start 1 measure after the transport starts
		 * source.sync("1m");
		 * //start the transport. the source will start 1 measure later. 
		 * Tone.Transport.start();
		 */
		Tone.Source.prototype.sync = function(delay){
			this._startDelay = this.defaultArg(delay, 0);
			Tone.Transport.on("start", this._syncStart);
			Tone.Transport.on("stop pause", this._syncStop);
			return this;
		};
	
		/**
		 *  Unsync the source to the Transport. See Tone.Source.sync
		 *  @returns {Tone.Source} this
		 */
		Tone.Source.prototype.unsync = function(){
			this._startDelay = 0;
			Tone.Transport.off("start", this._syncStart);
			Tone.Transport.off("stop pause", this._syncStop);
			return this;
		};
	
		/**
		 *	Clean up.
		 *  @return {Tone.Source} this
		 */
		Tone.Source.prototype.dispose = function(){
			this.stop();
			Tone.prototype.dispose.call(this);
			this.unsync();
			this._writable("volume");
			this._volume.dispose();
			this._volume = null;
			this.volume = null;
			this._state.dispose();
			this._state = null;
			this._syncStart = null;
			this._syncStart = null;
		};
	
		return Tone.Source;
	}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));

/***/ }),
/* 29 */
/*!****************************************************!*\
  !*** ./third_party/Tone.js/Tone/core/Transport.js ***!
  \****************************************************/
/***/ (function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__(/*! Tone/core/Tone */ 26), __webpack_require__(/*! Tone/core/Clock */ 30), __webpack_require__(/*! Tone/core/Type */ 35), __webpack_require__(/*! Tone/core/Timeline */ 38), 
		__webpack_require__(/*! Tone/core/Emitter */ 40), __webpack_require__(/*! Tone/core/Gain */ 37), __webpack_require__(/*! Tone/core/IntervalTimeline */ 41)], __WEBPACK_AMD_DEFINE_RESULT__ = function(Tone){
	
		"use strict";
	
		/**
		 *  @class  Transport for timing musical events.
		 *          Supports tempo curves and time changes. Unlike browser-based timing (setInterval, requestAnimationFrame)
		 *          Tone.Transport timing events pass in the exact time of the scheduled event
		 *          in the argument of the callback function. Pass that time value to the object
		 *          you're scheduling. <br><br>
		 *          A single transport is created for you when the library is initialized. 
		 *          <br><br>
		 *          The transport emits the events: "start", "stop", "pause", and "loop" which are
		 *          called with the time of that event as the argument. 
		 *
		 *  @extends {Tone.Emitter}
		 *  @singleton
		 *  @example
		 * //repeated event every 8th note
		 * Tone.Transport.setInterval(function(time){
		 * 	//do something with the time
		 * }, "8n");
		 *  @example
		 * //one time event 1 second in the future
		 * Tone.Transport.setTimeout(function(time){
		 * 	//do something with the time
		 * }, 1);
		 *  @example
		 * //event fixed to the Transports timeline. 
		 * Tone.Transport.setTimeline(function(time){
		 * 	//do something with the time
		 * }, "16:0:0");
		 */
		Tone.Transport = function(){
	
			Tone.Emitter.call(this);
	
			///////////////////////////////////////////////////////////////////////
			//	LOOPING
			//////////////////////////////////////////////////////////////////////
	
			/** 
			 * 	If the transport loops or not.
			 *  @type {boolean}
			 */
			this.loop = false;
	
			/** 
			 * 	The loop start position in ticks
			 *  @type {Ticks}
			 *  @private
			 */
			this._loopStart = 0;
	
			/** 
			 * 	The loop end position in ticks
			 *  @type {Ticks}
			 *  @private
			 */
			this._loopEnd = 0;
	
			///////////////////////////////////////////////////////////////////////
			//	CLOCK/TEMPO
			//////////////////////////////////////////////////////////////////////
	
			/**
			 *  Pulses per quarter is the number of ticks per quarter note.
			 *  @private
			 *  @type  {Number}
			 */
			this._ppq = TransportConstructor.defaults.PPQ;
	
			/**
			 *  watches the main oscillator for timing ticks
			 *  initially starts at 120bpm
			 *  @private
			 *  @type {Tone.Clock}
			 */
			this._clock = new Tone.Clock({
				"callback" : this._processTick.bind(this), 
				"frequency" : 0,
			});
			/**
			 *  The Beats Per Minute of the Transport. 
			 *  @type {BPM}
			 *  @signal
			 *  @example
			 * Tone.Transport.bpm.value = 80;
			 * //ramp the bpm to 120 over 10 seconds
			 * Tone.Transport.bpm.rampTo(120, 10);
			 */
			this.bpm = this._clock.frequency;
			this.bpm._toUnits = this._toUnits.bind(this);
			this.bpm._fromUnits = this._fromUnits.bind(this);
			this.bpm.units = Tone.Type.BPM;
			this.bpm.value = TransportConstructor.defaults.bpm;
			this._readOnly("bpm");
	
			/**
			 *  The time signature, or more accurately the numerator
			 *  of the time signature over a denominator of 4. 
			 *  @type {Number}
			 *  @private
			 */
			this._timeSignature = TransportConstructor.defaults.timeSignature;
	
			///////////////////////////////////////////////////////////////////////
			//	TIMELINE EVENTS
			//////////////////////////////////////////////////////////////////////
	
			/**
			 *  All the events in an object to keep track by ID
			 *  @type {Object}
			 *  @private
			 */
			this._scheduledEvents = {};
	
			/**
			 *  The event ID counter
			 *  @type {Number}
			 *  @private
			 */
			this._eventID = 0;
	
			/**
			 * 	The scheduled events.
			 *  @type {Tone.Timeline}
			 *  @private
			 */
			this._timeline = new Tone.Timeline();
	
			/**
			 *  Repeated events
			 *  @type {Array}
			 *  @private
			 */
			this._repeatedEvents = new Tone.IntervalTimeline();
	
			/**
			 *  Events that occur once
			 *  @type {Array}
			 *  @private
			 */
			this._onceEvents = new Tone.Timeline();
	
			/** 
			 *  All of the synced Signals
			 *  @private 
			 *  @type {Array}
			 */
			this._syncedSignals = [];
	
			///////////////////////////////////////////////////////////////////////
			//	SWING
			//////////////////////////////////////////////////////////////////////
	
			var swingSeconds = this.notationToSeconds(TransportConstructor.defaults.swingSubdivision, TransportConstructor.defaults.bpm, TransportConstructor.defaults.timeSignature);
	
			/**
			 *  The subdivision of the swing
			 *  @type  {Ticks}
			 *  @private
			 */
			this._swingTicks = (swingSeconds / (60 / TransportConstructor.defaults.bpm)) * this._ppq;
	
			/**
			 *  The swing amount
			 *  @type {NormalRange}
			 *  @private
			 */
			this._swingAmount = 0;
	
		};
	
		Tone.extend(Tone.Transport, Tone.Emitter);
	
		/**
		 *  the defaults
		 *  @type {Object}
		 *  @const
		 *  @static
		 */
		Tone.Transport.defaults = {
			"bpm" : 120,
			"swing" : 0,
			"swingSubdivision" : "16n",
			"timeSignature" : 4,
			"loopStart" : 0,
			"loopEnd" : "4m",
			"PPQ" : 48
		};
	
		///////////////////////////////////////////////////////////////////////////////
		//	TICKS
		///////////////////////////////////////////////////////////////////////////////
	
		/**
		 *  called on every tick
		 *  @param   {number} tickTime clock relative tick time
		 *  @private
		 */
		Tone.Transport.prototype._processTick = function(tickTime){
			//handle swing
			if (this._swingAmount > 0 && 
				this._clock.ticks % this._ppq !== 0 && //not on a downbeat
				this._clock.ticks % this._swingTicks === 0){
				//add some swing
				tickTime += this.ticksToSeconds(this._swingTicks) * this._swingAmount;
			}
			//do the loop test
			if (this.loop){
				if (this._clock.ticks === this._loopEnd){
					this.ticks = this._loopStart;
					this.trigger("loop", tickTime);
				}
			}
			var ticks = this._clock.ticks;
			//fire the next tick events if their time has come
			this._timeline.forEachAtTime(ticks, function(event){
				event.callback(tickTime);
			});
			//process the repeated events
			this._repeatedEvents.forEachOverlap(ticks, function(event){
				if ((ticks - event.time) % event.interval === 0){
					event.callback(tickTime);
				}
			});
			//process the single occurrence events
			this._onceEvents.forEachBefore(ticks, function(event){
				event.callback(tickTime);
			});
			//and clear the single occurrence timeline
			this._onceEvents.cancelBefore(ticks);
		};
	
		///////////////////////////////////////////////////////////////////////////////
		//	SCHEDULABLE EVENTS
		///////////////////////////////////////////////////////////////////////////////
	
		/**
		 *  Schedule an event along the timeline.
		 *  @param {Function} callback The callback to be invoked at the time.
		 *  @param {Time}  time The time to invoke the callback at.
		 *  @return {Number} The id of the event which can be used for canceling the event. 
		 *  @example
		 * //trigger the callback when the Transport reaches the desired time
		 * Tone.Transport.schedule(function(time){
		 * 	envelope.triggerAttack(time);
		 * }, "128i");
		 */
		Tone.Transport.prototype.schedule = function(callback, time){
			var event = {
				"time" : this.toTicks(time),
				"callback" : callback
			};
			var id = this._eventID++;
			this._scheduledEvents[id.toString()] = {
				"event" : event,
				"timeline" : this._timeline
			};
			this._timeline.addEvent(event);
			return id;
		};
	
		/**
		 *  Schedule a repeated event along the timeline. The event will fire
		 *  at the `interval` starting at the `startTime` and for the specified
		 *  `duration`. 
		 *  @param  {Function}  callback   The callback to invoke.
		 *  @param  {Time}    interval   The duration between successive
		 *                               callbacks.
		 *  @param  {Time=}    startTime  When along the timeline the events should
		 *                               start being invoked.
		 *  @param {Time} [duration=Infinity] How long the event should repeat. 
		 *  @return  {Number}    The ID of the scheduled event. Use this to cancel
		 *                           the event. 
		 *  @example
		 * //a callback invoked every eighth note after the first measure
		 * Tone.Transport.scheduleRepeat(callback, "8n", "1m");
		 */
		Tone.Transport.prototype.scheduleRepeat = function(callback, interval, startTime, duration){
			if (interval <= 0){
				throw new Error("repeat events must have an interval larger than 0");
			}
			var event = {
				"time" : this.toTicks(startTime),
				"duration" : this.toTicks(this.defaultArg(duration, Infinity)),
				"interval" : this.toTicks(interval),
				"callback" : callback
			};
			var id = this._eventID++;
			this._scheduledEvents[id.toString()] = {
				"event" : event,
				"timeline" : this._repeatedEvents
			};
			this._repeatedEvents.addEvent(event);
			return id;
		};
	
		/**
		 *  Schedule an event that will be removed after it is invoked. 
		 *  Note that if the given time is less than the current transport time, 
		 *  the event will be invoked immediately. 
		 *  @param {Function} callback The callback to invoke once.
		 *  @param {Time} time The time the callback should be invoked.
		 *  @returns {Number} The ID of the scheduled event. 
		 */
		Tone.Transport.prototype.scheduleOnce = function(callback, time){
			var event = {
				"time" : this.toTicks(time),
				"callback" : callback
			};
			var id = this._eventID++;
			this._scheduledEvents[id.toString()] = {
				"event" : event,
				"timeline" : this._onceEvents
			};
			this._onceEvents.addEvent(event);
			return id;
		};
	
		/**
		 *  Clear the passed in event id from the timeline
		 *  @param {Number} eventId The id of the event.
		 *  @returns {Tone.Transport} this
		 */
		Tone.Transport.prototype.clear = function(eventId){
			if (this._scheduledEvents.hasOwnProperty(eventId)){
				var item = this._scheduledEvents[eventId.toString()];
				item.timeline.removeEvent(item.event);
				delete this._scheduledEvents[eventId.toString()];
			}
			return this;
		};
	
		/**
		 *  Remove scheduled events from the timeline after
		 *  the given time. Repeated events will be removed
		 *  if their startTime is after the given time
		 *  @param {Time} [after=0] Clear all events after
		 *                          this time. 
		 *  @returns {Tone.Transport} this
		 */
		Tone.Transport.prototype.cancel = function(after){
			after = this.defaultArg(after, 0);
			after = this.toTicks(after);
			this._timeline.cancel(after);
			this._onceEvents.cancel(after);
			this._repeatedEvents.cancel(after);
			return this;
		};
	
		///////////////////////////////////////////////////////////////////////////////
		//	QUANTIZATION
		///////////////////////////////////////////////////////////////////////////////
	
		/**
		 *  Returns the time closest time (equal to or after the given time) that aligns 
		 *  to the subidivision. 
		 *  @param {Time} time The time value to quantize to the given subdivision
		 *  @param  {String} [subdivision="4n"] The subdivision to quantize to.
		 *  @return {Number} 	the time in seconds until the next subdivision.
		 *  @example
		 * Tone.Transport.bpm.value = 120;
		 * Tone.Transport.quantize("3 * 4n", "1m"); //return 0.5
		 * //if the clock is started, it will return a value less than 0.5
		 */
		Tone.Transport.prototype.quantize = function(time, subdivision){
			subdivision = this.defaultArg(subdivision, "4n");
			var tickTime = this.toTicks(time);
			subdivision = this.toTicks(subdivision);
			var remainingTicks = subdivision - (tickTime % subdivision);
			if (remainingTicks === subdivision){
				remainingTicks = 0;
			}
			var now = this.now();
			if (this.state === Tone.State.Started){
				now = this._clock._nextTick;
			}
			return this.toSeconds(time, now) + this.ticksToSeconds(remainingTicks);
		};
	
		///////////////////////////////////////////////////////////////////////////////
		//	START/STOP/PAUSE
		///////////////////////////////////////////////////////////////////////////////
	
		/**
		 *  Returns the playback state of the source, either "started", "stopped", or "paused"
		 *  @type {Tone.State}
		 *  @readOnly
		 *  @memberOf Tone.Transport#
		 *  @name state
		 */
		Object.defineProperty(Tone.Transport.prototype, "state", {
			get : function(){
				return this._clock.getStateAtTime(this.now());
			}
		});
	
		/**
		 *  Start the transport and all sources synced to the transport.
		 *  @param  {Time} [time=now] The time when the transport should start.
		 *  @param  {Time=} offset The timeline offset to start the transport.
		 *  @returns {Tone.Transport} this
		 *  @example
		 * //start the transport in one second starting at beginning of the 5th measure. 
		 * Tone.Transport.start("+1", "4:0:0");
		 */
		Tone.Transport.prototype.start = function(time, offset){
			time = this.toSeconds(time);
			if (!this.isUndef(offset)){
				offset = this.toTicks(offset);
			} else {
				offset = this.defaultArg(offset, this._clock.ticks);
			}
			//start the clock
			this._clock.start(time, offset);
			this.trigger("start", time, this.ticksToSeconds(offset));
			return this;
		};
	
		/**
		 *  Stop the transport and all sources synced to the transport.
		 *  @param  {Time} [time=now] The time when the transport should stop. 
		 *  @returns {Tone.Transport} this
		 *  @example
		 * Tone.Transport.stop();
		 */
		Tone.Transport.prototype.stop = function(time){
			time = this.toSeconds(time);
			this._clock.stop(time);
			this.trigger("stop", time);
			return this;
		};
	
		/**
		 *  Pause the transport and all sources synced to the transport.
		 *  @param  {Time} [time=now]
		 *  @returns {Tone.Transport} this
		 */
		Tone.Transport.prototype.pause = function(time){
			time = this.toSeconds(time);
			this._clock.pause(time);
			this.trigger("pause", time);
			return this;
		};
	
		///////////////////////////////////////////////////////////////////////////////
		//	SETTERS/GETTERS
		///////////////////////////////////////////////////////////////////////////////
	
		/**
		 *  The time signature as just the numerator over 4. 
		 *  For example 4/4 would be just 4 and 6/8 would be 3.
		 *  @memberOf Tone.Transport#
		 *  @type {Number|Array}
		 *  @name timeSignature
		 *  @example
		 * //common time
		 * Tone.Transport.timeSignature = 4;
		 * // 7/8
		 * Tone.Transport.timeSignature = [7, 8];
		 * //this will be reduced to a single number
		 * Tone.Transport.timeSignature; //returns 3.5
		 */
		Object.defineProperty(Tone.Transport.prototype, "timeSignature", {
			get : function(){
				return this._timeSignature;
			},
			set : function(timeSig){
				if (this.isArray(timeSig)){
					timeSig = (timeSig[0] / timeSig[1]) * 4;
				}
				this._timeSignature = timeSig;
			}
		});
	
	
		/**
		 * When the Tone.Transport.loop = true, this is the starting position of the loop.
		 * @memberOf Tone.Transport#
		 * @type {Time}
		 * @name loopStart
		 */
		Object.defineProperty(Tone.Transport.prototype, "loopStart", {
			get : function(){
				return this.ticksToSeconds(this._loopStart);
			},
			set : function(startPosition){
				this._loopStart = this.toTicks(startPosition);
			}
		});
	
		/**
		 * When the Tone.Transport.loop = true, this is the ending position of the loop.
		 * @memberOf Tone.Transport#
		 * @type {Time}
		 * @name loopEnd
		 */
		Object.defineProperty(Tone.Transport.prototype, "loopEnd", {
			get : function(){
				return this.ticksToSeconds(this._loopEnd);
			},
			set : function(endPosition){
				this._loopEnd = this.toTicks(endPosition);
			}
		});
	
		/**
		 *  Set the loop start and stop at the same time. 
		 *  @param {Time} startPosition 
		 *  @param {Time} endPosition   
		 *  @returns {Tone.Transport} this
		 *  @example
		 * //loop over the first measure
		 * Tone.Transport.setLoopPoints(0, "1m");
		 * Tone.Transport.loop = true;
		 */
		Tone.Transport.prototype.setLoopPoints = function(startPosition, endPosition){
			this.loopStart = startPosition;
			this.loopEnd = endPosition;
			return this;
		};
	
		/**
		 *  The swing value. Between 0-1 where 1 equal to 
		 *  the note + half the subdivision.
		 *  @memberOf Tone.Transport#
		 *  @type {NormalRange}
		 *  @name swing
		 */
		Object.defineProperty(Tone.Transport.prototype, "swing", {
			get : function(){
				return this._swingAmount * 2;
			},
			set : function(amount){
				//scale the values to a normal range
				this._swingAmount = amount * 0.5;
			}
		});
	
		/**
		 *  Set the subdivision which the swing will be applied to. 
		 *  The default values is a 16th note. Value must be less 
		 *  than a quarter note.
		 *  
		 *  @memberOf Tone.Transport#
		 *  @type {Time}
		 *  @name swingSubdivision
		 */
		Object.defineProperty(Tone.Transport.prototype, "swingSubdivision", {
			get : function(){
				return this.toNotation(this._swingTicks + "i");
			},
			set : function(subdivision){
				this._swingTicks = this.toTicks(subdivision);
			}
		});
	
		/**
		 *  The Transport's position in MEASURES:BEATS:SIXTEENTHS.
		 *  Setting the value will jump to that position right away. 
		 *  
		 *  @memberOf Tone.Transport#
		 *  @type {TransportTime}
		 *  @name position
		 */
		Object.defineProperty(Tone.Transport.prototype, "position", {
			get : function(){
				var quarters = this.ticks / this._ppq;
				var measures = Math.floor(quarters / this._timeSignature);
				var sixteenths = ((quarters % 1) * 4);
				//if the sixteenths aren't a whole number, fix their length
				if (sixteenths % 1 > 0){
					sixteenths = sixteenths.toFixed(3);	
				}
				quarters = Math.floor(quarters) % this._timeSignature;
				var progress = [measures, quarters, sixteenths];
				return progress.join(":");
			},
			set : function(progress){
				var ticks = this.toTicks(progress);
				this.ticks = ticks;
			}
		});
	
		/**
		 *  The Transport's loop position as a normalized value. Always
		 *  returns 0 if the transport if loop is not true. 
		 *  @memberOf Tone.Transport#
		 *  @name progress
		 *  @type {NormalRange}
		 */
		Object.defineProperty(Tone.Transport.prototype, "progress", {
			get : function(){
				if (this.loop){
					return (this.ticks - this._loopStart) / (this._loopEnd - this._loopStart);
				} else {
					return 0;
				}
			}
		});
	
		/**
		 *  The transports current tick position.
		 *  
		 *  @memberOf Tone.Transport#
		 *  @type {Ticks}
		 *  @name ticks
		 */
		Object.defineProperty(Tone.Transport.prototype, "ticks", {
			get : function(){
				return this._clock.ticks;
			},
			set : function(t){
				this._clock.ticks = t;
			}
		});
	
		/**
		 *  Pulses Per Quarter note. This is the smallest resolution
		 *  the Transport timing supports. This should be set once
		 *  on initialization and not set again. Changing this value 
		 *  after other objects have been created can cause problems. 
		 *  
		 *  @memberOf Tone.Transport#
		 *  @type {Number}
		 *  @name PPQ
		 */
		Object.defineProperty(Tone.Transport.prototype, "PPQ", {
			get : function(){
				return this._ppq;
			},
			set : function(ppq){
				this._ppq = ppq;
				this.bpm.value = this.bpm.value;
			}
		});
	
		/**
		 *  Convert from BPM to frequency (factoring in PPQ)
		 *  @param  {BPM}  bpm The BPM value to convert to frequency
		 *  @return  {Frequency}  The BPM as a frequency with PPQ factored in.
		 *  @private
		 */
		Tone.Transport.prototype._fromUnits = function(bpm){
			return 1 / (60 / bpm / this.PPQ);
		};
	
		/**
		 *  Convert from frequency (with PPQ) into BPM
		 *  @param  {Frequency}  freq The clocks frequency to convert to BPM
		 *  @return  {BPM}  The frequency value as BPM.
		 *  @private
		 */
		Tone.Transport.prototype._toUnits = function(freq){
			return (freq / this.PPQ) * 60;
		};
	
		///////////////////////////////////////////////////////////////////////////////
		//	SYNCING
		///////////////////////////////////////////////////////////////////////////////
	
		/**
		 *  Attaches the signal to the tempo control signal so that 
		 *  any changes in the tempo will change the signal in the same
		 *  ratio. 
		 *  
		 *  @param  {Tone.Signal} signal 
		 *  @param {number=} ratio Optionally pass in the ratio between
		 *                         the two signals. Otherwise it will be computed
		 *                         based on their current values. 
		 *  @returns {Tone.Transport} this
		 */
		Tone.Transport.prototype.syncSignal = function(signal, ratio){
			if (!ratio){
				//get the sync ratio
				if (signal._param.value !== 0){
					ratio = signal._param.value / this.bpm._param.value;
				} else {
					ratio = 0;
				}
			}
			var ratioSignal = new Tone.Gain(ratio);
			this.bpm.chain(ratioSignal, signal._param);
			this._syncedSignals.push({
				"ratio" : ratioSignal,
				"signal" : signal,
				"initial" : signal._param.value
			});
			signal._param.value = 0;
			return this;
		};
	
		/**
		 *  Unsyncs a previously synced signal from the transport's control. 
		 *  See Tone.Transport.syncSignal.
		 *  @param  {Tone.Signal} signal 
		 *  @returns {Tone.Transport} this
		 */
		Tone.Transport.prototype.unsyncSignal = function(signal){
			for (var i = this._syncedSignals.length - 1; i >= 0; i--){
				var syncedSignal = this._syncedSignals[i];
				if (syncedSignal.signal === signal){
					syncedSignal.ratio.dispose();
					syncedSignal.signal._param.value = syncedSignal.initial;
					this._syncedSignals.splice(i, 1);
				}
			}
			return this;
		};
	
		/**
		 *  Clean up. 
		 *  @returns {Tone.Transport} this
		 *  @private
		 */
		Tone.Transport.prototype.dispose = function(){
			Tone.Emitter.prototype.dispose.call(this);
			this._clock.dispose();
			this._clock = null;
			this._writable("bpm");
			this.bpm = null;
			this._timeline.dispose();
			this._timeline = null;
			this._onceEvents.dispose();
			this._onceEvents = null;
			this._repeatedEvents.dispose();
			this._repeatedEvents = null;
			return this;
		};
	
		///////////////////////////////////////////////////////////////////////////////
		//	INITIALIZATION
		///////////////////////////////////////////////////////////////////////////////
	
		var TransportConstructor = Tone.Transport;
	
		Tone._initAudioContext(function(){
			if (typeof Tone.Transport === "function"){
				//a single transport object
				Tone.Transport = new Tone.Transport();
			} else {
				//stop the clock
				Tone.Transport.stop();
				//get the previous values
				var prevSettings = Tone.Transport.get();
				//destory the old transport
				Tone.Transport.dispose();
				//make new Transport insides
				TransportConstructor.call(Tone.Transport);
				//set the previous config
				Tone.Transport.set(prevSettings);
			}
		});
	
		return Tone.Transport;
	}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));


/***/ }),
/* 30 */
/*!************************************************!*\
  !*** ./third_party/Tone.js/Tone/core/Clock.js ***!
  \************************************************/
/***/ (function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__(/*! Tone/core/Tone */ 26), __webpack_require__(/*! Tone/signal/TimelineSignal */ 31), __webpack_require__(/*! Tone/core/TimelineState */ 39)], __WEBPACK_AMD_DEFINE_RESULT__ = function (Tone) {
	
		"use strict";
	
		/**
		 *  @class  A sample accurate clock which provides a callback at the given rate. 
		 *          While the callback is not sample-accurate (it is still susceptible to
		 *          loose JS timing), the time passed in as the argument to the callback
		 *          is precise. For most applications, it is better to use Tone.Transport
		 *          instead of the Clock by itself since you can synchronize multiple callbacks.
		 *
		 * 	@constructor
		 * 	@extends {Tone}
		 * 	@param {function} callback The callback to be invoked with the time of the audio event
		 * 	@param {Frequency} frequency The rate of the callback
		 * 	@example
		 * //the callback will be invoked approximately once a second
		 * //and will print the time exactly once a second apart.
		 * var clock = new Tone.Clock(function(time){
		 * 	console.log(time);
		 * }, 1);
		 */
		Tone.Clock = function(){
	
			var options = this.optionsObject(arguments, ["callback", "frequency"], Tone.Clock.defaults);
	
			/**
			 *  The callback function to invoke at the scheduled tick.
			 *  @type  {Function}
			 */
			this.callback = options.callback;
	
			/**
			 *  The time which the clock will schedule events in advance
			 *  of the current time. Scheduling notes in advance improves
			 *  performance and decreases the chance for clicks caused
			 *  by scheduling events in the past. If set to "auto",
			 *  this value will be automatically computed based on the 
			 *  rate of requestAnimationFrame (0.016 seconds). Larger values
			 *  will yeild better performance, but at the cost of latency. 
			 *  Values less than 0.016 are not recommended.
			 *  @type {Number|String}
			 */
			this._lookAhead = "auto";
	
			/**
			 *  The lookahead value which was automatically
			 *  computed using a time-based averaging.
			 *  @type {Number}
			 *  @private
			 */
			this._computedLookAhead = 1/60;
	
			/**
			 *  The value afterwhich events are thrown out
			 *  @type {Number}
			 *  @private
			 */
			this._threshold = 0.5;
	
			/**
			 *  The next time the callback is scheduled.
			 *  @type {Number}
			 *  @private
			 */
			this._nextTick = -1;
	
			/**
			 *  The last time the callback was invoked
			 *  @type  {Number}
			 *  @private
			 */
			this._lastUpdate = 0;
	
			/**
			 *  The id of the requestAnimationFrame
			 *  @type {Number}
			 *  @private
			 */
			this._loopID = -1;
	
			/**
			 *  The rate the callback function should be invoked. 
			 *  @type  {BPM}
			 *  @signal
			 */
			this.frequency = new Tone.TimelineSignal(options.frequency, Tone.Type.Frequency);
	
			/**
			 *  The number of times the callback was invoked. Starts counting at 0
			 *  and increments after the callback was invoked. 
			 *  @type {Ticks}
			 *  @readOnly
			 */
			this.ticks = 0;
	
			/**
			 *  The state timeline
			 *  @type {Tone.TimelineState}
			 *  @private
			 */
			this._state = new Tone.TimelineState(Tone.State.Stopped);
	
			/**
			 *  A pre-binded loop function to save a tiny bit of overhead
			 *  of rebinding the function on every frame.
			 *  @type  {Function}
			 *  @private
			 */
			this._boundLoop = this._loop.bind(this);
	
			this._readOnly("frequency");
			//start the loop
			this._loop();
		};
	
		Tone.extend(Tone.Clock);
	
		/**
		 *  The defaults
		 *  @const
		 *  @type  {Object}
		 */
		Tone.Clock.defaults = {
			"callback" : Tone.noOp,
			"frequency" : 1,
			"lookAhead" : "auto",
		};
	
		/**
		 *  Returns the playback state of the source, either "started", "stopped" or "paused".
		 *  @type {Tone.State}
		 *  @readOnly
		 *  @memberOf Tone.Clock#
		 *  @name state
		 */
		Object.defineProperty(Tone.Clock.prototype, "state", {
			get : function(){
				return this._state.getStateAtTime(this.now());
			}
		});
	
		/**
		 *  The time which the clock will schedule events in advance
		 *  of the current time. Scheduling notes in advance improves
		 *  performance and decreases the chance for clicks caused
		 *  by scheduling events in the past. If set to "auto",
		 *  this value will be automatically computed based on the 
		 *  rate of requestAnimationFrame (0.016 seconds). Larger values
		 *  will yeild better performance, but at the cost of latency. 
		 *  Values less than 0.016 are not recommended.
		 *  @type {Number|String}
		 *  @memberOf Tone.Clock#
		 *  @name lookAhead
		 */
		Object.defineProperty(Tone.Clock.prototype, "lookAhead", {
			get : function(){
				return this._lookAhead;
			},
			set : function(val){
				if (val === "auto"){
					this._lookAhead = "auto";
				} else {
					this._lookAhead = this.toSeconds(val);
				}
			}
		});
	
	
		/**
		 *  Start the clock at the given time. Optionally pass in an offset
		 *  of where to start the tick counter from.
		 *  @param  {Time}  time    The time the clock should start
		 *  @param  {Ticks=}  offset  Where the tick counter starts counting from.
		 *  @return  {Tone.Clock}  this
		 */
		Tone.Clock.prototype.start = function(time, offset){
			time = this.toSeconds(time);
			if (this._state.getStateAtTime(time) !== Tone.State.Started){
				this._state.addEvent({
					"state" : Tone.State.Started, 
					"time" : time,
					"offset" : offset
				});
			}
			return this;	
		};
	
		/**
		 *  Stop the clock. Stopping the clock resets the tick counter to 0.
		 *  @param {Time} [time=now] The time when the clock should stop.
		 *  @returns {Tone.Clock} this
		 *  @example
		 * clock.stop();
		 */
		Tone.Clock.prototype.stop = function(time){
			time = this.toSeconds(time);
			if (this._state.getStateAtTime(time) !== Tone.State.Stopped){
				this._state.setStateAtTime(Tone.State.Stopped, time);
			}
			return this;	
		};
	
	
		/**
		 *  Pause the clock. Pausing does not reset the tick counter.
		 *  @param {Time} [time=now] The time when the clock should stop.
		 *  @returns {Tone.Clock} this
		 */
		Tone.Clock.prototype.pause = function(time){
			time = this.toSeconds(time);
			if (this._state.getStateAtTime(time) === Tone.State.Started){
				this._state.setStateAtTime(Tone.State.Paused, time);
			}
			return this;	
		};
	
		/**
		 *  The scheduling loop.
		 *  @param  {Number}  time  The current page time starting from 0
		 *                          when the page was loaded.
		 *  @private
		 */
		Tone.Clock.prototype._loop = function(time){
			this._loopID = requestAnimationFrame(this._boundLoop);
			//compute the look ahead
			if (this._lookAhead === "auto"){
				if (!this.isUndef(time)){
					var diff = (time - this._lastUpdate) / 1000;
					this._lastUpdate = time;
					//throw away large differences
					if (diff < this._threshold){
						//averaging
						this._computedLookAhead = (9 * this._computedLookAhead + diff) / 10;
					}
				}
			} else {
				this._computedLookAhead = this._lookAhead;
			}
			//get the frequency value to compute the value of the next loop
			var now = this.now();
			//if it's started
			var lookAhead = this._computedLookAhead * 2;
			var event = this._state.getEvent(now + lookAhead);
			var state = Tone.State.Stopped;
			if (event){
				state = event.state;
				//if it was stopped and now started
				if (this._nextTick === -1 && state === Tone.State.Started){
					this._nextTick = event.time;
					if (!this.isUndef(event.offset)){
						this.ticks = event.offset;
					}
				}
			}
			if (state === Tone.State.Started){
				while (now + lookAhead > this._nextTick){
					//catch up
					if (now > this._nextTick + this._threshold){
						this._nextTick = now;
					}
					var tickTime = this._nextTick;
					this._nextTick += 1 / this.frequency.getValueAtTime(this._nextTick);
					this.callback(tickTime);
					this.ticks++;
				}
			} else if (state === Tone.State.Stopped){
				this._nextTick = -1;
				this.ticks = 0;
			}
		};
	
		/**
		 *  Returns the scheduled state at the given time.
		 *  @param  {Time}  time  The time to query.
		 *  @return  {String}  The name of the state input in setStateAtTime.
		 *  @example
		 * clock.start("+0.1");
		 * clock.getStateAtTime("+0.1"); //returns "started"
		 */
		Tone.Clock.prototype.getStateAtTime = function(time){
			return this._state.getStateAtTime(time);
		};
	
		/**
		 *  Clean up
		 *  @returns {Tone.Clock} this
		 */
		Tone.Clock.prototype.dispose = function(){
			cancelAnimationFrame(this._loopID);
			Tone.TimelineState.prototype.dispose.call(this);
			this._writable("frequency");
			this.frequency.dispose();
			this.frequency = null;
			this._boundLoop = Tone.noOp;
			this._nextTick = Infinity;
			this.callback = null;
			this._state.dispose();
			this._state = null;
		};
	
		return Tone.Clock;
	}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));

/***/ }),
/* 31 */
/*!***********************************************************!*\
  !*** ./third_party/Tone.js/Tone/signal/TimelineSignal.js ***!
  \***********************************************************/
/***/ (function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__(/*! Tone/core/Tone */ 26), __webpack_require__(/*! Tone/signal/Signal */ 32), __webpack_require__(/*! Tone/core/Timeline */ 38)], __WEBPACK_AMD_DEFINE_RESULT__ = function (Tone) {
	
		"use strict";
	
		/**
		 *  @class A signal which adds the method getValueAtTime. 
		 *         Code and inspiration from https://github.com/jsantell/web-audio-automation-timeline
		 *  @extends {Tone.Param}
		 *  @param {Number=} value The initial value of the signal
		 *  @param {String=} units The conversion units of the signal.
		 */
		Tone.TimelineSignal = function(){
	
			var options = this.optionsObject(arguments, ["value", "units"], Tone.Signal.defaults);
	
			//constructors
			Tone.Signal.apply(this, options);
			options.param = this._param;
			Tone.Param.call(this, options);
	
			/**
			 *  The scheduled events
			 *  @type {Tone.Timeline}
			 *  @private
			 */
			this._events = new Tone.Timeline(10);
	
			/**
			 *  The initial scheduled value
			 *  @type {Number}
			 *  @private
			 */
			this._initial = this._fromUnits(this._param.value);
		};
	
		Tone.extend(Tone.TimelineSignal, Tone.Param);
	
		/**
		 *  The event types of a schedulable signal.
		 *  @enum {String}
		 */
		Tone.TimelineSignal.Type = {
			Linear : "linear",
			Exponential : "exponential",
			Target : "target",
			Set : "set"
		};
	
		/**
		 * The current value of the signal. 
		 * @memberOf Tone.TimelineSignal#
		 * @type {Number}
		 * @name value
		 */
		Object.defineProperty(Tone.TimelineSignal.prototype, "value", {
			get : function(){
				return this._toUnits(this._param.value);
			},
			set : function(value){
				var convertedVal = this._fromUnits(value);
				this._initial = convertedVal;
				this._param.value = convertedVal;
			}
		});
	
		///////////////////////////////////////////////////////////////////////////
		//	SCHEDULING
		///////////////////////////////////////////////////////////////////////////
	
		/**
		 *  Schedules a parameter value change at the given time.
		 *  @param {*}	value The value to set the signal.
		 *  @param {Time}  time The time when the change should occur.
		 *  @returns {Tone.TimelineSignal} this
		 *  @example
		 * //set the frequency to "G4" in exactly 1 second from now. 
		 * freq.setValueAtTime("G4", "+1");
		 */
		Tone.TimelineSignal.prototype.setValueAtTime = function (value, startTime) {
			value = this._fromUnits(value);
			startTime = this.toSeconds(startTime);
			this._events.addEvent({
				"type" : Tone.TimelineSignal.Type.Set,
				"value" : value,
				"time" : startTime
			});
			//invoke the original event
			this._param.setValueAtTime(value, startTime);
			return this;
		};
	
		/**
		 *  Schedules a linear continuous change in parameter value from the 
		 *  previous scheduled parameter value to the given value.
		 *  
		 *  @param  {number} value   
		 *  @param  {Time} endTime 
		 *  @returns {Tone.TimelineSignal} this
		 */
		Tone.TimelineSignal.prototype.linearRampToValueAtTime = function (value, endTime) {
			value = this._fromUnits(value);
			endTime = this.toSeconds(endTime);
			this._events.addEvent({
				"type" : Tone.TimelineSignal.Type.Linear,
				"value" : value,
				"time" : endTime
			});
			this._param.linearRampToValueAtTime(value, endTime);
			return this;
		};
	
		/**
		 *  Schedules an exponential continuous change in parameter value from 
		 *  the previous scheduled parameter value to the given value.
		 *  
		 *  @param  {number} value   
		 *  @param  {Time} endTime 
		 *  @returns {Tone.TimelineSignal} this
		 */
		Tone.TimelineSignal.prototype.exponentialRampToValueAtTime = function (value, endTime) {
			//get the previous event and make sure it's not starting from 0
			var beforeEvent = this._searchBefore(endTime);
			if (beforeEvent && beforeEvent.value === 0){
				//reschedule that event
				this.setValueAtTime(this._minOutput, beforeEvent.time);
			}
			value = this._fromUnits(value);
			var setValue = Math.max(value, this._minOutput);
			endTime = this.toSeconds(endTime);
			this._events.addEvent({
				"type" : Tone.TimelineSignal.Type.Exponential,
				"value" : setValue,
				"time" : endTime
			});
			//if the ramped to value is 0, make it go to the min output, and then set to 0.
			if (value < this._minOutput){
				this._param.exponentialRampToValueAtTime(this._minOutput, endTime - 1 / Tone.context.sampleRate);
				this.setValueAtTime(0, endTime);
			} else {
				this._param.exponentialRampToValueAtTime(value, endTime);
			}
			return this;
		};
	
		/**
		 *  Start exponentially approaching the target value at the given time with
		 *  a rate having the given time constant.
		 *  @param {number} value        
		 *  @param {Time} startTime    
		 *  @param {number} timeConstant 
		 *  @returns {Tone.TimelineSignal} this 
		 */
		Tone.TimelineSignal.prototype.setTargetAtTime = function (value, startTime, timeConstant) {
			value = this._fromUnits(value);
			value = Math.max(this._minOutput, value);
			timeConstant = Math.max(this._minOutput, timeConstant);
			startTime = this.toSeconds(startTime);
			this._events.addEvent({
				"type" : Tone.TimelineSignal.Type.Target,
				"value" : value,
				"time" : startTime,
				"constant" : timeConstant
			});
			this._param.setTargetAtTime(value, startTime, timeConstant);
			return this;
		};
	
		/**
		 *  Cancels all scheduled parameter changes with times greater than or 
		 *  equal to startTime.
		 *  
		 *  @param  {Time} startTime
		 *  @returns {Tone.TimelineSignal} this
		 */
		Tone.TimelineSignal.prototype.cancelScheduledValues = function (after) {
			this._events.cancel(after);
			this._param.cancelScheduledValues(this.toSeconds(after));
			return this;
		};
	
		/**
		 *  Sets the computed value at the given time. This provides
		 *  a point from which a linear or exponential curve
		 *  can be scheduled after. Will cancel events after 
		 *  the given time and shorten the currently scheduled
		 *  linear or exponential ramp so that it ends at `time` .
		 *  This is to avoid discontinuities and clicks in envelopes. 
		 *  @param {Time} time When to set the ramp point
		 *  @returns {Tone.TimelineSignal} this
		 */
		Tone.TimelineSignal.prototype.setRampPoint = function (time) {
			time = this.toSeconds(time);
			//get the value at the given time
			var val = this.getValueAtTime(time);
			//if there is an event at the given time
			//and that even is not a "set"
			var before = this._searchBefore(time);
			if (before && before.time === time){
				//remove everything after
				this.cancelScheduledValues(time + this.sampleTime);
			} else {
				//reschedule the next event to end at the given time
				var after = this._searchAfter(time);
				if (after){
					//cancel the next event(s)
					this.cancelScheduledValues(time);
					if (after.type === Tone.TimelineSignal.Type.Linear){
						this.linearRampToValueAtTime(val, time);
					} else if (after.type === Tone.TimelineSignal.Type.Exponential){
						this.exponentialRampToValueAtTime(val, time);
					} 
				} 
				this.setValueAtTime(val, time);
			}
			return this;
		};
	
		/**
		 *  Do a linear ramp to the given value between the start and finish times.
		 *  @param {Number} value The value to ramp to.
		 *  @param {Time} start The beginning anchor point to do the linear ramp
		 *  @param {Time} finish The ending anchor point by which the value of
		 *                       the signal will equal the given value.
		 *  @returns {Tone.TimelineSignal} this
		 */
		Tone.TimelineSignal.prototype.linearRampToValueBetween = function (value, start, finish) {
			this.setRampPoint(start);
			this.linearRampToValueAtTime(value, finish);
			return this;
		};
	
		/**
		 *  Do a exponential ramp to the given value between the start and finish times.
		 *  @param {Number} value The value to ramp to.
		 *  @param {Time} start The beginning anchor point to do the exponential ramp
		 *  @param {Time} finish The ending anchor point by which the value of
		 *                       the signal will equal the given value.
		 *  @returns {Tone.TimelineSignal} this
		 */
		Tone.TimelineSignal.prototype.exponentialRampToValueBetween = function (value, start, finish) {
			this.setRampPoint(start);
			this.exponentialRampToValueAtTime(value, finish);
			return this;
		};
	
		///////////////////////////////////////////////////////////////////////////
		//	GETTING SCHEDULED VALUES
		///////////////////////////////////////////////////////////////////////////
	
		/**
		 *  Returns the value before or equal to the given time
		 *  @param  {Number}  time  The time to query
		 *  @return  {Object}  The event at or before the given time.
		 *  @private
		 */
		Tone.TimelineSignal.prototype._searchBefore = function(time){
			return this._events.getEvent(time);
		};
	
		/**
		 *  The event after the given time
		 *  @param  {Number}  time  The time to query.
		 *  @return  {Object}  The next event after the given time
		 *  @private
		 */
		Tone.TimelineSignal.prototype._searchAfter = function(time){
			return this._events.getEventAfter(time);
		};
	
		/**
		 *  Get the scheduled value at the given time. This will
		 *  return the unconverted (raw) value.
		 *  @param  {Number}  time  The time in seconds.
		 *  @return  {Number}  The scheduled value at the given time.
		 */
		Tone.TimelineSignal.prototype.getValueAtTime = function(time){
			var after = this._searchAfter(time);
			var before = this._searchBefore(time);
			var value = this._initial;
			//if it was set by
			if (before === null){
				value = this._initial;
			} else if (before.type === Tone.TimelineSignal.Type.Target){
				var previous = this._events.getEventBefore(before.time);
				var previouVal;
				if (previous === null){
					previouVal = this._initial;
				} else {
					previouVal = previous.value;
				}
				value = this._exponentialApproach(before.time, previouVal, before.value, before.constant, time);
			} else if (after === null){
				value = before.value;
			} else if (after.type === Tone.TimelineSignal.Type.Linear){
				value = this._linearInterpolate(before.time, before.value, after.time, after.value, time);
			} else if (after.type === Tone.TimelineSignal.Type.Exponential){
				value = this._exponentialInterpolate(before.time, before.value, after.time, after.value, time);
			} else {
				value = before.value;
			}
			return value;
		};
	
		/**
		 *  When signals connect to other signals or AudioParams, 
		 *  they take over the output value of that signal or AudioParam. 
		 *  For all other nodes, the behavior is the same as a default <code>connect</code>. 
		 *
		 *  @override
		 *  @param {AudioParam|AudioNode|Tone.Signal|Tone} node 
		 *  @param {number} [outputNumber=0] The output number to connect from.
		 *  @param {number} [inputNumber=0] The input number to connect to.
		 *  @returns {Tone.TimelineSignal} this
		 *  @method
		 */
		Tone.TimelineSignal.prototype.connect = Tone.SignalBase.prototype.connect;
	
	
		///////////////////////////////////////////////////////////////////////////
		//	AUTOMATION CURVE CALCULATIONS
		//	MIT License, copyright (c) 2014 Jordan Santell
		///////////////////////////////////////////////////////////////////////////
	
		/**
		 *  Calculates the the value along the curve produced by setTargetAtTime
		 *  @private
		 */
		Tone.TimelineSignal.prototype._exponentialApproach = function (t0, v0, v1, timeConstant, t) {
			return v1 + (v0 - v1) * Math.exp(-(t - t0) / timeConstant);
		};
	
		/**
		 *  Calculates the the value along the curve produced by linearRampToValueAtTime
		 *  @private
		 */
		Tone.TimelineSignal.prototype._linearInterpolate = function (t0, v0, t1, v1, t) {
			return v0 + (v1 - v0) * ((t - t0) / (t1 - t0));
		};
	
		/**
		 *  Calculates the the value along the curve produced by exponentialRampToValueAtTime
		 *  @private
		 */
		Tone.TimelineSignal.prototype._exponentialInterpolate = function (t0, v0, t1, v1, t) {
			v0 = Math.max(this._minOutput, v0);
			return v0 * Math.pow(v1 / v0, (t - t0) / (t1 - t0));
		};
	
		/**
		 *  Clean up.
		 *  @return {Tone.TimelineSignal} this
		 */
		Tone.TimelineSignal.prototype.dispose = function(){
			Tone.Signal.prototype.dispose.call(this);
			Tone.Param.prototype.dispose.call(this);
			this._events.dispose();
			this._events = null;
		};
	
		return Tone.TimelineSignal;
	}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));

/***/ }),
/* 32 */
/*!***************************************************!*\
  !*** ./third_party/Tone.js/Tone/signal/Signal.js ***!
  \***************************************************/
/***/ (function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__(/*! Tone/core/Tone */ 26), __webpack_require__(/*! Tone/signal/WaveShaper */ 33), __webpack_require__(/*! Tone/core/Type */ 35), __webpack_require__(/*! Tone/core/Param */ 36), __webpack_require__(/*! Tone/core/Gain */ 37)], __WEBPACK_AMD_DEFINE_RESULT__ = function(Tone){
	
		"use strict";
	
		/**
		 *  @class  A signal is an audio-rate value. Tone.Signal is a core component of the library.
		 *          Unlike a number, Signals can be scheduled with sample-level accuracy. Tone.Signal
		 *          has all of the methods available to native Web Audio 
		 *          [AudioParam](http://webaudio.github.io/web-audio-api/#the-audioparam-interface)
		 *          as well as additional conveniences. Read more about working with signals 
		 *          [here](https://github.com/Tonejs/Tone.js/wiki/Signals).
		 *
		 *  @constructor
		 *  @extends {Tone.Param}
		 *  @param {Number|AudioParam} [value] Initial value of the signal. If an AudioParam
		 *                                     is passed in, that parameter will be wrapped
		 *                                     and controlled by the Signal. 
		 *  @param {string} [units=Number] unit The units the signal is in. 
		 *  @example
		 * var signal = new Tone.Signal(10);
		 */
		Tone.Signal = function(){
	
			var options = this.optionsObject(arguments, ["value", "units"], Tone.Signal.defaults);
	
			/**
			 * The node where the constant signal value is scaled.
			 * @type {GainNode}
			 * @private
			 */
			this.output = this._gain = this.context.createGain();
	
			options.param = this._gain.gain;
			Tone.Param.call(this, options);
	
			/**
			 * The node where the value is set.
			 * @type {Tone.Param}
			 * @private
			 */
			this.input = this._param = this._gain.gain;
	
			//connect the const output to the node output
			Tone.Signal._constant.chain(this._gain);
		};
	
		Tone.extend(Tone.Signal, Tone.Param);
	
		/**
		 *  The default values
		 *  @type  {Object}
		 *  @static
		 *  @const
		 */
		Tone.Signal.defaults = {
			"value" : 0,
			"units" : Tone.Type.Default,
			"convert" : true,
		};
	
		/**
		 *  When signals connect to other signals or AudioParams, 
		 *  they take over the output value of that signal or AudioParam. 
		 *  For all other nodes, the behavior is the same as a default <code>connect</code>. 
		 *
		 *  @override
		 *  @param {AudioParam|AudioNode|Tone.Signal|Tone} node 
		 *  @param {number} [outputNumber=0] The output number to connect from.
		 *  @param {number} [inputNumber=0] The input number to connect to.
		 *  @returns {Tone.SignalBase} this
		 *  @method
		 */
		Tone.Signal.prototype.connect = Tone.SignalBase.prototype.connect;
	
		/**
		 *  dispose and disconnect
		 *  @returns {Tone.Signal} this
		 */
		Tone.Signal.prototype.dispose = function(){
			Tone.Param.prototype.dispose.call(this);
			this._param = null;
			this._gain.disconnect();
			this._gain = null;
			return this;
		};
	
		///////////////////////////////////////////////////////////////////////////
		//	STATIC
		///////////////////////////////////////////////////////////////////////////
	
		/**
		 *  Generates a constant output of 1.
		 *  @static
		 *  @private
		 *  @const
		 *  @type {AudioBufferSourceNode}
		 */
		Tone.Signal._constant = null;
	
		/**
		 *  initializer function
		 */
		Tone._initAudioContext(function(audioContext){
			var buffer = audioContext.createBuffer(1, 128, audioContext.sampleRate);
			var arr = buffer.getChannelData(0);
			for (var i = 0; i < arr.length; i++){
				arr[i] = 1;
			}
			Tone.Signal._constant = audioContext.createBufferSource();
			Tone.Signal._constant.channelCount = 1;
			Tone.Signal._constant.channelCountMode = "explicit";
			Tone.Signal._constant.buffer = buffer;
			Tone.Signal._constant.loop = true;
			Tone.Signal._constant.start(0);
			Tone.Signal._constant.noGC();
		});
	
		return Tone.Signal;
	}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));

/***/ }),
/* 33 */
/*!*******************************************************!*\
  !*** ./third_party/Tone.js/Tone/signal/WaveShaper.js ***!
  \*******************************************************/
/***/ (function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__(/*! Tone/core/Tone */ 26), __webpack_require__(/*! Tone/signal/SignalBase */ 34)], __WEBPACK_AMD_DEFINE_RESULT__ = function(Tone){
	
		"use strict";
	
		/**
		 *  @class Wraps the native Web Audio API 
		 *         [WaveShaperNode](http://webaudio.github.io/web-audio-api/#the-waveshapernode-interface).
		 *
		 *  @extends {Tone.SignalBase}
		 *  @constructor
		 *  @param {function|Array|Number} mapping The function used to define the values. 
		 *                                    The mapping function should take two arguments: 
		 *                                    the first is the value at the current position 
		 *                                    and the second is the array position. 
		 *                                    If the argument is an array, that array will be
		 *                                    set as the wave shaping function. The input
		 *                                    signal is an AudioRange [-1, 1] value and the output
		 *                                    signal can take on any numerical values. 
		 *                                    
		 *  @param {Number} [bufferLen=1024] The length of the WaveShaperNode buffer.
		 *  @example
		 * var timesTwo = new Tone.WaveShaper(function(val){
		 * 	return val * 2;
		 * }, 2048);
		 *  @example
		 * //a waveshaper can also be constructed with an array of values
		 * var invert = new Tone.WaveShaper([1, -1]);
		 */
		Tone.WaveShaper = function(mapping, bufferLen){
	
			/**
			 *  the waveshaper
			 *  @type {WaveShaperNode}
			 *  @private
			 */
			this._shaper = this.input = this.output = this.context.createWaveShaper();
	
			/**
			 *  the waveshapers curve
			 *  @type {Float32Array}
			 *  @private
			 */
			this._curve = null;
	
			if (Array.isArray(mapping)){
				this.curve = mapping;
			} else if (isFinite(mapping) || this.isUndef(mapping)){
				this._curve = new Float32Array(this.defaultArg(mapping, 1024));
			} else if (this.isFunction(mapping)){
				this._curve = new Float32Array(this.defaultArg(bufferLen, 1024));
				this.setMap(mapping);
			} 
		};
	
		Tone.extend(Tone.WaveShaper, Tone.SignalBase);
	
		/**
		 *  Uses a mapping function to set the value of the curve. 
		 *  @param {function} mapping The function used to define the values. 
		 *                            The mapping function take two arguments: 
		 *                            the first is the value at the current position 
		 *                            which goes from -1 to 1 over the number of elements
		 *                            in the curve array. The second argument is the array position. 
		 *  @returns {Tone.WaveShaper} this
		 *  @example
		 * //map the input signal from [-1, 1] to [0, 10]
		 * shaper.setMap(function(val, index){
		 * 	return (val + 1) * 5;
		 * })
		 */
		Tone.WaveShaper.prototype.setMap = function(mapping){
			for (var i = 0, len = this._curve.length; i < len; i++){
				var normalized = (i / (len)) * 2 - 1;
				this._curve[i] = mapping(normalized, i);
			}
			this._shaper.curve = this._curve;
			return this;
		};
	
		/**
		 * The array to set as the waveshaper curve. For linear curves
		 * array length does not make much difference, but for complex curves
		 * longer arrays will provide smoother interpolation. 
		 * @memberOf Tone.WaveShaper#
		 * @type {Array}
		 * @name curve
		 */
		Object.defineProperty(Tone.WaveShaper.prototype, "curve", {
			get : function(){
				return this._shaper.curve;
			},
			set : function(mapping){
				this._curve = new Float32Array(mapping);
				this._shaper.curve = this._curve;
			}
		});
	
		/**
		 * Specifies what type of oversampling (if any) should be used when 
		 * applying the shaping curve. Can either be "none", "2x" or "4x". 
		 * @memberOf Tone.WaveShaper#
		 * @type {string}
		 * @name oversample
		 */
		Object.defineProperty(Tone.WaveShaper.prototype, "oversample", {
			get : function(){
				return this._shaper.oversample;
			},
			set : function(oversampling){
				if (["none", "2x", "4x"].indexOf(oversampling) !== -1){
					this._shaper.oversample = oversampling;
				} else {
					throw new Error("invalid oversampling: "+oversampling);
				}
			}
		});
	
		/**
		 *  Clean up.
		 *  @returns {Tone.WaveShaper} this
		 */
		Tone.WaveShaper.prototype.dispose = function(){
			Tone.prototype.dispose.call(this);
			this._shaper.disconnect();
			this._shaper = null;
			this._curve = null;
			return this;
		};
	
		return Tone.WaveShaper;
	}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));

/***/ }),
/* 34 */
/*!*******************************************************!*\
  !*** ./third_party/Tone.js/Tone/signal/SignalBase.js ***!
  \*******************************************************/
/***/ (function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__(/*! Tone/core/Tone */ 26)], __WEBPACK_AMD_DEFINE_RESULT__ = function(Tone){
	
		"use strict";
	
		/**
		 *  @class  Base class for all Signals. Used Internally. 
		 *
		 *  @constructor
		 *  @extends {Tone}
		 */
		Tone.SignalBase = function(){};
	
		Tone.extend(Tone.SignalBase);
	
		/**
		 *  When signals connect to other signals or AudioParams, 
		 *  they take over the output value of that signal or AudioParam. 
		 *  For all other nodes, the behavior is the same as a default <code>connect</code>. 
		 *
		 *  @override
		 *  @param {AudioParam|AudioNode|Tone.Signal|Tone} node 
		 *  @param {number} [outputNumber=0] The output number to connect from.
		 *  @param {number} [inputNumber=0] The input number to connect to.
		 *  @returns {Tone.SignalBase} this
		 */
		Tone.SignalBase.prototype.connect = function(node, outputNumber, inputNumber){
			//zero it out so that the signal can have full control
			if ((Tone.Signal && Tone.Signal === node.constructor) || 
					(Tone.Param && Tone.Param === node.constructor) || 
					(Tone.TimelineSignal && Tone.TimelineSignal === node.constructor)){
				//cancel changes
				node._param.cancelScheduledValues(0);
				//reset the value
				node._param.value = 0;
				//mark the value as overridden
				node.overridden = true;
			} else if (node instanceof AudioParam){
				node.cancelScheduledValues(0);
				node.value = 0;
			} 
			Tone.prototype.connect.call(this, node, outputNumber, inputNumber);
			return this;
		};
	
		return Tone.SignalBase;
	}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));

/***/ }),
/* 35 */
/*!***********************************************!*\
  !*** ./third_party/Tone.js/Tone/core/Type.js ***!
  \***********************************************/
/***/ (function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__(/*! Tone/core/Tone */ 26)], __WEBPACK_AMD_DEFINE_RESULT__ = function (Tone) {
	
		"use strict";
	
		///////////////////////////////////////////////////////////////////////////
		//	TYPES
		///////////////////////////////////////////////////////////////////////////
	
		/**
		 * Units which a value can take on.
		 * @enum {String}
		 */
		Tone.Type = {
			/** 
			 *  The default value is a number which can take on any value between [-Infinity, Infinity]
			 */
			Default : "number",
			/**
			 *  Time can be described in a number of ways. Read more [Time](https://github.com/Tonejs/Tone.js/wiki/Time).
			 *
			 *  <ul>
			 *  <li>Numbers, which will be taken literally as the time (in seconds).</li>
			 *  <li>Notation, ("4n", "8t") describes time in BPM and time signature relative values.</li>
			 *  <li>TransportTime, ("4:3:2") will also provide tempo and time signature relative times 
			 *  in the form BARS:QUARTERS:SIXTEENTHS.</li>
			 *  <li>Frequency, ("8hz") is converted to the length of the cycle in seconds.</li>
			 *  <li>Now-Relative, ("+1") prefix any of the above with "+" and it will be interpreted as 
			 *  "the current time plus whatever expression follows".</li>
			 *  <li>Expressions, ("3:0 + 2 - (1m / 7)") any of the above can also be combined 
			 *  into a mathematical expression which will be evaluated to compute the desired time.</li>
			 *  <li>No Argument, for methods which accept time, no argument will be interpreted as 
			 *  "now" (i.e. the currentTime).</li>
			 *  </ul>
			 *  
			 *  @typedef {Time}
			 */
			Time : "time",
			/**
			 *  Frequency can be described similar to time, except ultimately the
			 *  values are converted to frequency instead of seconds. A number
			 *  is taken literally as the value in hertz. Additionally any of the 
			 *  Time encodings can be used. Note names in the form
			 *  of NOTE OCTAVE (i.e. C4) are also accepted and converted to their
			 *  frequency value. 
			 *  @typedef {Frequency}
			 */
			Frequency : "frequency",
			/** 
			 *  Normal values are within the range [0, 1].
			 *  @typedef {NormalRange}
			 */
			NormalRange : "normalRange",
			/** 
			 *  AudioRange values are between [-1, 1].
			 *  @typedef {AudioRange}
			 */
			AudioRange : "audioRange",
			/** 
			 *  Decibels are a logarithmic unit of measurement which is useful for volume
			 *  because of the logarithmic way that we perceive loudness. 0 decibels 
			 *  means no change in volume. -10db is approximately half as loud and 10db 
			 *  is twice is loud. 
			 *  @typedef {Decibels}
			 */
			Decibels : "db",
			/** 
			 *  Half-step note increments, i.e. 12 is an octave above the root. and 1 is a half-step up.
			 *  @typedef {Interval}
			 */
			Interval : "interval",
			/** 
			 *  Beats per minute. 
			 *  @typedef {BPM}
			 */
			BPM : "bpm",
			/** 
			 *  The value must be greater than or equal to 0.
			 *  @typedef {Positive}
			 */
			Positive : "positive",
			/** 
			 *  A cent is a hundredth of a semitone. 
			 *  @typedef {Cents}
			 */
			Cents : "cents",
			/** 
			 *  Angle between 0 and 360. 
			 *  @typedef {Degrees}
			 */
			Degrees : "degrees",
			/** 
			 *  A number representing a midi note.
			 *  @typedef {MIDI}
			 */
			MIDI : "midi",
			/** 
			 *  A colon-separated representation of time in the form of
			 *  BARS:QUARTERS:SIXTEENTHS. 
			 *  @typedef {TransportTime}
			 */
			TransportTime : "transportTime",
			/** 
			 *  Ticks are the basic subunit of the Transport. They are
			 *  the smallest unit of time that the Transport supports.
			 *  @typedef {Ticks}
			 */
			Ticks : "tick",
			/** 
			 *  A frequency represented by a letter name, 
			 *  accidental and octave. This system is known as
			 *  [Scientific Pitch Notation](https://en.wikipedia.org/wiki/Scientific_pitch_notation).
			 *  @typedef {Note}
			 */
			Note : "note",
			/** 
			 *  One millisecond is a thousandth of a second. 
			 *  @typedef {Milliseconds}
			 */
			Milliseconds : "milliseconds",
			/** 
			 *  A string representing a duration relative to a measure. 
			 *  <ul>
			 *  	<li>"4n" = quarter note</li>
			 *   	<li>"2m" = two measures</li>
			 *    	<li>"8t" = eighth-note triplet</li>
			 *  </ul>
			 *  @typedef {Notation}
			 */
			Notation : "notation",
		};
	
		///////////////////////////////////////////////////////////////////////////
		//	MATCHING TESTS
		///////////////////////////////////////////////////////////////////////////
	
		/**
		 *  Test if a function is "now-relative", i.e. starts with "+".
		 *  
		 *  @param {String} str The string to test
		 *  @return {boolean} 
		 *  @method isNowRelative
		 *  @lends Tone.prototype.isNowRelative
		 */
		Tone.prototype.isNowRelative = (function(){
			var nowRelative = new RegExp(/^\s*\+(.)+/i);
			return function(note){
				return nowRelative.test(note);
			};
		})();
	
		/**
		 *  Tests if a string is in Ticks notation. 
		 *  
		 *  @param {String} str The string to test
		 *  @return {boolean} 
		 *  @method isTicks
		 *  @lends Tone.prototype.isTicks
		 */
		Tone.prototype.isTicks = (function(){
			var tickFormat = new RegExp(/^\d+i$/i);
			return function(note){
				return tickFormat.test(note);
			};
		})();
	
		/**
		 *  Tests if a string is musical notation.
		 *  i.e.:
		 *  <ul>
		 *  	<li>4n = quarter note</li>
		 *   	<li>2m = two measures</li>
		 *    	<li>8t = eighth-note triplet</li>
		 *  </ul>
		 *  
		 *  @param {String} str The string to test
		 *  @return {boolean} 
		 *  @method isNotation
		 *  @lends Tone.prototype.isNotation
		 */
		Tone.prototype.isNotation = (function(){
			var notationFormat = new RegExp(/^[0-9]+[mnt]$/i);
			return function(note){
				return notationFormat.test(note);
			};
		})();
	
		/**
		 *  Test if a string is in the transportTime format. 
		 *  "Bars:Beats:Sixteenths"
		 *  @param {String} transportTime
		 *  @return {boolean} 
		 *  @method isTransportTime
		 *  @lends Tone.prototype.isTransportTime
		 */
		Tone.prototype.isTransportTime = (function(){
			var transportTimeFormat = new RegExp(/^(\d+(\.\d+)?\:){1,2}(\d+(\.\d+)?)?$/i);
			return function(transportTime){
				return transportTimeFormat.test(transportTime);
			};
		})();
	
		/**
		 *  Test if a string is in Scientific Pitch Notation: i.e. "C4". 
		 *  @param  {String}  note The note to test
		 *  @return {boolean}      true if it's in the form of a note
		 *  @method isNote
		 *  @lends Tone.prototype.isNote
		 *  @function
		 */
		Tone.prototype.isNote = ( function(){
			var noteFormat = new RegExp(/^[a-g]{1}(b|#|x|bb)?-?[0-9]+$/i);
			return function(note){
				return noteFormat.test(note);
			};
		})();
	
		/**
		 *  Test if the input is in the format of number + hz
		 *  i.e.: 10hz
		 *
		 *  @param {String} freq 
		 *  @return {boolean} 
		 *  @function
		 */
		Tone.prototype.isFrequency = (function(){
			var freqFormat = new RegExp(/^\d*\.?\d+hz$/i);
			return function(freq){
				return freqFormat.test(freq);
			};
		})();
	
		///////////////////////////////////////////////////////////////////////////
		//	TO SECOND CONVERSIONS
		///////////////////////////////////////////////////////////////////////////
	
		/**
		 *  @private
		 *  @return  {Object}  The Transport's BPM if the Transport exists, 
		 *                         otherwise returns reasonable defaults.
		 */
		function getTransportBpm(){
			if (Tone.Transport && Tone.Transport.bpm){
				return Tone.Transport.bpm.value;
			} else {
				return 120;
			}
		}
	
		/**
		 *  @private
		 *  @return  {Object}  The Transport's Time Signature if the Transport exists, 
		 *                         otherwise returns reasonable defaults.
		 */
		function getTransportTimeSignature(){
			if (Tone.Transport && Tone.Transport.timeSignature){
				return Tone.Transport.timeSignature;
			} else {
				return 4;
			}
		}
	
		/**
		 *
		 *  convert notation format strings to seconds
		 *  
		 *  @param  {String} notation     
		 *  @param {BPM=} bpm 
		 *  @param {number=} timeSignature 
		 *  @return {number} 
		 *                
		 */
		Tone.prototype.notationToSeconds = function(notation, bpm, timeSignature){
			bpm = this.defaultArg(bpm, getTransportBpm());
			timeSignature = this.defaultArg(timeSignature, getTransportTimeSignature());
			var beatTime = (60 / bpm);
			//special case: 1n = 1m
			if (notation === "1n"){
				notation = "1m";
			}
			var subdivision = parseInt(notation, 10);
			var beats = 0;
			if (subdivision === 0){
				beats = 0;
			}
			var lastLetter = notation.slice(-1);
			if (lastLetter === "t"){
				beats = (4 / subdivision) * 2/3;
			} else if (lastLetter === "n"){
				beats = 4 / subdivision;
			} else if (lastLetter === "m"){
				beats = subdivision * timeSignature;
			} else {
				beats = 0;
			}
			return beatTime * beats;
		};
	
		/**
		 *  convert transportTime into seconds.
		 *  
		 *  ie: 4:2:3 == 4 measures + 2 quarters + 3 sixteenths
		 *
		 *  @param  {TransportTime} transportTime 
		 *  @param {BPM=} bpm 
		 *  @param {number=} timeSignature
		 *  @return {number}               seconds
		 */
		Tone.prototype.transportTimeToSeconds = function(transportTime, bpm, timeSignature){
			bpm = this.defaultArg(bpm, getTransportBpm());
			timeSignature = this.defaultArg(timeSignature, getTransportTimeSignature());
			var measures = 0;
			var quarters = 0;
			var sixteenths = 0;
			var split = transportTime.split(":");
			if (split.length === 2){
				measures = parseFloat(split[0]);
				quarters = parseFloat(split[1]);
			} else if (split.length === 1){
				quarters = parseFloat(split[0]);
			} else if (split.length === 3){
				measures = parseFloat(split[0]);
				quarters = parseFloat(split[1]);
				sixteenths = parseFloat(split[2]);
			}
			var beats = (measures * timeSignature + quarters + sixteenths / 4);
			return beats * (60/bpm);
		};
		
		/**
		 *  Convert ticks into seconds
		 *  @param  {Ticks} ticks 
		 *  @param {BPM=} bpm 
		 *  @return {number}               seconds
		 */
		Tone.prototype.ticksToSeconds = function(ticks, bpm){
			if (this.isUndef(Tone.Transport)){
				return 0;
			}
			ticks = parseFloat(ticks);
			bpm = this.defaultArg(bpm, getTransportBpm());
			var tickTime = (60/bpm) / Tone.Transport.PPQ;
			return tickTime * ticks;
		};
	
		/**
		 *  Convert a frequency into seconds.
		 *  Accepts numbers and strings: i.e. "10hz" or 
		 *  10 both return 0.1. 
		 *  
		 *  @param  {Frequency} freq 
		 *  @return {number}      
		 */
		Tone.prototype.frequencyToSeconds = function(freq){
			return 1 / parseFloat(freq);
		};
	
		/**
		 *  Convert a sample count to seconds.
		 *  @param  {number} samples 
		 *  @return {number}         
		 */
		Tone.prototype.samplesToSeconds = function(samples){
			return samples / this.context.sampleRate;
		};
	
		/**
		 *  Convert from seconds to samples. 
		 *  @param  {number} seconds 
		 *  @return {number} The number of samples        
		 */
		Tone.prototype.secondsToSamples = function(seconds){
			return seconds * this.context.sampleRate;
		};
	
		///////////////////////////////////////////////////////////////////////////
		//	FROM SECOND CONVERSIONS
		///////////////////////////////////////////////////////////////////////////
	
		/**
		 *  Convert seconds to transportTime in the form 
		 *  	"measures:quarters:sixteenths"
		 *
		 *  @param {Number} seconds 
		 *  @param {BPM=} bpm 
		 *  @param {Number=} timeSignature
		 *  @return {TransportTime}  
		 */
		Tone.prototype.secondsToTransportTime = function(seconds, bpm, timeSignature){
			bpm = this.defaultArg(bpm, getTransportBpm());
			timeSignature = this.defaultArg(timeSignature, getTransportTimeSignature());
			var quarterTime = 60/bpm;
			var quarters = seconds / quarterTime;
			var measures = Math.floor(quarters / timeSignature);
			var sixteenths = (quarters % 1) * 4;
			quarters = Math.floor(quarters) % timeSignature;
			var progress = [measures, quarters, sixteenths];
			return progress.join(":");
		};
	
		/**
		 *  Convert a number in seconds to a frequency.
		 *  @param  {number} seconds 
		 *  @return {number}         
		 */
		Tone.prototype.secondsToFrequency = function(seconds){
			return 1/seconds;
		};
	
		///////////////////////////////////////////////////////////////////////////
		//	GENERALIZED CONVERSIONS
		///////////////////////////////////////////////////////////////////////////
	
		/**
		 *  Convert seconds to the closest transportTime in the form 
		 *  	measures:quarters:sixteenths
		 *
		 *  @method toTransportTime
		 *  
		 *  @param {Time} time 
		 *  @param {BPM=} bpm 
		 *  @param {number=} timeSignature
		 *  @return {TransportTime}  
		 *  
		 *  @lends Tone.prototype.toTransportTime
		 */
		Tone.prototype.toTransportTime = function(time, bpm, timeSignature){
			var seconds = this.toSeconds(time);
			return this.secondsToTransportTime(seconds, bpm, timeSignature);
		};
	
		/**
		 *  Convert a frequency representation into a number.
		 *  	
		 *  @param  {Frequency} freq 
		 *  @param {number=} 	now 	if passed in, this number will be 
		 *                        		used for all 'now' relative timings
		 *  @return {number}      the frequency in hertz
		 */
		Tone.prototype.toFrequency = function(freq, now){
			if (this.isFrequency(freq)){
				return parseFloat(freq);
			} else if (this.isNotation(freq) || this.isTransportTime(freq)) {
				return this.secondsToFrequency(this.toSeconds(freq, now));
			} else if (this.isNote(freq)){
				return this.noteToFrequency(freq);
			} else {
				return freq;
			}
		};
	
		/**
		 *  Convert the time representation into ticks.
		 *  Now-Relative timing will be relative to the current
		 *  Tone.Transport.ticks. 
		 *  @param  {Time} time
		 *  @return {Ticks}   
		 */
		Tone.prototype.toTicks = function(time){
			if (this.isUndef(Tone.Transport)){
				return 0;
			}
			var bpm = Tone.Transport.bpm.value;
			//get the seconds
			var plusNow = 0;
			if (this.isNowRelative(time)){
				time = time.replace("+", "");
				plusNow = Tone.Transport.ticks;
			} else if (this.isUndef(time)){
				return Tone.Transport.ticks;
			}
			var seconds = this.toSeconds(time);
			var quarter = 60/bpm;
			var quarters = seconds / quarter;
			var tickNum = quarters * Tone.Transport.PPQ;
			//align the tick value
			return Math.round(tickNum + plusNow);
		};
	
		/**
		 *  convert a time into samples
		 *  
		 *  @param  {Time} time
		 *  @return {number}         
		 */
		Tone.prototype.toSamples = function(time){
			var seconds = this.toSeconds(time);
			return Math.round(seconds * this.context.sampleRate);
		};
	
		/**
		 *  Convert Time into seconds.
		 *  
		 *  Unlike the method which it overrides, this takes into account 
		 *  transporttime and musical notation.
		 *
		 *  Time : 1.40
		 *  Notation: 4n|1m|2t
		 *  TransportTime: 2:4:1 (measure:quarters:sixteens)
		 *  Now Relative: +3n
		 *  Math: 3n+16n or even complicated expressions ((3n*2)/6 + 1)
		 *
		 *  @override
		 *  @param  {Time} time       
		 *  @param {number=} 	now 	if passed in, this number will be 
		 *                        		used for all 'now' relative timings
		 *  @return {number} 
		 */
		Tone.prototype.toSeconds = function(time, now){
			now = this.defaultArg(now, this.now());
			if (this.isNumber(time)){
				return time; //assuming that it's seconds
			} else if (this.isString(time)){
				var plusTime = 0;
				if(this.isNowRelative(time)) {
					time = time.replace("+", "");
					plusTime = now;
				} 
				var betweenParens = time.match(/\(([^)(]+)\)/g);
				if (betweenParens){
					//evaluate the expressions between the parenthesis
					for (var j = 0; j < betweenParens.length; j++){
						//remove the parens
						var symbol = betweenParens[j].replace(/[\(\)]/g, "");
						var symbolVal = this.toSeconds(symbol);
						time = time.replace(betweenParens[j], symbolVal);
					}
				}
				//test if it is quantized
				if (time.indexOf("@") !== -1){
					var quantizationSplit = time.split("@");
					if (!this.isUndef(Tone.Transport)){
						var toQuantize = quantizationSplit[0].trim();
						//if there's no argument it should be evaluated as the current time
						if (toQuantize === ""){
							toQuantize = undefined;
						} 
						//if it's now-relative, it should be evaluated by `quantize`
						if (plusTime > 0){
							toQuantize = "+" + toQuantize;
							plusTime = 0;
						}
						var subdivision = quantizationSplit[1].trim();
						time = Tone.Transport.quantize(toQuantize, subdivision);
					} else {
						throw new Error("quantization requires Tone.Transport");
					}
				} else {
					var components = time.split(/[\(\)\-\+\/\*]/);
					if (components.length > 1){
						var originalTime = time;
						for(var i = 0; i < components.length; i++){
							var symb = components[i].trim();
							if (symb !== ""){
								var val = this.toSeconds(symb);
								time = time.replace(symb, val);
							}
						}
						try {
							//eval is evil
							time = eval(time); // jshint ignore:line
						} catch (e){
							throw new EvalError("cannot evaluate Time: "+originalTime);
						}
					} else if (this.isNotation(time)){
						time = this.notationToSeconds(time);
					} else if (this.isTransportTime(time)){
						time = this.transportTimeToSeconds(time);
					} else if (this.isFrequency(time)){
						time = this.frequencyToSeconds(time);
					} else if (this.isTicks(time)){
						time = this.ticksToSeconds(time);
					} else {
						time = parseFloat(time);
					}
				}
				return time + plusTime;
			} else {
				return now;
			}
		};
	
	
		/**
		 *  Convert a Time to Notation. Values will be thresholded to the nearest 128th note. 
		 *  @param {Time} time 
		 *  @param {BPM=} bpm 
		 *  @param {number=} timeSignature
		 *  @return {Notation}  
		 */
		Tone.prototype.toNotation = function(time, bpm, timeSignature){
			var testNotations = ["1m", "2n", "4n", "8n", "16n", "32n", "64n", "128n"];
			var retNotation = toNotationHelper.call(this, time, bpm, timeSignature, testNotations);
			//try the same thing but with tripelets
			var testTripletNotations = ["1m", "2n", "2t", "4n", "4t", "8n", "8t", "16n", "16t", "32n", "32t", "64n", "64t", "128n"];
			var retTripletNotation = toNotationHelper.call(this, time, bpm, timeSignature, testTripletNotations);
			//choose the simpler expression of the two
			if (retTripletNotation.split("+").length < retNotation.split("+").length){
				return retTripletNotation;
			} else {
				return retNotation;
			}
		};
	
		/**
		 *  Helper method for Tone.toNotation
		 *  @private
		 */
		function toNotationHelper(time, bpm, timeSignature, testNotations){
			var seconds = this.toSeconds(time);
			var threshold = this.notationToSeconds(testNotations[testNotations.length - 1], bpm, timeSignature);
			var retNotation = "";
			for (var i = 0; i < testNotations.length; i++){
				var notationTime = this.notationToSeconds(testNotations[i], bpm, timeSignature);
				//account for floating point errors (i.e. round up if the value is 0.999999)
				var multiple = seconds / notationTime;
				var floatingPointError = 0.000001;
				if (1 - multiple % 1 < floatingPointError){
					multiple += floatingPointError;
				}
				multiple = Math.floor(multiple);
				if (multiple > 0){
					if (multiple === 1){
						retNotation += testNotations[i];
					} else {
						retNotation += multiple.toString() + "*" + testNotations[i];
					}
					seconds -= multiple * notationTime;
					if (seconds < threshold){
						break;
					} else {
						retNotation += " + ";
					}
				}
			}
			if (retNotation === ""){
				retNotation = "0";
			}
			return retNotation;
		}
	
		/**
		 *  Convert the given value from the type specified by units
		 *  into a number.
		 *  @param  {*} val the value to convert
		 *  @return {Number}     the number which the value should be set to
		 */
		Tone.prototype.fromUnits = function(val, units){
			if (this.convert || this.isUndef(this.convert)){
				switch(units){
					case Tone.Type.Time: 
						return this.toSeconds(val);
					case Tone.Type.Frequency: 
						return this.toFrequency(val);
					case Tone.Type.Decibels: 
						return this.dbToGain(val);
					case Tone.Type.NormalRange: 
						return Math.min(Math.max(val, 0), 1);
					case Tone.Type.AudioRange: 
						return Math.min(Math.max(val, -1), 1);
					case Tone.Type.Positive: 
						return Math.max(val, 0);
					default:
						return val;
				}
			} else {
				return val;
			}
		};
	
		/**
		 * Convert a number to the specified units.
		 * @param  {number} val the value to convert
		 * @return {number}
		 */
		Tone.prototype.toUnits = function(val, units){
			if (this.convert || this.isUndef(this.convert)){
				switch(units){
					case Tone.Type.Decibels: 
						return this.gainToDb(val);
					default:
						return val;
				}
			} else {
				return val;
			}
		};
	
		///////////////////////////////////////////////////////////////////////////
		//	FREQUENCY CONVERSIONS
		///////////////////////////////////////////////////////////////////////////
	
		/**
		 *  Note to scale index
		 *  @type  {Object}
		 */
		var noteToScaleIndex = {
			"cbb" : -2, "cb" : -1, "c" : 0,  "c#" : 1,  "cx" : 2, 
			"dbb" : 0,  "db" : 1,  "d" : 2,  "d#" : 3,  "dx" : 4,
			"ebb" : 2,  "eb" : 3,  "e" : 4,  "e#" : 5,  "ex" : 6, 
			"fbb" : 3,  "fb" : 4,  "f" : 5,  "f#" : 6,  "fx" : 7,
			"gbb" : 5,  "gb" : 6,  "g" : 7,  "g#" : 8,  "gx" : 9,
			"abb" : 7,  "ab" : 8,  "a" : 9,  "a#" : 10, "ax" : 11,
			"bbb" : 9,  "bb" : 10, "b" : 11, "b#" : 12, "bx" : 13,
		};
	
		/**
		 *  scale index to note (sharps)
		 *  @type  {Array}
		 */
		var scaleIndexToNote = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
	
		/**
		 *  The [concert pitch](https://en.wikipedia.org/wiki/Concert_pitch, 
		 *  A4's values in Hertz. 
		 *  @type {Frequency}
		 *  @static
		 */
		Tone.A4 = 440;
	
		/**
		 *  Convert a note name to frequency. 
		 *  @param  {String} note
		 *  @return {number}     
		 *  @example
		 * var freq = tone.noteToFrequency("A4"); //returns 440
		 */
		Tone.prototype.noteToFrequency = function(note){
			//break apart the note by frequency and octave
			var parts = note.split(/(-?\d+)/);
			if (parts.length === 3){
				var index = noteToScaleIndex[parts[0].toLowerCase()];
				var octave = parts[1];
				var noteNumber = index + (parseInt(octave, 10) + 1) * 12;
				return this.midiToFrequency(noteNumber);
			} else {
				return 0;
			}
		};
	
		/**
		 *  Convert a frequency to a note name (i.e. A4, C#5).
		 *  @param  {number} freq
		 *  @return {String}         
		 */
		Tone.prototype.frequencyToNote = function(freq){
			var log = Math.log(freq / Tone.A4) / Math.LN2;
			var noteNumber = Math.round(12 * log) + 57;
			var octave = Math.floor(noteNumber/12);
			if(octave < 0){
				noteNumber += -12 * octave;
			}
			var noteName = scaleIndexToNote[noteNumber % 12];
			return noteName + octave.toString();
		};
	
		/**
		 *  Convert an interval (in semitones) to a frequency ratio.
		 *
		 *  @param  {Interval} interval the number of semitones above the base note
		 *  @return {number}          the frequency ratio
		 *  @example
		 * tone.intervalToFrequencyRatio(0); // returns 1
		 * tone.intervalToFrequencyRatio(12); // returns 2
		 */
		Tone.prototype.intervalToFrequencyRatio = function(interval){
			return Math.pow(2,(interval/12));
		};
	
		/**
		 *  Convert a midi note number into a note name. 
		 *
		 *  @param  {MIDI} midiNumber the midi note number
		 *  @return {String}            the note's name and octave
		 *  @example
		 * tone.midiToNote(60); // returns "C3"
		 */
		Tone.prototype.midiToNote = function(midiNumber){
			var octave = Math.floor(midiNumber / 12) - 1;
			var note = midiNumber % 12;
			return scaleIndexToNote[note] + octave;
		};
	
		/**
		 *  Convert a note to it's midi value. 
		 *
		 *  @param  {String} note the note name (i.e. "C3")
		 *  @return {MIDI} the midi value of that note
		 *  @example
		 * tone.noteToMidi("C3"); // returns 60
		 */
		Tone.prototype.noteToMidi = function(note){
			//break apart the note by frequency and octave
			var parts = note.split(/(\d+)/);
			if (parts.length === 3){
				var index = noteToScaleIndex[parts[0].toLowerCase()];
				var octave = parts[1];
				return index + (parseInt(octave, 10) + 1) * 12;
			} else {
				return 0;
			}
		};
	
		/**
		 *  Convert a MIDI note to frequency value. 
		 *
		 *  @param  {MIDI} midi The midi number to convert.
		 *  @return {Frequency} the corresponding frequency value
		 *  @example
		 * tone.midiToFrequency(57); // returns 440
		 */
		Tone.prototype.midiToFrequency = function(midi){
			return Tone.A4 * Math.pow(2, (midi - 69) / 12);
		};
	
		return Tone;
	}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));

/***/ }),
/* 36 */
/*!************************************************!*\
  !*** ./third_party/Tone.js/Tone/core/Param.js ***!
  \************************************************/
/***/ (function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__(/*! Tone/core/Tone */ 26), __webpack_require__(/*! Tone/core/Type */ 35)], __WEBPACK_AMD_DEFINE_RESULT__ = function(Tone){
	
		"use strict";
	
		/**
		 *  @class Tone.Param wraps the native Web Audio's AudioParam to provide
		 *         additional unit conversion functionality. It also
		 *         serves as a base-class for classes which have a single,
		 *         automatable parameter. 
		 *  @extends {Tone}
		 *  @param  {AudioParam}  param  The parameter to wrap.
		 *  @param  {Tone.Type} units The units of the audio param.
		 *  @param  {Boolean} convert If the param should be converted.
		 */
		Tone.Param = function(){
	
			var options = this.optionsObject(arguments, ["param", "units", "convert"], Tone.Param.defaults);
	
			/**
			 *  The native parameter to control
			 *  @type  {AudioParam}
			 *  @private
			 */
			this._param = this.input = options.param;
	
			/**
			 *  The units of the parameter
			 *  @type {Tone.Type}
			 */
			this.units = options.units;
	
			/**
			 *  If the value should be converted or not
			 *  @type {Boolean}
			 */
			this.convert = options.convert;
	
			/**
			 *  True if the signal value is being overridden by 
			 *  a connected signal.
			 *  @readOnly
			 *  @type  {boolean}
			 *  @private
			 */
			this.overridden = false;
	
			if (!this.isUndef(options.value)){
				this.value = options.value;
			}
		};
	
		Tone.extend(Tone.Param);
		
		/**
		 *  Defaults
		 *  @type  {Object}
		 *  @const
		 */
		Tone.Param.defaults = {
			"units" : Tone.Type.Default,
			"convert" : true,
			"param" : undefined
		};
	
		/**
		 * The current value of the parameter. 
		 * @memberOf Tone.Param#
		 * @type {Number}
		 * @name value
		 */
		Object.defineProperty(Tone.Param.prototype, "value", {
			get : function(){
				return this._toUnits(this._param.value);
			},
			set : function(value){
				var convertedVal = this._fromUnits(value);
				this._param.value = convertedVal;
			}
		});
	
		/**
		 *  Convert the given value from the type specified by Tone.Param.units
		 *  into the destination value (such as Gain or Frequency).
		 *  @private
		 *  @param  {*} val the value to convert
		 *  @return {number}     the number which the value should be set to
		 */
		Tone.Param.prototype._fromUnits = function(val){
			if (this.convert || this.isUndef(this.convert)){
				switch(this.units){
					case Tone.Type.Time: 
						return this.toSeconds(val);
					case Tone.Type.Frequency: 
						return this.toFrequency(val);
					case Tone.Type.Decibels: 
						return this.dbToGain(val);
					case Tone.Type.NormalRange: 
						return Math.min(Math.max(val, 0), 1);
					case Tone.Type.AudioRange: 
						return Math.min(Math.max(val, -1), 1);
					case Tone.Type.Positive: 
						return Math.max(val, 0);
					default:
						return val;
				}
			} else {
				return val;
			}
		};
	
		/**
		 * Convert the parameters value into the units specified by Tone.Param.units.
		 * @private
		 * @param  {number} val the value to convert
		 * @return {number}
		 */
		Tone.Param.prototype._toUnits = function(val){
			if (this.convert || this.isUndef(this.convert)){
				switch(this.units){
					case Tone.Type.Decibels: 
						return this.gainToDb(val);
					default:
						return val;
				}
			} else {
				return val;
			}
		};
	
		/**
		 *  the minimum output value
		 *  @type {Number}
		 *  @private
		 */
		Tone.Param.prototype._minOutput = 0.00001;
	
		/**
		 *  Schedules a parameter value change at the given time.
		 *  @param {*}	value The value to set the signal.
		 *  @param {Time}  time The time when the change should occur.
		 *  @returns {Tone.Param} this
		 *  @example
		 * //set the frequency to "G4" in exactly 1 second from now. 
		 * freq.setValueAtTime("G4", "+1");
		 */
		Tone.Param.prototype.setValueAtTime = function(value, time){
			value = this._fromUnits(value);
			this._param.setValueAtTime(value, this.toSeconds(time));
			return this;
		};
	
		/**
		 *  Creates a schedule point with the current value at the current time.
		 *  This is useful for creating an automation anchor point in order to 
		 *  schedule changes from the current value. 
		 *
		 *  @param {number=} now (Optionally) pass the now value in. 
		 *  @returns {Tone.Param} this
		 */
		Tone.Param.prototype.setRampPoint = function(now){
			now = this.defaultArg(now, this.now());
			var currentVal = this._param.value;
			this._param.setValueAtTime(currentVal, now);
			return this;
		};
	
		/**
		 *  Schedules a linear continuous change in parameter value from the 
		 *  previous scheduled parameter value to the given value.
		 *  
		 *  @param  {number} value   
		 *  @param  {Time} endTime 
		 *  @returns {Tone.Param} this
		 */
		Tone.Param.prototype.linearRampToValueAtTime = function(value, endTime){
			value = this._fromUnits(value);
			this._param.linearRampToValueAtTime(value, this.toSeconds(endTime));
			return this;
		};
	
		/**
		 *  Schedules an exponential continuous change in parameter value from 
		 *  the previous scheduled parameter value to the given value.
		 *  
		 *  @param  {number} value   
		 *  @param  {Time} endTime 
		 *  @returns {Tone.Param} this
		 */
		Tone.Param.prototype.exponentialRampToValueAtTime = function(value, endTime){
			value = this._fromUnits(value);
			value = Math.max(this._minOutput, value);
			this._param.exponentialRampToValueAtTime(value, this.toSeconds(endTime));
			return this;
		};
	
		/**
		 *  Schedules an exponential continuous change in parameter value from 
		 *  the current time and current value to the given value over the 
		 *  duration of the rampTime.
		 *  
		 *  @param  {number} value   The value to ramp to.
		 *  @param  {Time} rampTime the time that it takes the 
		 *                               value to ramp from it's current value
		 *  @returns {Tone.Param} this
		 *  @example
		 * //exponentially ramp to the value 2 over 4 seconds. 
		 * signal.exponentialRampToValue(2, 4);
		 */
		Tone.Param.prototype.exponentialRampToValue = function(value, rampTime){
			var now = this.now();
			// exponentialRampToValueAt cannot ever ramp from 0, apparently.
			// More info: https://bugzilla.mozilla.org/show_bug.cgi?id=1125600#c2
			var currentVal = this.value;
			this.setValueAtTime(Math.max(currentVal, this._minOutput), now);
			this.exponentialRampToValueAtTime(value, now + this.toSeconds(rampTime));
			return this;
		};
	
		/**
		 *  Schedules an linear continuous change in parameter value from 
		 *  the current time and current value to the given value over the 
		 *  duration of the rampTime.
		 *  
		 *  @param  {number} value   The value to ramp to.
		 *  @param  {Time} rampTime the time that it takes the 
		 *                               value to ramp from it's current value
		 *  @returns {Tone.Param} this
		 *  @example
		 * //linearly ramp to the value 4 over 3 seconds. 
		 * signal.linearRampToValue(4, 3);
		 */
		Tone.Param.prototype.linearRampToValue = function(value, rampTime){
			var now = this.now();
			this.setRampPoint(now);
			this.linearRampToValueAtTime(value, now + this.toSeconds(rampTime));
			return this;
		};
	
		/**
		 *  Start exponentially approaching the target value at the given time with
		 *  a rate having the given time constant.
		 *  @param {number} value        
		 *  @param {Time} startTime    
		 *  @param {number} timeConstant 
		 *  @returns {Tone.Param} this 
		 */
		Tone.Param.prototype.setTargetAtTime = function(value, startTime, timeConstant){
			value = this._fromUnits(value);
			// The value will never be able to approach without timeConstant > 0.
			// http://www.w3.org/TR/webaudio/#dfn-setTargetAtTime, where the equation
			// is described. 0 results in a division by 0.
			value = Math.max(this._minOutput, value);
			timeConstant = Math.max(this._minOutput, timeConstant);
			this._param.setTargetAtTime(value, this.toSeconds(startTime), timeConstant);
			return this;
		};
	
		/**
		 *  Sets an array of arbitrary parameter values starting at the given time
		 *  for the given duration.
		 *  	
		 *  @param {Array} values    
		 *  @param {Time} startTime 
		 *  @param {Time} duration  
		 *  @returns {Tone.Param} this
		 */
		Tone.Param.prototype.setValueCurveAtTime = function(values, startTime, duration){
			for (var i = 0; i < values.length; i++){
				values[i] = this._fromUnits(values[i]);
			}
			this._param.setValueCurveAtTime(values, this.toSeconds(startTime), this.toSeconds(duration));
			return this;
		};
	
		/**
		 *  Cancels all scheduled parameter changes with times greater than or 
		 *  equal to startTime.
		 *  
		 *  @param  {Time} startTime
		 *  @returns {Tone.Param} this
		 */
		Tone.Param.prototype.cancelScheduledValues = function(startTime){
			this._param.cancelScheduledValues(this.toSeconds(startTime));
			return this;
		};
	
		/**
		 *  Ramps to the given value over the duration of the rampTime. 
		 *  Automatically selects the best ramp type (exponential or linear)
		 *  depending on the `units` of the signal
		 *  
		 *  @param  {number} value   
		 *  @param  {Time} rampTime the time that it takes the 
		 *                               value to ramp from it's current value
		 *  @returns {Tone.Param} this
		 *  @example
		 * //ramp to the value either linearly or exponentially 
		 * //depending on the "units" value of the signal
		 * signal.rampTo(0, 10);
		 */
		Tone.Param.prototype.rampTo = function(value, rampTime){
			rampTime = this.defaultArg(rampTime, 0);
			if (this.units === Tone.Type.Frequency || this.units === Tone.Type.BPM){
				this.exponentialRampToValue(value, rampTime);
			} else {
				this.linearRampToValue(value, rampTime);
			}
			return this;
		};
	
		/**
		 *  Clean up
		 *  @returns {Tone.Param} this
		 */
		Tone.Param.prototype.dispose = function(){
			Tone.prototype.dispose.call(this);
			this._param = null;
			return this;
		};
	
		return Tone.Param;
	}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));

/***/ }),
/* 37 */
/*!***********************************************!*\
  !*** ./third_party/Tone.js/Tone/core/Gain.js ***!
  \***********************************************/
/***/ (function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__(/*! Tone/core/Tone */ 26), __webpack_require__(/*! Tone/core/Param */ 36), __webpack_require__(/*! Tone/core/Type */ 35)], __WEBPACK_AMD_DEFINE_RESULT__ = function (Tone) {
	
		"use strict";
	
		/**
		 *  @class A thin wrapper around the Native Web Audio GainNode.
		 *         The GainNode is a basic building block of the Web Audio
		 *         API and is useful for routing audio and adjusting gains. 
		 *  @extends {Tone}
		 *  @param  {Number=}  gain  The initial gain of the GainNode
		 *  @param {Tone.Type=} units The units of the gain parameter. 
		 */
		Tone.Gain = function(){
	
			var options = this.optionsObject(arguments, ["gain", "units"], Tone.Gain.defaults);
	
			/**
			 *  The GainNode
			 *  @type  {GainNode}
			 *  @private
			 */
			this.input = this.output = this._gainNode = this.context.createGain();
	
			/**
			 *  The gain parameter of the gain node.
			 *  @type {AudioParam}
			 *  @signal
			 */
			this.gain = new Tone.Param({
				"param" : this._gainNode.gain, 
				"units" : options.units,
				"value" : options.gain,
				"convert" : options.convert
			});
			this._readOnly("gain");
		};
	
		Tone.extend(Tone.Gain);
	
		/**
		 *  The defaults
		 *  @const
		 *  @type  {Object}
		 */
		Tone.Gain.defaults = {
			"gain" : 1,
			"convert" : true,
		};
	
		/**
		 *  Clean up.
		 *  @return  {Tone.Gain}  this
		 */
		Tone.Gain.prototype.dispose = function(){
			Tone.Param.prototype.dispose.call(this);
			this._gainNode.disconnect();
			this._gainNode = null;
			this._writable("gain");
			this.gain.dispose();
			this.gain = null;
		};
	
		return Tone.Gain;
	}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));

/***/ }),
/* 38 */
/*!***************************************************!*\
  !*** ./third_party/Tone.js/Tone/core/Timeline.js ***!
  \***************************************************/
/***/ (function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__(/*! Tone/core/Tone */ 26), __webpack_require__(/*! Tone/core/Type */ 35)], __WEBPACK_AMD_DEFINE_RESULT__ = function (Tone) {
	
		"use strict";
	
		/**
		 *  @class A Timeline class for scheduling and maintaining state
		 *         along a timeline. All events must have a "time" property. 
		 *         Internally, events are stored in time order for fast 
		 *         retrieval.
		 *  @extends {Tone}
		 *  @param {Positive} [memory=Infinity] The number of previous events that are retained.
		 */
		Tone.Timeline = function(){
	
			var options = this.optionsObject(arguments, ["memory"], Tone.Timeline.defaults);
	
			/**
			 *  The array of scheduled timeline events
			 *  @type  {Array}
			 *  @private
			 */
			this._timeline = [];
	
			/**
			 *  An array of items to remove from the list. 
			 *  @type {Array}
			 *  @private
			 */
			this._toRemove = [];
	
			/**
			 *  Flag if the tieline is mid iteration
			 *  @private
			 *  @type {Boolean}
			 */
			this._iterating = false;
	
			/**
			 *  The memory of the timeline, i.e.
			 *  how many events in the past it will retain
			 *  @type {Positive}
			 */
			this.memory = options.memory;
		};
	
		Tone.extend(Tone.Timeline);
	
		/**
		 *  the default parameters
		 *  @static
		 *  @const
		 */
		Tone.Timeline.defaults = {
			"memory" : Infinity
		};
	
		/**
		 *  The number of items in the timeline.
		 *  @type {Number}
		 *  @memberOf Tone.Timeline#
		 *  @name length
		 *  @readOnly
		 */
		Object.defineProperty(Tone.Timeline.prototype, "length", {
			get : function(){
				return this._timeline.length;
			}
		});
	
		/**
		 *  Insert an event object onto the timeline. Events must have a "time" attribute.
		 *  @param  {Object}  event  The event object to insert into the 
		 *                           timeline. 
		 *  @returns {Tone.Timeline} this
		 */
		Tone.Timeline.prototype.addEvent = function(event){
			//the event needs to have a time attribute
			if (this.isUndef(event.time)){
				throw new Error("events must have a time attribute");
			}
			event.time = this.toSeconds(event.time);
			if (this._timeline.length){
				var index = this._search(event.time);
				this._timeline.splice(index + 1, 0, event);
			} else {
				this._timeline.push(event);			
			}
			//if the length is more than the memory, remove the previous ones
			if (this.length > this.memory){
				var diff = this.length - this.memory;
				this._timeline.splice(0, diff);
			}
			return this;
		};
	
		/**
		 *  Remove an event from the timeline.
		 *  @param  {Object}  event  The event object to remove from the list.
		 *  @returns {Tone.Timeline} this
		 */
		Tone.Timeline.prototype.removeEvent = function(event){
			if (this._iterating){
				this._toRemove.push(event);
			} else {
				var index = this._timeline.indexOf(event);
				if (index !== -1){
					this._timeline.splice(index, 1);
				}
			}
			return this;
		};
	
		/**
		 *  Get the event whose time is less than or equal to the given time.
		 *  @param  {Number}  time  The time to query.
		 *  @returns {Object} The event object set after that time.
		 */
		Tone.Timeline.prototype.getEvent = function(time){
			time = this.toSeconds(time);
			var index = this._search(time);
			if (index !== -1){
				return this._timeline[index];
			} else {
				return null;
			}
		};
	
		/**
		 *  Get the event which is scheduled after the given time.
		 *  @param  {Number}  time  The time to query.
		 *  @returns {Object} The event object after the given time
		 */
		Tone.Timeline.prototype.getEventAfter = function(time){
			time = this.toSeconds(time);
			var index = this._search(time);
			if (index + 1 < this._timeline.length){
				return this._timeline[index + 1];
			} else {
				return null;
			}
		};
	
		/**
		 *  Get the event before the event at the given time.
		 *  @param  {Number}  time  The time to query.
		 *  @returns {Object} The event object before the given time
		 */
		Tone.Timeline.prototype.getEventBefore = function(time){
			time = this.toSeconds(time);
			var index = this._search(time);
			if (index - 1 >= 0){
				return this._timeline[index - 1];
			} else {
				return null;
			}
		};
	
		/**
		 *  Cancel events after the given time
		 *  @param  {Time}  time  The time to query.
		 *  @returns {Tone.Timeline} this
		 */
		Tone.Timeline.prototype.cancel = function(after){
			if (this._timeline.length > 1){
				after = this.toSeconds(after);
				var index = this._search(after);
				if (index >= 0){
					this._timeline = this._timeline.slice(0, index);
				} else {
					this._timeline = [];
				}
			} else if (this._timeline.length === 1){
				//the first item's time
				if (this._timeline[0].time >= after){
					this._timeline = [];
				}
			}
			return this;
		};
	
		/**
		 *  Cancel events before or equal to the given time.
		 *  @param  {Time}  time  The time to cancel before.
		 *  @returns {Tone.Timeline} this
		 */
		Tone.Timeline.prototype.cancelBefore = function(time){
			if (this._timeline.length){
				time = this.toSeconds(time);
				var index = this._search(time);
				if (index >= 0){
					this._timeline = this._timeline.slice(index + 1);
				}
			}
			return this;
		};
	
		/**
		 *  Does a binary serach on the timeline array and returns the 
		 *  event which is after or equal to the time.
		 *  @param  {Number}  time  
		 *  @return  {Number} the index in the timeline array 
		 *  @private
		 */
		Tone.Timeline.prototype._search = function(time){
			var beginning = 0;
			var len = this._timeline.length;
			var end = len;
			// continue searching while [imin,imax] is not empty
			while (beginning <= end && beginning < len){
				// calculate the midpoint for roughly equal partition
				var midPoint = Math.floor(beginning + (end - beginning) / 2);
				var event = this._timeline[midPoint];
				if (event.time === time){
					//choose the last one that has the same time
					for (var i = midPoint; i < this._timeline.length; i++){
						var testEvent = this._timeline[i];
						if (testEvent.time === time){
							midPoint = i;
						}
					}
					return midPoint;
				} else if (event.time > time){
					//search lower
					end = midPoint - 1;
				} else if (event.time < time){
					//search upper
					beginning = midPoint + 1;
				} 
			}
			return beginning - 1;
		};
	
		/**
		 *  Internal iterator. Applies extra safety checks for 
		 *  removing items from the array. 
		 *  @param  {Function}  callback 
		 *  @param  {Number=}    lowerBound     
		 *  @param  {Number=}    upperBound    
		 *  @private
		 */
		Tone.Timeline.prototype._iterate = function(callback, lowerBound, upperBound){
			this._iterating = true;
			lowerBound = this.defaultArg(lowerBound, 0);
			upperBound = this.defaultArg(upperBound, this._timeline.length - 1);
			for (var i = lowerBound; i <= upperBound; i++){
				callback(this._timeline[i]);
			}
			this._iterating = false;
			if (this._toRemove.length > 0){
				for (var j = 0; j < this._toRemove.length; j++){
					var index = this._timeline.indexOf(this._toRemove[j]);
					if (index !== -1){
						this._timeline.splice(index, 1);
					}
				}
				this._toRemove = [];
			}
		};
	
		/**
		 *  Iterate over everything in the array
		 *  @param  {Function}  callback The callback to invoke with every item
		 *  @returns {Tone.Timeline} this
		 */
		Tone.Timeline.prototype.forEach = function(callback){
			this._iterate(callback);
			return this;
		};
	
		/**
		 *  Iterate over everything in the array at or before the given time.
		 *  @param  {Time}  time The time to check if items are before
		 *  @param  {Function}  callback The callback to invoke with every item
		 *  @returns {Tone.Timeline} this
		 */
		Tone.Timeline.prototype.forEachBefore = function(time, callback){
			//iterate over the items in reverse so that removing an item doesn't break things
			time = this.toSeconds(time);
			var upperBound = this._search(time);
			if (upperBound !== -1){
				this._iterate(callback, 0, upperBound);
			}
			return this;
		};
	
		/**
		 *  Iterate over everything in the array after the given time.
		 *  @param  {Time}  time The time to check if items are before
		 *  @param  {Function}  callback The callback to invoke with every item
		 *  @returns {Tone.Timeline} this
		 */
		Tone.Timeline.prototype.forEachAfter = function(time, callback){
			//iterate over the items in reverse so that removing an item doesn't break things
			time = this.toSeconds(time);
			var lowerBound = this._search(time);
			this._iterate(callback, lowerBound + 1);
			return this;
		};
	
		/**
		 *  Iterate over everything in the array at or after the given time. Similar to 
		 *  forEachAfter, but includes the item(s) at the given time.
		 *  @param  {Time}  time The time to check if items are before
		 *  @param  {Function}  callback The callback to invoke with every item
		 *  @returns {Tone.Timeline} this
		 */
		Tone.Timeline.prototype.forEachFrom = function(time, callback){
			//iterate over the items in reverse so that removing an item doesn't break things
			time = this.toSeconds(time);
			var lowerBound = this._search(time);
			//work backwards until the event time is less than time
			while (lowerBound >= 0 && this._timeline[lowerBound].time >= time){
				lowerBound--;
			}
			this._iterate(callback, lowerBound + 1);
			return this;
		};
	
		/**
		 *  Iterate over everything in the array at the given time
		 *  @param  {Time}  time The time to check if items are before
		 *  @param  {Function}  callback The callback to invoke with every item
		 *  @returns {Tone.Timeline} this
		 */
		Tone.Timeline.prototype.forEachAtTime = function(time, callback){
			//iterate over the items in reverse so that removing an item doesn't break things
			time = this.toSeconds(time);
			var upperBound = this._search(time);
			if (upperBound !== -1){
				this._iterate(function(event){
					if (event.time === time){
						callback(event);
					} 
				}, 0, upperBound);
			}
			return this;
		};
	
		/**
		 *  Clean up.
		 *  @return  {Tone.Timeline}  this
		 */
		Tone.Timeline.prototype.dispose = function(){
			Tone.prototype.dispose.call(this);
			this._timeline = null;
			this._toRemove = null;
		};
	
		return Tone.Timeline;
	}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));

/***/ }),
/* 39 */
/*!********************************************************!*\
  !*** ./third_party/Tone.js/Tone/core/TimelineState.js ***!
  \********************************************************/
/***/ (function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__(/*! Tone/core/Tone */ 26), __webpack_require__(/*! Tone/core/Timeline */ 38), __webpack_require__(/*! Tone/core/Type */ 35)], __WEBPACK_AMD_DEFINE_RESULT__ = function (Tone) {
	
		"use strict";
	
		/**
		 *  @class  A Timeline State. Provides the methods: <code>setStateAtTime("state", time)</code>
		 *          and <code>getStateAtTime(time)</code>.
		 *
		 *  @extends {Tone.Timeline}
		 *  @param {String} initial The initial state of the TimelineState. 
		 *                          Defaults to <code>undefined</code>
		 */
		Tone.TimelineState = function(initial){
	
			Tone.Timeline.call(this);
	
			/**
			 *  The initial state
			 *  @private
			 *  @type {String}
			 */
			this._initial = initial;
		};
	
		Tone.extend(Tone.TimelineState, Tone.Timeline);
	
		/**
		 *  Returns the scheduled state scheduled before or at
		 *  the given time.
		 *  @param  {Time}  time  The time to query.
		 *  @return  {String}  The name of the state input in setStateAtTime.
		 */
		Tone.TimelineState.prototype.getStateAtTime = function(time){
			var event = this.getEvent(time);
			if (event !== null){
				return event.state;
			} else {
				return this._initial;
			}
		};
	
		/**
		 *  Returns the scheduled state scheduled before or at
		 *  the given time.
		 *  @param  {String}  state The name of the state to set.
		 *  @param  {Time}  time  The time to query.
		 */
		Tone.TimelineState.prototype.setStateAtTime = function(state, time){
			this.addEvent({
				"state" : state,
				"time" : this.toSeconds(time)
			});
		};
	
		return Tone.TimelineState;
	}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));

/***/ }),
/* 40 */
/*!**************************************************!*\
  !*** ./third_party/Tone.js/Tone/core/Emitter.js ***!
  \**************************************************/
/***/ (function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__(/*! Tone/core/Tone */ 26)], __WEBPACK_AMD_DEFINE_RESULT__ = function (Tone) {
	
		"use strict";
	
		/**
		 *  @class Tone.Emitter gives classes which extend it
		 *         the ability to listen for and trigger events. 
		 *         Inspiration and reference from Jerome Etienne's [MicroEvent](https://github.com/jeromeetienne/microevent.js).
		 *         MIT (c) 2011 Jerome Etienne.
		 *         
		 *  @extends {Tone}
		 */
		Tone.Emitter = function(){
			/**
			 *  Contains all of the events.
			 *  @private
			 *  @type  {Object}
			 */
			this._events = {};
		};
	
		Tone.extend(Tone.Emitter);
	
		/**
		 *  Bind a callback to a specific event.
		 *  @param  {String}    event     The name of the event to listen for.
		 *  @param  {Function}  callback  The callback to invoke when the
		 *                                event is triggered
		 *  @return  {Tone.Emitter}    this
		 */
		Tone.Emitter.prototype.on = function(event, callback){
			//split the event
			var events = event.split(/\W+/);
			for (var i = 0; i < events.length; i++){
				var eventName = events[i];
				if (!this._events.hasOwnProperty(eventName)){
					this._events[eventName] = [];
				}
				this._events[eventName].push(callback);
			}
			return this;
		};
	
		/**
		 *  Remove the event listener.
		 *  @param  {String}    event     The event to stop listening to.
		 *  @param  {Function=}  callback  The callback which was bound to 
		 *                                the event with Tone.Emitter.on.
		 *                                If no callback is given, all callbacks
		 *                                events are removed.
		 *  @return  {Tone.Emitter}    this
		 */
		Tone.Emitter.prototype.off = function(event, callback){
			var events = event.split(/\W+/);
			for (var ev = 0; ev < events.length; ev++){
				event = events[ev];
				if (this._events.hasOwnProperty(event)){
					if (Tone.prototype.isUndef(callback)){
						this._events[event] = [];
					} else {
						var eventList = this._events[event];
						for (var i = 0; i < eventList.length; i++){
							if (eventList[i] === callback){
								eventList.splice(i, 1);
							}
						}
					}
				}
			}
			return this;
		};
	
		/**
		 *  Invoke all of the callbacks bound to the event
		 *  with any arguments passed in. 
		 *  @param  {String}  event  The name of the event.
		 *  @param {*...} args The arguments to pass to the functions listening.
		 *  @return  {Tone.Emitter}  this
		 */
		Tone.Emitter.prototype.trigger = function(event){
			if (this._events){
				var args = Array.prototype.slice.call(arguments, 1);
				if (this._events.hasOwnProperty(event)){
					var eventList = this._events[event];
					for (var i = 0, len = eventList.length; i < len; i++){
						eventList[i].apply(this, args);
					}
				}
			}
			return this;
		};
	
		/**
		 *  Add Emitter functions (on/off/trigger) to the object
		 *  @param  {Object|Function}  object  The object or class to extend.
		 */
		Tone.Emitter.mixin = function(object){
			var functions = ["on", "off", "trigger"];
			object._events = {};
			for (var i = 0; i < functions.length; i++){
				var func = functions[i];
				var emitterFunc = Tone.Emitter.prototype[func];
				object[func] = emitterFunc;
			}
		};
	
		/**
		 *  Clean up
		 *  @return  {Tone.Emitter}  this
		 */
		Tone.Emitter.prototype.dispose = function(){
			Tone.prototype.dispose.call(this);
			this._events = null;
			return this;
		};
	
		return Tone.Emitter;
	}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));

/***/ }),
/* 41 */
/*!***********************************************************!*\
  !*** ./third_party/Tone.js/Tone/core/IntervalTimeline.js ***!
  \***********************************************************/
/***/ (function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__(/*! Tone/core/Tone */ 26), __webpack_require__(/*! Tone/core/Type */ 35)], __WEBPACK_AMD_DEFINE_RESULT__ = function (Tone) {
	
		"use strict";
	
		/**
		 *  @class Similar to Tone.Timeline, but all events represent
		 *         intervals with both "time" and "duration" times. The 
		 *         events are placed in a tree structure optimized
		 *         for querying an intersection point with the timeline
		 *         events. Internally uses an [Interval Tree](https://en.wikipedia.org/wiki/Interval_tree)
		 *         to represent the data.
		 *  @extends {Tone}
		 */
		Tone.IntervalTimeline = function(){
	
			/**
			 *  The root node of the inteval tree
			 *  @type  {IntervalNode}
			 *  @private
			 */
			this._root = null;
	
			/**
			 *  Keep track of the length of the timeline.
			 *  @type  {Number}
			 *  @private
			 */
			this._length = 0;
		};
	
		Tone.extend(Tone.IntervalTimeline);
	
		/**
		 *  The event to add to the timeline. All events must 
		 *  have a time and duration value
		 *  @param  {Object}  event  The event to add to the timeline
		 *  @return  {Tone.IntervalTimeline}  this
		 */
		Tone.IntervalTimeline.prototype.addEvent = function(event){
			if (this.isUndef(event.time) || this.isUndef(event.duration)){
				throw new Error("events must have time and duration parameters");
			}
			var node = new IntervalNode(event.time, event.time + event.duration, event);
			if (this._root === null){
				this._root = node;
			} else {
				this._root.insert(node);
			}
			this._length++;
			// Restructure tree to be balanced
			while (node !== null) {
				node.updateHeight();
				node.updateMax();
				this._rebalance(node);
				node = node.parent;
			}
			return this;
		};
	
		/**
		 *  Remove an event from the timeline.
		 *  @param  {Object}  event  The event to remove from the timeline
		 *  @return  {Tone.IntervalTimeline}  this
		 */
		Tone.IntervalTimeline.prototype.removeEvent = function(event){
			if (this._root !== null){
				var results = [];
				this._root.search(event.time, results);
				for (var i = 0; i < results.length; i++){
					var node = results[i];
					if (node.event === event){
						this._removeNode(node);
						this._length--;
						break;
					}
				}
			}
			return this;
		};
	
		/**
		 *  The number of items in the timeline.
		 *  @type {Number}
		 *  @memberOf Tone.IntervalTimeline#
		 *  @name length
		 *  @readOnly
		 */
		Object.defineProperty(Tone.IntervalTimeline.prototype, "length", {
			get : function(){
				return this._length;
			}
		});
	
		/**
		 *  Remove events whose time time is after the given time
		 *  @param  {Time}  time  The time to query.
		 *  @returns {Tone.IntervalTimeline} this
		 */
		Tone.IntervalTimeline.prototype.cancel = function(after){
			after = this.toSeconds(after);
			this.forEachAfter(after, function(event){
				this.removeEvent(event);
			}.bind(this));
			return this;
		};
	
		/**
		 *  Set the root node as the given node
		 *  @param {IntervalNode} node
		 *  @private
		 */
		Tone.IntervalTimeline.prototype._setRoot = function(node){
			this._root = node;
			if (this._root !== null){
				this._root.parent = null;
			}
		};
	
		/**
		 *  Replace the references to the node in the node's parent
		 *  with the replacement node.
		 *  @param  {IntervalNode}  node        
		 *  @param  {IntervalNode}  replacement 
		 *  @private
		 */
		Tone.IntervalTimeline.prototype._replaceNodeInParent = function(node, replacement){
			if (node.parent !== null){
				if (node.isLeftChild()){
					node.parent.left = replacement;
				} else {
					node.parent.right = replacement;
				}
				this._rebalance(node.parent);
			} else {
				this._setRoot(replacement);
			}
		};
	
		/**
		 *  Remove the node from the tree and replace it with 
		 *  a successor which follows the schema.
		 *  @param  {IntervalNode}  node
		 *  @private
		 */
		Tone.IntervalTimeline.prototype._removeNode = function(node){
			if (node.left === null && node.right === null){
				this._replaceNodeInParent(node, null);
			} else if (node.right === null){
				this._replaceNodeInParent(node, node.left);
			} else if (node.left === null){
				this._replaceNodeInParent(node, node.right);
			} else {
				var balance = node.getBalance();
				var replacement, temp;
				if (balance > 0){
					if (node.left.right === null){
						replacement = node.left;
						replacement.right = node.right;
						temp = replacement;
					} else {
						replacement = node.left.right;
						while (replacement.right !== null){
							replacement = replacement.right;
						}
						replacement.parent.right = replacement.left;
						temp = replacement.parent;
						replacement.left = node.left;
						replacement.right = node.right;
					}
				} else {
					if (node.right.left === null){
						replacement = node.right;
						replacement.left = node.left;
						temp = replacement;
					} else {
						replacement = node.right.left;
						while (replacement.left !== null) {
							replacement = replacement.left;
						}
						replacement.parent = replacement.parent;
						replacement.parent.left = replacement.right;
						temp = replacement.parent;
						replacement.left = node.left;
						replacement.right = node.right;
					}
				}
				if (node.parent !== null){
					if (node.isLeftChild()){
						node.parent.left = replacement;
					} else {
						node.parent.right = replacement;
					}
				} else {
					this._setRoot(replacement);
				}
				// this._replaceNodeInParent(node, replacement);
				this._rebalance(temp);
			}
			node.dispose();
		};
	
		/**
		 *  Rotate the tree to the left
		 *  @param  {IntervalNode}  node
		 *  @private
		 */
		Tone.IntervalTimeline.prototype._rotateLeft = function(node){
			var parent = node.parent;
			var isLeftChild = node.isLeftChild();
	
			// Make node.right the new root of this sub tree (instead of node)
			var pivotNode = node.right;
			node.right = pivotNode.left;
			pivotNode.left = node;
	
			if (parent !== null){
				if (isLeftChild){
					parent.left = pivotNode;
				} else{
					parent.right = pivotNode;
				}
			} else{
				this._setRoot(pivotNode);
			}
		};
	
		/**
		 *  Rotate the tree to the right
		 *  @param  {IntervalNode}  node
		 *  @private
		 */
		Tone.IntervalTimeline.prototype._rotateRight = function(node){
			var parent = node.parent;
			var isLeftChild = node.isLeftChild();
	 
			// Make node.left the new root of this sub tree (instead of node)
			var pivotNode = node.left;
			node.left = pivotNode.right;
			pivotNode.right = node;
	
			if (parent !== null){
				if (isLeftChild){
					parent.left = pivotNode;
				} else{
					parent.right = pivotNode;
				}
			} else{
				this._setRoot(pivotNode);
			}
		};
	
		/**
		 *  Balance the BST
		 *  @param  {IntervalNode}  node
		 *  @private
		 */
		Tone.IntervalTimeline.prototype._rebalance = function(node){
			var balance = node.getBalance();
			if (balance > 1){
				if (node.left.getBalance() < 0){
					this._rotateLeft(node.left);
				} else {
					this._rotateRight(node);
				}
			} else if (balance < -1) {
				if (node.right.getBalance() > 0){
					this._rotateRight(node.right);
				} else {
					this._rotateLeft(node);
				}
			}
		};
	
		/**
		 *  Get an event whose time and duration span the give time. Will
		 *  return the match whose "time" value is closest to the given time.
		 *  @param  {Object}  event  The event to add to the timeline
		 *  @return  {Object}  The event which spans the desired time
		 */
		Tone.IntervalTimeline.prototype.getEvent = function(time){
			if (this._root !== null){
				var results = [];
				this._root.search(time, results);
				if (results.length > 0){
					var max = results[0];
					for (var i = 1; i < results.length; i++){
						if (results[i].low > max.low){
							max = results[i];
						}
					}
					return max.event;
				} 
			}
			return null;
		};
	
		/**
		 *  Iterate over everything in the timeline.
		 *  @param  {Function}  callback The callback to invoke with every item
		 *  @returns {Tone.IntervalTimeline} this
		 */
		Tone.IntervalTimeline.prototype.forEach = function(callback){
			if (this._root !== null){
				var allNodes = [];
				if (this._root !== null){
					this._root.traverse(function(node){
						allNodes.push(node);
					});
				}
				for (var i = 0; i < allNodes.length; i++){
					var ev = allNodes[i].event;
					if (ev){
						callback(ev);
					}
				}
			}
			return this;
		};
	
		/**
		 *  Iterate over everything in the array in which the given time
		 *  overlaps with the time and duration time of the event.
		 *  @param  {Time}  time The time to check if items are overlapping
		 *  @param  {Function}  callback The callback to invoke with every item
		 *  @returns {Tone.IntervalTimeline} this
		 */
		Tone.IntervalTimeline.prototype.forEachOverlap = function(time, callback){
			time = this.toSeconds(time);
			if (this._root !== null){
				var results = [];
				this._root.search(time, results);
				for (var i = results.length - 1; i >= 0; i--){
					var ev = results[i].event;
					if (ev){
						callback(ev);
					}
				}
			}
			return this;
		};
	
		/**
		 *  Iterate over everything in the array in which the time is greater
		 *  than the given time.
		 *  @param  {Time}  time The time to check if items are before
		 *  @param  {Function}  callback The callback to invoke with every item
		 *  @returns {Tone.IntervalTimeline} this
		 */
		Tone.IntervalTimeline.prototype.forEachAfter = function(time, callback){
			time = this.toSeconds(time);
			if (this._root !== null){
				var results = [];
				this._root.searchAfter(time, results);
				for (var i = results.length - 1; i >= 0; i--){
					var ev = results[i].event;
					if (ev){
						callback(ev);
					}
				}
			}
			return this;
		};
	
		/**
		 *  Clean up
		 *  @return  {Tone.IntervalTimeline}  this
		 */
		Tone.IntervalTimeline.prototype.dispose = function() {
			var allNodes = [];
			if (this._root !== null){
				this._root.traverse(function(node){
					allNodes.push(node);
				});
			}
			for (var i = 0; i < allNodes.length; i++){
				allNodes[i].dispose();
			}
			allNodes = null;
			this._root = null;
			return this;
		};
	
		///////////////////////////////////////////////////////////////////////////
		//	INTERVAL NODE HELPER
		///////////////////////////////////////////////////////////////////////////
	
		/**
		 *  Represents a node in the binary search tree, with the addition
		 *  of a "high" value which keeps track of the highest value of
		 *  its children. 
		 *  References: 
		 *  https://brooknovak.wordpress.com/2013/12/07/augmented-interval-tree-in-c/
		 *  http://www.mif.vu.lt/~valdas/ALGORITMAI/LITERATURA/Cormen/Cormen.pdf
		 *  @param {Number} low
		 *  @param {Number} high
		 *  @private
		 */
		var IntervalNode = function(low, high, event){
			//the event container
			this.event = event;
			//the low value
			this.low = low;
			//the high value
			this.high = high;
			//the high value for this and all child nodes
			this.max = this.high;
			//the nodes to the left
			this._left = null;
			//the nodes to the right
			this._right = null;
			//the parent node
			this.parent = null;
			//the number of child nodes
			this.height = 0;
		};
	
		/** 
		 *  Insert a node into the correct spot in the tree
		 *  @param  {IntervalNode}  node
		 */
		IntervalNode.prototype.insert = function(node) {
			if (node.low <= this.low){
				if (this.left === null){
					this.left = node;
				} else {
					this.left.insert(node);
				}
			} else {
				if (this.right === null){
					this.right = node;
				} else {
					this.right.insert(node);
				}
			}
		};
	
		/**
		 *  Search the tree for nodes which overlap 
		 *  with the given point
		 *  @param  {Number}  point  The point to query
		 *  @param  {Array}  results  The array to put the results
		 */
		IntervalNode.prototype.search = function(point, results) {
			// If p is to the right of the rightmost point of any interval
			// in this node and all children, there won't be any matches.
			if (point > this.max){
				return;
			}
			// Search left children
			if (this.left !== null){
				this.left.search(point, results);
			}
			// Check this node
			if (this.low <= point && this.high >= point){
				results.push(this);
			}
			// If p is to the left of the time of this interval,
			// then it can't be in any child to the right.
			if (this.low > point){
				return;
			}
			// Search right children
			if (this.right !== null){
				this.right.search(point, results);
			}
		};
	
		/**
		 *  Search the tree for nodes which are less 
		 *  than the given point
		 *  @param  {Number}  point  The point to query
		 *  @param  {Array}  results  The array to put the results
		 */
		IntervalNode.prototype.searchAfter = function(point, results) {
			// Check this node
			if (this.low >= point){
				results.push(this);
				if (this.left !== null){
					this.left.searchAfter(point, results);
				}
			} 
			// search the right side
			if (this.right !== null){
				this.right.searchAfter(point, results);
			}
		};
	
		/**
		 *  Invoke the callback on this element and both it's branches
		 *  @param  {Function}  callback
		 */
		IntervalNode.prototype.traverse = function(callback){
			callback(this);
			if (this.left !== null){
				this.left.traverse(callback);
			}
			if (this.right !== null){
				this.right.traverse(callback);
			}
		};
	
		/**
		 *  Update the height of the node
		 */
		IntervalNode.prototype.updateHeight = function(){
			if (this.left !== null && this.right !== null){
				this.height = Math.max(this.left.height, this.right.height) + 1;
			} else if (this.right !== null){
				this.height = this.right.height + 1;
			} else if (this.left !== null){
				this.height = this.left.height + 1;
			} else {
				this.height = 0;
			}
		};
	
		/**
		 *  Update the height of the node
		 */
		IntervalNode.prototype.updateMax = function(){
			this.max = this.high;
			if (this.left !== null){
				this.max = Math.max(this.max, this.left.max);
			}
			if (this.right !== null){
				this.max = Math.max(this.max, this.right.max);
			}
		};
	
		/**
		 *  The balance is how the leafs are distributed on the node
		 *  @return  {Number}  Negative numbers are balanced to the right
		 */
		IntervalNode.prototype.getBalance = function() {
			var balance = 0;
			if (this.left !== null && this.right !== null){
				balance = this.left.height - this.right.height;
			} else if (this.left !== null){
				balance = this.left.height + 1;
			} else if (this.right !== null){
				balance = -(this.right.height + 1);
			}
			return balance;
		};
	
		/**
		 *  @returns {Boolean} true if this node is the left child
		 *  of its parent
		 */
		IntervalNode.prototype.isLeftChild = function() {
			return this.parent !== null && this.parent.left === this;
		};
	
		/**
		 *  get/set the left node
		 *  @type {IntervalNode}
		 */
		Object.defineProperty(IntervalNode.prototype, "left", {
			get : function(){
				return this._left;
			},
			set : function(node){
				this._left = node;
				if (node !== null){
					node.parent = this;
				}
				this.updateHeight();
				this.updateMax();
			}
		});
	
		/**
		 *  get/set the right node
		 *  @type {IntervalNode}
		 */
		Object.defineProperty(IntervalNode.prototype, "right", {
			get : function(){
				return this._right;
			},
			set : function(node){
				this._right = node;
				if (node !== null){
					node.parent = this;
				}
				this.updateHeight();
				this.updateMax();
			}
		});
	
		/**
		 *  null out references.
		 */
		IntervalNode.prototype.dispose = function() {
			this.parent = null;
			this._left = null;
			this._right = null;
			this.event = null;
		};
	
		///////////////////////////////////////////////////////////////////////////
		//	END INTERVAL NODE HELPER
		///////////////////////////////////////////////////////////////////////////
	
		return Tone.IntervalTimeline;
	}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));

/***/ }),
/* 42 */
/*!******************************************************!*\
  !*** ./third_party/Tone.js/Tone/component/Volume.js ***!
  \******************************************************/
/***/ (function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__(/*! Tone/core/Tone */ 26), __webpack_require__(/*! Tone/signal/Signal */ 32), __webpack_require__(/*! Tone/core/Gain */ 37)], __WEBPACK_AMD_DEFINE_RESULT__ = function(Tone){
	
		"use strict";
	
		/**
		 *  @class Tone.Volume is a simple volume node, useful for creating a volume fader. 
		 *
		 *  @extends {Tone}
		 *  @constructor
		 *  @param {Decibels} [volume=0] the initial volume
		 *  @example
		 * var vol = new Tone.Volume(-12);
		 * instrument.chain(vol, Tone.Master);
		 */
		Tone.Volume = function(){
	
			var options = this.optionsObject(arguments, ["volume"], Tone.Volume.defaults);
	
			/**
			 * the output node
			 * @type {GainNode}
			 * @private
			 */
			this.output = this.input = new Tone.Gain(options.volume, Tone.Type.Decibels);
	
			/**
			 *  The volume control in decibels. 
			 *  @type {Decibels}
			 *  @signal
			 */
			this.volume = this.output.gain;
	
			this._readOnly("volume");
		};
	
		Tone.extend(Tone.Volume);
	
		/**
		 *  Defaults
		 *  @type  {Object}
		 *  @const
		 *  @static
		 */
		Tone.Volume.defaults = {
			"volume" : 0
		};
	
		/**
		 *  clean up
		 *  @returns {Tone.Volume} this
		 */
		Tone.Volume.prototype.dispose = function(){
			this.input.dispose();
			Tone.prototype.dispose.call(this);
			this._writable("volume");
			this.volume.dispose();
			this.volume = null;
			return this;
		};
	
		return Tone.Volume;
	}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));

/***/ }),
/* 43 */
/*!*************************************************!*\
  !*** ./third_party/Tone.js/Tone/core/Master.js ***!
  \*************************************************/
/***/ (function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__(/*! Tone/core/Tone */ 26), __webpack_require__(/*! Tone/component/Volume */ 42)], __WEBPACK_AMD_DEFINE_RESULT__ = function(Tone){
	
		"use strict";
		
		/**
		 *  @class  A single master output which is connected to the
		 *          AudioDestinationNode (aka your speakers). 
		 *          It provides useful conveniences such as the ability 
		 *          to set the volume and mute the entire application. 
		 *          It also gives you the ability to apply master effects to your application. 
		 *          <br><br>
		 *          Like Tone.Transport, A single Tone.Master is created
		 *          on initialization and you do not need to explicitly construct one.
		 *
		 *  @constructor
		 *  @extends {Tone}
		 *  @singleton
		 *  @example
		 * //the audio will go from the oscillator to the speakers
		 * oscillator.connect(Tone.Master);
		 * //a convenience for connecting to the master output is also provided:
		 * oscillator.toMaster();
		 * //the above two examples are equivalent.
		 */
		Tone.Master = function(){
			Tone.call(this);
	
			/**
			 * the unmuted volume
			 * @type {number}
			 * @private
			 */
			this._unmutedVolume = 1;
	
			/**
			 *  if the master is muted
			 *  @type {boolean}
			 *  @private
			 */
			this._muted = false;
	
			/**
			 *  The private volume node
			 *  @type  {Tone.Volume}
			 *  @private
			 */
			this._volume = this.output = new Tone.Volume();
	
			/**
			 * The volume of the master output.
			 * @type {Decibels}
			 * @signal
			 */
			this.volume = this._volume.volume;
			
			this._readOnly("volume");
			//connections
			this.input.chain(this.output, this.context.destination);
		};
	
		Tone.extend(Tone.Master);
	
		/**
		 *  @type {Object}
		 *  @const
		 */
		Tone.Master.defaults = {
			"volume" : 0,
			"mute" : false
		};
	
		/**
		 * Mute the output. 
		 * @memberOf Tone.Master#
		 * @type {boolean}
		 * @name mute
		 * @example
		 * //mute the output
		 * Tone.Master.mute = true;
		 */
		Object.defineProperty(Tone.Master.prototype, "mute", {
			get : function(){
				return this._muted;
			}, 
			set : function(mute){
				if (!this._muted && mute){
					this._unmutedVolume = this.volume.value;
					//maybe it should ramp here?
					this.volume.value = -Infinity;
				} else if (this._muted && !mute){
					this.volume.value = this._unmutedVolume;
				}
				this._muted = mute;
			}
		});
	
		/**
		 *  Add a master effects chain. NOTE: this will disconnect any nodes which were previously 
		 *  chained in the master effects chain. 
		 *  @param {AudioNode|Tone...} args All arguments will be connected in a row
		 *                                  and the Master will be routed through it.
		 *  @return  {Tone.Master}  this
		 *  @example
		 * //some overall compression to keep the levels in check
		 * var masterCompressor = new Tone.Compressor({
		 * 	"threshold" : -6,
		 * 	"ratio" : 3,
		 * 	"attack" : 0.5,
		 * 	"release" : 0.1
		 * });
		 * //give a little boost to the lows
		 * var lowBump = new Tone.Filter(200, "lowshelf");
		 * //route everything through the filter 
		 * //and compressor before going to the speakers
		 * Tone.Master.chain(lowBump, masterCompressor);
		 */
		Tone.Master.prototype.chain = function(){
			this.input.disconnect();
			this.input.chain.apply(this.input, arguments);
			arguments[arguments.length - 1].connect(this.output);
		};
	
		/**
		 *  Clean up
		 *  @return  {Tone.Master}  this
		 */
		Tone.Master.prototype.dispose = function(){
			Tone.prototype.dispose.call(this);
			this._writable("volume");
			this._volume.dispose();
			this._volume = null;
			this.volume = null;
		};
	
		///////////////////////////////////////////////////////////////////////////
		//	AUGMENT TONE's PROTOTYPE
		///////////////////////////////////////////////////////////////////////////
	
		/**
		 *  Connect 'this' to the master output. Shorthand for this.connect(Tone.Master)
		 *  @returns {Tone} this
		 *  @example
		 * //connect an oscillator to the master output
		 * var osc = new Tone.Oscillator().toMaster();
		 */
		Tone.prototype.toMaster = function(){
			this.connect(Tone.Master);
			return this;
		};
	
		/**
		 *  Also augment AudioNode's prototype to include toMaster
		 *  as a convenience
		 *  @returns {AudioNode} this
		 */
		AudioNode.prototype.toMaster = function(){
			this.connect(Tone.Master);
			return this;
		};
	
		var MasterConstructor = Tone.Master;
	
		/**
		 *  initialize the module and listen for new audio contexts
		 */
		Tone._initAudioContext(function(){
			//a single master output
			if (!Tone.prototype.isUndef(Tone.Master)){
				Tone.Master = new MasterConstructor();
			} else {
				MasterConstructor.prototype.dispose.call(Tone.Master);
				MasterConstructor.call(Tone.Master);
			}
		});
	
		return Tone.Master;
	}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));

/***/ }),
/* 44 */
/*!***************************!*\
  !*** ./app/mic/Player.js ***!
  \***************************/
/***/ (function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;/**
	 * Copyright 2016 Google Inc.
	 *
	 * Licensed under the Apache License, Version 2.0 (the "License");
	 * you may not use this file except in compliance with the License.
	 * You may obtain a copy of the License at
	 *
	 *     http://www.apache.org/licenses/LICENSE-2.0
	 *
	 * Unless required by applicable law or agreed to in writing, software
	 * distributed under the License is distributed on an "AS IS" BASIS,
	 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
	 * See the License for the specific language governing permissions and
	 * limitations under the License.
	 */
	
	!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__(/*! Tone/core/Tone */ 26), __webpack_require__(/*! util/MathUtils */ 3), __webpack_require__(/*! mic/Amplitude */ 23)], __WEBPACK_AMD_DEFINE_RESULT__ = function (Tone, MathUtils, Amplitude) {
	
		var Player = function(bufferDuration){
	
			/**
			 *  @private
			 *  @type {ScriptProcessorNode}
			 */
			this._jsNode = Tone.context.createScriptProcessor(2048, 0, 1);
			//so it doesn't get garbage collected
			this._jsNode.toMaster();
			this._jsNode.onaudioprocess = this._process.bind(this);
	
			this._buffer = Tone.context.createBuffer(1, Tone.context.sampleRate * bufferDuration, Tone.context.sampleRate);
	
			this._playbackPosition = 0;
	
			this.speed = 0;
	
			this.position = 0;
		};
	
		Player.prototype.setBuffer = function(buffer){
			this._buffer = Tone.context.createBuffer(1, Tone.context.sampleRate * buffer.duration, Tone.context.sampleRate);
			var targetArray = this._buffer.getChannelData(0);
			var copyArray = buffer.getChannelData(0);
			for (var i = 0; i < copyArray.length; i++){
				targetArray[i] = copyArray[i];
			}
			this._playbackPosition = 0;
			this.position = 0;
		};
	
		Player.prototype._process = function(e){
	
			var outputBuffer = e.outputBuffer.getChannelData(0);
			var frameLength = outputBuffer.length;
	
			var sum = 0;
	
			if (Math.abs(this.speed) > 0.08){
	
				var samples = this._buffer.getChannelData(0);
				var sampleLen = samples.length;
	
				var startSamples = this._playbackPosition;
				var endSamples = this.speed * outputBuffer.length + startSamples;
				this._playbackPosition = endSamples;
	
				this.position = (this._playbackPosition / sampleLen);
	
				for (var i = 0, len = outputBuffer.length; i < len; i++){
	
					var pos = MathUtils.lerp(startSamples, endSamples, i / len);
					var lowPos = Math.floor(pos) % sampleLen;
					if (lowPos < 0){
						lowPos = sampleLen + lowPos;
					}
	
					var highPos = Math.ceil(pos) % sampleLen;
					if (highPos < 0){
						highPos = sampleLen + highPos;
					}
	
					pos = pos % sampleLen;
					if (pos < 0){
						pos = sampleLen + pos;
					}
	
					//lerp the sample if between samples
					sample = MathUtils.lerp(samples[lowPos], samples[highPos], pos - lowPos);
	
					sum += sample * sample;
	
					//set the sample
					outputBuffer[i] = sample;
				}
	
			} else {
				//all 0s
				for (var j = 0; j < frameLength; j++){
					outputBuffer[j] = 0;
				}
			}
			Amplitude.setRMS(sum / frameLength);
		};
	
		return Player;
	}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));


/***/ }),
/* 45 */
/*!***************************!*\
  !*** ./app/mic/Loader.js ***!
  \***************************/
/***/ (function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;/**
	 * Copyright 2016 Google Inc.
	 *
	 * Licensed under the Apache License, Version 2.0 (the "License");
	 * you may not use this file except in compliance with the License.
	 * You may obtain a copy of the License at
	 *
	 *     http://www.apache.org/licenses/LICENSE-2.0
	 *
	 * Unless required by applicable law or agreed to in writing, software
	 * distributed under the License is distributed on an "AS IS" BASIS,
	 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
	 * See the License for the specific language governing permissions and
	 * limitations under the License.
	 */
	
	!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__(/*! Tone/core/Buffer */ 46)], __WEBPACK_AMD_DEFINE_RESULT__ = function (Buffer) {
	
		var soundUrls = [ {
			title: 'Your voice',
			url: 'audio/useyourvoice.mp3'
		},{
			title:'experiment',
			url: 'audio/toexperiment.mp3'
		},{
			title:'La Di Da',
			url: 'audio/ladida.mp3'
		}];
	
		var Loader = function(callback){
			//parse the url for "preset" string
			var str = window.location.search;
			var objURL = {};
	
			str.replace(
			new RegExp( "([^?=&]+)(=([^&]*))?", "g" ),
				function( $0, $1, $2, $3 ){ objURL[ $1 ] = $3; }
			);
			if(objURL === undefined || objURL.preset === undefined) {
				objURL.preset = 3;
			}
	
			var sound = soundUrls[objURL.preset - 1];
			if (sound){
				var buffer = new Buffer(sound.url, function(){
					callback(buffer.get());
				});
			}
		};
	
		return Loader;
	}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));


/***/ }),
/* 46 */
/*!*************************************************!*\
  !*** ./third_party/Tone.js/Tone/core/Buffer.js ***!
  \*************************************************/
/***/ (function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__(/*! Tone/core/Tone */ 26), __webpack_require__(/*! Tone/core/Emitter */ 40)], __WEBPACK_AMD_DEFINE_RESULT__ = function(Tone){
	
		"use strict";
	
		/**
		 *  @class  Buffer loading and storage. Tone.Buffer is used internally by all 
		 *          classes that make requests for audio files such as Tone.Player,
		 *          Tone.Sampler and Tone.Convolver.
		 *          <br><br>
		 *          Aside from load callbacks from individual buffers, Tone.Buffer 
		 *  		provides static methods which keep track of the loading progress 
		 *  		of all of the buffers. These methods are Tone.Buffer.onload, Tone.Buffer.onprogress,
		 *  		and Tone.Buffer.onerror. 
		 *
		 *  @constructor 
		 *  @extends {Tone}
		 *  @param {AudioBuffer|string} url The url to load, or the audio buffer to set. 
		 *  @param {function=} onload A callback which is invoked after the buffer is loaded. 
		 *                            It's recommended to use Tone.Buffer.onload instead 
		 *                            since it will give you a callback when ALL buffers are loaded.
		 *  @example
		 * var buffer = new Tone.Buffer("path/to/sound.mp3", function(){
		 * 	//the buffer is now available.
		 * 	var buff = buffer.get();
		 * });
		 */
		Tone.Buffer = function(){
	
			var options = this.optionsObject(arguments, ["url", "onload"], Tone.Buffer.defaults);
	
			/**
			 *  stores the loaded AudioBuffer
			 *  @type {AudioBuffer}
			 *  @private
			 */
			this._buffer = null;
	
			/**
			 *  indicates if the buffer should be reversed or not
			 *  @type {boolean}
			 *  @private
			 */
			this._reversed = options.reverse;
	
			/**
			 *  The url of the buffer. <code>undefined</code> if it was 
			 *  constructed with a buffer
			 *  @type {string}
			 *  @readOnly
			 */
			this.url = undefined;
	
			/**
			 *  Indicates if the buffer is loaded or not. 
			 *  @type {boolean}
			 *  @readOnly
			 */
			this.loaded = false;
	
			/**
			 *  The callback to invoke when everything is loaded. 
			 *  @type {function}
			 */
			this.onload = options.onload.bind(this, this);
	
			if (options.url instanceof AudioBuffer || options.url instanceof Tone.Buffer){
				this.set(options.url);
				this.onload(this);
			} else if (this.isString(options.url)){
				this.url = options.url;
				Tone.Buffer._addToQueue(options.url, this);
			}
		};
	
		Tone.extend(Tone.Buffer);
	
		/**
		 *  the default parameters
		 *  @type {Object}
		 */
		Tone.Buffer.defaults = {
			"url" : undefined,
			"onload" : Tone.noOp,
			"reverse" : false
		};
	
		/**
		 *  Pass in an AudioBuffer or Tone.Buffer to set the value
		 *  of this buffer.
		 *  @param {AudioBuffer|Tone.Buffer} buffer the buffer
		 *  @returns {Tone.Buffer} this
		 */
		Tone.Buffer.prototype.set = function(buffer){
			if (buffer instanceof Tone.Buffer){
				this._buffer = buffer.get();
			} else {
				this._buffer = buffer;
			}
			this.loaded = true;
			return this;
		};
	
		/**
		 *  @return {AudioBuffer} The audio buffer stored in the object.
		 */
		Tone.Buffer.prototype.get = function(){
			return this._buffer;
		};
	
		/**
		 *  Load url into the buffer. 
		 *  @param {String} url The url to load
		 *  @param {Function=} callback The callback to invoke on load. 
		 *                              don't need to set if `onload` is
		 *                              already set.
		 *  @returns {Tone.Buffer} this
		 */
		Tone.Buffer.prototype.load = function(url, callback){
			this.url = url;
			this.onload = this.defaultArg(callback, this.onload);
			Tone.Buffer._addToQueue(url, this);
			return this;
		};
	
		/**
		 *  dispose and disconnect
		 *  @returns {Tone.Buffer} this
		 */
		Tone.Buffer.prototype.dispose = function(){
			Tone.prototype.dispose.call(this);
			Tone.Buffer._removeFromQueue(this);
			this._buffer = null;
			this.onload = Tone.Buffer.defaults.onload;
			return this;
		};
	
		/**
		 * The duration of the buffer. 
		 * @memberOf Tone.Buffer#
		 * @type {number}
		 * @name duration
		 * @readOnly
		 */
		Object.defineProperty(Tone.Buffer.prototype, "duration", {
			get : function(){
				if (this._buffer){
					return this._buffer.duration;
				} else {
					return 0;
				}
			},
		});
	
		/**
		 *  Reverse the buffer.
		 *  @private
		 *  @return {Tone.Buffer} this
		 */
		Tone.Buffer.prototype._reverse = function(){
			if (this.loaded){
				for (var i = 0; i < this._buffer.numberOfChannels; i++){
					Array.prototype.reverse.call(this._buffer.getChannelData(i));
				}
			}
			return this;
		};
	
		/**
		 * Reverse the buffer.
		 * @memberOf Tone.Buffer#
		 * @type {boolean}
		 * @name reverse
		 */
		Object.defineProperty(Tone.Buffer.prototype, "reverse", {
			get : function(){
				return this._reversed;
			},
			set : function(rev){
				if (this._reversed !== rev){
					this._reversed = rev;
					this._reverse();
				}
			},
		});
	
		///////////////////////////////////////////////////////////////////////////
		// STATIC METHODS
		///////////////////////////////////////////////////////////////////////////
	
		//statically inherits Emitter methods
		Tone.Emitter.mixin(Tone.Buffer);
		 
		/**
		 *  the static queue for all of the xhr requests
		 *  @type {Array}
		 *  @private
		 */
		Tone.Buffer._queue = [];
	
		/**
		 *  the array of current downloads
		 *  @type {Array}
		 *  @private
		 */
		Tone.Buffer._currentDownloads = [];
	
		/**
		 *  the total number of downloads
		 *  @type {number}
		 *  @private
		 */
		Tone.Buffer._totalDownloads = 0;
	
		/**
		 *  the maximum number of simultaneous downloads
		 *  @static
		 *  @type {number}
		 */
		Tone.Buffer.MAX_SIMULTANEOUS_DOWNLOADS = 6;
		
		/**
		 *  Adds a file to be loaded to the loading queue
		 *  @param   {string}   url      the url to load
		 *  @param   {function} callback the callback to invoke once it's loaded
		 *  @private
		 */
		Tone.Buffer._addToQueue = function(url, buffer){
			Tone.Buffer._queue.push({
				url : url,
				Buffer : buffer,
				progress : 0,
				xhr : null
			});
			this._totalDownloads++;
			Tone.Buffer._next();
		};
	
		/**
		 *  Remove an object from the queue's (if it's still there)
		 *  Abort the XHR if it's in progress
		 *  @param {Tone.Buffer} buffer the buffer to remove
		 *  @private
		 */
		Tone.Buffer._removeFromQueue = function(buffer){
			var i;
			for (i = 0; i < Tone.Buffer._queue.length; i++){
				var q = Tone.Buffer._queue[i];
				if (q.Buffer === buffer){
					Tone.Buffer._queue.splice(i, 1);
				}
			}
			for (i = 0; i < Tone.Buffer._currentDownloads.length; i++){
				var dl = Tone.Buffer._currentDownloads[i];
				if (dl.Buffer === buffer){
					Tone.Buffer._currentDownloads.splice(i, 1);
					dl.xhr.abort();
					dl.xhr.onprogress = null;
					dl.xhr.onload = null;
					dl.xhr.onerror = null;
				}
			}
		};
	
		/**
		 *  load the next buffer in the queue
		 *  @private
		 */
		Tone.Buffer._next = function(){
			if (Tone.Buffer._queue.length > 0){
				if (Tone.Buffer._currentDownloads.length < Tone.Buffer.MAX_SIMULTANEOUS_DOWNLOADS){
					var next = Tone.Buffer._queue.shift();
					Tone.Buffer._currentDownloads.push(next);
					next.xhr = Tone.Buffer.load(next.url, function(buffer){
						//remove this one from the queue
						var index = Tone.Buffer._currentDownloads.indexOf(next);
						Tone.Buffer._currentDownloads.splice(index, 1);
						next.Buffer.set(buffer);
						if (next.Buffer._reversed){
							next.Buffer._reverse();
						}
						next.Buffer.onload(next.Buffer);
						Tone.Buffer._onprogress();
						Tone.Buffer._next();
					});
					next.xhr.onprogress = function(event){
						next.progress = event.loaded / event.total;
						Tone.Buffer._onprogress();
					};
					next.xhr.onerror = function(e){
						Tone.Buffer.trigger("error", e);
					};
				} 
			} else if (Tone.Buffer._currentDownloads.length === 0){
				Tone.Buffer.trigger("load");
				//reset the downloads
				Tone.Buffer._totalDownloads = 0;
			}
		};
	
		/**
		 *  internal progress event handler
		 *  @private
		 */
		Tone.Buffer._onprogress = function(){
			var curretDownloadsProgress = 0;
			var currentDLLen = Tone.Buffer._currentDownloads.length;
			var inprogress = 0;
			if (currentDLLen > 0){
				for (var i = 0; i < currentDLLen; i++){
					var dl = Tone.Buffer._currentDownloads[i];
					curretDownloadsProgress += dl.progress;
				}
				inprogress = curretDownloadsProgress;
			}
			var currentDownloadProgress = currentDLLen - inprogress;
			var completed = Tone.Buffer._totalDownloads - Tone.Buffer._queue.length - currentDownloadProgress;
			Tone.Buffer.trigger("progress", completed / Tone.Buffer._totalDownloads);
		};
	
		/**
		 *  Makes an xhr reqest for the selected url then decodes
		 *  the file as an audio buffer. Invokes
		 *  the callback once the audio buffer loads.
		 *  @param {string} url The url of the buffer to load.
		 *                      filetype support depends on the
		 *                      browser.
		 *  @param {function} callback The function to invoke when the url is loaded. 
		 *  @returns {XMLHttpRequest} returns the XHR
		 */
		Tone.Buffer.load = function(url, callback){
			var request = new XMLHttpRequest();
			request.open("GET", url, true);
			request.responseType = "arraybuffer";
			// decode asynchronously
			request.onload = function() {
				Tone.context.decodeAudioData(request.response, function(buff) {
					if(!buff){
						throw new Error("could not decode audio data:" + url);
					}
					callback(buff);
				});
			};
			//send the request
			request.send();
			return request;
		};
	
		return Tone.Buffer;
	}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));

/***/ }),
/* 47 */
/*!**************************************************!*\
  !*** ./~/StartAudioContext/StartAudioContext.js ***!
  \**************************************************/
/***/ (function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_FACTORY__, __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;/**
	 *  StartAudioContext.js
	 *  @author Yotam Mann
	 *  @license http://opensource.org/licenses/MIT MIT License
	 *  @copyright 2016 Yotam Mann
	 */
	(function (root, factory) {
		if (true) {
			!(__WEBPACK_AMD_DEFINE_ARRAY__ = [], __WEBPACK_AMD_DEFINE_FACTORY__ = (factory), __WEBPACK_AMD_DEFINE_RESULT__ = (typeof __WEBPACK_AMD_DEFINE_FACTORY__ === 'function' ? (__WEBPACK_AMD_DEFINE_FACTORY__.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__)) : __WEBPACK_AMD_DEFINE_FACTORY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__))
		 } else if (typeof module === "object" && module.exports) {
	        module.exports = factory()
		} else {
			root.StartAudioContext = factory()
	  }
	}(this, function () {
	
		//TAP LISTENER/////////////////////////////////////////////////////////////
	
		/**
		 * @class  Listens for non-dragging tap ends on the given element
		 * @param {Element} element
		 * @internal
		 */
		var TapListener = function(element, context){
	
			this._dragged = false
	
			this._element = element
	
			this._bindedMove = this._moved.bind(this)
			this._bindedEnd = this._ended.bind(this, context)
	
			element.addEventListener("touchstart", this._bindedEnd)
			element.addEventListener("touchmove", this._bindedMove)
			element.addEventListener("touchend", this._bindedEnd)
			element.addEventListener("mouseup", this._bindedEnd)
		}
	
		/**
		 * drag move event
		 */
		TapListener.prototype._moved = function(e){
			this._dragged = true
		};
	
		/**
		 * tap ended listener
		 */
		TapListener.prototype._ended = function(context){
			if (!this._dragged){
				startContext(context)
			}
			this._dragged = false
		};
	
		/**
		 * remove all the bound events
		 */
		TapListener.prototype.dispose = function(){
			this._element.removeEventListener("touchstart", this._bindedEnd)
			this._element.removeEventListener("touchmove", this._bindedMove)
			this._element.removeEventListener("touchend", this._bindedEnd)
			this._element.removeEventListener("mouseup", this._bindedEnd)
			this._bindedMove = null
			this._bindedEnd = null
			this._element = null
		};
	
		//END TAP LISTENER/////////////////////////////////////////////////////////
	
		/**
		 * Plays a silent sound and also invoke the "resume" method
		 * @param {AudioContext} context
		 * @private
		 */
		function startContext(context){
			// this accomplishes the iOS specific requirement
			var buffer = context.createBuffer(1, 1, context.sampleRate)
			var source = context.createBufferSource()
			source.buffer = buffer
			source.connect(context.destination)
			source.start(0)
	
			// resume the audio context
			if (context.resume){
				context.resume()
			}
		}
	
		/**
		 * Returns true if the audio context is started
		 * @param  {AudioContext}  context
		 * @return {Boolean}
		 * @private
		 */
		function isStarted(context){
			 return context.state === "running"
		}
	
		/**
		 * Invokes the callback as soon as the AudioContext
		 * is started
		 * @param  {AudioContext}   context
		 * @param  {Function} callback
		 */
		function onStarted(context, callback){
	
			function checkLoop(){
				if (isStarted(context)){
					callback()
				} else {
					requestAnimationFrame(checkLoop)
					if (context.resume){
						context.resume()
					}
				}
			}
	
			if (isStarted(context)){
				callback()
			} else {
				checkLoop()
			}
		}
	
		/**
		 * Add a tap listener to the audio context
		 * @param  {Array|Element|String|jQuery} element
		 * @param {Array} tapListeners
		 */
		function bindTapListener(element, tapListeners, context){
			if (Array.isArray(element) || (NodeList && element instanceof NodeList)){
				for (var i = 0; i < element.length; i++){
					bindTapListener(element[i], tapListeners, context)
				}
			} else if (typeof element === "string"){
				bindTapListener(document.querySelectorAll(element), tapListeners, context)
			} else if (element.jquery && typeof element.toArray === "function"){
				bindTapListener(element.toArray(), tapListeners, context)
			} else if (Element && element instanceof Element){
				//if it's an element, create a TapListener
				var tap = new TapListener(element, context)
				tapListeners.push(tap)
			} 
		}
	
		/**
		 * @param {AudioContext} context The AudioContext to start.
		 * @param {Array|String|Element|jQuery=} elements For iOS, the list of elements
		 *                                               to bind tap event listeners
		 *                                               which will start the AudioContext. If
		 *                                               no elements are given, it will bind
		 *                                               to the document.body.
		 * @param {Function=} callback The callback to invoke when the AudioContext is started.
		 * @return {Promise} The promise is invoked when the AudioContext
		 *                       is started.
		 */
		function StartAudioContext(context, elements, callback){
	
			//the promise is invoked when the AudioContext is started
			var promise = new Promise(function(success) {
				onStarted(context, success)
			})
	
			// The TapListeners bound to the elements
			var tapListeners = []
	
			// add all the tap listeners
			if (!elements){
				elements = document.body
			}
			bindTapListener(elements, tapListeners, context)
	
			//dispose all these tap listeners when the context is started
			promise.then(function(){
				for (var i = 0; i < tapListeners.length; i++){
					tapListeners[i].dispose()
				}
				tapListeners = null
	
				if (callback){
					callback()
				}
			})
	
			return promise
		}
	
		return StartAudioContext
	}))

/***/ })
]);
//# sourceMappingURL=1.js.map