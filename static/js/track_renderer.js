document.addEventListener('DOMContentLoaded', () => {

    let playButton = document.getElementById('play-loop');
    let tempo = parseInt(document.getElementById('tempo').value);
    playButton.addEventListener('click', () => init(tempo));

    let numberOfTracks = document.getElementsByClassName('track').length;
    console.log(`numberOfTracks : ${numberOfTracks}`);
    for (let i = 0; i < numberOfTracks; i++) {
        let trackId = `track_${i}`;
        let track_div = document.getElementById(trackId);
        let beatString = document.getElementById('beats_' + i).value;
        for (let j = 0; j < beatString.length; j++) {
            let beatDiv = document.createElement('div');
            if (beatString[j] === '8') {
                beatDiv.className = "beat active_beat";
            } else {
                beatDiv.className = "beat";
            }
            beatDiv.id = `${i}:${j}`
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

function init(tempo) {
    const seqData = new SequenceData(tempo, 32);
    const audioCtx = new AudioContext();
    let drumURLs = [];
    let instrumentURLElements = document.getElementsByClassName('instrument-url');
    console.log(`instrumentURLElements == ${instrumentURLElements}`);
    for (let element of instrumentURLElements) {
        let drumURL = element.innerHTML;
        drumURLs.push(drumURL);
    }
    setupSequences(audioCtx, drumURLs).then((sequences) => {
        scheduler(audioCtx, seqData, sequences);
    });
}

function scheduleNote(audioCtx, sample, noteTime) {
    const sampleSource = new AudioBufferSourceNode(audioCtx, {
        buffer: sample,
        playbackRate: 1.0,
    });
    sampleSource.connect(audioCtx.destination);
    sampleSource.start(noteTime);
}

function scheduler(audioCtx, seqData, sequences) {
    let currentTime = audioCtx.currentTime;

    while (seqData.nextBeatTime - currentTime < seqData.scheduleWindow) {

        // Check the currentNote of each instrument to see if it is due 
        // to be played.
        for (let sequence of sequences) {
            if (sequence.hasBeatAt(seqData.beatIndex)) {
                scheduleNote(audioCtx, sequence.sample, seqData.nextBeatTime);
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
    console.log(drumURLs);
    for (let i = 0; i < drumURLs.length; i++) {
        const filepath = `static/${drumURLs[i]}`;
        
        sample = await getFile(audioCtx, filepath);
        let pattern = document.getElementById(`beats_${i}`).value;
        sequences.push(new DrumSequence(sample, pattern));
    }
    return sequences;
}

async function getFile(audioContext, filepath) {
    const response = await fetch(filepath);
    const arrayBuffer = await response.arrayBuffer();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    return audioBuffer;
}

function playSample(audioCtx, audioBuffer, time) {
    const sampleSource = new AudioBufferSourceNode(audioCtx, {
        buffer: audioBuffer,
        playbackRate: 1.0,
    });
    sampleSource.connect(audioCtx.destination);
    sampleSource.start(time);
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
        console.log(`tempo = ${this.tempo}`);
        console.log(`loopLength = ${this.loopLength}`);
    }

    setTempo(tempo) {
        this.tempo = tempo;
        let beatsPerSec = tempo / 60 * 8;
        this.beatDuration = 1 / beatsPerSec;
    }
}

class DrumSequence {
    constructor(sample, sequence) {
        this.sample = sample;
        this.sequence = sequence;

        this.pointer = 0;
        console.log(`sequence: ${this.sequence}`);
    }

    setSequence = (sequence) => {
        this.sequence = sequence;
    }

    hasBeatAt = (index) => {
        return this.sequence.charAt(index) === '8'
    }
}