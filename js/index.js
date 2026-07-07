import { TMDB_API_KEY } from "./config.js";

// SETUP PERSON AUTOFILL
const personElm = document.getElementById("person-select");
const suggestionElm = document.getElementById("person-list");
const roleElm = document.querySelector(".role");

// Function for sending the fetch required to access person suggestions
async function fetchPersonSuggestions(query) {
    
    // If Input Empty, dont continue the function
    if (!query.trim()) {
        suggestionElm.innerHTML = '';
        return;
    }

    // Create endpoint request
    const endpoint = `https://api.themoviedb.org/3/search/person?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}`;

    try {
        const response = await fetch(endpoint);
        
        if (!response.ok) {
            throw new Error(`Network response error: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Filter to only be active players in the space
        const relevantData = data.results.filter(person => {
            const filterProfession = person.known_for_department === "Acting"
            || person.known_for_department === "Directing" 
            || person.known_for_department === "Writing";
            const filterPopularity = person.popularity > 2.0; // Based on recent activity 

            return filterProfession && filterPopularity;
        });

        // Sort by TMDB popularity score and grab the top 5
        const top5 = data.results
            .sort((a, b) => b.popularity - a.popularity)
            .slice(0, 5);

        renderSuggestions(top5);

    } catch (error) { 
        console.error("Error fetching person suggestions:", error);
    }
};

// Handles updating the person dropdown list
function renderSuggestions(list) {
    suggestionElm.innerHTML = "";

    list.forEach(person => {
        const option = document.createElement("option");

        // Set name value
        option.value = person.name;

        // Set additional info label
        const department = person.known_for_department;
        let topProject;
        if (person.known_for && person.known_for.length > 0) {topProject = person.known_for[0].title; }
        option.label = topProject ? `${name} (${department}, known for '${topProject})'` : department;
        suggestionElm.appendChild(option);
    });
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

    const currentPerson = event.target.value;

    // Ensure currently typed person is valid
    const exactMatchFound = Array.from(suggestionElm.options)
        .some(option => option.value.toLowerCase() === currentPerson.toLowerCase());

    if (exactMatchFound) {
        console.log("FOUND EXACT PERSON"); // MATCH FOUND, SO STOP SEARCHING
        return;
    }

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