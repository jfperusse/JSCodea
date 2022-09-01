// © 2022 Jean-François Pérusse

var volume = document.getElementById("volume");
var volumeValue = document.getElementById("volumeValue");
var myCanvas = document.getElementById("myCanvas");
var myContext = myCanvas.getContext('2d');
var surveyFrame = document.getElementById("survey-frame");
var surveyContainer = document.getElementById("survey-container");
var feedbackForm = document.getElementById("form-feedback");
var textareaFeedback = document.getElementById("textarea-feedback");
var musicAudio = new Audio();
var soundAudio = new Audio(); // TODO: Should allow playing multiple concurrent sounds instead!

window.onclick = function(event) {
    if (event.target == surveyContainer) {
        surveyContainer.style.display = "none";
    }
}

const CORNER = 0
const LEFT = 0
const RIGHT = 1
const CORNERS = 1
const CENTER = 2
const RADIUS = 3

const BEGAN = 0
const MOVING = 1
const ENDED = 2

var strokeWidth = 0.0;
var fontSize = 17.0;
var fontName = "Helvetica";
var textMode = CENTER;
var textAlign = LEFT;
var fill = {r: 127, g: 127, b: 127, a: 255};
var stroke = {r: 255, g: 255, b: 255, a: 255};
var tint = {r: 255, g: 255, b: 255, a: 255};
var styleStack = [];
var rectMode = CORNER;
var ellipseMode = CENTER;
var spriteMode = CENTER;
var touching = false;
var startTime;

function getMousePos(e) {
    var rect = myCanvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
}

function sendLuaMouse(state, e) {
    var mousePos = getMousePos(e);
    var x = (mousePos.x / myCanvas.offsetWidth) * width;
    var y = ((myCanvas.offsetHeight - mousePos.y) / myCanvas.offsetHeight) * height;
    luaMouse(state, x, y);
}

function updateVolumeValue() {
    volumeValue.innerHTML = `${Math.floor(volume.value * 100)} %`;
    musicAudio.volume = volume.valueAsNumber;
    localStorage.setItem('volume', volume.value);
    console.log("saved volume to " + volume.value);
}

function handlePrint(message) {
    terminal.echo(message);
}

updateVolumeValue();

volume.oninput = updateVolumeValue;

function pageWantsInputs() {
    return textareaFeedback == document.activeElement;
}

function startRuntime(luaCode) {
    myCanvas.onselectstart = function () { return false; }

    width = myCanvas.width;
    height = myCanvas.height;

    luaSetWindowSize(width, height);

    fengari.load(luaCode)();

    luaCallSetup();

    terminal = $('#terminal').terminal(function(command) {
        luaEval(command);
    },
    {
        greetings: greetings.innerHTML + "\nCommands are evaluated in the Lua context.\n\nprint() commands are displayed here.\n"
    });

    myContext.fillStyle = 'rgb(0, 0, 0)';
    myContext.fillRect(0, 0, width, height);

    applyFont();

    startTime = Date.now();
    lastTime = Date.now();

    draw();

    myCanvas.addEventListener('mousedown', e => {
        if (pageWantsInputs()) return;

        touching = true;        
        sendLuaMouse(BEGAN, e);
      });
      
    myCanvas.addEventListener('mousemove', e => {
        if (pageWantsInputs()) return;
        
        if (touching) {
            sendLuaMouse(MOVING, e);
        }
    });
    
    myCanvas.addEventListener('mouseup', e => {
        if (pageWantsInputs()) return;
        
        sendLuaMouse(ENDED, e);
        touching = false;
    });

    myCanvas.addEventListener('touchstart', e => {
        if (pageWantsInputs()) return;
        
        touching = true;        
        sendLuaMouse(BEGAN, e.changedTouches[0]);
        e.preventDefault();
      });
      
    myCanvas.addEventListener('touchmove', e => {
        if (pageWantsInputs()) return;
        
        if (touching) {
            sendLuaMouse(MOVING, e.changedTouches[0]);
        }
        e.preventDefault();
    });
    
    myCanvas.addEventListener('touchend', e => {
        if (pageWantsInputs()) return;
        
        sendLuaMouse(ENDED, e.changedTouches[0]);
        touching = false;
        e.preventDefault();
    });

    window.addEventListener("keydown", e => {
        if (pageWantsInputs()) return;
        
        luaKeyDown(e.key);
        if (document.activeElement == document.body) {
            e.preventDefault();
        }
    });

    window.addEventListener("keyup", e => {
        if (pageWantsInputs()) return;
        
        luaKeyUp(e.key);
        if (document.activeElement == document.body) {
            e.preventDefault();
        }
    });
}

