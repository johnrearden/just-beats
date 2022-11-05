let loopPlayer;

document.addEventListener('DOMContentLoaded', () => {
    const playButtons = document.getElementsByClassName('play-button');
    for (let button of playButtons) {
        button.addEventListener('click', (e) => {

            // Get the id and tempo associated with this loop.
            const target = e.target;
            const loopID = target.getAttribute('data-id');
            const tempo = target.getAttribute('data-tempo');
            const name = target.getAttribute('data-name');
            const creator = target.getAttribute('data-creator');

            // If the loopPlayer has been created, and it is already playing
            // this loop, toggle the play button as normal.
            if (loopPlayer) {
                if (loopPlayer.loopID !== loopID) {
                    
                    // Get the tracks related to this loop from the server.
                    let url = '/tracks/' + loopID;
                    fetch(url)
                        .then(response => response.json())
                        .then(tracks => {
                            populateLoopPlayer(parseInt(tempo), tracks, loopID);
                            loopPlayer.audioCtx.resume();
                            changeCurrentTrackName(name);
                            showRatingLink();
                        });
                } else {
                    toggleRatingLink(name);
                }
                loopPlayer.togglePlay();
                
            } else {
                // Get the tracks related to this loop from the server.
                let url = '/tracks/' + loopID;
                fetch(url)
                    .then(response => response.json())
                    .then(tracks => {
                        loopPlayer = new LoopPlayer(tempo, tracks, loopID);
                        toggleRatingLink(name);
                        loopPlayer.togglePlay();
                    });
            }
        });
    }
});

// Each time the loopPlayer is toggled, the rating link must be also. This keeps
// the visibility of the link in sync with the loopPlayer.
const toggleRatingLink = (name) => {
    // If the loopPlayer is being set to play, then display the 
    // loop name in the current track display.
    const currentTrackDisplay = document.getElementById('current-track-display');
    const trackNameSpan = document.getElementById('playing-track-name');
    if (currentTrackDisplay.classList.contains('invisible')) {
        trackNameSpan.textContent = name;
        currentTrackDisplay.classList.remove('invisible');
    } else {
        currentTrackDisplay.classList.add('invisible');
    }
}

// Used when the user has clicked on a new track. In this case, the loopPlayer
// is not toggled, it is switched on (whether or not it was on before). The 
// rating link visiblity must be displayed to match the audio behaviour
const showRatingLink = () => {
    const currentTrackDisplay = document.getElementById('current-track-display');
    currentTrackDisplay.classList.remove('invisible');
}

const changeCurrentTrackName = (name) => {
    document.getElementById('playing-track-name').textContent = name;
}

const populateLoopPlayer = (tempo, tracks, loopID) => {
    if (!loopPlayer) {
        loopPlayer = new LoopPlayer(tempo, tracks, loopID);
    } else {
        loopPlayer.swapLoop(tempo, tracks, loopID);
    }
}
