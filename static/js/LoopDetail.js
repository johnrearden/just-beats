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
                    loopPlayer = new LoopPlayer(tempo, tracks, loopID);
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