/**
 * A class that handles audio playback for multiple different pages within
 * the project. It operates using the WebAudio API, enabling it to play 
 * multiple tracks simultaneously and schedule the playing of samples in advance.
 */
class LoopPlayer {
    constructor(tempo, tracks, loopID, name, animationCallback) {
        // Create a new AudioContext and suspend it immediately. This is to ensure
        // consistent behaviour - browsers will allow autoplay (having initially 
        // forbidden it) after an unspecified number of user actions initiating
        // audio playback.
        this.audioCtx = new AudioContext();
        this.audioCtx.suspend();

        // A callback used by client code to synchronise animations on
        // the page with the beat.
        this.animationCallback = animationCallback;

        // The id (pk from model) of the current loop.
        this.loopID = loopID;

        // The name of the current loop.
        this.name = name;

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
        // This is less than the min possible beatDuration, 200bpm / 60sec = 0.3sec.
        this.scheduleWindow = 0.1;

        // The time (relative to audioCtx.currentTime) the next scheduled beat
        // should be played.
        this.nextBeatTime = 0;

        // The master loop volume.
        this.loopVolume = 1.0;

        // The tracks related to this loop. These are assigned to an object
        // to enable straightforward lookup by id.
        this.trackSequences = new Map();
        this.initialise(tracks);
    }
    
    async initialise(tracks) {
        for (let track of tracks) {
            await this.addTrackSequence(track);
        }
        this.scheduler();
    }

    /**
     * Repeated calls to this function will alternately stop and restart the
     * audio playback.
     */
    togglePlay() {
        if (this.audioCtx.state === 'running') {
            this.audioCtx.suspend();
        } else {
            this.audioCtx.resume();
        }
    }

    /**
     * 
     * @returns a boolean, true if playing, false if not
     */
    isPlaying() {
        return this.audioCtx.state === 'running';
    }

