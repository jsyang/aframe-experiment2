# Jim's AFrame experiments

---

## Experimentation Summary

[Bringing Light to WebVR with AFrame](https://medium.com/this-place/bringing-light-to-webvr-with-aframe-bf98ba2f49db)


## Getting started

In one terminal window:

```
npm i ; grunt
```

In another:

```
node server/index.js
```

### Duck Hunt

![duckhunt gif](http://i.imgur.com/9eq8jqe.gif)

[See it on YouTube](https://www.youtube.com/watch?v=qLRu9_qdUpo)

1. On your *viewer device*, go to http://localhost:3000/duckhunt.html
2. On your *controller device*, go to http://localhost:3000/controller.html
3. Select the `gyronorm` controller mode
4. Select the `socketio` network mode

5. You need to align both the *viewer* and the *controller* in the same orientation,
if they get out of sync, you will need to long-press on the *controller* to reset it.

On your *viewer*, you need to face north as you re-sync.

---

## Learnings

- [Google W3C WebVR presentation](https://docs.google.com/presentation/d/1CSgOsiyn2PeLGlJCnrmmTYv9FLE_dmCaVKp7fZ-SF2I/edit?usp=sharing)
- Models with faces that have more than 3 vertices will not load in THREE.js loaders (which is what AFrame is using)
- Ctrl + Alt + I opens the AFrame Inspector which you can use to rearrange entities in the scene. You can
copy the resultant HTML

- Youtube Videos need to be downloaded as MP4 or [proxied to be viewable as textures](http://stackoverflow.com/questions/36298195/how-to-render-youtube-videos-as-a-texture-in-a-frame)
- [`<script/>` after `</body>` produces undefined behavior and should be avoided.](http://stackoverflow.com/q/3037725/4921124)
- aframe-cubemap-component order diagram:

```
   px   py
     \  |
      \ |
       \|
 pz-----*----> nz
        |\
        | \
        |  \
        ny  nx


  -->   indicates direction of camera relative to the inside faces of
        the cubemap
```
- iOS: make sure you clear the cache. textures are cached requests.
- Use Firebase as a fast DB to sync controllers via network, if no bluetooth/ direct input is available.
[Firebase console](https://console.firebase.google.com/)

- [Dynamic mesh modification](https://github.com/mrdoob/three.js/issues/1091)
- [Embedding Google Street View images into AFrame](http://stackoverflow.com/questions/39919377/can-i-embed-google-street-view-into-aframe)

- [Bitmap fonts at good at any distance](https://github.com/bryik/aframe-bmfont-text-component)
- [Templating](https://github.com/ngokevin/aframe-template-component) for AFrame scene nodes

- Cursor component doesn't filter elements like raycaster component does
- AR foundation: [aframe-passthrough](https://github.com/flysonic10/aframe-passthrough) (get live camera image)

- HTMLElement.appendChild doesn't work. Use HTMLElement.insertAdjacentHTML() instead.

- Open source alternative to Firebase: [gunDB](https://github.com/amark/gun)
Real-time sync'd graph DB that's available locally.

- FeathersJS another alt to Firebase: https://docs.feathersjs.com/getting-started/quick-start.html
- [ProxyControls](https://proxy-controls.donmccurdy.com/#/connect)
Polished version of devices connecting to others via WebRTC + WebSockets. Differences:
    - paradigm limits it strictly to 1 type (client/host) per device (pc/mobile)

- `HTMLElement.remove()` does not work for removing entities through the DOM. Instead use `HTMLElement.parentNode.removeChild(HTMLElement)`

- [Early handwriting recognition](http://jackschaedler.github.io/handwriting-recognition)
    [DIY version](http://hackaday.com/2016/10/12/ask-hackaday-diy-handwriting-recognition)
    [$1 unistroke recognizer](http://depts.washington.edu/aimgroup/proj/dollar)

- [Frustum Lock component](https://jesstelford.github.io/aframe-frustum-lock-component/)

- [ReDollar gesture recognizer](https://github.com/finscn/ReDollar)

- [Cannon.js 3D non-ported physics](http://schteppe.github.io/cannon.js/)

- Gyronorm values don't implement [sensor fusion](https://github.com/googlevr/webvr-polyfill/tree/master/src/sensor-fusion)... will need to use that to get better orientation values
- Needs to sync with consumer to recalibrate the sensor when the scene is done loading.

---

## Existing VR Guidelines

- [Google Cardboard VR design specs](https://developers.google.com/vr/android/)
- [Unreal Engine VR Guidelines Doc](https://docs.unrealengine.com/latest/INT/Platforms/VR/ContentSetup/)
- [Hololens Design Patterns](http://8ninths.com/hololens-design-patterns/)

- [GooCreate](https://goocreate.com/product)
WebGL creation tool

- [Vizor creation tool](http://vizor.io)

- [Ray-input](https://github.com/borismus/ray-input)
Similar to the solution that's to be created, but mine is substitution of inputs as a way to
keep the experience interactive.

## Blender Recap

- [Blender HotKeys](https://wiki.blender.org/index.php/Doc:2.4/Reference/Hotkeys/Edit)
- After selection (A to select all), TAB enters Edit mode.
- [Rotate texture](http://blender.stackexchange.com/questions/5608/rotate-object-texture)

## Notable AFrame projects

- [Sense of promise](http://senseofpromise.com)

## AR libraries

- [JS Aruco](https://github.com/jcmellado/js-aruco)


# Duck hunt resources

- [SFX](http://downloads.khinsider.com/game-soundtracks/album/duck-hunt)

# Conduit tech

- [Electron app for the controller host](https://github.com/electron/electron)
- [SocketIO iOS](http://socket.io/blog/socket-io-on-ios/)
- [selenium-standalone](https://github.com/vvo/selenium-standalone)

```
npm install selenium-standalone@latest -g
selenium-standalone install
selenium-standalone start
node server/index.js
```

- [webdriverio](http://webdriver.io)
- [Inversion of control in a DooM mod](https://www.youtube.com/watch?v=KNxPfHon-wY)

- [3D Scene to cubemap for streaming to cubemap viewer?](https://www.npmjs.com/package/gl-render-cubemap)

```
npm install webdriverio --save-dev
```

- [Webdriver usage example](https://github.com/webdriverio/webdriverio/blob/master/examples/standalone/webdriverio.with.nodeunit.js)
- [Capture entire web document](https://github.com/brenden/node-webshot)
- [RobotJS desktop automation](http://robotjs.io/docs/)