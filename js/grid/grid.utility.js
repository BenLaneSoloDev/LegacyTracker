import { gridElm } from "../general/elements.js";

function displayGridError(message) {
    gridElm.innerHTML = "";
    gridElm.textContent = `ERROR: ${message}`;
};

function clearGrid() {
    while (gridElm.firstChild) {
        gridElm.removeChild(gridElm.firstChild);
    }
};

export { displayGridError, clearGrid }