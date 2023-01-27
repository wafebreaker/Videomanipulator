var tutorial_visible = false;
let videoPure = document.getElementById("video-pure");
let canvasProcessed = document.getElementById("canvas-processed");
let ctx = canvasProcessed.getContext("2d");
let audioContext = new AudioContext();
let track = audioContext.createMediaElementSource(videoPure);
let audiofilter = audioContext.createBiquadFilter();
audiofilter.type = 'lowpass';
audiofilter.frequency.value = 100;
audiofilter.connect(audioContext.destination);
let analyser = audioContext.createAnalyser();
track.connect(analyser).connect(audioContext.destination);
analyser.fftSize = 512;
const bufferLength = analyser.frequencyBinCount;
let dataArray = new Uint8Array(bufferLength);
analyser.getByteFrequencyData(dataArray);
console.log(audioContext.state);
let grenze = 0;
let filters = [
    {
        name: 'brightness',
        enabled: false,
        value: 0,
        onMusic: false,
        function: changeBrightness
    },
    {
        name: 'invert',
        enabled: false,
        function: invertFilter
    },
    {
        name: 'chroma-key',
        enabled: false,
        value: 0,
        onMusic: false,
        function: chromaKeyingFilter
    },
    {
        name: 'otsu',
        enabled: false,
        value: 0,
        onMusic: false,
        function: getOtsuPictureFromFrame
    },
    {
        name: 'contrast',
        enabled: false,
        value: 0,
        onMusic: false,
        function: adjustContrast
    },
    {
        name: 'color-otsu',
        enabled: false,
        value: 0,
        onMusic: false,
        function: getOtsuPictureFromFrameColored
    },
    {
        name: 'greyscaling',
        enabled: false,
        value: 0,
        onMusic: false,
        function: greyscalePicture
    },
];

let colors = fillColors();

console.log(colors);

function changeFilterStatus(id) {
    let checkbox_music = $('#' + id + '-music');
    let checkbox_filter = $('#' + id);
    let slidercontainer = $('#' + id + '-music-container');

    let index = filters.findIndex((obj => obj.name === id));


    if (checkbox_music.prop("disabled") === true) {
        checkbox_music.prop("disabled", false);
    } else {
        checkbox_music.prop("disabled", true);
        checkbox_music.prop("checked", false);
    }

    if (checkbox_filter.prop("checked") === true) {
        slidercontainer.css("display", "block");
        filters[index].enabled = true;
    } else {
        slidercontainer.css("display", "none");
        filters[index].enabled = false;
    }

}

function changeSliderStatus(id, filter) {
    let checkbox = $('#' + id);
    let slider = $('#' + id + '-slider');
    let index = filters.findIndex((obj => obj.name === filter));

    if (checkbox.prop("checked") === true) {
        filters[index].onMusic = true;
        slider.prop("disabled", true);

    } else {
        filters[index].onMusic = false;
        slider.prop("disabled", false);
    }

}


function changeVisibility() {
    var element = $("#tutorial-content");
    if (tutorial_visible) {
        element.css("display", "none");
        tutorial_visible = false;
    } else {
        element.css("display", "block");
        tutorial_visible = true;
    }
}

function updateVideo(value) {
    let video = $('#video-pure');
    let canvas = $('#canvas-processed');
    video.attr('src', 'media/' + value + '.mp4');
    canvas.attr('width', video[0].width);
    canvas.attr('height', video[0].height);
    video.load();
    console.log(value);
}

function updateSliderValueFromMusic(value, filter) {
    let slider = $('#' + filter + '-music-slider')
    slider.val(value);
    slider.next().val(value);
}

function changeGrenzeValue(value) {
    grenze = value;
}

render();

function updateValue(value, update) {
    let index = filters.findIndex((obj => obj.name === update));
    filters[index].value = Math.floor(value);
}

function render() {
    renderPicture();
    requestAnimationFrame(render);
}

function renderPicture() {
    let tempMax = 0;
    ctx.drawImage(videoPure, 0, 0);
    let frame = ctx.getImageData(0, 0, 788, 568);
    let length = frame.data.length / 4;

    analyser.getByteFrequencyData(dataArray);
    for (let i = 1; i < 1 / 3 * dataArray.length; i++) {
        if (dataArray[i] > tempMax) {
            tempMax = i;
        }
    }

    for (let x = 0; x < filters.length; x++) {
        if (filters[x].enabled === true) {
            if (filters[x].onMusic === true) {
                if (tempMax < grenze) {
                    tempMax = 0;
                }
                filters[x].value = tempMax;
                filters[x].function(frame, length, tempMax);
                updateSliderValueFromMusic(tempMax, filters[x].name);
            } else {
                filters[x].function(frame, length, filters[x].value);
            }
        }
    }
    ctx.putImageData(frame, 0, 0);
}


