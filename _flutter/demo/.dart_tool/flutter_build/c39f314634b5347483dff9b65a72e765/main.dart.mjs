// Returns whether the `js-string` built-in is supported.
function detectJsStringBuiltins() {
  let bytes = [
    0,   97,  115, 109, 1,   0,   0,  0,   1,   4,   1,   96,  0,
    0,   2,   23,  1,   14,  119, 97, 115, 109, 58,  106, 115, 45,
    115, 116, 114, 105, 110, 103, 4,  99,  97,  115, 116, 0,   0
  ];
  return WebAssembly.validate(
    new Uint8Array(bytes), {builtins: ['js-string']});
}

// Compiles a dart2wasm-generated main module from `source` which can then
// instantiatable via the `instantiate` method.
//
// `source` needs to be a `Response` object (or promise thereof) e.g. created
// via the `fetch()` JS API.
export async function compileStreaming(source) {
  const builtins = detectJsStringBuiltins()
      ? {builtins: ['js-string']} : {};
  return new CompiledApp(
      await WebAssembly.compileStreaming(source, builtins), builtins);
}

// Compiles a dart2wasm-generated wasm modules from `bytes` which is then
// instantiatable via the `instantiate` method.
export async function compile(bytes) {
  const builtins = detectJsStringBuiltins()
      ? {builtins: ['js-string']} : {};
  return new CompiledApp(await WebAssembly.compile(bytes, builtins), builtins);
}

// DEPRECATED: Please use `compile` or `compileStreaming` to get a compiled app,
// use `instantiate` method to get an instantiated app and then call
// `invokeMain` to invoke the main function.
export async function instantiate(modulePromise, importObjectPromise) {
  var moduleOrCompiledApp = await modulePromise;
  if (!(moduleOrCompiledApp instanceof CompiledApp)) {
    moduleOrCompiledApp = new CompiledApp(moduleOrCompiledApp);
  }
  const instantiatedApp = await moduleOrCompiledApp.instantiate(await importObjectPromise);
  return instantiatedApp.instantiatedModule;
}

// DEPRECATED: Please use `compile` or `compileStreaming` to get a compiled app,
// use `instantiate` method to get an instantiated app and then call
// `invokeMain` to invoke the main function.
export const invoke = (moduleInstance, ...args) => {
  moduleInstance.exports.$invokeMain(args);
}

class CompiledApp {
  constructor(module, builtins) {
    this.module = module;
    this.builtins = builtins;
  }

