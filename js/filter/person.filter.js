import { TMDB_API_KEY } from "../config/config.js";
import { suggestionElm, personElm } from "../general/elements.js";

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
const debouncePersonSuggestionsFetch = debounce((query) => {
    fetchPersonSuggestions(query);
}, 300); 

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
        const option = document.createElement("div");
        option.className = "dropdown-row";

        // Set additional info label
        const department = person.known_for_department;
        let topProject;
        if (person.known_for && person.known_for.length > 0) { topProject = person.known_for[0].title; }
        option.textContent = topProject ? `${person.name} (${department}, known for '${topProject})'` : `${person.name} (${department})`;

        // Save ID
        option.setAttribute('data-id', person.id);

        suggestionElm.appendChild(option);
    });

    suggestionElm.style.display = "block";
};

function selectSuggestion(event) {
    const clickedRow = event.target.closest('.dropdown-row');  
    if (!clickedRow) return;

    // Set Input Element Value (and return the id);
    personElm.value = event.target.textContent.split(" (")[0]; 
    return event.target.getAttribute("data-id"); 
}

function nameInSuggestion(event) {
    const currentPerson = event.target.value;

    // Ensure currently typed person is valid
    const exactMatchFound = Array.from(suggestionElm.children)
        .some(option => option.textContent.toLowerCase() === currentPerson.toLowerCase());

    if (exactMatchFound) {
        console.log("FOUND EXACT PERSON"); // MATCH FOUND, SO STOP SEARCHING
        return true;    
    }
    return false;
};

export { nameInSuggestion, debouncePersonSuggestionsFetch, selectSuggestion }

