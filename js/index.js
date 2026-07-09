import { suggestionElm, personElm, formElm } from "./general/elements.js";
import { showElement } from "./general/reuse.js";
import { nameInSuggestion, debouncePersonSuggestionsFetch, selectSuggestion} from "./filter/person.filter.js";
import { extractFormData } from "./generate.js";

let personSelected;

// * ======= Person Filter ======= *

// Handle AutoFilling Upon Lost Focus
personElm.addEventListener("input", (event) => {
    if (nameInSuggestion(event)) { return; }
    debouncePersonSuggestionsFetch(event.target.value);
});

// Remove Person Dropdown
personElm.addEventListener("focusout", (event) => {
    // TODO: NEED TO FIND WAY FOR NON COMPLETE NAME FROM SENDING
    showElement(suggestionElm, false);
})

// Selects Dropdown For Person
suggestionElm.addEventListener('mousedown', (event) => {
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
    extractFormData(eventData);
}); 