function changeBrightness(frame, length, value) {
    let l = frame.data.length / 4;
    for (let i = 0; i < l; i++) {
        let r = frame.data[i * 4 + 0] + value;
        let g = frame.data[i * 4 + 1] + value;
        let b = frame.data[i * 4 + 2] + value;

        r = clampColorValues(r);
        g = clampColorValues(g);
        b = clampColorValues(b);

        frame.data[i * 4 + 0] = r;
        frame.data[i * 4 + 1] = g;
        frame.data[i * 4 + 2] = b;
    }

}

function adjustContrast(frame, length, value) {
    var data = frame.data;
    var factor = (259 * (value + 255)) / (255 * (259 - value));

    for (var i = 0; i < data.length; i += 4) {
        data[i] = factor * (data[i] - 128) + 128;
        data[i + 1] = factor * (data[i + 1] - 128) + 128;
        data[i + 2] = factor * (data[i + 2] - 128) + 128;
    }

    return frame;
}


//von dozent
function invertFilter(frame, length, value) {
    for (let i = 0; i < length; i++) {
        frame.data[i * 4 + 0] = 255 - frame.data[i * 4 + 0];
        frame.data[i * 4 + 1] = 255 - frame.data[i * 4 + 1];
        frame.data[i * 4 + 2] = 255 - frame.data[i * 4 + 2];
    }
}

//von dozent
function chromaKeyingFilter(frame, length, value) {
    for (let i = 0; i < length; i++) {
        frame.data[i * 4 + 3] = ((frame.data[i * 4 + 0] +
            frame.data[i * 4 + 1] +
            frame.data[i * 4 + 2]) / 3) + value;
    }
}

function clampColorValues(value) {
    let v = value;
    if (v > 255) v = 255;
    if (v < 0) v = 0;
    return v;
}

function getOtsuPictureFromFrame(frame, length, value) {
    greyscalePicture(frame, 0, 0);
    let hisData = getHistogramData(frame);

    let thresholds = otsuMultipleThresholds(hisData, frame.data.length / 4, value)
    useOtsuThresholdsOnPicture(frame, thresholds);
}

function getOtsuPictureFromFrameColored(frame, length, value) {
    greyscalePicture(frame, 0, 0);
    let hisData = getHistogramData(frame);
    let thresholds = otsuMultipleThresholds(hisData, frame.data.length / 4, value)
    useOtsuThresholdsOnPictureWithColor(frame, thresholds);
}

function greyscalePicture(frame, length, value) {
    let l = frame.data.length / 4;
    for (let i = 0; i < l; i++) {
        let averageColour = (frame.data[i * 4 + 0] + frame.data[i * 4 + 1] + frame.data[i * 4 + 2]) / 3;
        frame.data[i * 4 + 0] = averageColour;
        frame.data[i * 4 + 1] = averageColour;
        frame.data[i * 4 + 2] = averageColour;
    }
}

// value = ((this part without area after point)old value/shrinkValue)* shrinkValue
function shrinkColourValues(frame, length, shrinkValue) {
    let l = frame.data.length / 4;
    for (let i = 0; i < l; i++) {
        let r = (Math.floor(frame.data[i * 4 + 0] / shrinkValue)) * shrinkValue;
        let g = (Math.floor(frame.data[i * 4 + 1] / shrinkValue)) * shrinkValue;
        let b = (Math.floor(frame.data[i * 4 + 2] / shrinkValue)) * shrinkValue;

        frame.data[i * 4 + 0] = r;
        frame.data[i * 4 + 1] = g;
        frame.data[i * 4 + 2] = b;
    }
}

function useOtsuThresholdsOnPicture(frame, thresholds) {
    let l = frame.data.length / 4;
    for (let i = 0; i < l; i++) {

        let averageColour = frame.data[i * 4 + 0];
        averageColour = getThresholdColorForValue(averageColour, thresholds);
        frame.data[i * 4 + 0] = averageColour;
        frame.data[i * 4 + 1] = averageColour;
        frame.data[i * 4 + 2] = averageColour;
    }
}

