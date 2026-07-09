import { TMDB_API_KEY } from "./config/config.js";
import { personElm, gridElm } from "./general/elements.js";

async function extractFormData(scaledEvent) {
    
    const event = scaledEvent.event;
    let personSelected = scaledEvent.personSelected;

    event.preventDefault(); // STOP PAGE REFRESH

    if(!personSelected) { 
        return;
    };

    const movies = await fetchMovieScores(personSelected);
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
        return topPerson.id;
    }
    catch (error) {
        console.error("Error fetching persons details:", error);
    }
};

async function fetchMovieScores(personSelected) {

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

    return personsFilms;
};

async function generateGridElements(movies) {
    console.log(movies);

    while (gridElm.firstChild) {
        gridElm.removeChild(gridElm.firstChild);
    }   

    // TODO: DOES NOT GENERATE ENOUGH ELEMENTS
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

export { extractFormData }