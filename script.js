var tutorial_visible = false;
let videoPure = document.getElementById("video-pure");
let canvasProcessed = document.getElementById("canvas-processed");
let ctx = canvasProcessed.getContext("2d");

//Einrichtung WebAudio API zur Analyse des Audios
let audioContext = new AudioContext();
let track = audioContext.createMediaElementSource(videoPure);
//Filterung des Audiosignals um nur den relevanten Frequenzbereich zu betrachten
let audiofilter = audioContext.createBiquadFilter();
audiofilter.type = 'bandpass';
audiofilter.connect(audioContext.destination);
let analyser = audioContext.createAnalyser();
track.connect(analyser).connect(audioContext.destination);
analyser.fftSize = 512;
const bufferLength = analyser.frequencyBinCount;
let dataArray = new Uint8Array(bufferLength);
analyser.getByteFrequencyData(dataArray);
let border = 0;

//Einstellungen für die Visuellen Filter
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

//Auffüllen der Farbwerte für den Otsu-Color-Filter
let colors = fillColors();

render();

//Aktivierung der Bildfilter
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

//Einstellungen der Slider
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

//Anzeigen des Tutorials
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

//Änderung des angezeigten Videos
function updateVideo(value) {
    let video = $('#video-pure');
    let canvas = $('#canvas-processed');
    video.attr('src', 'media/' + value + '.mp4');
    canvas.attr('width', video[0].width);
    canvas.attr('height', video[0].height);
    video.load();
}

//Wert aus der Audioanalyse an den Bildfilter übergeben
function updateSliderValueFromMusic(value, filter) {
    let slider = $('#' + filter + '-music-slider')
    slider.val(value);
    slider.next().val(value);
}

//Setzen der Mittleren Frequenz des Filters aus dem Slider
function changeMediumValue(value) {
    audiofilter.frequency.value = value;
}

//Setzen des Q-Wertes des Filters zur Auswahl der Breite des Frequenzspektrums um die mittlere Frequenz aus dem Slider
function changeBandwidth(value) {
    audiofilter.Q.value = getQ(value);
}

//Setzen des Grenzwertes ab welchem der Bildfilter den Wert aus der Audioanalyse nutzt
function changeBorderValue(value) {
    border = value;
}


//Errechnet den Q Wert ausgehend von der Bandbreite
function getQ(bandwidth) {
    return Math.sqrt(Math.pow(2, bandwidth)) / (Math.pow(2, bandwidth) - 1)
}

//Wert für Bildfilter über Slider setzen
function updateValue(value, update) {
    let index = filters.findIndex((obj => obj.name === update));
    filters[index].value = Math.floor(value);
}

//ruft die Render Funktion auf - regelt Zeitfluss
function render() {
    renderPicture();
    requestAnimationFrame(render);
}

//wird zum Rendern der Bilder aufgerufen und Analyse des Audios
function renderPicture() {
    ctx.drawImage(videoPure, 0, 0);
    let frame = ctx.getImageData(0, 0, 788, 568);
    let length = frame.data.length / 4;

    //Audioanalyse
    let tempMax = 0;
    analyser.getByteFrequencyData(dataArray);
    for (let i = 1; i < dataArray.length; i++) {
        if (dataArray[i] > tempMax) {
            tempMax = dataArray[i];
        }
    }

    for (let x = 0; x < filters.length; x++) {
        if (filters[x].enabled === true) {
            if (filters[x].onMusic === true) {
                if (tempMax < border) {
                    tempMax = 0;
                }
                filters[x].value = tempMax / 4;
                filters[x].function(frame, length, tempMax);
                updateSliderValueFromMusic(tempMax, filters[x].name);
            } else {
                filters[x].function(frame, length, filters[x].value);
            }
        }
    }
    ctx.putImageData(frame, 0, 0);
}

//Helligkeitsfilter - Punktfilter der das value auf jede Farbe jedes Pixels addiert
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

//Kontrastfilter
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


//Invertiert Bildwerte - Methode wurden im Rahmen des Moduls B54.1 MM Audio- und Videotechnik an der HTW Berlin zur Verfügung gestellt
function invertFilter(frame, length, value) {
    for (let i = 0; i < length; i++) {
        frame.data[i * 4 + 0] = 255 - frame.data[i * 4 + 0];
        frame.data[i * 4 + 1] = 255 - frame.data[i * 4 + 1];
        frame.data[i * 4 + 2] = 255 - frame.data[i * 4 + 2];
    }
}

