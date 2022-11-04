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
    const name = document.getElementById('drumloop_name').value;
    let url = '/tracks/' + loopID;
    fetch(url)
        .then(response => response.json())
        .then(tracks => {
            loopPlayer = new LoopPlayer(tempo, tracks, loopID, name);
            playButton.addEventListener('click', e => loopPlayer.togglePlay());
        });
    setIntrumentNameColors();
});

const onBeatClick = (event) => {
    let beatDiv = event.target;
    let [trackString, beatString] = beatDiv.id.split(":");
    console.log(trackString, beatString);
    trackNumber = parseInt(trackString);
    beatNumber = parseInt(beatString);
    if (beatDiv.classList.contains('active_beat')) {
        beatDiv.classList.remove('active_beat');
        loopPlayer.toggleBeatAt(trackNumber, beatNumber);
    } else {
        beatDiv.classList.add('active_beat');
        loopPlayer.toggleBeatAt(trackNumber, beatNumber);
    }
}

const onDrumloopNameChange = (event) => {
    loopPlayer.changeLoopName(event.target.value);
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
        '',
        '',
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

const onModalSaveChangesClicked = async(e) => {

    // If an existing track is being modified, update the instrumentID input 
    // so that the backend can save the new instrument selection.
    if (!instrumentModalConfig.newTrack) {

        // Change the loopPlayer instrument id and sample for this track.
        await loopPlayer.setInstrument(
            instrumentModalConfig.selectedTrackID, 
            instrumentModalConfig.currentInstrumentID, 
            instrumentModalConfig.currentInstrumentURL);

        // Change the instrument name on the track GUI.
        const instrumentNameDivs = document.getElementsByClassName('instrument-name');
        for (const div of instrumentNameDivs) {
            if (div.id.split('_')[1] === instrumentModalConfig.selectedTrackID) {
                console.log('track matched');
                div.innerText = instrumentModalConfig.currentInstrumentName;
            }
        }
        setIntrumentNameColors();

        // Hide the instrument modal.
        $('#instrument-chooser').modal('hide');

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
                // Reload the page
                window.location.reload();
            });
    }
}

const onModalInstrumentClicked = (e, instrumentURL, instrumentName) => {
    const selectedInstrumentID = e.target.id.split('_')[1];
    instrumentModalConfig.currentInstrumentID = selectedInstrumentID;
    instrumentModalConfig.currentInstrumentName = instrumentName;
    instrumentModalConfig.currentInstrumentURL = instrumentURL;

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

    // Remove the track from the LoopPlayer, so that it is not POSTed
    // the next time the user tries to save the loop and track.
    loopPlayer.deleteTrack(trackID);

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

const postLoopAndTracks = async(event) => {
    const csrfToken = getCookie('csrftoken');
    
    const options = {
        method: 'POST',
        credentials: 'same-origin',
        body: loopPlayer.getLoopAsJSON(),
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'X-CSRFToken': csrfToken,
        },
    }
    await fetch('/save_loop_and_tracks/', options)
        .then(response => response.json())
        .then(json => console.log(json));
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
    constructor(selectedTrackID, currentInstrumentID, currentLoopID, 
                newTrack, currentInstrumentURL, currentInstrumentName) {
        this.selectedTrackID = selectedTrackID;
        this.currentInstrumentID = currentInstrumentID;
        this.currentInstrumentURL = currentInstrumentURL;
        this.currentInstrumentName = currentInstrumentName;
        this.currentLoopID = currentLoopID;
        this.newTrack = newTrack;
    }
}