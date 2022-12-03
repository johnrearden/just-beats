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
        const url = `/create_review/${loopID}/${username}/`;
        window.location = url;
    });
});