    /**
     * Adds a track to the loop. Extracts the fields of the backend model Track
     * necessary to play the loop. Loads the required sample from remote file.
     * @param {Object} track 
     */
    async addTrackSequence(track) {
        let instrumentURL = track.instrument_url;
        let drumURL = drumURLs[instrumentURL];
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


    /**
     * Deletes a track from the loop.
     * @param {String} trackID 
     */
    deleteTrack(trackID){
        this.trackSequences.delete(parseInt(trackID));
    }


    /**
     *  Switches the beat at index on and off alternately.
     */ 
    toggleBeatAt(trackID, index) {
        let trackSeq = this.trackSequences.get(trackID);
        trackSeq.toggleBeat(index);
    }


    /**
     * Alter the tempo (beats per minute) that the loop is playing at.
     * @param {Integer} newTempo 
     */
    changeTempo(newTempo) {
        this.tempo = newTempo;
        let beatsPerSec = newTempo / 60 * 8;
        this.beatDuration = 1 / beatsPerSec;
    }


    /**
     * When a user selects a track to play, replaces the current tempo and tracks
     * with the specified ones. This avoids the overhead of creating a new AudioContext
     * each time a different loop is played.
     * @param {Integer} tempo 
     * @param {String} tracks 
     * @param {String} loopID 
     */
    swapLoop(tempo, tracks, loopID) {

        // The new loopID of this loop.
        this.loopID = loopID;

        // The tempo of the loop, as specified in the Django model
        this.changeTempo(tempo);

        // The tracks related to this loop. These are assigned to an object
        // to enable straightforward lookup by id.
        this.trackSequences = new Map();
        for (let track of tracks) {
            this.addTrackSequence(track);
        }

        this.nextBeatTime = 0;
    }


    /**
     * Changes the overall master volume for the whole loop playback.
     * @param {Integer} newVolume 
     */
    changeLoopVolume(newVolume) {
        this.loopVolume = newVolume;
    }


    /**
     * Changes the overall track volume to the new value.
     * @param {String} trackID 
     * @param {Integer} newVolume 
     */
    changeTrackVolume(trackID, newVolume) {
        const idAsNumber = parseInt(trackID);
        this.trackSequences.get(idAsNumber).masterVolume = newVolume;
    }

    
    /**
     * Changes the track name.
     * @param {String} newName 
     */
    changeLoopName(newName) {
        this.name = newName;
    }


    /**
     * Returns the Instrument ID of the current track.
     * @param {String} trackID 
     * @returns The instrument id of the specified track
     */
    getInstrumentID(trackID) {
        return this.trackSequences.get(parseInt(trackID)).instrumentID;
    }


    /**
     * When a new instrument is chosen, loads the sample and stores a reference
     * to it in the trackSequences array.
     * @param {String} trackID 
     * @param {String} newInstrumentID 
     * @param {String} newInstrumentURL 
     */
    async setInstrument(trackID, newInstrumentID, newInstrumentURL) {
        const trackSeq = this.trackSequences.get(parseInt(trackID));
        trackSeq.instrumentID = newInstrumentID;
        let drumURL = drumURLs[newInstrumentURL];
        let sample = await this.getAudioBuffer(drumURL);
        trackSeq.sample = sample;
    }


    /**
     * If the next beat falls within the lookahead window, this function iterates
     * through the trackSequences and schedules any notes that the sequences have
     * on this beat. It then advances the nextBeatTime by the current beatDuration, 
     * and advances the beatIndex, cycling back to 0 if necessary to begin the loop
     * again from the start.
     */
    scheduler() {
        let currentTime = this.audioCtx.currentTime;
        
        while (this.nextBeatTime - currentTime < this.scheduleWindow) {
            // Check the currentNote of each instrument to see if it is due 
            // to be played.
            for (const track of this.trackSequences.values()) {
                if (track.hasBeatAt(this.beatIndex)) {
                    this.scheduleNote(
                        track.sample,
                        track.getVolume() * this.loopVolume,
                        this.nextBeatTime);
                }
            }

            // Set a timeout to call the animation callback at the time of the next beat.
            let timeUntilNextBeat = this.nextBeatTime - currentTime;
            setTimeout(this.animationCallback, timeUntilNextBeat, this.beatIndex);

            // Add beatDuration to nextBeatTime, and increment the beatIndex counter
            // (looping back when we hit the end)
            this.nextBeatTime += this.beatDuration;
            this.beatIndex = (this.beatIndex + 1) % this.loopLength;
        }

        // Set a timeout to run the scheduler again. The call to the scheduler
        // is wrapped in a function explicitly bound to the current context, as
        // setTimeout would otherwise default to the global context, making
        // the scheduler function inaccessible.
        setTimeout(function() {
            this.scheduler();
        }.bind(this), this.lookAhead);
    }


    /**
     * Connects up the AudioContext pipeline - 
     * sample(source) -> gainNode -> destination.
     * Schedules the sample to be played at the noteTime specified.
     * @param {AudioBuffer} sample 
     * @param {Integer} volume 
     * @param {Number} noteTime 
     */
    scheduleNote(sample, volume, noteTime) {
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


    /**
     *  Fetches the file at the specified path and converts it to an audioBuffer, 
     *  ready for playing by the AudioContext
     */
    async getAudioBuffer(filepath) {
        const response = await fetch(filepath);
        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await this.audioCtx.decodeAudioData(arrayBuffer);
        return audioBuffer;
    }


    /**
     * Return a JSON representation of this loop, for sending in a POST request.
    */ 
    getLoopAsJSON() {
        const obj = {};
        obj.name = this.name;
        obj.tempo = this.tempo;
        obj.loopID = this.loopID;
        obj.trackList = [];
        for (const track of this.trackSequences.values()) {
            const element = {};
            element.trackID = track.id;
            element.instrumentID = track.instrumentID;
            element.beats = track.beatList;
            element.volume = track.masterVolume;
            obj.trackList.push(element);
        }
        return JSON.stringify(obj);
    }
}


/**
 * A TrackSequence is the representation of the backend model Track as used
 * by the LoopPlayer. In addition to the fields in the model Track, it also
 * holds the sample (an AudioBuffer) to allow the track to be played aloud.
 */
class TrackSequence {
    constructor(id, instrumentID, sample, beatList, masterVolume) {
        this.id = id;
        this.instrumentID = instrumentID;
        this.sample = sample;
        this.beatList = beatList;
        this.masterVolume = masterVolume;
    }

    /**
     * Toggles the character (repesenting the beat on/off) at the index
     * specified.
     * @param {Integer} index 
     */
    toggleBeat(index){
        if (this.beatList.charAt(index) === "8") {
            this.beatList = replaceCharacter(this.beatList, index, "0");
        } else {
            this.beatList = replaceCharacter(this.beatList, index, "8");
        }
    }

    /**
     * Returns the master volume divided by 10 for use in the gainNode
     * of the AudioContext.
     * @returns master volume * 0.1
     */
    getVolume() {
        return this.masterVolume * 0.1;
    }

    /**
     * returns true if there is a beat to be played at this index.
     * @returns true if beat exists at index, false otherwise.
    */
    hasBeatAt(index) {
        return this.beatList.charAt(index) === '8';
    }
}


/**
 * Utility function which replaces the character at a given position in the
 * string parameter with the supplied replacement character.
 * @param {String} string 
 * @param {Integer} position 
 * @param {String} newCharacter 
 * @returns The altered string.
 */
const replaceCharacter = (string, position, newCharacter) => {
    let before = string.substring(0, position);
    let after = string.substring(position + 1);
    return before + newCharacter + after;
};

