import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7/+esm';
import { gridElm } from "../general/elements.js";
import { clearGrid } from "./grid.utility.js";
import { mouseOutOfElement } from '../general/reuse.js';

function createTreeMap(movies) {

    let endWidth = 900;
    let endHeight = 600;
    const movieCap = 25;

    // ADJUSTS WITH EXPONENTIALLY BASED ON MOVIE COUNT (1 - 25)
    const movieTotal = Math.max(1, Math.min(movieCap, movies.length));

    const curveScale = d3.scalePow()  // Sets Logirthmic scale, ease out
      .exponent(0.5) 
      .domain([1, 25]);

    const widthScale = curveScale.copy()
      .range([100, endWidth]);

    const heightScale = curveScale.copy()
      .range([100, endHeight]);

    const calculatedWidth = widthScale(movieTotal);
    const calculatedHeight = heightScale(movieTotal);

    gridElm.style.width = `${calculatedWidth}px`;
    gridElm.style.height = `${calculatedHeight}px`;
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
    d3.treemap().size([calculatedWidth, calculatedHeight]).padding(5).tile(d3.treemapSquarify.ratio(0.666666))(root);

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

        // Create Title Panel
        const titlePanel = document.createElement("div");
        titlePanel.classList.add("movie-panel", "panel-top");
        titlePanel.textContent = movie.data.title;

        // Create Poster Image
        const poster = document.createElement("img"); // Creates poster for movie item
        posterElm.setAttribute("data-title", movie.data.title);
        const posterURL = `https://image.tmdb.org/t/p/w500/${movie.data.poster_path}`;
        if(movie.data.poster_path) { 
            poster.src = posterURL;
        } else {
            poster.style.backgroundColor = "white";
        }

        // Create Score Panel
        const scorePanel = document.createElement("div");
        scorePanel.classList.add("movie-panel", "panel-bottom");
        const score = movie.data.vote_average || movie.data.score || 0;
        scorePanel.textContent = `${score * 10}%`;

        // Add to parent
        posterElm.appendChild(titlePanel);
        posterElm.appendChild(poster);
        posterElm.appendChild(scorePanel);

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

        // Doesnt add panels until image is fully expanded
        const panelAnimSpeed = 200; // in ms
        setTimeout(() => {
            const img = targetItem.querySelector("img");
            const panels = targetItem.querySelectorAll(".movie-panel");
            if (!img || panels.length === 0) return;

            const imgRect = img.getBoundingClientRect();
            const containerRect = targetItem.getBoundingClientRect();

            // 1. Exactly match the image's current pixel width
            const currentWidth = imgRect.width;
            
            // 2. Calculate horizontal shift to center the panels over the scaled image
            const leftOffset = imgRect.left - containerRect.left;

            // 3. Find exactly how far out the top and bottom edges have expanded
            const topShift = imgRect.top - containerRect.top;       // Negative value (e.g., -30px)
            const bottomShift = imgRect.bottom - containerRect.bottom; // Positive value (e.g., 30px)

            const borderWidth = parseInt(getComputedStyle(img).borderTopWidth) || 0;

            panels.forEach(panel => {
                panel.style.width = `${currentWidth}px`;
                panel.style.left = `${leftOffset}px`;

                if (panel.classList.contains("panel-top")) {
                    // Push the top panel UP to match the top of the image
                    panel.style.transform = `translateY(${topShift - panel.clientHeight + borderWidth}px)`;
                } else if (panel.classList.contains("panel-bottom")) {
                    // Push the bottom panel DOWN to match the bottom of the image
                    panel.style.transform = `translateY(${bottomShift + panel.clientHeight - borderWidth}px)`;
                }
            });
        }, panelAnimSpeed); // This duration matched the image transition duration
    }
};

function displayExitTM(event) {
    // Removes Hovered Item When Leaving Display
    const activeItem = gridElm.querySelector(".movie-item.is-hovered");
    if (activeItem) activeItem.classList.remove("is-hovered");
};

// TODO: ADD TOP AND BOTTOM BAR WITH TITLE AND SCORE (TITLE ABOVE, SCORE BELOW)

export { createTreeMap, handleHoverTM, displayExitTM }