export function createBoardController({
  svg,
  selector,
  selectorList,
  selectorClose,
  stateSelector,
  stateSelectorTitle,
  stateButtons,
  stateSelectorClose,
  holds,
  holdStateColors
}) {
  let selectedPoly = null;

  function setOverlayActive(isActive) {
    document.body.classList.toggle("overlay-active", isActive);
  }

  function closeHoldSelector() {
    selector.classList.add("hidden");
    setOverlayActive(false);
  }

  function closeStateSelector() {
    stateSelector.classList.add("hidden");
    setOverlayActive(false);
  }

  function openStateSelectorFor(poly) {
    selectedPoly = poly;
    stateSelectorTitle.textContent = `Prise : ${poly.dataset.id}`;
    stateSelector.classList.remove("hidden");
    setOverlayActive(true);
  }

  function render() {
    svg.innerHTML = "";

    for (const hold of holds) {
      const poly = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
      poly.setAttribute("points", hold.points);
      poly.setAttribute("stroke", holdStateColors[hold.state || "none"]);
      poly.setAttribute("fill", "transparent");
      poly.setAttribute("stroke-width", "3");
      poly.setAttribute("pointer-events", "all");
      poly.dataset.id = hold.id;
      poly.addEventListener("click", handleHoldClick);
      svg.appendChild(poly);
    }
  }

  function handleHoldClick(e) {
    e.stopPropagation();

    const elements = document.elementsFromPoint(e.clientX, e.clientY);
    const clicked = elements.filter((el) => el.tagName === "polygon");
    if (clicked.length === 0) return;

    if (clicked.length === 1) {
      openStateSelectorFor(clicked[0]);
      return;
    }

    selectorList.innerHTML = "";
    for (const poly of clicked) {
      const li = document.createElement("li");
      li.textContent = poly.dataset.id;
      li.onclick = () => {
        selectedPoly = poly;
        closeHoldSelector();
        openStateSelectorFor(poly);
      };
      selectorList.appendChild(li);
    }

    selector.classList.remove("hidden");
    setOverlayActive(true);
  }

  selectorClose.onclick = closeHoldSelector;
  stateSelectorClose.onclick = closeStateSelector;

  for (const btn of stateButtons) {
    btn.onclick = () => {
      if (!selectedPoly) return;
      const id = selectedPoly.dataset.id;
      const hold = holds.find((h) => h.id === id);
      if (!hold) return;

      hold.state = btn.dataset.state;
      selectedPoly.setAttribute("stroke", holdStateColors[hold.state] || holdStateColors.none);
      closeStateSelector();
    };
  }

  return {
    render,
    closeOverlays() {
      closeHoldSelector();
      closeStateSelector();
    }
  };
}
