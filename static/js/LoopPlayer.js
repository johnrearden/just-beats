class LoopPlayer {
    constructor(tempo, tracks, loopID) {
        console.log('Loopplayer constructor')
        // Create a new AudioContext and suspend it immediately. This is to ensure
        // consistent behaviour - browsers will allow autoplay (having initially 
        // forbidden it) after an unspecified number of user actions initiating
        // audio playback.
        this.audioCtx = new AudioContext();
        this.audioCtx.suspend();

        // The id (pk from model) of the current loop.
        this.loopID = loopID;

        // The tempo of the loop, as specified in the Django model
        this.changeTempo(tempo);

        // For this project, set at a default of 32 beats.
        this.loopLength = 32;

        // Enables the LoopPlayer to keep track of which beat comes next.
        this.beatIndex = 0;

        // The interval, in milliseconds, between each invocation of the 
        // scheduler.
        this.lookAhead = 25;

        // Future time window, in seconds, that the scheduler will take beats from. 
        this.scheduleWindow = 0.1;

        // The time (relative to audioCtx.currentTime) the next scheduled beat
        // should be played.
        this.nextBeatTime = 0;

        // The tracks related to this loop. These are assigned to an object
        // to enable straightforward lookup by id.
        this.trackSequences = new Map();
        for (let track of tracks) {
            this.addTrackSequence(track);
            console.log(this.trackSequences.size);
        }
        this.scheduler();
    }

    togglePlay = () => {
        console.log(`Now ${this.audioCtx.state}`);
        if (this.audioCtx.state === 'running') {
            console.log('switching to suspended');
            this.audioCtx.suspend();
        } else {
            this.audioCtx.resume();
            console.log('switching to resumed');
        }
    }

    // Adds a track to the loop. Extracts the fields of the backend model Track
    // necessary to play the loop. Loads the required sample from remote file.
    addTrackSequence = async (track) => {
        let instrumentURL = track.instrument_url;
        let drumURL = drumURLs[instrumentURL];
        let sample = await this.getAudioBuffer(drumURL);
        let trackSequence = new TrackSequence(
            track.pk,
            sample,
            track.beats,
            track.beat_volumes,
            track.track_volume,
        );
        this.trackSequences.set(track.pk, trackSequence);
    }

    // Deletes a track from the loop.
    deleteTrack = (trackID) => {
        this.trackSequences.delete(trackID);
    }

    // Switches the beat at index on and off alternately.
    toggleBeatAt = (trackID, index) => {
        let trackSeq = this.trackSequences.get(trackID);
        if (trackSeq.beatList.charAt(index) === '8') {

        }
    }

    // Alter the tempo (beats per minute) that the loop is playing at.
    changeTempo = (newTempo) => {
        this.tempo = newTempo;
        let beatsPerSec = newTempo / 60 * 8;
        this.beatDuration = 1 / beatsPerSec;
    }

    // When a user selects a track to play, replaces the current tempo and tracks
    // with the specified ones. This avoids the overhead of creating a new AudioContext
    // each time a different loop is played.
    swapLoop = (tempo, tracks, loopID) => {

        // The new loopID of this loop.
        this.loopID = loopID;

        // The tempo of the loop, as specified in the Django model
        this.tempo = tempo;

        // The tracks related to this loop. These are assigned to an object
        // to enable straightforward lookup by id.
        this.trackSequences = new Map();
        for (let track of tracks) {
            this.addTrackSequence(track);
        }

        this.nextBeatTime = 0;
    }

    // Changes the overall track volume to the new value.
    changeTrackVolume = (trackID, newVolume) => {
        this.trackSequences.get(trackID).masterVolume = newVolume;
    }

    scheduler = () => {
        let currentTime = this.audioCtx.currentTime;
        while (this.nextBeatTime - currentTime < this.scheduleWindow) {

            // Check the currentNote of each instrument to see if it is due 
            // to be played.
            this.trackSequences.forEach((key, value) => {
                let track = this.trackSequences.get(value);
                if (track.hasBeatAt(this.beatIndex)) {
                    this.scheduleNote(
                        track.sample,
                        track.getVolumeAt(this.beatIndex),
                        this.nextBeatTime);
                }
            })

            // Add beatDuration to nextBeatTime, and increment the beatIndex counter
            // (looping back when we hit the end)
            this.nextBeatTime += this.beatDuration;
            this.beatIndex = (this.beatIndex + 1) % this.loopLength;
        }

        // Set a timeout to run the scheduler again.
        setTimeout(
            this.scheduler, this.lookahead);
    }

    scheduleNote = (sample, volume, noteTime) => {
        const sampleSource = new AudioBufferSourceNode(this.audioCtx, {
            buffer: sample,
            playbackRate: 1.0,
        });
        const gainNode = this.audioCtx.createGain();
        gainNode.gain.setValueAtTime(volume, noteTime);
        sampleSource.connect(gainNode);
        gainNode.connect(this.audioCtx.destination);
        sampleSource.start(noteTime);
    }

    // Fetches the file at the specified path and converts it to an audioBuffer, 
    // ready for playing by the AudioContext
    getAudioBuffer = async (filepath) => {
        const response = await fetch(filepath);
        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await this.audioCtx.decodeAudioData(arrayBuffer);
        return audioBuffer;
    }
}

