let visualEffectDelaySet = false;

const audioCtx = new AudioContext();
audioCtx.onstatechange = () => {
    console.log(audioCtx.state);
}

document.addEventListener('DOMContentLoaded', () => {

    let playButton = document.getElementById('play-loop');
    let tempo = parseInt(document.getElementById('tempo').value);
    let seqData = new SequenceData(tempo, 32);
    let drumURLs = [];
    let instrumentURLElements = document.getElementsByClassName('instrument-url');

    // The drum sample urls are read from the DOM in the order in which the
    // elements appear - this should remain stable, and is the same order in 
    // which the beats are read.
    for (let element of instrumentURLElements) {
        let drumURL = element.innerHTML;
        drumURLs.push(drumURL);
    }
    setupSequences(audioCtx, drumURLs).then((sequences) => {
        scheduler(audioCtx, seqData, sequences);
    });
    let tempoInput = document.getElementById('tempo');
    tempoInput.addEventListener('change', () => {
        seqData.setTempo(tempoInput.value);
        console.log(`tempo set to ${tempoInput.value}`);
    })
    playButton.addEventListener('click', () => init(seqData));

    let beatsFields = document.getElementsByClassName('beats-field')
    let numberOfTracks = beatsFields.length;
    for (let i = 0; i < numberOfTracks; i++) {
        let trackDOMIndex = `track_${i}`;
        let trackId = beatsFields[i].id.split('_')[1]
        let track_div = document.getElementById(trackDOMIndex);
        let beatString = beatsFields[i].value;
        for (let j = 0; j < beatString.length; j++) {
            let beatDiv = document.createElement('div');
            if (beatString[j] === '8') {
                beatDiv.className = "beat active_beat";
            } else {
                beatDiv.className = "beat";
            }
            beatDiv.id = `${trackId}:${j}`
            beatDiv.addEventListener('click', e => onBeatClick(e));
            track_div.appendChild(beatDiv)
        }
    }
})

const onBeatClick = (event) => {
    let beatDiv = event.target;
    let [trackString, beatString] = beatDiv.id.split(":");
    trackNumber = parseInt(trackString);
    beatNumber = parseInt(beatString);
    let beatInputField = document.getElementById(`beats_${trackNumber}`)
    if (beatDiv.classList.contains('active_beat')) {
        beatDiv.classList.remove('active_beat');
        beatInputField.value = replaceCharacter(beatInputField.value, beatNumber, "0");
    } else {
        beatDiv.classList.add('active_beat');
        beatInputField.value = replaceCharacter(beatInputField.value, beatNumber, "8");
    }
}

const replaceCharacter = (string, position, newCharacter) => {
    let before = string.substring(0, position);
    let after = string.substring(position + 1);
    return before + newCharacter + after;
}

function init(seqData) {
    console.log(audioCtx.state);
    if (audioCtx.state === 'running') {
        audioCtx.suspend().then(() => {
            console.log('audioCtx suspended');
        })
    } else {
        audioCtx.resume().then(() => {
            console.log('audioCtx resuming');
            checkForVisualBeatCue(seqData, -1);
        })
    }
}

function scheduleNote(audioCtx, sample, volume, noteTime) {
    const sampleSource = new AudioBufferSourceNode(audioCtx, {
        buffer: sample,
        playbackRate: 1.0,
    });
    const gainNode = audioCtx.createGain();
    gainNode.gain.setValueAtTime(volume, noteTime);
    sampleSource.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    sampleSource.start(noteTime);
}

function changeBackgroundColor(seqData) {
    let drumLoopName = document.getElementById('drumloop_name');
    drumLoopName.style.transition = "none";
    drumLoopName.style.fontSize = "2.2rem";

    let trackHolder = document.getElementsByClassName('track-holder')[0];
    trackHolder.style.transition = "none";
    trackHolder.style.background = "rgb(0, 20, 20, 100)";
    setTimeout(() => {
        drumLoopName.style.transition = "all 0.4s";
        drumLoopName.style.fontSize = "2rem";
        trackHolder.style.transition = "all 0.4s";
        trackHolder.style.background = "rgb(0, 0, 0, 100)";
    }, 10);

}

function checkForVisualBeatCue(seqData, lastBeatIndex) {
    if (seqData.beatIndex % 8 === 0 && seqData.beatIndex != lastBeatIndex) {
        changeBackgroundColor(seqData);
    }
    setTimeout(checkForVisualBeatCue, 15, seqData, seqData.beatIndex);
}

function scheduler(audioCtx, seqData, sequences) {
    let currentTime = audioCtx.currentTime;

    while (seqData.nextBeatTime - currentTime < seqData.scheduleWindow) {

        // Check the currentNote of each instrument to see if it is due 
        // to be played.
        for (let sequence of sequences) {
            if (sequence.hasBeatAt(seqData.beatIndex)) {
                scheduleNote(
                    audioCtx,
                    sequence.sample,
                    sequence.getVolumeAt(seqData.beatIndex),
                    seqData.nextBeatTime);
            }
        }

        // Add beatDuration to nextBeatTime, and increment the beatIndex counter
        // (looping back when we hit the end)
        seqData.nextBeatTime += seqData.beatDuration;
        seqData.beatIndex = (seqData.beatIndex + 1) % seqData.loopLength;
    }

    timerId = setTimeout(
        scheduler, seqData.lookahead, audioCtx, seqData, sequences);
}

async function setupSequences(audioCtx, drumURLs) {
    let sequences = [];
    let beatsFields = document.getElementsByClassName('beats-field');
    let trackVolumeInputs = document.getElementsByClassName('track-volume');
    for (let i = 0; i < drumURLs.length; i++) {
        const filepath = `static/${drumURLs[i]}`;
        sample = await getFile(audioCtx, filepath);
        sequences.push(new DrumSequence(
            sample,
            beatsFields[i].id,
            trackVolumeInputs[i].id))
    }
    return sequences;
}

async function getFile(audioContext, filepath) {
    const response = await fetch(filepath);
    const arrayBuffer = await response.arrayBuffer();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    return audioBuffer;
}

class SequenceData {
    constructor(tempo, loopLength) {
        this.tempo = tempo;
        this.beatIndex = 0;
        this.lookahead = 25.0;
        this.scheduleWindow = 0.1;
        this.loopLength = loopLength;
        this.nextBeatTime = 0;

        let beatsPerSec = tempo / 60 * 8;
        this.beatDuration = 1 / beatsPerSec;
    }

    setTempo(tempo) {
        this.tempo = tempo;
        let beatsPerSec = tempo / 60 * 8;
        this.beatDuration = 1 / beatsPerSec;
    }
}

class DrumSequence {
    constructor(sample, beatsFieldID, volumeInputID) {
        this.sample = sample;
        this.beatsFieldID = beatsFieldID;
        this.volumeInputID = volumeInputID;
    }

    hasBeatAt = (index) => {
        return document.getElementById(this.beatsFieldID).value.charAt(index) === "8"
    }

    getVolumeAt = (index) => {
        let volume = document.getElementById(this.volumeInputID).value;
        return volume * 0.1;
    }
}