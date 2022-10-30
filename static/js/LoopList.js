let loopPlayer;

document.addEventListener('DOMContentLoaded', () => {
    const playButtons = document.getElementsByClassName('play-button');
    for (let button of playButtons) {
        button.addEventListener('click', (e) => {

            // Get the id and tempo associated with this loop.
            let idAttr = e.target.id;
            let arr = idAttr.split('-');
            let loopID = arr[1];
            let tempo = arr[2];

            if (loopPlayer) {
                console.log(`current loopID == ${loopPlayer.loopID}, new id == ${loopID}`);
            }
            

            // If the loopPlayer has been created, and it is already playing
            // this loop, toggle the play button as normal.
            if (loopPlayer) {
                if (loopPlayer.loopID !== loopID) {
                    console.log()
                    console.log('loop has changed .....');
                    // Get the tracks related to this loop from the server.
                    let url = '/tracks/' + loopID;
                    fetch(url)
                        .then(response => response.json())
                        .then(tracks => {
                            populateLoopPlayer(tempo, tracks, loopID);
                            loopPlayer.audioCtx.resume();
                        });
                }
                loopPlayer.togglePlay();
            } else {
                // Get the tracks related to this loop from the server.
                let url = '/tracks/' + loopID;
                fetch(url)
                    .then(response => response.json())
                    .then(tracks => {
                        loopPlayer = new LoopPlayer(tempo, tracks, loopID);
                        loopPlayer.togglePlay();
                    });
            }
        });
    }
});

const populateLoopPlayer = (tempo, tracks, loopID) => {
    if (!loopPlayer) {
        loopPlayer = new LoopPlayer(tempo, tracks, loopID);
    } else {
        loopPlayer.swapLoop(tempo, tracks, loopID);
    }
}
