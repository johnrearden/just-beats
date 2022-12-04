document.addEventListener('DOMContentLoaded', () => {

    // Set the text on the sharing link to the current window location.
    const link = document.getElementById('pasteable-link');
    link.textContent = window.location;

    // Create a reference to the loop player.
    let loopPlayer;

    // Wire up the play button.
    const playButton = document.getElementById('detail-play-button');
    playButton.addEventListener('click', (e) => {
        // Get the id and tempo associated with this loop.
        const target = e.target;
        const loopID = target.getAttribute('data-id');
        const tempo = target.getAttribute('data-tempo');
        let volume = document.getElementById('loop-detail-volume').value;

        // If the loopPlayer has not been created, create it now, and then 
        // set it to playing.
        if (!loopPlayer) {
            // Get the tracks related to this loop from the server.
            let url = '/tracks/' + loopID;
            fetch(url)
                .then(response => response.json())
                .then(tracks => {
                    loopPlayer = new LoopPlayer(
                        tempo, 
                        tracks, 
                        loopID,
                        'anonymous',
                        fireAnimation);
                    loopPlayer.changeLoopVolume(volume * 0.1);
                    loopPlayer.togglePlay();
                    toggleIcon();
                });
        } else {
            loopPlayer.togglePlay();
            toggleIcon();
        }
    });

    // Wire up the volume control.
    volumeInput = document.getElementById('loop-detail-volume');
    volumeInput.addEventListener('input', (e) => {
        volume = e.target.value;
        if(loopPlayer) {
            loopPlayer.changeLoopVolume(volume * 0.1);
        }
    });

    // Wire up the sharing link url copier.
    let copyToClipboardButton = document.getElementsByClassName('copy-icon')[0];
    copyToClipboardButton.addEventListener('click', (e) => {
        navigator.clipboard.writeText(document.location);
        displaySuccessAlert('Link copied to your clipboard .... send it to your friends!');
    });
    
});

const toggleIcon = () => {
    const playIcon = document.getElementsByClassName('fa-play')[0];
    const pauseIcon = document.getElementsByClassName('fa-pause')[0];

    if (playIcon.classList.contains('d-none')) {
        playIcon.classList.remove('d-none');
        pauseIcon.classList.add('d-none');
    } else {
        playIcon.classList.add('d-none');
        pauseIcon.classList.remove('d-none');
    }
};

const fireAnimation = (beatIndex) => {

    // Animate the currently playing beat on the beats display.
    const trackCount = document.getElementsByClassName('beats-holder').length;
    for (let i = 0; i < trackCount; i++) {
        const beatsHolder = document.getElementById(`beats-holder-track_${i}`);
        const beatDivs = beatsHolder.children;
        const beatCount = beatDivs.length;
        const previousBeatIndex = beatIndex > 0 ? beatIndex - 1 : beatCount - 1;
        const beatDiv = beatDivs[beatIndex];
        if (beatDiv.classList.contains('readonly-active-beat')) {
            beatDiv.classList.add('readonly-active-highlighted-beat');
        } else {
            beatDiv.classList.add('readonly-highlighted-beat');
        }
        beatDivs[previousBeatIndex].classList.remove('readonly-highlighted-beat');
        beatDivs[previousBeatIndex].classList.remove('readonly-active-highlighted-beat');
    }

    // Rotate the play button
    const playButton = document.getElementById('detail-play-button');
    if (beatIndex === 0) {
        playButton.style.transform = `rotatez(1turn)`;    
    } else if (beatIndex === 16) {
        playButton.style.transform = 'rotatez(-1turn)';
    }

    // Control the size of the site logo
    const siteLogo = document.getElementsByClassName('site-logo')[0];
    const loopName = document.getElementById('loop-name-heading');
    if (beatIndex % 16 === 0) {
        siteLogo.classList.remove('transition-on');
        siteLogo.style.transform = 'scale(1.1, 1.1)';
        loopName.style.transform = 'scale(1.1, 1.1)';
        loopName.classList.remove('transition-on');
    }
    if (beatIndex % 16 === 8) {
        siteLogo.style.transform = 'scale(1.0, 1.0)';
        siteLogo.classList.add('transition-on');
        loopName.style.transform = 'scale(1.0, 1.0)';
        loopName.classList.add('transition-on');
    }
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