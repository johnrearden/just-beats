document.addEventListener('DOMContentLoaded', () => {

});

const onRowClicked = (event, creator, loopName) => {
    console.log('row clicked');
    window.location = (`/loop/${creator}/${loopName}/`);
};


