import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7/+esm';
import { gridElm } from "../general/elements.js";
import { clearGrid } from "./grid.utility.js";
import { mouseOutOfElement } from '../general/reuse.js';

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
    .sum(d => Math.pow(d.vote_average, 2 * d.vote_average / 10) || Math.pow(d.score, 2 * d.score / 10) || 0)
    // Sorts biggest scores to lowest (could toggle)
    .sort((a, b) => b.value - a.value)
    ;

    // Initialise Packing Rules
    d3.treemap().size([w, h]).padding(5).tile(d3.treemapSquarify.ratio(0.666666))(root);

    // Unpack coordinates and place elements
    root.leaves().forEach(movie => {
        const posterElm = document.createElement("div"); // Creates movie item
        posterElm.classList.add("movie-item", "treemap");
        
        const width = movie.x1 - movie.x0;
        const height = movie.y1 - movie.y0;
        posterElm.style.left = `${movie.x0}px`;
        posterElm.style.top = `${movie.y0}px`;
        posterElm.style.width = `${width}px`;
        posterElm.style.height = `${height}px`;

        const poster = document.createElement("img"); // Creates poster for movie item
        posterElm.setAttribute("data-title", movie.data.title);
        const posterURL = `https://image.tmdb.org/t/p/w500/${movie.data.poster_path}`;
        if(movie.data.poster_path) { 
            poster.src = posterURL;
        } else {
            poster.style.backgroundColor = "white";
        }
        
        posterElm.appendChild(poster);
        gridElm.appendChild(posterElm);
    });
};

function handleHoverTM(event) {
    const elements = document.elementsFromPoint(event.clientX, event.clientY);
    
    // Find Tile Under Mouse
    let targetItem = null;
    for (const el of elements) {
        const item = el.closest(".movie-item");
        if (item) {
        targetItem = item;
        break; 
        }
    }

    // Remove Item From Target (as its out of parent bounds)
    if (targetItem) {
        if (mouseOutOfElement(targetItem, event)) {
            targetItem = null;
        }
    }

    // Remove Hover From Previous Tile
    if (!targetItem) {
        const activeItem = gridElm.querySelector(".movie-item.is-hovered");
        if (activeItem) activeItem.classList.remove("is-hovered");
        return;
    }

    // Hover New Tile
    if (!targetItem.classList.contains("is-hovered")) {
        
        const activeItem = gridElm.querySelector(".treemap-item.is-hovered");
        if (activeItem) activeItem.classList.remove("is-hovered");
        
        targetItem.classList.add("is-hovered");
    }
};

function displayExitTM(event) {
    // Removes Hovered Item When Leaving Display
    const activeItem = gridElm.querySelector(".movie-item.is-hovered");
    if (activeItem) activeItem.classList.remove("is-hovered");
};

// TODO: ADD TOP AND BOTTOM BAR WITH TITLE AND SCORE (TITLE ABOVE, SCORE BELOW)

export { createTreeMap, handleHoverTM, displayExitTM }