function applyFont() {
    myContext.font = `${fontSize}px ${fontName}`;
}

function readLocalData(key, defaultValue) {
    return localStorage.getItem(key) || defaultValue;
}

function saveLocalData(key, value) {
    localStorage.setItem(key, value);
}

function updateCanvasSize() {
    var newHeight = window.innerHeight - 50;
    var newWidth = (800.0 / 600.0) * newHeight;
    myCanvas.style.height = `${newHeight}px`;
    myCanvas.style.width = `${newWidth}px`;

    surveyFrame.height = newHeight;

    var widgetBot = document.getElementById("widgetbot");
    widgetBot.style.height = newHeight / 2;
    widgetBot.style.width = window.innerWidth - newWidth - 50;

    var terminal = document.getElementById("terminal");
    terminal.style.height = widgetBot.style.height;
    terminal.style.width = widgetBot.style.width;
}

function draw() {
    updateCanvasSize();

    var time = Date.now();
    var elapsedTime = (time - startTime) / 1000;
    var deltaTime = Math.min(1, (time - lastTime) / 1000);
    lastTime = time;

    luaSetTime(elapsedTime, deltaTime);

    luaCallDraw();

    setTimeout(draw, 1000 / 60);
}

function textSize(textToMeasure) {
    var size = myContext.measureText(textToMeasure);
    return [ null, size.width, size.fontBoundingBoxAscent + size.fontBoundingBoxDescent ];
}

function background(r, g, b, a) {
    myContext.fillStyle = `rgb(${r}, ${g}, ${b}, ${a})`;
    myContext.fillRect(0, 0, width, height);
}

function pushMatrix() {
    myContext.save();
}

function popMatrix() {
    var strokeStyle = myContext.strokeStyle;
    var fillStyle = myContext.fillStyle;
    var lineWidth = myContext.lineWidth;
    var lineCap = myContext.lineCap;
    var font = myContext.font;
    var textAlign = myContext.textAlign;
    var direction = myContext.direction;
    var imageSmoothingEnabled = myContext.imageSmoothingEnabled;

    myContext.restore();

    myContext.strokeStyle = strokeStyle;
    myContext.fillStyle = fillStyle;
    myContext.lineWidth = lineWidth;
    myContext.lineCap = lineCap;
    myContext.font = font;
    myContext.textAlign = textAlign;
    myContext.direction = direction;
    myContext.imageSmoothingEnabled = imageSmoothingEnabled;
}

function pushStyle() {
    styleStack.push({
        strokeStyle: myContext.strokeStyle,
        fillStyle: myContext.fillStyle,
        lineWidth: myContext.lineWidth,
        lineCap: myContext.lineCap,
        font: myContext.font,
        textAlign: myContext.textAlign,
        direction: myContext.direction,
        imageSmoothingEnabled: myContext.imageSmoothingEnabled,
        strokeWidth: strokeWidth,
        textMode: textMode,
        rectMode: rectMode,
        ellipseMode: ellipseMode,
        spriteMode: spriteMode
    });
}

function popStyle() {
    if (styleStack.length == 0) {
        return;
    }

    var style = styleStack.pop();

    myContext.strokeStyle = style.strokeStyle;
    myContext.fillStyle = style.fillStyle;
    myContext.lineWidth = style.lineWidth;
    myContext.lineCap = style.lineCap;
    myContext.font = style.font;
    myContext.textAlign = style.textAlign;
    myContext.direction = style.direction;
    myContext.imageSmoothingEnabled = style.imageSmoothingEnabled;

    strokeWidth = style.strokeWidth;
    textMode = style.textMode;
    rectMode = style.rectMode;
    spriteMode = style.spriteMode;
    ellipseMode = style.ellipseMode;
}

function translate(x, y) {
    myContext.translate(x, -y);
}

function scale(x, y) {
    myContext.scale(x, y);
}

