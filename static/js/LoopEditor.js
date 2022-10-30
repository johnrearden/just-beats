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