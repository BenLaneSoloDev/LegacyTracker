import { TMDB_API_KEY } from "./config.js";

// SETUP PERSON AUTOFILL
const personElm = document.getElementById("person-select");
const suggestionElm = document.getElementById("person-results");
const roleElm = document.querySelector(".role");

// Function for sending the fetch required to access person suggestions
function fetchPersonSuggestions(query) {
    console.log("EVENT");
};

// function that only runs the given function if the delay is met
function debounce(func, delay = 300) { 
    let timeoutId;
    return (...args) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
            func.apply(null, args);
        }, delay);
    }
}

// Debounce Fetch Reference Made (so same instance timer can be updated)
const debounceFetch = debounce((query) => {

    // Handle Toggling Role Filter
    if (query) { roleElm.classList.remove("is-hidden"); }
    else { roleElm.classList.add("is-hidden"); }

    // Handles Fetch
    fetchPersonSuggestions(query);

}, 300); 

// Handle AutoFilling
personElm.addEventListener("input", (event) => {
    debounceFetch(event.target.value);
});

// HANDLE DECADE OPTION GENERATION



// HANDLE FORM SUBMISSIONS
const formElm = document.querySelector(".filter-form");
formElm.addEventListener("submit", (event) => {
    event.preventDefault(); // STOP PAGE REFRESH

    // EXTRACT DATA
    const formData = new FormData(formElm);
    const franchise = formData.get('franchise');
    const person = formData.get('person');
    const role = formData.get('role');
    const decade = formData.get('decade');

    // PRINT DATA
    console.log("Form submitted successfully!");
    console.log(`Searching for: ${franchise} - ${person} - ${role} - ${decade}"`);
}); 