function text(msg, x, y) {
    myContext.fillStyle = `rgba(${fill.r}, ${fill.g}, ${fill.b}, ${fill.a})`;

    switch (textMode) {
        case CENTER:
            myContext.textAlign = "center";
            myContext.textBaseline = "middle";
            break;
        case CORNER:
            myContext.textAlign = "left";
            myContext.textBaseline = "bottom";
            break;
        default:
            break;
    }
        
    myContext.fillText(msg, x, height - y);
}

function rect(x, y, w, h) {
    myContext.fillStyle = `rgba(${fill.r}, ${fill.g}, ${fill.b}, ${fill.a})`;
    myContext.strokeStyle = `rgba(${stroke.r}, ${stroke.g}, ${stroke.b}, ${stroke.a})`;

    var rectLeft = x + strokeWidth / 2
    var rectBottom = y + strokeWidth / 2
    var rectWidth = w - strokeWidth
    var rectHeight = h - strokeWidth

    switch (rectMode) {
        case CENTER:
            rectLeft = x - w / 2 + strokeWidth / 2;
            rectBottom = y - h / 2 + strokeWidth / 2;
            break;
        case RADIUS:
            rectLeft = x - w + strokeWidth / 2
            rectBottom = y - h + strokeWidth / 2
            rectWidth = w * 2 - strokeWidth
            rectHeight = h * 2 - strokeWidth
            break;
        case CORNER:
            break;
        case CORNERS:
            rectWidth = w - x - strokeWidth
            rectHeight = h - y - strokeWidth
            break;
    }

    myContext.fillRect(rectLeft, height - rectBottom - rectHeight, rectWidth, rectHeight);

    if (strokeWidth > 0) {
        myContext.lineWidth = strokeWidth;
        myContext.strokeRect(rectLeft, height - rectBottom - rectHeight, rectWidth, rectHeight);
    }
}

function ellipse(x, y, w, h) {
    myContext.fillStyle = `rgba(${fill.r}, ${fill.g}, ${fill.b}, ${fill.a})`;
    myContext.strokeStyle = `rgba(${stroke.r}, ${stroke.g}, ${stroke.b}, ${stroke.a})`;
    myContext.lineWidth = strokeWidth;

    var centerX = x
    var centerY = y
    var ellipseWidth = w
    var ellipseHeight = h

    switch (ellipseMode) {
        case CENTER:
            break;
        case RADIUS:
            ellipseWidth = w * 2
            ellipseHeight = h * 2
            break;
        case CORNER:
            centerX = x + w / 2
            centerY = y + h / 2
            break;
        case CORNERS:
            ellipseWidth = w - x
            ellipseHeight = h - y
            centerX = x + ellipseWidth / 2
            centerY = y + ellipseHeight / 2
            break;
    }

    myContext.beginPath();
    myContext.ellipse(centerX, height - centerY, ellipseWidth / 2 - strokeWidth, ellipseHeight / 2 - strokeWidth, 0, 0, 2 * Math.PI);
    myContext.fill();

    if (strokeWidth > 0) {
        myContext.stroke();
    }
}

function line(x1, y1, x2, y2)  {
    myContext.fillStyle = `rgba(${stroke.r}, ${stroke.g}, ${stroke.b}, ${stroke.a})`;
    myContext.lineWidth = strokeWidth;
    myContext.beginPath();
    myContext.moveTo(x1, height - y1);
    myContext.lineTo(x2, height - y2);
    myContext.stroke();
}

var tintCanvas = document.createElement('canvas');
var tintContext = tintCanvas.getContext('2d');

