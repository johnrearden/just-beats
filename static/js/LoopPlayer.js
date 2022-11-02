class LoopPlayer {
    constructor(tempo, tracks, loopID) {
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
        console.log(drumURL);
        let sample = await this.getAudioBuffer(drumURL);
        let trackSequence = new TrackSequence(
            track.pk,
            track.instrument_id,
            sample,
            track.beats,
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
        trackSeq.toggleBeat(index);
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

    getInstrumentID = (trackID) => {
        return this.trackSequences.get(parseInt(trackID)).instrumentID;
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
                        track.getVolume(),
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
    constructor(id, instrumentID, sample, beatList, masterVolume) {
        this.id = id;
        this.instrumentID = instrumentID;
        this.sample = sample;
        this.beatList = beatList;
        this.masterVolume = masterVolume;
    }

    toggleBeat = (index) => {
        if (this.beatList.charAt(index) === "8") {
            this.beatList = replaceCharacter(this.beatList, index, "0");
        } else {
            this.beatList = replaceCharacter(this.beatList, index, "8");
        }
    }

    getVolume = () => {
        return this.masterVolume * 0.1;
    }

    // returns true if there is a beat to be played at this index.
    hasBeatAt = (index) => {
        return this.beatList.charAt(index) === '8';
    }
}

const replaceCharacter = (string, position, newCharacter) => {
    let before = string.substring(0, position);
    let after = string.substring(position + 1);
    return before + newCharacter + after;
}

