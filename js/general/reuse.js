function showElement(element, visible) {
    element.style.display = visible ? "block" : "none";
};

function mouseOutOfElement(element, mouseEvent) {
    const rect = element.getBoundingClientRect();
    
    const isOutsideBaseBounds = 
        mouseEvent.clientX < rect.left || 
        mouseEvent.clientX > (rect.left + element.offsetWidth) || 
        mouseEvent.clientY < rect.top || 
        mouseEvent.clientY > (rect.top + element.offsetHeight);

    return isOutsideBaseBounds;
}

export { showElement, mouseOutOfElement }