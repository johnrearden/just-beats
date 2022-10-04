document.addEventListener('DOMContentLoaded', () => {
    let numberOfTracks = document.getElementsByClassName('track').length;
    console.log(`numberOfTracks : ${numberOfTracks}`);
    for (let i = 0; i < numberOfTracks; i++) {
        let trackId = `track_${i}`;
        let track_div = document.getElementById(trackId);
        let beatString = document.getElementById('beats_' + i).value;
        for (let j = 0; j < beatString.length; j++) {
            let beatDiv = document.createElement('div');
            if (beatString[j] === '8') {
                beatDiv.className = "beat active_beat";
            } else {
                beatDiv.className = "beat";
            }
            beatDiv.id = `${i}:${j}`
            beatDiv.addEventListener('click', e => onBeatClick(e));
            track_div.appendChild(beatDiv)
        }
    }
})

const onBeatClick = (event) => {
    let beatDiv = event.target;
    let [trackString, beatString] = beatDiv.id.split(":");
    trackNumber = parseInt(trackString);
    beatNumber = parseInt(beatString);
    let beatInputField = document.getElementById(`beats_${trackNumber}`)
    if (beatDiv.classList.contains('active_beat')) {
        beatDiv.classList.remove('active_beat');
        beatInputField.value = replaceCharacter(beatInputField.value, beatNumber, "0");
    } else {
        beatDiv.classList.add('active_beat');
        beatInputField.value = replaceCharacter(beatInputField.value, beatNumber, "8");
    }
}

const replaceCharacter = (string, position, newCharacter) => {
    let before = string.substring(0, position);
    let after = string.substring(position + 1);
    return before + newCharacter + after;
}