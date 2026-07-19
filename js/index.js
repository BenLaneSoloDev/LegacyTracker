import { suggestionElm, personElm, formElm, gridElm } from "./general/elements.js";
import { showElement } from "./general/reuse.js";
import { nameInSuggestion, debouncePersonSuggestionsFetch, selectSuggestion} from "./filter/person.filter.js";
import { createGridFromData } from "./grid/grid.generate.js";
import { handleHoverTM, displayExitTM } from "./grid/grid.treemap.js";

let personSelected;

// * ======= Person Filter ======= *

// Handle AutoFilling Upon Lost Focus
personElm.addEventListener("input", (event) => {
    if (nameInSuggestion(event)) { return; }
    debouncePersonSuggestionsFetch(event.target.value);
});

// Remove Person Dropdown
personElm.addEventListener("focusout", (event) => {
    showElement(suggestionElm, false);
    if (nameInSuggestion(event)) { return; }
    personSelected = "";
})

// Selects Dropdown For Person
suggestionElm.addEventListener("mousedown", (event) => {
    event.preventDefault();
    personSelected = selectSuggestion(event);
    showElement(suggestionElm, false);
});

// * ======= Visual Generation ======= *

formElm.addEventListener("submit", (event) => {
    const eventData = {
        event: event,
        personSelected: personSelected
    }
    createGridFromData(eventData);
}); 

// * ======= Treemap Item Interaction ======= *

gridElm.addEventListener("mousemove", (event) => {
    handleHoverTM(event);     // TREEMAP FUNCTION
});

gridElm.addEventListener("mouseleave", (event) => {
    displayExitTM(event);     // TREEMAP FUNCTION
}, true); 