//Wendet Chroma-Key Filter an - Methode wurden im Rahmen des Moduls B54.1 MM Audio- und Videotechnik an der HTW Berlin zur Verfügung gestellt
function chromaKeyingFilter(frame, length, value) {
    for (let i = 0; i < length; i++) {
        frame.data[i * 4 + 3] = ((frame.data[i * 4 + 0] +
            frame.data[i * 4 + 1] +
            frame.data[i * 4 + 2]) / 3) + value;
    }
}

//Redudziert Farbwerte auf 255 bzw. 0, wenn entsprechender Wert über- oder unterschritten wird
function clampColorValues(value) {
    let v = value;
    if (v > 255) v = 255;
    if (v < 0) v = 0;
    return v;
}

//Otsu-Filter - value bestimmt in wieviel Grauwerte Bild zerlegt werden soll -> 2^value=Grauwerte
function getOtsuPictureFromFrame(frame, length, value) {
    greyscalePicture(frame, 0, 0);
    let hisData = getHistogramData(frame);
    let thresholds = otsuMultipleThresholds(hisData, frame.data.length / 4, value)
    useOtsuThresholdsOnPicture(frame, thresholds);
}

//Otsu-Farb-Filter - value bestimmt in wieviel Farben Bild zerlegt werden soll -> 2^value=Farben
function getOtsuPictureFromFrameColored(frame, length, value) {
    greyscalePicture(frame, 0, 0);
    let hisData = getHistogramData(frame);
    let thresholds = otsuMultipleThresholds(hisData, frame.data.length / 4, value)
    useOtsuThresholdsOnPictureWithColor(frame, thresholds);
}

//Wandelt Bild in Grauwerte um
function greyscalePicture(frame, length, value) {
    let l = frame.data.length / 4;
    for (let i = 0; i < l; i++) {
        let averageColour = (frame.data[i * 4 + 0] + frame.data[i * 4 + 1] + frame.data[i * 4 + 2]) / 3;
        frame.data[i * 4 + 0] = averageColour;
        frame.data[i * 4 + 1] = averageColour;
        frame.data[i * 4 + 2] = averageColour;
    }
}

//Senkt die Anzahl an Farbwerten -> wird zur Zeit nicht angewendet
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

//Hilfsmethode Otsu-Filter - wendet Thresholds auf Bild an
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

//Hilfsmethode Otsu-Farb-Filter- wendet Thresholds für Farben auf Bild an
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

//Hilfsmethode Otsu-Farb-Filter - füllt Array mit Farben für Filter
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

//Hilfsmethode Otsu-Farb-Filter - erhält Threshold und liefert Farbe zurück
function getThresholdColorWithValueForColor(value, thresholds) {
    for (let i = 1; i < thresholds.length; i++) {
        if (value >= thresholds[i - 1] && value < thresholds[i]) return colors[i - 1];
    }
    return colors[length - 1];
}

//Hilfsmethode Otsu-Filter - erhält Threshold und liefert Grauwert zurück
function getThresholdColorForValue(value, thresholds) {
    for (let i = 1; i < thresholds.length; i++) {
        if (value >= thresholds[i - 1] && value < thresholds[i]) return thresholds[i - 1];
    }
    return thresholds[length - 1];
}

//Hilfsmethode Otsu - liefert Histogram für Bildpunkte
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

/*
Hilfmethode - Otsu Algorithmus - gibt Threshold für bestimmten Bereich zurück
start/end geben Bereich an
angepasster Algorithmus nach https://gist.github.com/zz85/2ebc8e4da705dc3244200de564ab5557
 */
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

/*
Hilfsmethode otsu - ruft Otsu Algorithmus für bestimmte Histogrammbereiche auf
gibt Thresholds zurück
Depth gibt an wie oft Algorithmus aufgerufen wird, 2^depth=threshold_count
 */
function otsuMultipleThresholds(hisData, total, depth) {
    // call otsu get treshold
    let thresholds = [];
    thresholds.push(0);
    thresholds.push(256);
    if (depth == 0) thresholds.push(callOtsuForBorders(hisData, thresholds)[0]);

    for (let i = 0; i < depth; i++) {
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

//Hilfsmethode Otsu - ruft Otsu Algorithmus auf
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

//Hilfsmethode Otsu - gibt Pixelanzahl von Histogramm in bestimmten Bereich zurück
function countPixels(hisData, start, end) {
    let count = 0;
    for (let i = start; i < end; i++) {
        count += hisData[i];
    }
    return count;
}