function sprite(asset, x, y, w, h) {
    var image;
    var imageWidth;
    var imageHeight;

    if (typeof asset === 'string') {
        var asset = asset.replace("asset.", "");

        var imageAsset = loadedProject.images[asset];
        if (imageAsset.img.width == 0 || imageAsset.img.height == 0) {
            return
        }

        image = imageAsset.img;
        imageWidth = image.width;
        imageHeight = image.height;
    }
    else {
        image = asset._canvas;
        imageWidth = asset.width;
        imageHeight = asset.height;
    }

    var spriteLeft = x
    var spriteBottom = y
    var spriteWidth = w ?? imageWidth
    var spriteHeight = h ?? imageHeight

    switch (spriteMode) {
        case CENTER:
            spriteLeft = x - w / 2;
            spriteBottom = y - h / 2;
            break;
        case RADIUS:
            spriteLeft = x - w;
            spriteBottom = y - h;
            spriteWidth = w * 2;
            spriteHeight = h * 2;
            break;
        case CORNER:
            break;
        case CORNERS:
            spriteWidth = w - x;
            spriteHeight = h - y;
            break;
    }

    if (tint.r != 255 || tint.g != 255 || tint.b != 255 || tint.a != 255) {
        tintCanvas.width = imageWidth;
        tintCanvas.height = imageHeight;
    
        tintContext.fillStyle = `rgba(${tint.r}, ${tint.g}, ${tint.b})`;
        tintContext.fillRect(0,0,tintCanvas.width,tintCanvas.height);
    
        tintContext.globalCompositeOperation = 'multiply';
        tintContext.drawImage(image, 0, 0); 
        
        tintContext.globalCompositeOperation = 'destination-atop';
        tintContext.drawImage(image, 0, 0);
    
        myContext.globalAlpha = tint.a / 255.0;
        myContext.drawImage(tintCanvas, spriteLeft, height - spriteBottom - spriteHeight, spriteWidth, spriteHeight);    
        myContext.globalAlpha = 1.0;
    }
    else {
        myContext.drawImage(image, spriteLeft, height - spriteBottom - spriteHeight, spriteWidth, spriteHeight);
    }
}

function readImage(asset) {
    var asset = asset.replace("asset.", "");

    var image = loadedProject.images[asset];

    var result = {
        width: image.img.width,
        height: image.img.height,
        _image: image.img
    };

    result.copy = function(x, y, w, h) {
        var hiddenCanvas = document.createElement("canvas");
        hiddenCanvas.width = w;
        hiddenCanvas.height = h;
        var hiddenContext = hiddenCanvas.getContext("2d");
        hiddenContext.drawImage(this._image, x - 1, this.height - y - h + 1, w, h, 0, 0, w, h);
        var result = {
            width: w,
            height: h,
            _canvas: hiddenCanvas
        }
        //console.dir(result);
        return result;
    }

    return result;
}

function copyToClipboard(data) {
    if (navigator && navigator.clipboard && navigator.clipboard.writeText) {
        console.log("Copying to clipboard...");
        navigator.clipboard.writeText(data);
    }
    else {
        console.warn("navigator.clipboard is not supported");
    }
}

function readUint8(view, position) {
    
    var result = view.getUint8(position);
    var newPosition = position + 1
    return [ newPosition, result ]
}

function readInt8(view, position) {
    var result = view.getInt8(position);
    var newPosition = position + 4
    return [ newPosition, result ]
}

function readSoundValue(sound, variable, view, method, position, size, norm = 1.0, scale = 1.0, offset = 0, methodParam = null) {
    var methodResult;

    if (methodParam != null) {
        methodResult = view[method](position, methodParam)
    }
    else {
        methodResult = view[method](position)
    }

    sound[variable] = (methodResult / norm) * scale + offset

    return position + size
}

