var audio   = require('./audio');
var network = require('./network');

var EL = {
    scene      : null,
    duck1      : null,
    zapper     : null,
    hitArea    : null,
    sightField : null,
    sightLine  : null
};

//////////////////////////////////////////////////////////////////////////////////////////

// Game logic

/** @constant */
var SHOT_CAPACITY         = 3;
var DUCK_SPEED_SLOW       = 0.1;
var DUCK_DIRECTIONS       = 'UpLeft,UpRight,AcrossLeft,AcrossRight'.split(',');
var DUCK_START_DIRECTIONS = 'UpLeft,UpRight'.split(',');

var STATE = {
    shotsRemaining : 3,

    // Animations
    duck1State                 : 'UpLeft',
    duck1CurrentFrame          : 1,
    duck1StartFrame            : 1,
    duck1EndFrame              : 1,
    duck1LastFrameTime         : 0,
    duck1RAF                   : null,
    duck1Alive                 : false,
    duck1DirectionChangeChance : 0.04,

    // Positioning
    duck1Position : {
        x : 0,
        y : 0,
        z : -12
    }
};

function getRandomInt(min, max) {
    return min + Math.floor(Math.random() * (max - min));
}

//////////////////////////////////////////////////////////////////////////////////////////

// User events

function onGyronorm(value) {
    var rotation = value.rotation.split(' ').map(parseFloat);
    rotation[0] += 90;
    EL.zapper.setAttribute('rotation', rotation.join(' '));
}

function onTap() {
    if (STATE.shotsRemaining > 0) {
        audio.playSoundFile('shot');

        if (intersectedDuck === EL.duck1) {
            setDuck1StateToShot();
        }

        STATE.shotsRemaining--;
    } else {
        STATE.shotsRemaining = SHOT_CAPACITY;
    }

}

function onFirebaseValue(res) {
    res = res.val();
    if (res.eventName === 'gyronorm') {
        onGyronorm(res.eventValue);
    } else if (res.eventName === 'tap') {
        onTap();
    }
}

//////////////////////////////////////////////////////////////////////////////////////////

// Sensors

var useFirebase = false;

function getNetworkSettings() {
    if (useFirebase) {
        var deviceId = prompt('deviceId', localStorage.getItem('deviceId'));
        localStorage.setItem('deviceId', deviceId);

        return {
            useFirebase : true,
            deviceId    : deviceId
        };
    } else {
        return {
            useSocketIO : true,
            url         : location.protocol + '//' + location.hostname + ':3001'
        };
    }
}

function initNetwork() {
    if (useFirebase) {
        network
            .init(getNetworkSettings())
            .on('value', onFirebaseValue);
    } else {
        network
            .init(getNetworkSettings())
            .on('tap', onTap)
            .on('gyronorm', onGyronorm);
    }

}

var intersectedDuck;

function onDuck1Intersected() {
    intersectedDuck = EL.duck1;
}

function onDuck1IntersectedCleared() {
    intersectedDuck = undefined;
}

function onSightFieldIntersected(e) {
    var vec3 = e.detail.intersection.point;
    EL.hitArea.setAttribute('position', vec3);
}

//////////////////////////////////////////////////////////////////////////////////////////

// Ducks

function setDuck1RandomDirection(isStart) {
    if (isStart) {
        STATE.duck1State = DUCK_START_DIRECTIONS[
            Math.floor(Math.random() * DUCK_START_DIRECTIONS.length)
            ];

    } else {
        STATE.duck1State = DUCK_DIRECTIONS[
            Math.floor(Math.random() * DUCK_DIRECTIONS.length)
            ];
    }

    audio.playSoundFile('duck');
}

function setDuck1StateToDown() {
    STATE.duck1State        = 'Down';
    STATE.duck1CurrentFrame = 1;
    STATE.duck1StartFrame   = 1;
    STATE.duck1EndFrame     = 2;
    audio.playSoundFile('down');
}

function setDuck1StateToShot() {
    STATE.duck1State = 'Shot';
}

function setDuck1StateToNotAlive() {
    EL.duck1.setAttribute('material', 'visible', false);
    STATE.duck1Alive = false;
    cancelAnimationFrame(STATE.duck1RAF);
}

function setDuck1StateToAliveWithRandomPosition() {
    setDuck1RandomDirection(true);
    EL.duck1.setAttribute('material', 'visible', true);
    STATE.duck1Alive      = true;
    STATE.duck1Position.y = 0;
    STATE.duck1Position.x = getRandomInt(-5, 5);
    EL.duck1.setAttribute('position', STATE.duck1Position);
    STATE.duck1CurrentFrame = 1;
    STATE.duck1StartFrame   = 1;
    STATE.duck1EndFrame     = 3;
    cancelAnimationFrame(STATE.duck1RAF);
}

