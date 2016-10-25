var audio   = require('./audio');
var network = require('./network');

var EL = {
    scene      : null,
    bg2        : null,
    duck1      : null,
    zapper     : null,
    hitArea    : null,
    hitBox     : null,
    sightField : null,
    sightLine  : null,
    player     : null,
    sky        : null,
    dog        : null
};

//////////////////////////////////////////////////////////////////////////////////////////

// Game logic

/** @constant */
var SHOT_CAPACITY        = 3;
var DOG_WALK_SPEED       = 0.0125;
var DOG_INITIAL_POSITION = {
    x : -2,
    y : 1.38,
    z : -7
};

var DUCK_SPEED_SLOW       = 0.1;
var DUCK_DIRECTIONS       = 'UpLeft,UpRight,AcrossLeft,AcrossRight'.split(',');
var DUCK_START_DIRECTIONS = 'UpLeft,UpRight'.split(',');

var STATE = {
    rAF            : null,
    shotsRemaining : 3,

    // Animations
    duck1State                 : 'UpLeft',
    duck1CurrentFrame          : 1,
    duck1StartFrame            : 1,
    duck1EndFrame              : 1,
    duck1LastFrameTime         : 0,
    duck1Alive                 : false,
    duck1DirectionChangeChance : 0.04,

    // Positioning
    duck1Position : {
        x : 0,
        y : 0,
        z : -12
    },

    // Dog
    dogActive                  : true,
    dogBarks                   : 0,
    dogMaxBarks                : 3,
    dogSniffs                  : 0,
    dogMaxSniffs               : 14,
    dogState                   : 'Walk',
    dogCurrentFrame            : 1,
    dogStartFrame              : 1,
    dogEndFrame                : 4,
    dogFramesInCurrentState    : 0,
    dogMaxFramesInCurrentState : 8,
    dogLastFrameTime           : 0,

    dogPosition : DOG_INITIAL_POSITION
};

function getRandomInt(min, max) {
    return min + Math.floor(Math.random() * (max - min));
}

//////////////////////////////////////////////////////////////////////////////////////////

// Shot fired effect

var COLOR_DARK_SKY = 'rgb(9,20,30)';
var COLOR_BLUE_SKY = 'rgb(72,161,241)';

function applyShotFiredEffect() {
    EL.sky.setAttribute('material', 'color', COLOR_DARK_SKY);
    EL.hitArea.setAttribute('material', 'visible', false);
    EL.hitBox.setAttribute('material', 'visible', true);
}

function removeShotFiredEffect() {
    EL.sky.setAttribute('material', 'color', COLOR_BLUE_SKY);
    EL.hitArea.setAttribute('material', 'visible', true);
    EL.hitBox.setAttribute('material', 'visible', false);
}

//////////////////////////////////////////////////////////////////////////////////////////

// User events

function onGyronorm(value) {
    var rotation       = value.rotation;
    var playerRotation = EL.player.getAttribute('rotation');
    rotation.x += 90;
    rotation.x -= playerRotation.x;
    rotation.y -= playerRotation.y;
    rotation.z -= playerRotation.z;
    EL.zapper.setAttribute('rotation', rotation);
}

function onTap() {
    if (STATE.shotsRemaining > 0) {
        audio.playSoundFile('shot');
        applyShotFiredEffect();

        if (intersectedDuck === EL.duck1) {
            setDuck1StateToShot();
        }

        STATE.shotsRemaining--;
    } else {
        STATE.shotsRemaining = SHOT_CAPACITY;
    }

    setTimeout(removeShotFiredEffect, 40);
}

//////////////////////////////////////////////////////////////////////////////////////////

// Network

function onFirebaseValue(res) {
    res = res.val();
    if (res.eventName === 'gyronorm') {
        onGyronorm(res.eventValue);
    } else if (res.eventName === 'tap') {
        onTap();
    }
}

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

    if (getRandomInt(0, 2) === 1) {
        audio.playSoundFile('duck');
    }
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
        if (dTime > 150) {
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

            if (STATE.duck1Position.y > 2 && Math.random() < STATE.duck1DirectionChangeChance) {
                setDuck1RandomDirection();
            }
            audio.playSoundFile('flapping');
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
    STATE.duck1DirectionChangeChance += 0.005;
}

function randomSpawn() {
    setTimeout(spawnDuck1, getRandomInt(1200, 3000));
}

//////////////////////////////////////////////////////////////////////////////////////////

// Dog

function resetDog() {
    STATE.dogActive   = true;
    STATE.dogPosition = DOG_INITIAL_POSITION;
    STATE.dogSniffs   = 0;
    STATE.dogBarks    = 0;
    EL.dog.setAttribute('material', 'depthTest', false);
}

