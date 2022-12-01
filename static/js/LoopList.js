/**
 * The LoopPlayer object that handles audio playback.
 */
let loopPlayer;


/**
 * Adds event listeners to the play buttons belonging to each loop in the
 * loop list.
 */
document.addEventListener('DOMContentLoaded', () => {
    const playButtons = document.getElementsByClassName('play-button');
    for (let button of playButtons) {
        button.addEventListener('click', (e) => {
            // Get the id and tempo associated with this loop.
            const target = e.target;
            const loopID = target.getAttribute('data-id');
            const tempo = target.getAttribute('data-tempo');
            const name = target.getAttribute('data-name');
            const username = target.getAttribute('data-user');

            // If the current user is the owner of this track, 
            // disable the rating link button.
            let creator = target.getAttribute('data-creator');
            let ratingLauncherButton = document.getElementById('rating-launcher-button');
            if (username === creator || username === "") {
                ratingLauncherButton.classList.add('invisible');
            } else {
                ratingLauncherButton.classList.remove('invisible');
            }

            const ratingButton = document.getElementById('rating-launcher-button');
            ratingButton.setAttribute('data-id', loopID);
            ratingButton.setAttribute('data-username', username);

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
                            changeCurrentLoopName(name);
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

    const ratingLauncher = document.getElementById('rating-launcher-button');
    ratingLauncher.addEventListener('click', (event) => {
        const loopID = event.target.getAttribute('data-id');
        const username = event.target.getAttribute('data-username');
        console.log(`username = "${username}"`);
        
        /* const url = `/create_review/${loopID}/${username}/`;
        window.location = url; */
    });
});


/**
 * Each time the loopPlayer is toggled, the rating link must be also. This keeps
 * the visibility of the link in sync with the loopPlayer.
 * @param {String} name 
 */
const toggleRatingLink = (name) => {
    // If the loopPlayer is being set to play, then display the 
    // loop name in the current track display.
    const currentTrackDisplay = document.getElementById('current-loop-display');
    const trackNameSpan = document.getElementById('playing-loop-name');
    if (currentTrackDisplay.classList.contains('invisible')) {
        trackNameSpan.textContent = name;
        currentTrackDisplay.classList.remove('invisible');
    } else {
        currentTrackDisplay.classList.add('invisible');
    }
};


/**
 * Used when the user has clicked on a new track. In this case, the loopPlayer
 * is not toggled, it is switched on (whether or not it was on before). The 
 * rating link visiblity must be displayed to match the audio behaviour
 */ 
const showRatingLink = () => {
    const currentTrackDisplay = document.getElementById('current-loop-display');
    currentTrackDisplay.classList.remove('invisible');
};


/**
 * Sets the currently playing loop name on the page.
 * @param {String} name 
 */
const changeCurrentLoopName = (name) => {
    document.getElementById('playing-loop-name').textContent = name;
};


/**
 * Creates a new LoopPlayer object if one does not yet exist, and passes
 * the loop ID, tracks info and tempo to it.
 * @param {Integer} tempo 
 * @param {String} tracks 
 * @param {String} loopID 
 */
const populateLoopPlayer = (tempo, tracks, loopID) => {
    if (!loopPlayer) {
        loopPlayer = new LoopPlayer(tempo, tracks, loopID);
    } else {
        loopPlayer.swapLoop(tempo, tracks, loopID);
    }
};
