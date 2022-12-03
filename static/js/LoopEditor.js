/**
 * The LoopPlayer object that handles audio playback.
 */
let loopPlayer;


/**
 * A configuration object that stores state relevant to the operation of the 
 * instrument chooser modal.
 */
let instrumentModalConfig; 


/**
 * This function runs after the page content has loaded. It fetches the track 
 * data for this loop from the backend, creates the LoopPlayer object, and sets
 * up the event listeners on the play button and the addNewTrackButton.
 */
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
            loopPlayer = new LoopPlayer(
                tempo, tracks, loopID, name, animationCallback);
            playButton.addEventListener('click', e => loopPlayer.togglePlay());
        });
    setIntrumentNameColors();
});


/**
 * This function is passed to the LoopPlayer object as a callback, and called 
 * on every fourth beat in order to synchronise animations on the page with
 * the loop.
 */
const animationCallback = () => {
    
};


/**
 * This event handler responds to a click on any of the beat divs on the page, 
 * toggles its active_beat class, and passes the toggle event to the LoopPlayer
 * object to update the audio data.
 * @param {Event} event 
 */
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
};


/**
 * Passes the changed drumloop name to the LoopPlayer object.
 * @param {Event} event 
 */
const onDrumloopNameChange = (event) => {
    loopPlayer.changeLoopName(event.target.value);
};


/**
 * Passes the changed tempo to the loopPlayer object.
 * @param {Event} event 
 */
const onTempoInputChange = (event) => {
    const newTempo = event.target.value;
    loopPlayer.changeTempo(newTempo);
};


/**
 * This function reacts to a change in the value of any of the volume sliders, 
 * passing the appropriate track ID and the new value of the slider to the 
 * LoopPlayer object.
 * @param {Event} event 
 * @param {String} trackID 
 */
const onTrackVolumeChange = (event, trackID) => {
    loopPlayer.changeTrackVolume(trackID, event.target.value);
};


/**
 * When any of the instrument buttons are clicked, creates an new
 * InstrumentModalConfig object to store the loop and track ID, and the current
 * instrument value for this track. It stops the audio playback (if running), 
 * so that the sample instrument sounds can be heard clearly.
 * @param {String} loopID 
 * @param {String} trackID 
 */
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
        ''
    );
    // Set the current instrument as selected in the modal.
    const instrumentSpans = document.getElementsByClassName('instrument-name');
    for (let span of instrumentSpans) {
        if (span.id.split('_')[1] === currentInstrumentID) {
            span.classList.add('selected-instrument');
        } else {
            span.classList.remove('selected-instrument');
        }
    }

    // Display the modal.
    $('#instrument-chooser').modal('show');
};


/**
 * When a new instrument is selected in the instrument chooser modal, this 
 * function passes the current InstrumentModalConfig settings to the LoopPlayer, 
 * changes the instrument name and colour on the page, and hides the modal.
 * @param {Event} e 
 */
const onModalSaveChangesClicked = async (e) => {

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
                div.innerText = instrumentModalConfig.currentInstrumentName;
            }
        }
        setIntrumentNameColors();

        // Hide the instrument modal.
        $('#instrument-chooser').modal('hide');

    } else {
        // Grab the csrf cookie for the POST request.
        const csrfToken = getCookie('csrftoken');
        // A new track is being created. Make a POST request to the backend
        // to create a new track.
        const params = {
            'loopID': instrumentModalConfig.currentLoopID,
            'instrumentID': instrumentModalConfig.currentInstrumentID,
        };
        const options = {
            method: 'POST',
            credentials: 'same-origin',
            body: JSON.stringify(params),
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'X-CSRFToken': csrfToken,
            },

        };
        fetch('/add_new_track/', options)
            .then(() => {
                // Reload the page
                window.location.reload();
            });
    }
};


/**
 * This event handler function fires when an instrument is selection in the
 * instrument chooser modal. It highlights the instrument on the page, and
 * plays the instrument sample so that the user can listen to the instrument
 * they've chosen.
 * @param {Event} e 
 * @param {String} instrumentURL 
 * @param {String} instrumentName 
 */
const onModalInstrumentClicked = (e, instrumentURL, instrumentName) => {
    const selectedInstrumentID = e.target.id.split('_')[1];
    instrumentModalConfig.currentInstrumentID = selectedInstrumentID;
    instrumentModalConfig.currentInstrumentName = instrumentName;
    instrumentModalConfig.currentInstrumentURL = instrumentURL;

    const instrumentSpans = document.getElementsByClassName('instrument-name');
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
};


/**
 * Stops the audio playback, saves the current loop and track data (as the 
 * page needs to reload after a new track is created) and displays the 
 * instrument chooser modal (as a track must have an instrument).
 * @param {Event} e 
 */
const onAddNewTrackButtonClick = async (e) => {
    // Stop the LoopPlayer if playing
    loopPlayer.audioCtx.suspend();

    // Save the loop and track data, as the page will reload in order to 
    // display the loop with the newly added track, and any modifications
    // made up till now will be lost.
    await postLoopAndTracks();

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
    );

    // Display the modal.
    $('#instrument-chooser').modal('show');
};


/**
 * Checks that there is more than one remaining track in this loop. If so, 
 * opens a confirmation modal and stores the track ID as an attribute in this
 * modal.
 * @param {Event} event 
 * @param {String} trackID 
 */
