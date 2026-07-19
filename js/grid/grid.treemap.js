import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7/+esm';
import { gridElm } from "../general/elements.js";
import { clearGrid } from "./grid.utility.js";
import { mouseOutOfElement } from '../general/reuse.js';
import { debounce } from '../filter/person.filter.js';

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
        removeItemPanels(targetItem);
        targetItem = null;
      }
    }

    // Remove Hover From Previous Tile
    if (!targetItem) {
      const activeItem = gridElm.querySelector(".movie-item.is-hovered");
      if (activeItem) {
        activeItem.classList.remove("is-hovered");
        removeItemPanels(activeItem);
      }
      return;
    }

    // Hover New Tile
    if (!targetItem.classList.contains("is-hovered")) {
      
      const activeItem = gridElm.querySelector(".treemap-item.is-hovered");
      if (activeItem) activeItem.classList.remove("is-hovered");

      targetItem.classList.add("is-hovered");

      // Stores init image size if not added
      if (!targetItem.dataset.initImageWidth) {
        targetItem.dataset.initImageWidth = targetItem.querySelector("img").getBoundingClientRect().width;
        console.log(targetItem.dataset.initImageWidth);
      }

      debouncedAddPanels(targetItem); // Adds info panels if staying on movie
    }
};

function displayExitTM(event) {
    // Removes Hovered Item When Leaving Display
    const activeItem = gridElm.querySelector(".movie-item.is-hovered");
    if (activeItem) {
      activeItem.classList.remove("is-hovered");
      removeItemPanels(activeItem);
    }
};

const debouncedAddPanels = debounce((targetItem) => {
  if (!targetItem || !targetItem.classList.contains("is-hovered")) return;
  addItemPanels(targetItem);
}, 300);  // ms wait to see if element is still hovered

function addItemPanels(target) {
  
  const img = target.querySelector("img");
  const panels = target.querySelectorAll(".movie-panel");
  if (!img || panels.length === 0) return;

  const panelScale = 1.4;   // Scale that matches what is in CSS

  const imgRect = img.getBoundingClientRect();
  const containerRect = target.getBoundingClientRect();
  const borderWidth = parseInt(getComputedStyle(img).borderTopWidth) * panelScale || 0;
  const initImageWidth = parseFloat(target.dataset.initImageWidth);

  const topShift = (imgRect.top - containerRect.top) / panelScale; 
  const bottomShift = (imgRect.bottom - containerRect.bottom) / panelScale;

  panels.forEach(panel => {
    panel.style.width = `${initImageWidth}px`;

    if (panel.classList.contains("panel-top")) {
      panel.style.transform = `translateX(-50%) scale3d(${panelScale}, ${panelScale}, 1) translateY(${topShift - (panel.clientHeight / panelScale) - borderWidth}px)`;
    } else if (panel.classList.contains("panel-bottom")) {
      panel.style.transform = `translateX(-50%) scale3d(${panelScale}, ${panelScale}, 1) translateY(${bottomShift + (panel.clientHeight / panelScale) + borderWidth}px)`;
    }
  });
};

function removeItemPanels(target) {
  const panels = target.querySelectorAll(".movie-panel");
  if (panels.length === 0) return;

  panels.forEach(panel => {
    panel.style.transform = "";
    panel.style.width = "";
    panel.style.left = "";
  });
};

// TODO: Should link certiain css variables to the JS for easier editing
// TODO: Need to edit styling visual on panels

export { createTreeMap, handleHoverTM, displayExitTM }