function animateDuck1() {
    var state = STATE.duck1State;
    var now   = new Date();
    var dTime = now - STATE.duck1LastFrameTime;

    if (state === 'Shot') {
        if (EL.duck1.getAttribute('material').src !== '#duckShot') {
            EL.duck1.setAttribute('material', 'src', '#duckShot');
            STATE.duck1LastFrameTime = now;
        } else if (dTime >= 600) {
            setDuck1StateToDown();
            STATE.duck1LastFrameTime = now;
        }
    } else if (state === 'Down') {
        // Falling
        if (STATE.duck1Position.y > 0) {
            if (dTime > 20) {
                moveDuck1({ dy : -DUCK_SPEED_SLOW });
            }

            if (dTime >= 100) {
                EL.duck1.setAttribute('material', 'src', '#duckDown' + STATE.duck1CurrentFrame);
                STATE.duck1CurrentFrame  = STATE.duck1CurrentFrame === 2 ? 1 : 2;
                STATE.duck1LastFrameTime = now;
            }
        } else {
            setDuck1StateToNotAlive();
            //audio.playSoundFile('drop');
            randomSpawn();
            audio.playSoundFile('end');
        }

    } else {
        if (dTime >= 200) {
            EL.duck1.setAttribute(
                'material',
                'src',
                '#duck' + STATE.duck1State + STATE.duck1CurrentFrame
            );

            STATE.duck1CurrentFrame++;
            if (STATE.duck1CurrentFrame > STATE.duck1EndFrame) {
                STATE.duck1CurrentFrame = STATE.duck1StartFrame;
            }
            STATE.duck1LastFrameTime = now;

            if(STATE.duck1Position.y > 1 && Math.random() < STATE.duck1DirectionChangeChance) {
                    setDuck1RandomDirection();
            }
        }

        if (dTime > 20) {
            var speed = DUCK_SPEED_SLOW;

            if (state === 'AcrossLeft') {
                moveDuck1({ dx : -speed });

            } else if (state === 'AcrossRight') {
                moveDuck1({ dx : speed });

            } else if (state === 'UpRight') {
                moveDuck1({ dx : speed, dy : speed });

            } else if (state === 'UpLeft') {
                moveDuck1({ dx : -speed, dy : speed });
            }
        }
    }

}

function tickDuck1() {
    if (STATE.duck1Alive) {
        animateDuck1();
        STATE.duck1RAF = requestAnimationFrame(tickDuck1);
    } else {
        setDuck1StateToNotAlive();
    }
}

function moveDuck1(options) {
    if (options.dx) {
        STATE.duck1Position.x += options.dx;
    }

    if (options.dy) {
        STATE.duck1Position.y += options.dy;
    }

    if (Math.abs(STATE.duck1Position.x) > 16 || Math.abs(STATE.duck1Position.y) > 16) {
        setDuck1StateToNotAlive();
        randomSpawn();
    } else {
        EL.duck1.setAttribute('position', STATE.duck1Position);
    }
}

function spawnDuck1() {
    setDuck1StateToAliveWithRandomPosition();
    tickDuck1();
    STATE.duck1DirectionChangeChance += 0.005;
}

function randomSpawn() {
    setTimeout(spawnDuck1, getRandomInt(1200, 3000));
}
//////////////////////////////////////////////////////////////////////////////////////////

// Entry point

function onDOMContentLoaded() {
    // Run all values as selectors and save in place
    Object.keys(EL).forEach(function (k) { EL[k] = document.getElementById(k);});

    EL.duck1.addEventListener('raycaster-intersected', onDuck1Intersected);
    EL.duck1.addEventListener('raycaster-intersected-cleared', onDuck1IntersectedCleared);

    EL.sightField.addEventListener('raycaster-intersected', onSightFieldIntersected);

    initNetwork();

    audio.init({
        from   : 'assets/duckhunt/',
        sounds : {
            drop : 'drop.mp3',
            down : 'down.mp3',
            duck : 'duck.mp3',
            shot : 'shot.wav',
            end  : 'end.mp3'
        }
    });

    randomSpawn();
}

document.addEventListener('DOMContentLoaded', onDOMContentLoaded);

//////////////////////////////////////////////////////////////////////////////////////////

// Debug stuff

window.addEventListener('keydown', function onKeyPress(e) {
    if (e.which === 32) { // Space
        onTap();

    } else if (e.which === 16) { // Shift
        spawnDuck1();
    }
});