function setDogStateToWalk() {
    STATE.dogState                   = 'Walk';
    STATE.dogCurrentFrame            = 1;
    STATE.dogStartFrame              = 1;
    STATE.dogEndFrame                = 4;
    STATE.dogFramesInCurrentState    = 0;
    STATE.dogMaxFramesInCurrentState = getRandomInt(1, 8);
}

function setDogStateToSniff() {
    STATE.dogState = 'Sniff';
}

function setDogStateToReady() {
    STATE.dogState = 'Ready';
}

function setDogStateToJump() {
    STATE.dogState         = 'Jump1';
    STATE.dogLastFrameTime = new Date();
}

function setDogStateToJumpFall() {
    STATE.dogState = 'Jump2';
    EL.dog.setAttribute('material', 'depthTest', true);
}

function moveDog(options) {
    if (options.dx) {
        STATE.dogPosition.x += options.dx;
    }

    if (options.dy) {
        STATE.dogPosition.y += options.dy;
    }

    if (options.dz) {
        STATE.dogPosition.z += options.dz;
    }

    EL.dog.setAttribute('position', STATE.dogPosition);
}

function dogBark() {
    if (STATE.dogBarks < STATE.dogMaxBarks) {
        STATE.dogBarks++;
        audio.playSoundFile('bark');
        setTimeout(dogBark, 300);
    }
}

function animateDog() {
    var state = STATE.dogState;
    var now   = new Date();
    var dTime = now - STATE.dogLastFrameTime;

    if (state === 'Walk') {
        if (dTime > 80) {
            EL.dog.setAttribute(
                'material',
                'src',
                '#dog' + STATE.dogState + STATE.dogCurrentFrame
            );

            STATE.dogCurrentFrame++;
            if (STATE.dogCurrentFrame > STATE.dogEndFrame) {
                STATE.dogCurrentFrame = STATE.dogStartFrame;
            }
            STATE.dogLastFrameTime = now;
            STATE.dogFramesInCurrentState++;

            if (STATE.dogFramesInCurrentState === STATE.dogMaxFramesInCurrentState) {
                if (STATE.dogSniffs > STATE.dogMaxSniffs) {
                    setDogStateToReady();
                } else {
                    STATE.dogSniffs++;
                    setDogStateToSniff();
                }
            }
        }

        if (dTime > 20) {
            moveDog({ dx : DOG_WALK_SPEED });
        }
    } else if (state === 'Sniff') {
        EL.dog.setAttribute('material', 'src', '#dogSniff');

        if (dTime > 140) {
            setDogStateToWalk();
        }
    } else if (state === 'Ready') {
        EL.dog.setAttribute('material', 'src', '#dogReady');

        if (dTime > 300) {
            setDogStateToJump();
            setTimeout(dogBark, 500);
        }
    } else if (state === 'Jump1' || state === 'Jump2') {
        EL.dog.setAttribute('material', 'src', '#dog' + state);

        if (state === 'Jump1') {
            if (STATE.dogPosition.y < 3.5) {
                moveDog({ dx : 0.02, dy : 0.12, dz : -0.08 });
            } else {
                setDogStateToJumpFall();
                bg2TextureBlendHack();
            }
        } else if (state === 'Jump2') {
            if (STATE.dogPosition.y > 1.38) {
                moveDog({ dx : 0.01, dy : -0.1 });
            } else {
                // Trigger round start
                randomSpawn();
                STATE.dogActive = false;
            }
        }
    }
}

function tickDog() {
    if (STATE.dogActive) {
        if (STATE.dogFramesInCurrentState <= STATE.dogMaxFramesInCurrentState) {
            animateDog();
        }
    }
}

//////////////////////////////////////////////////////////////////////////////////////////

// Game events

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

function tick() {
    tickDuck1();
    tickDog();
    STATE.rAF = requestAnimationFrame(tick);

}

var hackApplied = false;

// Hack to get BG2 texture to blend correctly
function bg2TextureBlendHack() {
    if (!hackApplied) {
        EL.bg2.components['material-overdraw'].update();
        hackApplied = true;
    }
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
            flapping      : 'flapping.mp3',
            drop          : 'drop.mp3',
            down          : 'down.mp3',
            duck          : 'duck.mp3',
            shot          : 'shot.mp3',
            end           : 'end.mp3',
            bark          : 'bark.mp3',
            duckHuntIntro : 'duckHuntIntro.mp3'
        }
    });

    //randomSpawn();
    audio.playSoundFile('duckHuntIntro');
    resetDog();
    setDogStateToWalk();
    tick();

    window.EL = EL;
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
