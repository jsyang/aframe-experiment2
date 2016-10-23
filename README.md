# aframe-experiment

## Getting started

```
npm i ; grunt
```

## Learnings

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

## Existing VR Guidelines

- [Unreal Engine VR Guidelines Doc](https://docs.unrealengine.com/latest/INT/Platforms/VR/ContentSetup/)
- [Hololens Design Patterns](http://8ninths.com/hololens-design-patterns/)

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
