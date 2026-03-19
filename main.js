import { holds } from "./app.js";
import { getDom } from "./src/dom.js";
import { HOLD_STATE_COLORS, arkoseColor } from "./src/colors.js";
import {
  db,
  auth,
  collection,
  doc,
  setDoc,
  getDocs,
  getDoc,
  deleteDoc,
  GoogleAuthProvider,
  signInWithPopup,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "./src/firebase.js";
import { createBoardController } from "./src/board.js";
import { createBlocController } from "./src/blocs.js";
import { setupAuth } from "./src/auth.js";

const dom = getDom();

// Keep SVG overlay aligned with the image even when responsive
function syncSvgToImage() {
  const img = dom.boardImg;
  if (!img?.naturalWidth || !img?.naturalHeight) return;

  // Holds coordinates were created against a 900px-wide reference.
  // Keep that coordinate space and derive the height from the image aspect ratio.
  const baseWidth = 900;
  const baseHeight = (baseWidth * img.naturalHeight) / img.naturalWidth;
  dom.svg.setAttribute("viewBox", `0 0 ${baseWidth} ${baseHeight}`);
  dom.svg.setAttribute("preserveAspectRatio", "xMinYMin meet");
}

if (dom.boardImg.complete) {
  syncSvgToImage();
} else {
  dom.boardImg.addEventListener("load", syncSvgToImage, { once: true });
}

for (const h of holds) {
  if (h.state === undefined) h.state = "none";
}

const board = createBoardController({
  svg: dom.svg,
  selector: dom.selector,
  selectorList: dom.selectorList,
  selectorClose: dom.selectorClose,
  stateSelector: dom.stateSelector,
  stateSelectorTitle: dom.stateSelectorTitle,
  stateButtons: dom.stateButtons,
  stateSelectorClose: dom.stateSelectorClose,
  holds,
  holdStateColors: HOLD_STATE_COLORS,
  isEditable: () => false
});

const blocs = createBlocController({
  db,
  auth,
  collection,
  doc,
  setDoc,
  getDocs,
  getDoc,
  deleteDoc,
  holds,
  dom,
  board,
  arkoseColor
});

setupAuth({
  auth,
  db,
  doc,
  getDoc,
  setDoc,
  GoogleAuthProvider,
  signInWithPopup,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  dom,
  onUserChanged: async (user) => {
    await blocs.loadBlocs();
    blocs.onAuthChanged?.(user);
  }
});

board.render();
