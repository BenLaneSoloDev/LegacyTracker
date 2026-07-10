import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7/+esm';
import { gridElm } from "../general/elements.js";
import { clearGrid } from "./grid.utility.js";

function createTreeMap(movies, w = 900, h = 600) {

    gridElm.style.width = `${w}px`;
    gridElm.style.height = `${h}px`;
    clearGrid();

    // Create root parent
    const treeStructure = {
        name: "Filmography",
        children: movies
    }

    // Form node tree
    const root = d3.hierarchy(treeStructure)
    // Scale block based on TMDB score
    .sum(d => d.vote_average || d.score)
    // Sorts biggest scores to lowest (could toggle)
    .sort((a, b) => b.value - a.value)
    ;

    // Initialise Packing Rules
    d3.treemap().size([w, h]).padding(2.5).tile(d3.treemapSquarify.ratio(0.666666))(root);

    // Unpack coordinates and place elements
    root.leaves().forEach(movie => {
        const poster = document.createElement("div");
        poster.classList.add("movie-item", "treemap");
        
        const width = movie.x1 - movie.x0;
        const height = movie.y1 - movie.y0;

        poster.style.left = `${movie.x0}px`;
        poster.style.top = `${movie.y0}px`;
        poster.style.width = `${width}px`;
        poster.style.height = `${height}px`;

        const posterURL = `https://image.tmdb.org/t/p/original/${movie.data.poster_path}`;
        if(movie.data.poster_path) { 
            poster.style.backgroundImage = `url(${posterURL})`;
        } else {
            poster.style.backgroundColor = "white";
        }

        poster.title = movie.data.title;
        
        gridElm.appendChild(poster);
    });
};

// TODO: ADD HOVER EVENT WITH POP UP POSTER 
// TODO: ADD TOP AND BOTTOM BAR WITH TITLE AND SCORE (TITLE ABOVE, SCORE BELOW)

export { createTreeMap }