function playSoundDataShort(view, position) {
    var sound = {
        sample_rate: 44100,
        sample_size: 16
    }

    position = readSoundValue(sound, "wave_type", view, "getInt8", position, 1)
    position = readSoundValue(sound, "sound_vol", view, "getInt8", position, 1, 128.0)

    position = readSoundValue(sound, "p_base_freq", view, "getInt8", position, 1, 128.0)
    position = readSoundValue(sound, "p_freq_limit", view, "getInt8", position, 1, 128.0)
    position = readSoundValue(sound, "p_freq_ramp", view, "getInt8", position, 1, 128.0, 2.0, -1.0)

    position = readSoundValue(sound, "p_freq_dramp", view, "getInt8", position, 1, 128.0, 2.0, -1.0)
    position = readSoundValue(sound, "p_duty", view, "getInt8", position, 1, 128.0, 2.0, -1.0)
    position = readSoundValue(sound, "p_duty_ramp", view, "getInt8", position, 1, 128.0, 2.0, -1.0)
    
    position = readSoundValue(sound, "p_vib_strength", view, "getInt8", position, 1, 128.0, 2.0, -1.0)
    position = readSoundValue(sound, "p_vib_speed", view, "getInt8", position, 1, 128.0, 2.0, -1.0)
    position = readSoundValue(sound, "p_vib_delay", view, "getInt8", position, 1, 128.0, 2.0, -1.0)

    position = readSoundValue(sound, "p_env_attack", view, "getFloat32", position, 4, 1, 1, 0, true)
    position = readSoundValue(sound, "p_env_sustain", view, "getFloat32", position, 4, 1, 1, 0, true)
    position = readSoundValue(sound, "p_env_decay", view, "getFloat32", position, 4, 1, 1, 0, true)
    
    position = readSoundValue(sound, "p_env_punch", view, "getInt8", position, 1, 128.0, 2.0, -1.0)

    position = readSoundValue(sound, "filter_on", view, "getInt8", position, 1)
    position = readSoundValue(sound, "p_lpf_resonance", view, "getInt8", position, 1, 128.0, 2.0, -1.0)
    position = readSoundValue(sound, "p_lpf_freq", view, "getInt8", position, 1, 128.0, 2.0, -1.0)
    position = readSoundValue(sound, "p_lpf_ramp", view, "getInt8", position, 1, 128.0, 2.0, -1.0)
    position = readSoundValue(sound, "p_hpf_freq", view, "getInt8", position, 1, 128.0, 2.0, -1.0)
    position = readSoundValue(sound, "p_hpf_ramp", view, "getInt8", position, 1, 128.0, 2.0, -1.0)

    position = readSoundValue(sound, "p_pha_offset", view, "getInt8", position, 1, 128.0, 2.0, -1.0)
    position = readSoundValue(sound, "p_pha_ramp", view, "getInt8", position, 1, 128.0, 2.0, -1.0)

    position = readSoundValue(sound, "p_repeat_speed", view, "getInt8", position, 1, 128.0, 2.0, -1.0)

    position = readSoundValue(sound, "p_arp_speed", view, "getInt8", position, 1, 128.0, 2.0, -1.0)
    position = readSoundValue(sound, "p_arp_mod", view, "getInt8", position, 1, 128.0, 2.0, -1.0)

    sound.sound_vol *= volume.valueAsNumber;

    //console.dir(JSON.stringify(sound))

    var audio = sfxr.toAudio(sound);
    audio.play();
}

function playSoundDataFull(view, position) {
    console.warn("playSoundDataFull is not implemented")
}

function playSoundData(data) {
    var binaryString = window.atob(data);
    var length = binaryString.length;
    var bytes = new Uint8Array(length);
    for (var i = 0; i < length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    var view = new DataView(bytes.buffer);
    
    var position = 0;
    var value = 0;

    [ position, value ] = readUint8(view, position);

    if (value == 102) {
        playSoundDataShort(view, position);
    }
    else if (value == 103) {
        playSoundDataLong(view, position);
    }
}

function playAsset(audio, type, packName, assetName) {
    var blobUrl = packs[packName][type][assetName];
    if (blobUrl) {
        audio.src = blobUrl;
        audio.load();
        audio.volume = volume.valueAsNumber;
        audio.play();
    }
}

function playAssetKey(audio, type, assetKey) {
    var assetKey = assetKey.replace("asset.downloaded.", "");
    var assetParts = assetKey.split(".")
    if (assetParts.length == 2) {
        var packName = assetParts[0];
        var assetName = assetParts[1];
        playAsset(audio, type, packName, assetName);
    }
}

function playAssetName(audio, type, name) {
    var assetParts = name.split(":")
    if (assetParts.length == 2) {
        var packName = assetParts[0]
            .replaceAll(" ", "_")
            .replaceAll("'", "_")
        var assetName = assetParts[1]
            .replaceAll(" ", "_")
            .replaceAll("'", "_")
        playAsset(audio, type, packName, assetName);
    }
}

function playMusicAsset(assetKey) {
    playAssetKey(musicAudio, "musics", assetKey);
}

function playMusicName(assetName) {
    playAssetName(musicAudio, "musics", assetName);
}

function isMusicPaused() {
    if (musicAudio == null) {
        return true;
    }

    return musicAudio.paused;
}

function setMusicPaused(paused) {
    if (musicAudio == null) {
        return true;
    }

    if (paused) {
        musicAudio.pause();
    }
    else {
        musicAudio.play();
    }
}

function playSoundAsset(assetKey) {
    playAssetKey(soundAudio, "sounds", assetKey);
}

function playSoundName(assetName) {
    playAssetName(soundAudio, "sounds", assetName);
}

function smooth() {
    myContext.imageSmoothingEnabled = true;
}

function noSmooth() {
    myContext.imageSmoothingEnabled = false;
}
