/******/ (function(modules) { // webpackBootstrap
/******/ 	// install a JSONP callback for chunk loading
/******/ 	var parentJsonpFunction = window["webpackJsonp"];
/******/ 	window["webpackJsonp"] = function webpackJsonpCallback(chunkIds, moreModules) {
/******/ 		// add "moreModules" to the modules object,
/******/ 		// then flag all "chunkIds" as loaded and fire callback
/******/ 		var moduleId, chunkId, i = 0, callbacks = [];
/******/ 		for(;i < chunkIds.length; i++) {
/******/ 			chunkId = chunkIds[i];
/******/ 			if(installedChunks[chunkId])
/******/ 				callbacks.push.apply(callbacks, installedChunks[chunkId]);
/******/ 			installedChunks[chunkId] = 0;
/******/ 		}
/******/ 		for(moduleId in moreModules) {
/******/ 			if(Object.prototype.hasOwnProperty.call(moreModules, moduleId)) {
/******/ 				modules[moduleId] = moreModules[moduleId];
/******/ 			}
/******/ 		}
/******/ 		if(parentJsonpFunction) parentJsonpFunction(chunkIds, moreModules);
/******/ 		while(callbacks.length)
/******/ 			callbacks.shift().call(null, __webpack_require__);
/******/
/******/ 	};
/******/
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// object to store loaded and loading chunks
/******/ 	// "0" means "already loaded"
/******/ 	// Array means "loading", array contains callbacks
/******/ 	var installedChunks = {
/******/ 		0:0
/******/ 	};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;
/******/
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/ 	// This file contains only the entry chunk.
/******/ 	// The chunk loading function for additional chunks
/******/ 	__webpack_require__.e = function requireEnsure(chunkId, callback) {
/******/ 		// "0" is the signal for "already loaded"
/******/ 		if(installedChunks[chunkId] === 0)
/******/ 			return callback.call(null, __webpack_require__);
/******/
/******/ 		// an array means "currently loading".
/******/ 		if(installedChunks[chunkId] !== undefined) {
/******/ 			installedChunks[chunkId].push(callback);
/******/ 		} else {
/******/ 			// start chunk loading
/******/ 			installedChunks[chunkId] = [callback];
/******/ 			var head = document.getElementsByTagName('head')[0];
/******/ 			var script = document.createElement('script');
/******/ 			script.type = 'text/javascript';
/******/ 			script.charset = 'utf-8';
/******/ 			script.async = true;
/******/
/******/ 			script.src = __webpack_require__.p + "./build/" + chunkId + ".js";
/******/ 			head.appendChild(script);
/******/ 		}
/******/ 	};
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/*!*********************!*\
  !*** ./app/Main.js ***!
  \*********************/
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
	
	__webpack_require__.e/* require */(1, function(__webpack_require__) { var __WEBPACK_AMD_REQUIRE_ARRAY__ = [__webpack_require__(/*! domready */ 1), __webpack_require__(/*! interface/UserInterface */ 2), __webpack_require__(/*! main.scss */ 16), __webpack_require__(/*! mic/Waveform */ 18), __webpack_require__(/*! mic/Recorder */ 24), __webpack_require__(/*! mic/Player */ 44),
		__webpack_require__(/*! mic/Loader */ 45), __webpack_require__(/*! StartAudioContext */ 47), __webpack_require__(/*! Tone/core/Tone */ 26), __webpack_require__(/*! Tone/source/Microphone */ 25)]; (function(domReady, UserInterface, mainStyle, Waveform, Recorder, Player, Loader, StartAudioContext, Tone, Microphone){
	
		domReady(function(){
			var recordTime = 3;
	
			var buttonTimeout  = -1;
			var currentRotation = 0;
			var rotationSpeed = 0;
			var isDragging = false;
			var dragSpeed = 0;
			var computedSpeed = 0;
	
			//INTERFACE////////////////////////////////////////////////
	
			var interface = new UserInterface(recordTime * 1000, document.body);
	
			interface.on("SpeedControllUpdate", function(speed){
				rotationSpeed = speed;
			});
	
			interface.on("dragRateUpdate", function(drag){
				dragSpeed = (drag * 10);
				// currentRotation += drag;
			});
	
			interface.on("StartWaveDrag", function(){
				isDragging = true;
			});
	
			interface.on("EndWaveDrag", function(){
				dragSpeed = 0;
				isDragging = false;
			});
	
			interface.on("StartRecord", function(drag){
				player.speed = 0;
				player.position = 0;
				recorder.open(function(){
					recorder.start();
					buttonTimeout = setTimeout(function(){
						interface.stopRecording();
						player.setBuffer(recorder.audioBuffer);
					}, recordTime * 1000);
				}, function(e){
					//denied
					window.parent.postMessage("error3","*");
				});
			});
	
			interface.on("StopRecord", function(drag){
				recorder.stop();
				player.setBuffer(recorder.audioBuffer);
				clearTimeout(buttonTimeout);
			});
	
			if (!Microphone.supported){
				interface.disableRecording(function(){
					//unsupported
					console.log("unsupported");
					window.parent.postMessage("error2","*");
				});
			}
	
	
			//AUDIO////////////////////////////////////////////////
	
			var recorder = new Recorder(recordTime);
	
			var twoPI = Math.PI * 2;
	
			var player = new Player(recordTime);
	
			var waveform = new Waveform(interface.waveDisplay, recorder);
	
			function animateIn(){
				//bring everything in
				setTimeout(function(){
					interface.animateIn();
					waveform.animateIn(750);
				}, 100);
			}
	
			var loader = new Loader(function(buffer){
				recorder.setBuffer(buffer);
				player.setBuffer(buffer);
	
				window.parent.postMessage("loaded", "*");
	
				//send the ready message to the parent
				var isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
	
				//full screen button on iOS
				if (isIOS){
					//make a full screen element and put it in front
					var iOSTapper = document.createElement("div");
					iOSTapper.id = "iOSTap";
					document.body.appendChild(iOSTapper);
					new StartAudioContext(Tone.context, iOSTapper).then(function() {
						iOSTapper.remove();
						window.parent.postMessage("ready","*");
					});
				} else {
					animateIn();
					window.parent.postMessage("ready","*");
				}
			});
	
			//LOOOOOOOOOP////////////////////////////////////////////////
			var lastFrame = -1;
	
			var rotationQuotient = (Math.PI * 2 / 1000);
	
			function loop(){
				requestAnimationFrame(loop);
				var speed = rotationSpeed;
				if (isDragging){
					speed = dragSpeed;
				} 
				var alpha = 0.05;
	
				computedSpeed = alpha * speed + (1 - alpha) * computedSpeed;
	
				player.speed = computedSpeed;
	
				if (!recorder.isRecording){
					waveform.setRotation(player.position * Math.PI * 2);
				} else {
					player.speed = 0;
					waveform.setRotation(0);
				}
			}
			loop();
	
		});
	}.apply(null, __WEBPACK_AMD_REQUIRE_ARRAY__));});


/***/ })
/******/ ]);
//# sourceMappingURL=Main.js.map