  // The second argument is an options object containing:
  // `loadDeferredWasm` is a JS function that takes a module name matching a
  //   wasm file produced by the dart2wasm compiler and returns the bytes to
  //   load the module. These bytes can be in either a format supported by
  //   `WebAssembly.compile` or `WebAssembly.compileStreaming`.
  async instantiate(additionalImports, {loadDeferredWasm} = {}) {
    let dartInstance;

    // Prints to the console
    function printToConsole(value) {
      if (typeof dartPrint == "function") {
        dartPrint(value);
        return;
      }
      if (typeof console == "object" && typeof console.log != "undefined") {
        console.log(value);
        return;
      }
      if (typeof print == "function") {
        print(value);
        return;
      }

      throw "Unable to print message: " + js;
    }

    // Converts a Dart List to a JS array. Any Dart objects will be converted, but
    // this will be cheap for JSValues.
    function arrayFromDartList(constructor, list) {
      const exports = dartInstance.exports;
      const read = exports.$listRead;
      const length = exports.$listLength(list);
      const array = new constructor(length);
      for (let i = 0; i < length; i++) {
        array[i] = read(list, i);
      }
      return array;
    }

    // A special symbol attached to functions that wrap Dart functions.
    const jsWrappedDartFunctionSymbol = Symbol("JSWrappedDartFunction");

    function finalizeWrapper(dartFunction, wrapped) {
      wrapped.dartFunction = dartFunction;
      wrapped[jsWrappedDartFunctionSymbol] = true;
      return wrapped;
    }

    // Imports
    const dart2wasm = {

      _1: (x0,x1,x2) => x0.set(x1,x2),
      _2: (x0,x1,x2) => x0.set(x1,x2),
      _3: (x0,x1) => x0.transferFromImageBitmap(x1),
      _4: x0 => x0.arrayBuffer(),
      _5: (x0,x1) => x0.transferFromImageBitmap(x1),
      _6: f => finalizeWrapper(f, function(x0) { return dartInstance.exports._6(f,arguments.length,x0) }),
      _7: x0 => new window.FinalizationRegistry(x0),
      _8: (x0,x1,x2,x3) => x0.register(x1,x2,x3),
      _9: (x0,x1) => x0.unregister(x1),
      _10: (x0,x1,x2) => x0.slice(x1,x2),
      _11: (x0,x1) => x0.decode(x1),
      _12: (x0,x1) => x0.segment(x1),
      _13: () => new TextDecoder(),
      _14: x0 => x0.buffer,
      _15: x0 => x0.wasmMemory,
      _16: () => globalThis.window._flutter_skwasmInstance,
      _17: x0 => x0.rasterStartMilliseconds,
      _18: x0 => x0.rasterEndMilliseconds,
      _19: x0 => x0.imageBitmaps,
      _192: x0 => x0.select(),
      _193: (x0,x1) => x0.append(x1),
      _194: x0 => x0.remove(),
      _197: x0 => x0.unlock(),
      _202: x0 => x0.getReader(),
      _211: x0 => new MutationObserver(x0),
      _220: (x0,x1) => new OffscreenCanvas(x0,x1),
      _222: (x0,x1,x2) => x0.addEventListener(x1,x2),
      _223: (x0,x1,x2) => x0.removeEventListener(x1,x2),
      _226: x0 => new ResizeObserver(x0),
      _229: (x0,x1) => new Intl.Segmenter(x0,x1),
      _230: x0 => x0.next(),
      _231: (x0,x1) => new Intl.v8BreakIterator(x0,x1),
      _316: f => finalizeWrapper(f, function(x0) { return dartInstance.exports._316(f,arguments.length,x0) }),
      _317: f => finalizeWrapper(f, function(x0) { return dartInstance.exports._317(f,arguments.length,x0) }),
      _318: (x0,x1) => ({addView: x0,removeView: x1}),
      _319: f => finalizeWrapper(f, function(x0) { return dartInstance.exports._319(f,arguments.length,x0) }),
      _320: f => finalizeWrapper(f, function() { return dartInstance.exports._320(f,arguments.length) }),
      _321: (x0,x1) => ({initializeEngine: x0,autoStart: x1}),
      _322: f => finalizeWrapper(f, function(x0) { return dartInstance.exports._322(f,arguments.length,x0) }),
      _323: x0 => ({runApp: x0}),
      _324: x0 => new Uint8Array(x0),
      _326: x0 => x0.preventDefault(),
      _327: x0 => x0.stopPropagation(),
      _328: (x0,x1) => x0.addListener(x1),
      _329: (x0,x1) => x0.removeListener(x1),
      _330: (x0,x1) => x0.prepend(x1),
      _331: x0 => x0.remove(),
      _332: x0 => x0.disconnect(),
      _333: (x0,x1) => x0.addListener(x1),
      _334: (x0,x1) => x0.removeListener(x1),
      _336: (x0,x1) => x0.append(x1),
      _337: x0 => x0.remove(),
      _338: x0 => x0.stopPropagation(),
      _342: x0 => x0.preventDefault(),
      _343: (x0,x1) => x0.append(x1),
      _344: x0 => x0.remove(),
      _345: x0 => x0.preventDefault(),
      _350: (x0,x1) => x0.removeChild(x1),
      _351: (x0,x1) => x0.appendChild(x1),
      _352: (x0,x1,x2) => x0.insertBefore(x1,x2),
      _353: (x0,x1) => x0.appendChild(x1),
      _354: (x0,x1) => x0.transferFromImageBitmap(x1),
      _356: (x0,x1) => x0.append(x1),
      _357: (x0,x1) => x0.append(x1),
      _358: (x0,x1) => x0.append(x1),
      _359: x0 => x0.remove(),
      _360: x0 => x0.remove(),
      _361: x0 => x0.remove(),
      _362: (x0,x1) => x0.appendChild(x1),
      _363: (x0,x1) => x0.appendChild(x1),
      _364: x0 => x0.remove(),
      _365: (x0,x1) => x0.append(x1),
      _366: (x0,x1) => x0.append(x1),
      _367: x0 => x0.remove(),
      _368: (x0,x1) => x0.append(x1),
      _369: (x0,x1) => x0.append(x1),
      _370: (x0,x1,x2) => x0.insertBefore(x1,x2),
      _371: (x0,x1) => x0.append(x1),
      _372: (x0,x1,x2) => x0.insertBefore(x1,x2),
      _373: x0 => x0.remove(),
      _374: x0 => x0.remove(),
      _375: (x0,x1) => x0.append(x1),
      _376: x0 => x0.remove(),
      _377: (x0,x1) => x0.append(x1),
      _378: x0 => x0.remove(),
      _379: x0 => x0.remove(),
      _380: x0 => x0.getBoundingClientRect(),
      _381: x0 => x0.remove(),
      _394: (x0,x1) => x0.append(x1),
      _395: x0 => x0.remove(),
      _396: (x0,x1) => x0.append(x1),
      _397: (x0,x1,x2) => x0.insertBefore(x1,x2),
      _398: x0 => x0.preventDefault(),
      _399: x0 => x0.preventDefault(),
      _400: x0 => x0.preventDefault(),
      _401: x0 => x0.preventDefault(),
      _402: x0 => x0.remove(),
      _403: (x0,x1) => x0.observe(x1),
      _404: x0 => x0.disconnect(),
      _405: (x0,x1) => x0.appendChild(x1),
      _406: (x0,x1) => x0.appendChild(x1),
      _407: (x0,x1) => x0.appendChild(x1),
      _408: (x0,x1) => x0.append(x1),
      _409: x0 => x0.remove(),
      _410: (x0,x1) => x0.append(x1),
      _412: (x0,x1) => x0.appendChild(x1),
      _413: (x0,x1) => x0.append(x1),
      _414: x0 => x0.remove(),
      _415: (x0,x1) => x0.append(x1),
      _416: x0 => x0.remove(),
      _417: () => new Array(),
      _418: (x0,x1) => x0.push(x1),
      _419: (x0,x1) => x0.appendChild(x1),
      _420: x0 => x0.remove(),
      _976: () => globalThis.window.flutterConfiguration,
      _977: x0 => x0.assetBase,
      _982: x0 => x0.debugShowSemanticsNodes,
      _983: x0 => x0.hostElement,
      _984: x0 => x0.multiViewEnabled,
      _985: x0 => x0.nonce,
      _986: x0 => x0.renderer,
      _987: x0 => x0.fontFallbackBaseUrl,
      _988: x0 => x0.useColorEmoji,
      _989: () => globalThis.window.flutterWebRenderer,
      _992: x0 => x0.console,
      _993: x0 => x0.devicePixelRatio,
      _994: x0 => x0.document,
      _995: x0 => x0.history,
      _996: x0 => x0.innerHeight,
      _997: x0 => x0.innerWidth,
      _998: x0 => x0.location,
      _999: x0 => x0.navigator,
      _1000: x0 => x0.visualViewport,
      _1001: x0 => x0.performance,
      _1004: (x0,x1) => x0.dispatchEvent(x1),
      _1005: (x0,x1) => x0.matchMedia(x1),
      _1007: (x0,x1) => x0.getComputedStyle(x1),
      _1008: x0 => x0.screen,
      _1009: (x0,x1) => x0.requestAnimationFrame(x1),
      _1010: f => finalizeWrapper(f, function(x0) { return dartInstance.exports._1010(f,arguments.length,x0) }),
      _1014: (x0,x1) => x0.warn(x1),
      _1017: () => globalThis.window,
      _1018: () => globalThis.Intl,
      _1019: () => globalThis.Symbol,
      _1022: x0 => x0.clipboard,
      _1023: x0 => x0.maxTouchPoints,
      _1024: x0 => x0.vendor,
      _1025: x0 => x0.language,
      _1026: x0 => x0.platform,
      _1027: x0 => x0.userAgent,
      _1028: x0 => x0.languages,
      _1029: x0 => x0.documentElement,
      _1030: (x0,x1) => x0.querySelector(x1),
      _1034: (x0,x1) => x0.createElement(x1),
      _1035: (x0,x1) => x0.execCommand(x1),
      _1039: (x0,x1) => x0.createTextNode(x1),
      _1040: (x0,x1) => x0.createEvent(x1),
      _1044: x0 => x0.head,
      _1045: x0 => x0.body,
      _1046: (x0,x1) => x0.title = x1,
      _1049: x0 => x0.activeElement,
      _1052: x0 => x0.visibilityState,
      _1053: x0 => x0.hasFocus(),
      _1054: () => globalThis.document,
      _1055: (x0,x1,x2,x3) => x0.addEventListener(x1,x2,x3),
      _1057: (x0,x1,x2,x3) => x0.addEventListener(x1,x2,x3),
      _1058: (x0,x1,x2,x3) => x0.removeEventListener(x1,x2,x3),
      _1060: f => finalizeWrapper(f, function(x0) { return dartInstance.exports._1060(f,arguments.length,x0) }),
      _1061: x0 => x0.target,
      _1063: x0 => x0.timeStamp,
      _1064: x0 => x0.type,
      _1066: x0 => x0.preventDefault(),
      _1068: (x0,x1,x2,x3) => x0.initEvent(x1,x2,x3),
      _1074: x0 => x0.baseURI,
      _1075: x0 => x0.firstChild,
      _1080: x0 => x0.parentElement,
      _1082: x0 => x0.parentNode,
      _1085: (x0,x1) => x0.removeChild(x1),
      _1086: (x0,x1) => x0.removeChild(x1),
      _1087: x0 => x0.isConnected,
      _1088: (x0,x1) => x0.textContent = x1,
      _1090: (x0,x1) => x0.contains(x1),
      _1095: x0 => x0.firstElementChild,
      _1097: x0 => x0.nextElementSibling,
      _1098: x0 => x0.clientHeight,
      _1099: x0 => x0.clientWidth,
      _1100: x0 => x0.offsetHeight,
      _1101: x0 => x0.offsetWidth,
      _1102: x0 => x0.id,
      _1103: (x0,x1) => x0.id = x1,
      _1106: (x0,x1) => x0.spellcheck = x1,
      _1107: x0 => x0.tagName,
      _1108: x0 => x0.style,
      _1109: (x0,x1) => x0.append(x1),
      _1110: (x0,x1) => x0.getAttribute(x1),
      _1111: x0 => x0.getBoundingClientRect(),
      _1116: (x0,x1) => x0.closest(x1),
      _1119: (x0,x1) => x0.querySelectorAll(x1),
      _1121: x0 => x0.remove(),
      _1122: (x0,x1,x2) => x0.setAttribute(x1,x2),
      _1123: (x0,x1) => x0.removeAttribute(x1),
      _1124: (x0,x1) => x0.tabIndex = x1,
      _1126: (x0,x1) => x0.focus(x1),
      _1127: x0 => x0.scrollTop,
      _1128: (x0,x1) => x0.scrollTop = x1,
      _1129: x0 => x0.scrollLeft,
      _1130: (x0,x1) => x0.scrollLeft = x1,
      _1131: x0 => x0.classList,
      _1132: (x0,x1) => x0.className = x1,
      _1139: (x0,x1) => x0.getElementsByClassName(x1),
      _1141: x0 => x0.click(),
      _1143: (x0,x1) => x0.hasAttribute(x1),
      _1146: (x0,x1) => x0.attachShadow(x1),
      _1151: (x0,x1) => x0.getPropertyValue(x1),
      _1153: (x0,x1,x2,x3) => x0.setProperty(x1,x2,x3),
      _1155: (x0,x1) => x0.removeProperty(x1),
      _1157: x0 => x0.offsetLeft,
      _1158: x0 => x0.offsetTop,
      _1159: x0 => x0.offsetParent,
      _1161: (x0,x1) => x0.name = x1,
      _1162: x0 => x0.content,
      _1163: (x0,x1) => x0.content = x1,
      _1177: (x0,x1) => x0.nonce = x1,
      _1183: x0 => x0.now(),
      _1185: (x0,x1) => x0.width = x1,
      _1187: (x0,x1) => x0.height = x1,
      _1191: (x0,x1) => x0.getContext(x1),
      _1263: x0 => x0.width,
      _1264: x0 => x0.height,
      _1267: (x0,x1) => x0.fetch(x1),
      _1268: x0 => x0.status,
      _1270: x0 => x0.body,
      _1271: x0 => x0.arrayBuffer(),
      _1277: x0 => x0.read(),
      _1278: x0 => x0.value,
      _1279: x0 => x0.done,
      _1282: x0 => x0.x,
      _1283: x0 => x0.y,
      _1286: x0 => x0.top,
      _1287: x0 => x0.right,
      _1288: x0 => x0.bottom,
      _1289: x0 => x0.left,
      _1299: x0 => x0.height,
      _1300: x0 => x0.width,
      _1301: (x0,x1) => x0.value = x1,
      _1303: (x0,x1) => x0.placeholder = x1,
      _1304: (x0,x1) => x0.name = x1,
      _1305: x0 => x0.selectionDirection,
      _1306: x0 => x0.selectionStart,
      _1307: x0 => x0.selectionEnd,
      _1310: x0 => x0.value,
      _1312: (x0,x1,x2) => x0.setSelectionRange(x1,x2),
      _1315: x0 => x0.readText(),
      _1316: (x0,x1) => x0.writeText(x1),
      _1317: x0 => x0.altKey,
      _1318: x0 => x0.code,
      _1319: x0 => x0.ctrlKey,
      _1320: x0 => x0.key,
      _1321: x0 => x0.keyCode,
      _1322: x0 => x0.location,
      _1323: x0 => x0.metaKey,
      _1324: x0 => x0.repeat,
      _1325: x0 => x0.shiftKey,
      _1326: x0 => x0.isComposing,
      _1327: (x0,x1) => x0.getModifierState(x1),
      _1329: x0 => x0.state,
      _1330: (x0,x1) => x0.go(x1),
      _1333: (x0,x1,x2,x3) => x0.pushState(x1,x2,x3),
      _1334: (x0,x1,x2,x3) => x0.replaceState(x1,x2,x3),
      _1335: x0 => x0.pathname,
      _1336: x0 => x0.search,
      _1337: x0 => x0.hash,
      _1341: x0 => x0.state,
      _1347: f => finalizeWrapper(f, function(x0,x1) { return dartInstance.exports._1347(f,arguments.length,x0,x1) }),
      _1350: (x0,x1,x2) => x0.observe(x1,x2),
      _1353: x0 => x0.attributeName,
      _1354: x0 => x0.type,
      _1355: x0 => x0.matches,
      _1358: x0 => x0.matches,
      _1360: x0 => x0.relatedTarget,
      _1361: x0 => x0.clientX,
      _1362: x0 => x0.clientY,
      _1363: x0 => x0.offsetX,
      _1364: x0 => x0.offsetY,
      _1367: x0 => x0.button,
      _1368: x0 => x0.buttons,
      _1369: x0 => x0.ctrlKey,
      _1370: (x0,x1) => x0.getModifierState(x1),
      _1373: x0 => x0.pointerId,
      _1374: x0 => x0.pointerType,
      _1375: x0 => x0.pressure,
      _1376: x0 => x0.tiltX,
      _1377: x0 => x0.tiltY,
      _1378: x0 => x0.getCoalescedEvents(),
      _1380: x0 => x0.deltaX,
      _1381: x0 => x0.deltaY,
      _1382: x0 => x0.wheelDeltaX,
      _1383: x0 => x0.wheelDeltaY,
      _1384: x0 => x0.deltaMode,
      _1390: x0 => x0.changedTouches,
      _1392: x0 => x0.clientX,
      _1393: x0 => x0.clientY,
      _1395: x0 => x0.data,
      _1398: (x0,x1) => x0.disabled = x1,
      _1399: (x0,x1) => x0.type = x1,
      _1400: (x0,x1) => x0.max = x1,
      _1401: (x0,x1) => x0.min = x1,
      _1402: (x0,x1) => x0.value = x1,
      _1403: x0 => x0.value,
      _1404: x0 => x0.disabled,
      _1405: (x0,x1) => x0.disabled = x1,
      _1406: (x0,x1) => x0.placeholder = x1,
      _1407: (x0,x1) => x0.name = x1,
      _1408: (x0,x1) => x0.autocomplete = x1,
      _1409: x0 => x0.selectionDirection,
      _1410: x0 => x0.selectionStart,
      _1411: x0 => x0.selectionEnd,
      _1415: (x0,x1,x2) => x0.setSelectionRange(x1,x2),
      _1420: (x0,x1) => x0.add(x1),
      _1423: (x0,x1) => x0.noValidate = x1,
      _1424: (x0,x1) => x0.method = x1,
      _1425: (x0,x1) => x0.action = x1,
      _1431: (x0,x1) => x0.getContext(x1),
      _1433: x0 => x0.convertToBlob(),
      _1450: x0 => x0.orientation,
      _1451: x0 => x0.width,
      _1452: x0 => x0.height,
      _1453: (x0,x1) => x0.lock(x1),
      _1471: f => finalizeWrapper(f, function(x0,x1) { return dartInstance.exports._1471(f,arguments.length,x0,x1) }),
      _1482: x0 => x0.length,
      _1483: (x0,x1) => x0.item(x1),
      _1484: x0 => x0.length,
      _1485: (x0,x1) => x0.item(x1),
      _1486: x0 => x0.iterator,
      _1487: x0 => x0.Segmenter,
      _1488: x0 => x0.v8BreakIterator,
      _1492: x0 => x0.done,
      _1493: x0 => x0.value,
      _1494: x0 => x0.index,
      _1498: (x0,x1) => x0.adoptText(x1),
      _1499: x0 => x0.first(),
      _1500: x0 => x0.next(),
      _1501: x0 => x0.current(),
      _1512: x0 => x0.hostElement,
      _1513: x0 => x0.viewConstraints,
      _1515: x0 => x0.maxHeight,
      _1516: x0 => x0.maxWidth,
      _1517: x0 => x0.minHeight,
      _1518: x0 => x0.minWidth,
      _1519: x0 => x0.loader,
      _1520: () => globalThis._flutter,
      _1521: (x0,x1) => x0.didCreateEngineInitializer(x1),
      _1522: (x0,x1,x2) => x0.call(x1,x2),
      _1523: () => globalThis.Promise,
      _1524: f => finalizeWrapper(f, function(x0,x1) { return dartInstance.exports._1524(f,arguments.length,x0,x1) }),
      _1527: x0 => x0.length,
      _1591: () => globalThis.window.__flutterState,
      _1592: x0 => globalThis.window.__flutterState = x0,
      _1602: (x0,x1) => globalThis.Neutralino.os.showMessageBox(x0,x1),
      _1614: (x0,x1,x2,x3) => x0.addEventListener(x1,x2,x3),
      _1624: (x0,x1,x2,x3) => x0.removeEventListener(x1,x2,x3),
      _1628: (x0,x1) => x0.getItem(x1),
      _1644: x0 => new Array(x0),
      _1646: x0 => x0.length,
      _1648: (x0,x1) => x0[x1],
      _1649: (x0,x1,x2) => x0[x1] = x2,
      _1652: (x0,x1,x2) => new DataView(x0,x1,x2),
      _1654: x0 => new Int8Array(x0),
      _1655: (x0,x1,x2) => new Uint8Array(x0,x1,x2),
      _1656: x0 => new Uint8Array(x0),
      _1664: x0 => new Int32Array(x0),
      _1666: x0 => new Uint32Array(x0),
      _1668: x0 => new Float32Array(x0),
      _1670: x0 => new Float64Array(x0),
      _1672: (o, c) => o instanceof c,
      _1676: f => finalizeWrapper(f, function(x0) { return dartInstance.exports._1676(f,arguments.length,x0) }),
      _1677: f => finalizeWrapper(f, function(x0) { return dartInstance.exports._1677(f,arguments.length,x0) }),
      _1703: (decoder, codeUnits) => decoder.decode(codeUnits),
      _1704: () => new TextDecoder("utf-8", {fatal: true}),
      _1705: () => new TextDecoder("utf-8", {fatal: false}),
      _1706: x0 => new WeakRef(x0),
      _1707: x0 => x0.deref(),
      _1713: Date.now,
      _1715: s => new Date(s * 1000).getTimezoneOffset() * 60,
      _1716: s => {
        if (!/^\s*[+-]?(?:Infinity|NaN|(?:\.\d+|\d+(?:\.\d*)?)(?:[eE][+-]?\d+)?)\s*$/.test(s)) {
          return NaN;
        }
        return parseFloat(s);
      },
      _1717: () => {
        let stackString = new Error().stack.toString();
        let frames = stackString.split('\n');
        let drop = 2;
        if (frames[0] === 'Error') {
            drop += 1;
        }
        return frames.slice(drop).join('\n');
      },
      _1718: () => typeof dartUseDateNowForTicks !== "undefined",
      _1719: () => 1000 * performance.now(),
      _1720: () => Date.now(),
      _1723: () => new WeakMap(),
      _1724: (map, o) => map.get(o),
      _1725: (map, o, v) => map.set(o, v),
      _1726: () => globalThis.WeakRef,
      _1736: s => JSON.stringify(s),
      _1737: s => printToConsole(s),
      _1738: a => a.join(''),
      _1741: (s, t) => s.split(t),
      _1742: s => s.toLowerCase(),
      _1743: s => s.toUpperCase(),
      _1744: s => s.trim(),
      _1745: s => s.trimLeft(),
      _1746: s => s.trimRight(),
      _1748: (s, p, i) => s.indexOf(p, i),
      _1749: (s, p, i) => s.lastIndexOf(p, i),
      _1751: Object.is,
      _1752: s => s.toUpperCase(),
      _1753: s => s.toLowerCase(),
      _1754: (a, i) => a.push(i),
      _1758: a => a.pop(),
      _1759: (a, i) => a.splice(i, 1),
      _1761: (a, s) => a.join(s),
      _1765: a => a.length,
      _1767: (a, i) => a[i],
      _1768: (a, i, v) => a[i] = v,
      _1771: (o, start, length) => new Uint8Array(o.buffer, o.byteOffset + start, length),
      _1772: (o, start, length) => new Int8Array(o.buffer, o.byteOffset + start, length),
      _1773: (o, start, length) => new Uint8ClampedArray(o.buffer, o.byteOffset + start, length),
      _1774: (o, start, length) => new Uint16Array(o.buffer, o.byteOffset + start, length),
      _1775: (o, start, length) => new Int16Array(o.buffer, o.byteOffset + start, length),
      _1776: (o, start, length) => new Uint32Array(o.buffer, o.byteOffset + start, length),
      _1777: (o, start, length) => new Int32Array(o.buffer, o.byteOffset + start, length),
      _1779: (o, start, length) => new BigInt64Array(o.buffer, o.byteOffset + start, length),
      _1780: (o, start, length) => new Float32Array(o.buffer, o.byteOffset + start, length),
      _1781: (o, start, length) => new Float64Array(o.buffer, o.byteOffset + start, length),
      _1782: (t, s) => t.set(s),
      _1784: (o) => new DataView(o.buffer, o.byteOffset, o.byteLength),
      _1786: o => o.buffer,
      _1787: o => o.byteOffset,
      _1788: Function.prototype.call.bind(Object.getOwnPropertyDescriptor(DataView.prototype, 'byteLength').get),
      _1789: (b, o) => new DataView(b, o),
      _1790: (b, o, l) => new DataView(b, o, l),
      _1791: Function.prototype.call.bind(DataView.prototype.getUint8),
      _1792: Function.prototype.call.bind(DataView.prototype.setUint8),
      _1793: Function.prototype.call.bind(DataView.prototype.getInt8),
      _1794: Function.prototype.call.bind(DataView.prototype.setInt8),
      _1795: Function.prototype.call.bind(DataView.prototype.getUint16),
      _1796: Function.prototype.call.bind(DataView.prototype.setUint16),
      _1797: Function.prototype.call.bind(DataView.prototype.getInt16),
      _1798: Function.prototype.call.bind(DataView.prototype.setInt16),
      _1799: Function.prototype.call.bind(DataView.prototype.getUint32),
      _1800: Function.prototype.call.bind(DataView.prototype.setUint32),
      _1801: Function.prototype.call.bind(DataView.prototype.getInt32),
      _1802: Function.prototype.call.bind(DataView.prototype.setInt32),
      _1805: Function.prototype.call.bind(DataView.prototype.getBigInt64),
      _1806: Function.prototype.call.bind(DataView.prototype.setBigInt64),
      _1807: Function.prototype.call.bind(DataView.prototype.getFloat32),
      _1808: Function.prototype.call.bind(DataView.prototype.setFloat32),
      _1809: Function.prototype.call.bind(DataView.prototype.getFloat64),
      _1810: Function.prototype.call.bind(DataView.prototype.setFloat64),
      _1812: () => globalThis.performance,
      _1813: () => globalThis.JSON,
      _1814: x0 => x0.measure,
      _1815: x0 => x0.mark,
      _1816: x0 => x0.clearMeasures,
      _1817: x0 => x0.clearMarks,
      _1818: (x0,x1,x2,x3) => x0.measure(x1,x2,x3),
      _1819: (x0,x1,x2) => x0.mark(x1,x2),
      _1820: x0 => x0.clearMeasures(),
      _1821: x0 => x0.clearMarks(),
      _1822: (x0,x1) => x0.parse(x1),
      _1823: (o, t) => o instanceof t,
      _1825: f => finalizeWrapper(f, function(x0) { return dartInstance.exports._1825(f,arguments.length,x0) }),
      _1826: f => finalizeWrapper(f, function(x0) { return dartInstance.exports._1826(f,arguments.length,x0) }),
      _1827: o => Object.keys(o),
      _1828: (ms, c) =>
      setTimeout(() => dartInstance.exports.$invokeCallback(c),ms),
      _1829: (handle) => clearTimeout(handle),
      _1830: (ms, c) =>
      setInterval(() => dartInstance.exports.$invokeCallback(c), ms),
      _1831: (handle) => clearInterval(handle),
      _1832: (c) =>
      queueMicrotask(() => dartInstance.exports.$invokeCallback(c)),
      _1833: () => Date.now(),
      _1834: () => new XMLHttpRequest(),
      _1835: (x0,x1,x2,x3) => x0.open(x1,x2,x3),
      _1836: (x0,x1,x2) => x0.setRequestHeader(x1,x2),
      _1837: (x0,x1) => x0.send(x1),
      _1839: x0 => x0.getAllResponseHeaders(),
      _1847: f => finalizeWrapper(f, function(x0) { return dartInstance.exports._1847(f,arguments.length,x0) }),
      _1853: (x0,x1) => x0.key(x1),
      _1869: (s, m) => {
        try {
          return new RegExp(s, m);
        } catch (e) {
          return String(e);
        }
      },
      _1870: (x0,x1) => x0.exec(x1),
      _1871: (x0,x1) => x0.test(x1),
      _1872: (x0,x1) => x0.exec(x1),
      _1873: (x0,x1) => x0.exec(x1),
      _1874: x0 => x0.pop(),
      _1876: o => o === undefined,
      _1895: o => typeof o === 'function' && o[jsWrappedDartFunctionSymbol] === true,
      _1897: o => {
        const proto = Object.getPrototypeOf(o);
        return proto === Object.prototype || proto === null;
      },
      _1898: o => o instanceof RegExp,
      _1899: (l, r) => l === r,
      _1900: o => o,
      _1901: o => o,
      _1902: o => o,
      _1903: b => !!b,
      _1904: o => o.length,
      _1907: (o, i) => o[i],
      _1908: f => f.dartFunction,
      _1909: l => arrayFromDartList(Int8Array, l),
      _1910: l => arrayFromDartList(Uint8Array, l),
      _1911: l => arrayFromDartList(Uint8ClampedArray, l),
      _1912: l => arrayFromDartList(Int16Array, l),
      _1913: l => arrayFromDartList(Uint16Array, l),
      _1914: l => arrayFromDartList(Int32Array, l),
      _1915: l => arrayFromDartList(Uint32Array, l),
      _1916: l => arrayFromDartList(Float32Array, l),
      _1917: l => arrayFromDartList(Float64Array, l),
      _1918: x0 => new ArrayBuffer(x0),
      _1919: (data, length) => {
        const getValue = dartInstance.exports.$byteDataGetUint8;
        const view = new DataView(new ArrayBuffer(length));
        for (let i = 0; i < length; i++) {
          view.setUint8(i, getValue(data, i));
        }
        return view;
      },
      _1920: l => arrayFromDartList(Array, l),
      _1921: (s, length) => {
        if (length == 0) return '';
      
        const read = dartInstance.exports.$stringRead1;
        let result = '';
        let index = 0;
        const chunkLength = Math.min(length - index, 500);
        let array = new Array(chunkLength);
        while (index < length) {
          const newChunkLength = Math.min(length - index, 500);
          for (let i = 0; i < newChunkLength; i++) {
            array[i] = read(s, index++);
          }
          if (newChunkLength < chunkLength) {
            array = array.slice(0, newChunkLength);
          }
          result += String.fromCharCode(...array);
        }
        return result;
      },
      _1922: (s, length) => {
        if (length == 0) return '';
      
        const read = dartInstance.exports.$stringRead2;
        let result = '';
        let index = 0;
        const chunkLength = Math.min(length - index, 500);
        let array = new Array(chunkLength);
        while (index < length) {
          const newChunkLength = Math.min(length - index, 500);
          for (let i = 0; i < newChunkLength; i++) {
            array[i] = read(s, index++);
          }
          if (newChunkLength < chunkLength) {
            array = array.slice(0, newChunkLength);
          }
          result += String.fromCharCode(...array);
        }
        return result;
      },
      _1923: (s) => {
        let length = s.length;
        let range = 0;
        for (let i = 0; i < length; i++) {
          range |= s.codePointAt(i);
        }
        const exports = dartInstance.exports;
        if (range < 256) {
          if (length <= 10) {
            if (length == 1) {
              return exports.$stringAllocate1_1(s.codePointAt(0));
            }
            if (length == 2) {
              return exports.$stringAllocate1_2(s.codePointAt(0), s.codePointAt(1));
            }
            if (length == 3) {
              return exports.$stringAllocate1_3(s.codePointAt(0), s.codePointAt(1), s.codePointAt(2));
            }
            if (length == 4) {
              return exports.$stringAllocate1_4(s.codePointAt(0), s.codePointAt(1), s.codePointAt(2), s.codePointAt(3));
            }
            if (length == 5) {
              return exports.$stringAllocate1_5(s.codePointAt(0), s.codePointAt(1), s.codePointAt(2), s.codePointAt(3), s.codePointAt(4));
            }
            if (length == 6) {
              return exports.$stringAllocate1_6(s.codePointAt(0), s.codePointAt(1), s.codePointAt(2), s.codePointAt(3), s.codePointAt(4), s.codePointAt(5));
            }
            if (length == 7) {
              return exports.$stringAllocate1_7(s.codePointAt(0), s.codePointAt(1), s.codePointAt(2), s.codePointAt(3), s.codePointAt(4), s.codePointAt(5), s.codePointAt(6));
            }
            if (length == 8) {
              return exports.$stringAllocate1_8(s.codePointAt(0), s.codePointAt(1), s.codePointAt(2), s.codePointAt(3), s.codePointAt(4), s.codePointAt(5), s.codePointAt(6), s.codePointAt(7));
            }
            if (length == 9) {
              return exports.$stringAllocate1_9(s.codePointAt(0), s.codePointAt(1), s.codePointAt(2), s.codePointAt(3), s.codePointAt(4), s.codePointAt(5), s.codePointAt(6), s.codePointAt(7), s.codePointAt(8));
            }
            if (length == 10) {
              return exports.$stringAllocate1_10(s.codePointAt(0), s.codePointAt(1), s.codePointAt(2), s.codePointAt(3), s.codePointAt(4), s.codePointAt(5), s.codePointAt(6), s.codePointAt(7), s.codePointAt(8), s.codePointAt(9));
            }
          }
          const dartString = exports.$stringAllocate1(length);
          const write = exports.$stringWrite1;
          for (let i = 0; i < length; i++) {
            write(dartString, i, s.codePointAt(i));
          }
          return dartString;
        } else {
          const dartString = exports.$stringAllocate2(length);
          const write = exports.$stringWrite2;
          for (let i = 0; i < length; i++) {
            write(dartString, i, s.charCodeAt(i));
          }
          return dartString;
        }
      },
      _1924: () => ({}),
      _1925: () => [],
      _1926: l => new Array(l),
      _1927: () => globalThis,
      _1928: (constructor, args) => {
        const factoryFunction = constructor.bind.apply(
            constructor, [null, ...args]);
        return new factoryFunction();
      },
      _1929: (o, p) => p in o,
      _1930: (o, p) => o[p],
      _1931: (o, p, v) => o[p] = v,
      _1932: (o, m, a) => o[m].apply(o, a),
      _1934: o => String(o),
      _1935: (p, s, f) => p.then(s, f),
      _1936: o => {
        if (o === undefined) return 1;
        var type = typeof o;
        if (type === 'boolean') return 2;
        if (type === 'number') return 3;
        if (type === 'string') return 4;
        if (o instanceof Array) return 5;
        if (ArrayBuffer.isView(o)) {
          if (o instanceof Int8Array) return 6;
          if (o instanceof Uint8Array) return 7;
          if (o instanceof Uint8ClampedArray) return 8;
          if (o instanceof Int16Array) return 9;
          if (o instanceof Uint16Array) return 10;
          if (o instanceof Int32Array) return 11;
          if (o instanceof Uint32Array) return 12;
          if (o instanceof Float32Array) return 13;
          if (o instanceof Float64Array) return 14;
          if (o instanceof DataView) return 15;
        }
        if (o instanceof ArrayBuffer) return 16;
        return 17;
      },
      _1937: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const getValue = dartInstance.exports.$wasmI8ArrayGet;
        for (let i = 0; i < length; i++) {
          jsArray[jsArrayOffset + i] = getValue(wasmArray, wasmArrayOffset + i);
        }
      },
      _1938: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const setValue = dartInstance.exports.$wasmI8ArraySet;
        for (let i = 0; i < length; i++) {
          setValue(wasmArray, wasmArrayOffset + i, jsArray[jsArrayOffset + i]);
        }
      },
      _1941: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const getValue = dartInstance.exports.$wasmI32ArrayGet;
        for (let i = 0; i < length; i++) {
          jsArray[jsArrayOffset + i] = getValue(wasmArray, wasmArrayOffset + i);
        }
      },
      _1942: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const setValue = dartInstance.exports.$wasmI32ArraySet;
        for (let i = 0; i < length; i++) {
          setValue(wasmArray, wasmArrayOffset + i, jsArray[jsArrayOffset + i]);
        }
      },
      _1943: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const getValue = dartInstance.exports.$wasmF32ArrayGet;
        for (let i = 0; i < length; i++) {
          jsArray[jsArrayOffset + i] = getValue(wasmArray, wasmArrayOffset + i);
        }
      },
      _1944: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const setValue = dartInstance.exports.$wasmF32ArraySet;
        for (let i = 0; i < length; i++) {
          setValue(wasmArray, wasmArrayOffset + i, jsArray[jsArrayOffset + i]);
        }
      },
      _1945: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const getValue = dartInstance.exports.$wasmF64ArrayGet;
        for (let i = 0; i < length; i++) {
          jsArray[jsArrayOffset + i] = getValue(wasmArray, wasmArrayOffset + i);
        }
      },
      _1946: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const setValue = dartInstance.exports.$wasmF64ArraySet;
        for (let i = 0; i < length; i++) {
          setValue(wasmArray, wasmArrayOffset + i, jsArray[jsArrayOffset + i]);
        }
      },
      _1947: s => {
        if (/[[\]{}()*+?.\\^$|]/.test(s)) {
            s = s.replace(/[[\]{}()*+?.\\^$|]/g, '\\$&');
        }
        return s;
      },
      _1950: x0 => x0.index,
      _1951: x0 => x0.groups,
      _1956: x0 => x0.flags,
      _1957: x0 => x0.multiline,
      _1958: x0 => x0.ignoreCase,
      _1959: x0 => x0.unicode,
      _1960: x0 => x0.dotAll,
      _1961: (x0,x1) => x0.lastIndex = x1,
      _1963: (o, p) => o[p],
      _1966: v => v.toString(),
      _1967: (d, digits) => d.toFixed(digits),
      _1970: (d, precision) => d.toPrecision(precision),
      _1971: x0 => x0.random(),
      _1972: x0 => x0.random(),
      _1976: () => globalThis.Math,
      _2071: (x0,x1) => x0.withCredentials = x1,
      _2073: x0 => x0.responseURL,
      _2074: x0 => x0.status,
      _2075: x0 => x0.statusText,
      _2077: (x0,x1) => x0.responseType = x1,
      _2078: x0 => x0.response,
      _3890: () => globalThis.window,
      _3955: x0 => x0.navigator,
      _4219: x0 => x0.localStorage,
      _4346: x0 => x0.userAgent,
      _4566: x0 => x0.length,
      _13651: () => globalThis.window.flutterCanvasKit,
      _13652: () => globalThis.window._flutter_skwasmInstance,

    };

    const baseImports = {
      dart2wasm: dart2wasm,


      Math: Math,
      Date: Date,
      Object: Object,
      Array: Array,
      Reflect: Reflect,
    };

    const jsStringPolyfill = {
      "charCodeAt": (s, i) => s.charCodeAt(i),
      "compare": (s1, s2) => {
        if (s1 < s2) return -1;
        if (s1 > s2) return 1;
        return 0;
      },
      "concat": (s1, s2) => s1 + s2,
      "equals": (s1, s2) => s1 === s2,
      "fromCharCode": (i) => String.fromCharCode(i),
      "length": (s) => s.length,
      "substring": (s, a, b) => s.substring(a, b),
    };

    const deferredLibraryHelper = {
      "loadModule": async (moduleName) => {
        if (!loadDeferredWasm) {
          throw "No implementation of loadDeferredWasm provided.";
        }
        const source = await Promise.resolve(loadDeferredWasm(moduleName));
        const module = await ((source instanceof Response)
            ? WebAssembly.compileStreaming(source, this.builtins)
            : WebAssembly.compile(source, this.builtins));
        return await WebAssembly.instantiate(module, {
          ...baseImports,
          ...additionalImports,
          "wasm:js-string": jsStringPolyfill,
          "module0": dartInstance.exports,
        });
      },
    };

    dartInstance = await WebAssembly.instantiate(this.module, {
      ...baseImports,
      ...additionalImports,
      "deferredLibraryHelper": deferredLibraryHelper,
      "wasm:js-string": jsStringPolyfill,
    });

    return new InstantiatedApp(this, dartInstance);
  }
}

class InstantiatedApp {
  constructor(compiledApp, instantiatedModule) {
    this.compiledApp = compiledApp;
    this.instantiatedModule = instantiatedModule;
  }

  // Call the main function with the given arguments.
  invokeMain(...args) {
    this.instantiatedModule.exports.$invokeMain(args);
  }
}

