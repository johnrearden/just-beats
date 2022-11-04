let loopPlayer;
let instrumentModalConfig;

document.addEventListener('DOMContentLoaded', () => {
    const addNewTrackButton = document.getElementById('add-new-track');
    addNewTrackButton.addEventListener('click', (event) => {
        onAddNewTrackButtonClick(event);
    });
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
        let trackDOMIndex = `beats-holder-track_${i}`;
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

const onTempoInputChange = (event) => {
    const newTempo = event.target.value;
    console.log(`new tempo is ${newTempo}`);
    loopPlayer.changeTempo(newTempo);
}

const onTrackVolumeChange = (event, trackID) => {
    loopPlayer.changeTrackVolume(trackID, event.target.value);
}

const onInstrumentButtonClicked = (loopID, trackID) => {

    // Stop the LoopPlayer if playing
    loopPlayer.audioCtx.suspend();

    // Create a new InstrumentModalConfig object to store current state.
    const currentInstrumentID = loopPlayer.getInstrumentID(trackID);
    instrumentModalConfig = new InstrumentModalConfig(
        trackID,
        currentInstrumentID,
        loopID,
        false,
    )
    console.log(instrumentModalConfig)

    // Set the current instrument as selected in the modal.
    const instrumentSpans = document.getElementsByClassName('instrument-spans');
    for (let span of instrumentSpans) {
        if (span.id.split('_')[1] === currentInstrumentID) {
            span.classList.add('selected-instrument');
        } else {
            span.classList.remove('selected-instrument');
        }
    }

    // Display the modal.
    $('#instrument-chooser').modal('show');
}

const onModalSaveChangesClicked = (e) => {

    // If an existing track is being modified, update the instrumentID input 
    // so that the backend can save the new instrument selection.
    if (!instrumentModalConfig.newTrack) {
        const instrumentIdInputs = document.getElementsByClassName('instrument-id');
        for (let input of instrumentIdInputs) {
            if (input.id.split('_')[1] === instrumentModalConfig.selectedTrackID) {
                input.value = instrumentModalConfig.currentInstrumentID;
            } 
        }
        // Force submission of the loop-editor-form to reload the page.
        document.getElementById('keep-editing').value = "yes";
        document.getElementById('loop-editor-form').submit();
    } else {
        const csrfToken = getCookie('csrftoken');
        // A new track is being created. Make a POST request to the backend
        // to create a new track.
        const params = {
            'loopID': instrumentModalConfig.currentLoopID,
            'instrumentID': instrumentModalConfig.currentInstrumentID,
        }
        const options = {
            method: 'POST',
            credentials: 'same-origin',
            body: JSON.stringify(params),
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'X-CSRFToken': csrfToken,
            },

        }
        fetch('/add_new_track/', options)
            .then(() => {
                // Submit the form to save all changes and display the 
                // new track on the page, once the response has been received.
                document.getElementById('keep-editing').value = "yes";
                document.getElementById('loop-editor-form').submit();
            });
    }
}

const onModalInstrumentClicked = (e, instrumentURL) => {
    const selectedInstrumentID = e.target.id.split('_')[1];
    instrumentModalConfig.currentInstrumentID = selectedInstrumentID;
    const instrumentSpans = document.getElementsByClassName('instrument-spans');
    for (let span of instrumentSpans) {
        if (span.id.split('_')[1] === selectedInstrumentID) {
            span.classList.add('selected-instrument');
        } else {
            span.classList.remove('selected-instrument');
        }
    }
    const url = drumURLs[instrumentURL];
    audio = new Audio(url);
    audio.play();
}

const onAddNewTrackButtonClick = (e) => {
    // Stop the LoopPlayer if playing
    loopPlayer.audioCtx.suspend();

    // Display the first instrument as selected, so that there is a default if
    // the modal is closed before a selection is made.
    const instrumentSpans = document.getElementsByClassName('instrument-spans');
    const defaultInstrumentID = instrumentSpans[0].id.split('_')[1];

    // Create a new InstrumentModalConfig object to store current state.
    instrumentModalConfig = new InstrumentModalConfig(
        -1, // In this case, there is no track yet.
        defaultInstrumentID,
        loopPlayer.loopID,
        true,
    )

    // Display the modal.
    $('#instrument-chooser').modal('show');
} 

const onDeleteTrackButtonClick = (event, trackID) => {
    event.preventDefault();

    // Store the selected trackID in the confirm button.
    const confirmButton = document.getElementById('confirm-delete-track-button');
    confirmButton.setAttribute('trackID', trackID);

    // Open a modal dialog to ask user to confirm action.
    $('#delete-track-confirmation').modal('show');
}

const onRefuseDeleteTrackClick = (event) => {
    $('#delete-track-confirmation').modal('hide');
}

const onConfirmDeleteTrackClick = (event) => {

    // Hide the dialog again.
    $('#delete-track-confirmation').modal('hide');

    // Get the trackID from the confirm button.
    const trackID = event.target.getAttribute('trackID');

    // Remove the track from the page, so that it is not returned with
    // the form on page reload.
    const trackIDAttribute = `track_${trackID}`;
    const trackRow = document.getElementById(trackIDAttribute);
    trackRow.parentNode.removeChild(trackRow);


    // Make a POST request to the backend to delete this track.
    const csrfToken = getCookie('csrftoken');
    const params = {
        'trackID': trackID,
    }
    const options = {
        method: 'POST',
        credentials: 'same-origin',
        body: JSON.stringify(params),
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'X-CSRFToken': csrfToken,
        },
    }
    fetch('/delete_track/', options); // No need to reload page in this instance.
}

getCookie = (name) => {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            // Does this cookie string begin with the name we want?
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
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

class InstrumentModalConfig {
    constructor(selectedTrackID, currentInstrumentID, currentLoopID, newTrack) {
        this.selectedTrackID = selectedTrackID;
        this.currentInstrumentID = currentInstrumentID;
        this.currentLoopID = currentLoopID;
        this.newTrack = newTrack;
    }
}