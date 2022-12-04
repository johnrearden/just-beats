/**
 * This function loads the loop detail view for the row clicked. It would have 
 * been more straightforward to simply put a link with a templated url in
 * loop_list.html, but for UX it was better to have the whole row clickable, 
 * and a HTML table row can't be wrapped in an anchor tag unfortunately.
 * @param {Event} event 
 * @param {String} creator 
 * @param {String} loopName 
 */
const onRowClicked = (event, creator, loopName) => {
    window.location = (`/loop/${creator}/${loopName}/`);
};


