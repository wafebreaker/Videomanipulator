# Videomanipulator


## Installation

Lade den kompletten Sourcecode herunter und öffne die index.html in WebStorm oder der IDE deiner wahl. Das Programm startet automatisch im Internet Browser. Kein Server notwendig, keine Installation notwendig. 


## Features
* Otsu Filter
```javascript
function getOtsuPictureFromFrame(frame, length, value) {
    greyscalePicture(frame,0,0);
    let hisData = getHistogramData(frame);

    let thresholds = otsuMultipleThresholds(hisData, frame.data.length / 4, value)
    useOtsuThresholdsOnPicture(frame, thresholds);
}
```

* Helligkeit Filter
```javascript
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
```

* Invert Filter
```javascript
function invertFilter(frame, length, value) {
    for (let i = 0; i < length; i++) {
        frame.data[i * 4 + 0] = 255 - frame.data[i * 4 + 0];
        frame.data[i * 4 + 1] = 255 - frame.data[i * 4 + 1];
        frame.data[i * 4 + 2] = 255 - frame.data[i * 4 + 2];
    }
}
```

* Chroma-key Filter
```javascript
function chromaKeyingFilter(frame, length, value) {
    for (let i = 0; i < length; i++) {
        frame.data[i * 4 + 3] = ((frame.data[i * 4 + 0] +
            frame.data[i * 4 + 1] +
            frame.data[i * 4 + 2]) / 3) + value;
    }
}
```

* Kontrast Filter
```javascript
function adjustContrast(frame,length, value) {
    var data = frame.data;
    var factor = (259 * (value + 255)) / (255 * (259 - value));

    for (var i = 0; i < data.length; i += 4) {
        data[i] = factor * (data[i] - 128) + 128;
        data[i + 1] = factor * (data[i + 1] - 128) + 128;
        data[i + 2] = factor * (data[i + 2] - 128) + 128;
    }

    return frame;
}
```

* Color-Otsu Filter
```javascript
function getOtsuPictureFromFrameColored(frame, length, value) {
    greyscalePicture(frame,0,0);
    let hisData = getHistogramData(frame);
    let thresholds = otsuMultipleThresholds(hisData, frame.data.length / 4, value)
    useOtsuThresholdsOnPictureWithColor(frame, thresholds);
}
```

* Greyscaling Filter 

```javascript
function greyscalePicture(frame,length,value) {
    let l = frame.data.length / 4;
    for (let i = 0; i < l; i++) {
        let averageColour = (frame.data[i * 4 + 0] + frame.data[i * 4 + 1] + frame.data[i * 4 + 2]) / 3;
        frame.data[i * 4 + 0] = averageColour;
        frame.data[i * 4 + 1] = averageColour;
        frame.data[i * 4 + 2] = averageColour;
    }
}
```

## Anleitung

Du hast 4 verschiedenen Videos aus denen du auswählen kannst. 
Der Slider 'Grenze' bestimmt ab welchem Wert der Filter auf das Video angewendet wird. Du kannst beliebig viele Filter aktivieren und auch wieder deaktivieren.
Einige Filter kannst du manuell über einen Slider steuern oder aber den Filter über den Ton des Videos steuern. Hierfüt musst du nur die zugewiesene Checkbox aktivieren.

Eingie Slider haben Werte von -100 bis 100, andere (wie z.B. der Otsu Filter nur 1-5). 
