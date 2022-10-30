let loopPlayer;

document.addEventListener('DOMContentLoaded', () => {
    const playButton = document.getElementById('play-loop');

    // Fetch the tracks for this loop from the server, and create a new
    // LoopPlayer object to play the loop.
    const loopID = document.getElementById('drumloop-id').value;
    const tempo = document.getElementById('tempo').value;
    let url = '/tracks/' + loopID;
            fetch(url)
                .then(response => response.json())
                .then(tracks => {
                    loopPlayer = new LoopPlayer(tempo, tracks, loopID);
                    playButton.addEventListener('click', e => loopPlayer.togglePlay());
                });


    setIntrumentNameColors();

    // Draw the clickable beat divs to the page.
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
});

const onBeatClick = (event) => {
    let beatDiv = event.target;
    let [trackString, beatString] = beatDiv.id.split(":");
    trackNumber = parseInt(trackString);
    beatNumber = parseInt(beatString);
    let beatInputField = document.getElementById(`beats_${trackNumber}`)
    if (beatDiv.classList.contains('active_beat')) {
        beatDiv.classList.remove('active_beat');
        beatInputField.value = replaceCharacter(beatInputField.value, beatNumber, "0");
        loopPlayer.toggleBeatAt(trackNumber, beatNumber);
    } else {
        beatDiv.classList.add('active_beat');
        beatInputField.value = replaceCharacter(beatInputField.value, beatNumber, "8");
        loopPlayer.toggleBeatAt(trackNumber, beatNumber);
    }
}

const onInstrumentClicked = (trackID) => {

    // Stop the LoopPlayer if playing
    loopPlayer.audioCtx.suspend();

    // Store the trackID of the track whose intrument has been clicked in the
    // modal to be retrieved when the modal is closed.
    let modalTrackID = document.getElementById('modal-current-trackID');
    modalTrackID.textContent = trackID;
    let currentInstrumentID = loopPlayer.getInstrumentID(trackID);
    console.log(`currentInstrumentID == ${currentInstrumentID}`);
    const modalCurrentInstrumentID = document.getElementById('modal-current-instrumentID');
    modalCurrentInstrumentID.textContent = currentInstrumentID;
    const instrumentSpans = document.getElementsByClassName('instrument-spans');
    for (let span of instrumentSpans) {
        if (span.id.split('_')[1] === currentInstrumentID) {
            span.classList.add('selected-instrument');
        } else {
            span.classList.remove('selected-instrument');
        }
    }
    $('#instrument-chooser').modal('show');
}

const onModalSaveChangesClicked = (e) => {
    const trackID = document.getElementById('modal-current-trackID').textContent;
    const instrumentID = document.getElementById('modal-current-instrumentID').textContent;

    // Change the value of the hidden instrument_id text field in the html form, and
    // then force form submission to save the new instrument, and all previous 
    // unsaved changes to the backend.
    const instrumentIdInputs = document.getElementsByClassName('instrument-id');
    for (let input of instrumentIdInputs) {
        if (input.id.split('_')[1] === trackID) {
            input.value = instrumentID;
        }
    }
    document.getElementById('keep-editing').value = "yes";
    document.getElementById('loop-editor-form').submit();
}

const onModalInstrumentClicked = (e) => {
    const selectedInstrumentID = e.target.id.split('_')[1];
    const modalCurrentInstrumentID = document.getElementById('modal-current-instrumentID');
    modalCurrentInstrumentID.textContent = selectedInstrumentID;
    const instrumentSpans = document.getElementsByClassName('instrument-spans');
    for (let span of instrumentSpans) {
        if (span.id.split('_')[1] === selectedInstrumentID) {
            span.classList.add('selected-instrument');
        } else {
            span.classList.remove('selected-instrument');
        }
    }
}

const setIntrumentNameColors = () => {
    let instrumentNameDivs = document.getElementsByClassName('instrument-name');
    for (let div of instrumentNameDivs) {
        let text = div.innerHTML;
        let hash = hashString(text);
        let unsignedHash = hash >>> 0;
        let red = (unsignedHash & 0x00ff0000) >>> 16;
        let green = (unsignedHash & 0x0000ff00) >>> 8;
        let blue = unsignedHash & 0x000000ff;
        div.style.backgroundColor = `rgb(${red}, ${green}, ${blue}, 0.4)`;
        div.style.color = "white";
    }
}

const hashString = (string) => {
    let hash = 0;
    if (string.length === 0) return hash;
    for (let i = 0; i < string.length; i++) {
        let chr = string.charCodeAt(i);
        hash = ((hash << 5) - hash) + chr;
        hash |= 0;
    }
    return hash;
}