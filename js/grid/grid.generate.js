import { TMDB_API_KEY } from "../config/config.js";
import { personElm } from "../general/elements.js";
import { displayGridError } from "./grid.utility.js";
import { createTreeMap } from "./grid.treemap.js";

async function createGridFromData(scaledEvent) {
    
    const event = scaledEvent.event;
    let personSelected = scaledEvent.personSelected;

    event.preventDefault(); // STOP PAGE REFRESH

    if(!personSelected) { 
        const errString = "No person selected";
        console.log("ERROR: ", errString);
        displayGridError(errString);
        return;
    };

    const movies = await fetchMovieScores(personSelected);
    generateGridElements(movies);
}

async function fetchPersonID(person) {

    if (!person.trim()) {
        const errString = "No person selected";
        console.log("ERROR: ", errString);
        displayGridError(errString);
        return;
    }

    // Grab the persons ID
    const endpointId = `https://api.themoviedb.org/3/search/person?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(person)}`;

    try {
        const responseId = await fetch(endpointId);

        if (!responseId.ok) {
            const errString = `Could not get network response: ${responseId.status}`
            throw new Error("ERROR: " + errString);
            displayGridError(errString);
        }

        const data = await responseId.json();

        const topPerson = data.results
            .sort((a, b) => b.popularity - a.popularity)
            .slice(0, 1)[0];

        personElm.value = topPerson.name;
        return topPerson.id;
    }
    catch (error) {
        const errString = "Could not fetch the persons data";
        console.error("ERROR: " + errString, error);
        displayGridError(errString);
    }
};

async function fetchMovieScores(personSelected) {

    // Find all movies linked to the person
    const endpointFilms = `https://api.themoviedb.org/3/person/${personSelected}/movie_credits?api_key=${TMDB_API_KEY}`;
    let personsFilms;

    try {
        const responseFilms = await fetch(endpointFilms);

        if (!responseFilms.ok) {
            const errString = `Could not get network response: ${responseFilms.status}`
            throw new Error("ERROR: " + errString);
            displayGridError(errString);
        }

        const data = await responseFilms.json();
        const combinedData = data.cast.concat(data.crew);

        // Filter the data
        const addedMovies = new Set();
        personsFilms = combinedData.filter(entry => {
            if (addedMovies.has(entry.id)) { return false; }                                    // DUPLICATES

            if (entry.media_type && entry.media_type !== "movie") { return false; }             // ONLY MOVIES                                                      // NOT RELEASED OR TOO SMALL

            const genreIds = entry.genre_ids || [];
            if (genreIds.includes(99) || genreIds.includes(10770)) { return false; }            // NO TV MOV / DOCS

            const shortKeywords = /short|music video|video short/i.test(entry.title || '');
            if (shortKeywords) { return false; }                                                // SHORTS / VIDEO

            if (entry.popularity && entry.popularity < 1) { return false; }                     // NOT POPULAR / GHOST PROJECT

            if (entry.job && entry.job !== "Director" && entry.job !== "Writer"
               && entry.job !== "Screenplay" && entry.job !== "Story") { return false; }        // DIRECTOR OR WRITER

            if (entry.video) { return false; }

            const minorRoleKeywords = /cameo|uncredited|himself|herself|special appearance/i
            .test(entry.character || "");
            if (entry.order >= 5 || minorRoleKeywords) { return false; }                         // SMALL ROLE

            if (!entry.release_date || !entry.poster_path) { return false; }                    // NO DISPLAY DATA

            addedMovies.add(entry.id);
            return true;
        });

        // Remove padding small films (relative to creative)
        const highestMovieReviews = Math.max(...personsFilms.map(m => m.vote_count || 0));
        const dynamicReviewFloor = Math.max(50, Math.min(250, highestMovieReviews * 0.02));
        personsFilms = personsFilms.filter(movie => movie.vote_count >= dynamicReviewFloor);
        console.log(personsFilms);
    }
    catch (error) {
        const errString = "Could not fetch the persons movies";
        console.error("ERROR: " + errString, error);
        displayGridError(errString);
    }

    return personsFilms;
};

async function generateGridElements(movies) {
    createTreeMap(movies, 960, 640);
};

export { createGridFromData }