// A TrackSequence is the representation of the backend model Track as used
// by the LoopPlayer. In addition to the fields in the model Track, it also
// holds the same (an AudioBuffer) to allow the track to be played aloud.
class TrackSequence {
    constructor(id, sample, beatList, volumeList, masterVolume) {
        this.id = id;
        this.sample = sample;
        this.beatList = beatList;
        this.volumeList = volumeList;
        this.masterVolume = masterVolume;
    }

    // returns true if there is a beat to be played at this index.
    hasBeatAt = (index) => {
        return this.beatList.charAt(index) === '8';
    }

    // returns the volume of the beat at the specified index, as a value
    // between 0.0 and 1.0 (the range for gain in a GainNode).
    getVolumeAt = (index) => {
        let character = this.volumeList.charAt(index);
        let value = parseInt(character);
        return value * 0.1;

    }
}

let loopPlayer;

document.addEventListener('DOMContentLoaded', () => {
    const playButtons = document.getElementsByClassName('play-button');
    for (let button of playButtons) {
        button.addEventListener('click', (e) => {

            // Get the id and tempo associated with this loop.
            let idAttr = e.target.id;
            let arr = idAttr.split('-');
            let loopID = arr[1];
            let tempo = arr[2];

            if (loopPlayer) {
                console.log(`current loopID == ${loopPlayer.loopID}, new id == ${loopID}`);
            }
            

            // If the loopPlayer has been created, and it is already playing
            // this loop, toggle the play button as normal.
            if (loopPlayer) {
                if (loopPlayer.loopID !== loopID) {
                    console.log()
                    console.log('loop has changed .....');
                    // Get the tracks related to this loop from the server.
                    let url = '/tracks/' + loopID;
                    fetch(url)
                        .then(response => response.json())
                        .then(tracks => {
                            populateLoopPlayer(tempo, tracks, loopID);
                            loopPlayer.audioCtx.resume();
                        });
                }
                loopPlayer.togglePlay();
            } else {
                // Get the tracks related to this loop from the server.
                let url = '/tracks/' + loopID;
                fetch(url)
                    .then(response => response.json())
                    .then(tracks => {
                        loopPlayer = new LoopPlayer(tempo, tracks, loopID);
                        loopPlayer.togglePlay();
                    });
            }
        });
    }
});

const populateLoopPlayer = (tempo, tracks, loopID) => {
    if (!loopPlayer) {
        loopPlayer = new LoopPlayer(tempo, tracks, loopID);
    } else {
        loopPlayer.swapLoop(tempo, tracks, loopID);
    }
}
