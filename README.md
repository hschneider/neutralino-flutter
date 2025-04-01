</p>

# neutralino-flutter

**Create Flutter Desktop Apps with Neutralino**

This app scaffold is an alternative to Flutter's Desktop approach: Quickly wrap your Flutter project into a Neutralino app and get access to Neutralino's awesome extensions from Dart.

It comes with the following features:

- Run a Flutter WASM app in a Neutralino Webview.
- Neutralino produces only 2 files to deploy: An executable and its resources file.
- Access all system-resources from the Blazor WASM sandbox through Neutralino's powerful API.
- Use all available [Neutralino Extensions](https://neutralino.js.org/resources/) from your Flutter code.
- Bypass CORS issues with e.g. [Neutralino's CURL extension](https://github.com/hschneider/neutralino-curl).

<img src="https://marketmix.com/git-assets/neutralino-flutter/neutralino-flutter.jpg">

## Neutralino & Flutter: How to integrate

Clone this repo and setup your Neutralino environment as usual. Then build your Flutter project as a WASM. You will find a working example in the `_flutter/demo` folder:
```bash
flutter build web --wasm
```
When your app is ready to publish, add these 2 lines in `build/web/index.html` before the closing head-tag:
```html
<script src="js/neutralino.js"></script>
<script src="js/main.js"></script>
```
Then copy the content of `build/web/` to Neutralino's resources folder, except the `icons`folder.

Make sure, that these 2 folders do not get lost or overwritten:
- resources/js
- resources/icons

Test your app with:
```bash
neu run
```
Then build it with
```
neu build
```
Neutralino depends on **libwebkit2gtk** on the target platfrom. So if your app does not start, you might need to install with:
```
sudo apt install libwebkit2gtk-4.1-0
```
<p align="center">
<img src="https://marketmix.com/git-assets/neutralino-flutter/neutalino-flutter-desktop-wasm.jpg" width="400" height="auto">
</p>

## How does it work?

The Flutter WASM runs in Neutralino's webview inside a native OS window.

The 2 lines added to the index.html make the C++ Neutralino API accessible from Javascript.
On Flutter's side, JS functions can be called by using Flutter's JS InterOP. 

This simple example illustrates how to call JS code from Flutter, doing things outside the WASM sandbox:

```html
import 'dart:js_interop';

@JS('Neutralino.os.showMessageBox')
external void NeutralinoOsShowMessageBox(String title, String msg);
...
onPressed: () async {
  // Calling the external JS function:
  NeutralinoOsShowMessageBox('Info', 'Neutralino says: Hello Flutter!');
},
...
```
We do an async call to the Neutralino API by using Flutter's JS InterOp, here the API-function `Neutralino.os.showMessageBox("Info", "Neutralino says: Hi Blazor!")`.

So when you click the "Call the Neutralino API" button, an os-native dialog pops up. 

You can also do more complex calls or the other way around, call C# code from JS. Read more [about Flutter's JS InterOp here](https://dart.dev/interop/js-interop).

## More about Neutralino

- [NeutralinoJS Home](https://neutralino.js.org) 
- [Neutralino related blog posts at marketmix.com](https://marketmix.com/de/tag/neutralinojs/)


<img src="https://marketmix.com/git-assets/star-me-2.svg">

