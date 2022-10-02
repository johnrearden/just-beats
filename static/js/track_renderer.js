document.addEventListener('DOMContentLoaded', () => {
    let scriptElement = document.getElementById('yoke-element');
    let jsonObj = JSON.parse(scriptElement.textContent);
    console.log(jsonObj);

    for (let i = 0; i < jsonObj.beats.length; i++) {
        let trackId = `track_${i}`;
        let track_div = document.getElementById(trackId);
        let beatString = jsonObj.beats[i]
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
    console.log(`Beat clicked : ${beatDiv.id}`);
    if (beatDiv.classList.contains('active_beat')) {
        beatDiv.classList.remove('active_beat');
    } else {
        beatDiv.classList.add('active_beat');
    }
}