import { ACCESS_TOKEN_AUTH, TMDB_API_KEY } from "./config.js";

// SETUP PERSON AUTOFILL
const personElm = document.getElementById("person-select");
const suggestionElm = document.getElementById("person-list");
const roleElm = document.querySelector(".role");
let personSelected;

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
    fetchPersonSuggestions(query);
}, 300); 

function nameAlreadyValid(event) {
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

// Handle AutoFilling
personElm.addEventListener("input", (event) => {
    if (nameAlreadyValid(event)) { return; }
    debounceFetch(event.target.value);
});

// Handle Lost Focus (save current name)
personElm.addEventListener("focusout", (event) => {
    if (nameAlreadyValid(event)) { return; }
    
    //fetchPersonID(event.target.value);
    suggestionElm.style.display = "none";
})

suggestionElm.addEventListener('mousedown', (event) => {
    event.preventDefault();
    const clickedRow = event.target.closest('.dropdown-row');  
    if (!clickedRow) return;

    // Extract the exact array index from the clicked row's HTML attribute
    personSelected = event.target.getAttribute("data-id"); 
    console.log(personSelected);   
    personElm.value = event.target.textContent.split(" (")[0]; 

    suggestionElm.style.display = "none";
});











// HANDLE FORM SUBMISSIONS
const formElm = document.querySelector(".filter-form");
const gridElm = document.querySelector(".grid");

formElm.addEventListener("submit", extractFormData); 

async function extractFormData(event) {
    event.preventDefault(); // STOP PAGE REFRESH

    if(!personSelected) { 
        await fetchPersonID(personElm.value);
    };

    const movies = await fetchMovieScores();
    generateGridElements(movies);
}

async function fetchPersonID(person) {

    if (!person.trim()) {
        console.log("NO PERSON SELECTED") // NEED TO DISPLAY ERROR ON SCREEN
        return;
    }

    // Grab the persons ID
    const endpointId = `https://api.themoviedb.org/3/search/person?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(person)}`;

    try {
        const responseId = await fetch(endpointId);

        if (!responseId.ok) {
            throw new Error(`Network response error: ${responseId.status}`);
        }

        const data = await responseId.json();

        const topPerson = data.results
            .sort((a, b) => b.popularity - a.popularity)
            .slice(0, 1)[0];

        personElm.value = topPerson.name;
        personSelected = topPerson.id;
    }
    catch (error) {
        console.error("Error fetching persons details:", error);
    }
};

async function fetchMovieScores() {

    // Find all movies linked to the person
    const endpointFilms = `https://api.themoviedb.org/3/person/${personSelected}/movie_credits?api_key=${TMDB_API_KEY}`;
    let personsFilms;

    try {
        const responseFilms = await fetch(endpointFilms);

        if (!responseFilms.ok) {
            throw new Error(`Network response error: ${responseFilms.status}`);
        }

        console.log("FILMS FROM ID: " + personSelected);

        const data = await responseFilms.json();
        const combinedData = data.cast.concat(data.crew);

        // Filter the data
        const minorRoleKeywords = /cameo|uncredited|himself|herself|special appearance/i; // Used to remove cameos from search
        personsFilms = combinedData.filter(entry => {
            const filterCrew = entry.job === "Director" || entry.job === "Writer";
            const filterCast = entry.order < 5 && !minorRoleKeywords.test(entry.character);
            return filterCrew || filterCast;
        });
    }
    catch (error) {
        console.error("Error fetching persons movies:", error);
    }

    personSelected = null;
    return personsFilms;
};

async function generateGridElements(movies) {
    console.log(movies);

    while (gridElm.firstChild) {
        gridElm.removeChild(gridElm.firstChild);
    }   

    movies.forEach(movie => {

        const score = movie.vote_average;
        const totalReviews = movie.vote_count;

        if (totalReviews < 2) { return; }

        const gridItem = document.createElement("div");
        gridItem.classList.add("movie-item");
        gridElm.appendChild(gridItem);
        
        gridItem.style.height = `${gridItem.offsetHeight*(score/10)}px`;
    });

};