const onDeleteTrackButtonClick = (event, trackID) => {
    event.preventDefault();

    // Check that there is more than one track remaining. If this is the last 
    // track, inform the user with a warning that a drumloop must have at least 
    // one track, and abort the delete action.
    const trackHolderRows = document.getElementsByClassName('track-holder-row');
    const trackCount = trackHolderRows.length;
    if (trackCount === 1) {
        displayWarningAlert('Can\'t delete the last track! A loop must have at least one.');
    } else {
        // Store the selected trackID in the confirm button.
    const confirmButton = document.getElementById('confirm-delete-track-button');
    confirmButton.setAttribute('trackID', trackID);

    // Open a modal dialog to ask user to confirm action.
    $('#delete-track-confirmation').modal('show');
    }
};


/**
 * If the user doesn't confirm the track deletion, simply hides the confirmation
 * modal.
 * @param {Event} event 
 */
const onRefuseDeleteTrackClick = (event) => {
    $('#delete-track-confirmation').modal('hide');
};


/**
 * On confirmation of the track deletion, takes the following 4 actions :
 *    1) Hides the confirmation modal
 *    2) Removes the track element from the page
 *    3) Removes the track from the LoopPlayer object.
 *    4) Makes a POST request to the backend to delete the track from 
 *       the database.
 * @param {Event} event 
 */
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
    };
    const options = {
        method: 'POST',
        credentials: 'same-origin',
        body: JSON.stringify(params),
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'X-CSRFToken': csrfToken,
        },
    };
    fetch('/delete_track/', options); // No need to reload page in this instance.
    displaySuccessAlert('Track deleted ..... farewell, condemned beats.');
};


/**
 * When the delete loop button is clicked, opens a modal to request
 * confirmation from the user.
 * @param {Event} event 
 * @param {String} loopID 
 */
const onDeleteLoopButtonClick = (event, loopID) => {
    event.preventDefault();

    // Store the selected loopID in the confirm button.
    const confirmButton = document.getElementById('confirm-delete-loop-button');
    confirmButton.setAttribute('loopID', loopID);

    // Open a modal dialog to ask user to confirm action.
    $('#delete-loop-confirmation').modal('show');
};


/**
 * If the user does not confirm the loop deletion, hides the modal.
 * @param {Event} event 
 */
const onRefuseDeleteLoopClick = (event) => {
    $('#delete-loop-confirmation').modal('hide');
};


/**
 * If the user confirms the loop deletion, this function hides the confirmation
 * modal, makes a POST request to the backend to delete the loop, and navigates
 * back to the homepage (the loop list).
 * @param {Event} event 
 */
const onConfirmDeleteLoopClick = (event) => {

    // Hide the dialog again.
    $('#delete-loop-confirmation').modal('hide');

    // Get the loopID from the confirm button.
    const loopID = event.target.getAttribute('loopID');

    // Make a POST request to the backend to delete this track.
    const csrfToken = getCookie('csrftoken');
    const params = {
        'loopID': loopID,
    };
    const options = {
        method: 'POST',
        credentials: 'same-origin',
        body: JSON.stringify(params),
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'X-CSRFToken': csrfToken,
        },
    };
    fetch('/delete_loop/', options)
        .then(() => window.location = '/');
};

/**
 * This function makes a POST request to the backend, passing the current 
 * loop and track data so that it can be saved to the database.
 * @param {Event} event 
 */
const postLoopAndTracks = async (event) => {
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
    };
    await fetch('/save_loop_and_tracks/', options)
        .then(response => response.json())
        .then(json => displaySuccessAlert('Loop and tracks successfully saved!'));
};


/**
 * Utility function to display a Bootstrap alert to the user. This alert mimics
 * the messages passed by Django to the page, and is used in the event that a 
 * message is needed, but the page is not reloaded, and so the Django messaging
 * functionality cannot be used.
 * @param {String} message 
 */
const displaySuccessAlert = (message) => {
    let alertHTML = `
        <div class="alert alert-success alert-dismissible fade show"
            id="msg" role="alert">
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        </div>`;
        let messageHolder = document.getElementById('message-holder');
        messageHolder.innerHTML = alertHTML;
        setTimeout(function() {
            let messages = document.getElementById('msg');
            if (messages) {
                let alert = new bootstrap.Alert(messages);
                alert.close();
            }
        }, 3000);
};

/**
 * Utility function to display a Bootstrap alert to the user. This alert mimics
 * the messages passed by Django to the page, and is used in the event that a 
 * message is needed, but the page is not reloaded, and so the Django messaging
 * functionality cannot be used.
 * @param {String} message 
 */
const displayWarningAlert = (message) => {
    let alertHTML = `
        <div class="alert alert-warning alert-dismissible fade show"
            id="msg" role="alert">
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        </div>`;
        let messageHolder = document.getElementById('message-holder');
        messageHolder.innerHTML = alertHTML;
        setTimeout(function() {
            let messages = document.getElementById('msg');
            if (messages) {
                let alert = new bootstrap.Alert(messages);
                alert.close();
            }
        }, 3000);
};

/**
 * Retrieves the document crsf cookie and returns it.
 * @param {String} name 
 * @returns the cookie value.
 */
const getCookie = (name) => {
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
};


/**
 * Creates a RGB color from the hashed value of the instrument name string, 
 * so that each instrument will have a unique color to improve UX. This 
 * approach reduces maintainance load as any new or custom instruments will
 * automatically have a new colour generated for them.
 */
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
};


/**
 * 
 * @param {String} string 
 * @returns an integer hash value (almost always) unique to the string.
 */
const hashString = (string) => {
    let hash = 0;
    if (string.length === 0) return hash;
    for (let i = 0; i < string.length; i++) {
        let chr = string.charCodeAt(i);
        hash = ((hash << 5) - hash) + chr;
        hash |= 0;
    }
    return hash;
};


/**
 * A utility class used to store information about the current track, loop
 * and instrument before opening the instrument chooser modal. This information
 * is then accessed by the modal event handlers upon user action.
 */
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