function useOtsuThresholdsOnPictureWithColor(frame, thresholds) {
    let l = frame.data.length / 4;
    for (let i = 0; i < l; i++) {

        let averageColour = frame.data[i * 4 + 0];
        let colors = getThresholdColorWithValueForColor(averageColour, thresholds);
        frame.data[i * 4 + 0] = colors[0];
        frame.data[i * 4 + 1] = colors[1];
        frame.data[i * 4 + 2] = colors[2];
    }
}

function fillColors() {
    let farben = new Array(32)
    farben[0] = [0, 0, 0]
    farben[1] = [0, 0, 255]
    farben[2] = [0, 255, 0]
    farben[3] = [255, 0, 0]
    farben[4] = [255, 255, 255]
    for (let i = 5; i < farben.length; i++) {
        farben[i] = [Math.floor(Math.random() * 255), Math.floor(Math.random() * 255), Math.floor(Math.random() * 255)]
    }
    return farben
}

function getThresholdColorWithValueForColor(value, thresholds) {
    for (let i = 1; i < thresholds.length; i++) {
        if (value >= thresholds[i - 1] && value < thresholds[i]) return colors[i - 1];
    }
    return colors[length - 1];
}

function getThresholdColorForValue(value, thresholds) {
    for (let i = 1; i < thresholds.length; i++) {
        if (value >= thresholds[i - 1] && value < thresholds[i]) return thresholds[i - 1];
    }
    return thresholds[length - 1];
}

function useOtsuThresholdOnPicture(frame, threshold) {
    let l = frame.data.length / 4;
    for (let i = 0; i < l; i++) {

        let averageColour = frame.data[i * 4 + 0];
        if (averageColour < threshold) averageColour = 0;
        else averageColour = 255;
        frame.data[i * 4 + 0] = averageColour;
        frame.data[i * 4 + 1] = averageColour;
        frame.data[i * 4 + 2] = averageColour;
    }
}

function getHistogramData(frame) {
    let histData = new Array(256);
    let l = frame.data.length / 4;
    for (let i = 0; i < 256; i++) {
        histData[i] = 0;
    }
    for (let i = 0; i < l; i++) {
        histData[frame.data[i * 4 + 0]]++;
    }
    return histData;
}

// https://gist.github.com/zz85/2ebc8e4da705dc3244200de564ab5557
function otsu(histData, total, start, end) {
    let sum = 0;
    for (let t = start; t < end; t++) sum += t * histData[t];

    let sumB = 0;
    let wB = 0;
    let wF = 0;

    let varMax = 0;
    let threshold = 0;
    for (let t = start; t < end; t++) {
        wB += histData[t];               // Weight Background
        if (wB == 0) continue;

        wF = total - wB;                 // Weight Foreground
        if (wF == 0) break;

        sumB += t * histData[t];

        let mB = sumB / wB;            // Mean Background
        let mF = (sum - sumB) / wF;    // Mean Foreground

        // Calculate Between Class Variance
        let varBetween = wB * wF * (mB - mF) * (mB - mF);

        // Check if new maximum found
        if (varBetween > varMax) {
            varMax = varBetween;
            threshold = t;
        }
    }
    return threshold;
}

// only uneven threshold counts
function otsuMultipleThresholds(hisData, total, debth) {
    // call otsu get treshold
    let thresholds = [];
    thresholds.push(0);
    thresholds.push(256);
    if (debth == 0) thresholds.push(callOtsuForBorders(hisData, thresholds)[0]);

    for (let i = 0; i < debth; i++) {
        let foundValues = callOtsuForBorders(hisData, thresholds);
        for (let j = 0; j < foundValues.length; j++) {
            thresholds.push(foundValues[j]);
        }
        thresholds = thresholds.filter((element, index) => {
            return thresholds.indexOf(element) === index;
        });
        thresholds.sort(function (a, b) {
            return a - b;
        });
    }
    thresholds.sort(function (a, b) {
        return a - b;
    });

    return thresholds;
}

function callOtsuForBorders(hisData, thresholds) {
    let foundThresholds = [];
    for (let i = 1; i < thresholds.length; i++) {
        let start = thresholds[i - 1];
        let end = thresholds[i];
        let pixelCount = countPixels(hisData, start, end);
        let newThreshold = otsu(hisData, pixelCount, start, end);
        foundThresholds.push(newThreshold);
    }
    return foundThresholds;
}

function countPixels(hisData, start, end) {
    let count = 0;
    for (let i = start; i < end; i++) {
        count += hisData[i];
    }
    return count;
}
