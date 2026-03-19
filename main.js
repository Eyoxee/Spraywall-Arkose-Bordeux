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
  dom.svg.setAttribute("viewBox", `0 0 ${img.naturalWidth} ${img.naturalHeight}`);
  dom.svg.setAttribute("preserveAspectRatio", "none");
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
  holdStateColors: HOLD_STATE_COLORS
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
