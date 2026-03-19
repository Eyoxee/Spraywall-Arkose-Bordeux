export function createBlocController({
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
}) {
  let currentBloc = null;
  let currentBlocOwner = null;
  let isCreatingNew = false;

  function setDeleteVisible(isVisible) {
    dom.deleteBloc.style.display = isVisible ? "block" : "none";
  }

  function setSaveVisible(isVisible) {
    dom.saveBloc.style.display = isVisible ? "block" : "none";
  }

  function setNewBlocVisible(isVisible) {
    dom.newBloc.style.display = isVisible ? "block" : "none";
  }

  function setToggleFinishVisible(isVisible) {
    dom.toggleFinish.style.display = isVisible ? "inline-block" : "none";
  }

  function syncControls() {
    const user = auth.currentUser;
    const viewingExisting = Boolean(currentBloc) && !isCreatingNew;
    const creatingNew = isCreatingNew;

    // Spec:
    // - Save only when creating a new bloc
    // - New bloc + finish toggle only when connected AND viewing an existing bloc
    setSaveVisible(Boolean(user) && creatingNew);
    setNewBlocVisible(Boolean(user) && viewingExisting);
    setToggleFinishVisible(Boolean(user) && viewingExisting);

    // Delete stays owner-only and only on an existing bloc
    setDeleteVisible(Boolean(user) && viewingExisting && user.uid === currentBlocOwner);

    // Holds should only be editable while creating a new bloc
    board.setEditable?.(Boolean(user) && creatingNew);
  }

  function getActiveColors() {
    return dom.filters.filter((cb) => cb.checked).map((cb) => cb.value);
  }

  async function saveBloc() {
    const user = auth.currentUser;
    if (!user) {
      alert("Tu dois être connecté pour enregistrer un bloc.");
      return;
    }

    if (!isCreatingNew) {
      alert("Pour enregistrer, crée un nouveau bloc.");
      return;
    }

    const name = dom.blocName.value.trim();
    if (!name) {
      alert("Donne un nom au bloc.");
      return;
    }

    const existingSnap = await getDoc(doc(db, "blocs", name));
    if (existingSnap.exists()) {
      alert("Ce nom est déjà utilisé. Choisis un autre nom.");
      return;
    }

    const bloc = {
      name,
      grade: {
        color: dom.blocGradeColor.value,
        bars: parseInt(dom.blocGradeBars.value, 10)
      },
      desc: dom.blocDesc.value,
      holds: holds.map((h) => ({ id: h.id, state: h.state })),
      owner: user.uid
    };

    await setDoc(doc(collection(db, "blocs"), bloc.name), bloc);
    isCreatingNew = false;
    currentBloc = bloc.name;
    currentBlocOwner = bloc.owner;
    await loadBloc(bloc.name);
    await loadBlocs();
  }

  async function loadBlocs() {
    dom.blocList.innerHTML = "";

    let snap;
    try {
      snap = await getDocs(collection(db, "blocs"));
    } catch (e) {
      dom.blocList.innerHTML = "<li>Impossible de charger les blocs.</li>";
      return;
    }

    const blocs = [];
    snap.forEach((docSnap) => blocs.push(docSnap.data()));

    const activeColors = getActiveColors();
    const filtered = blocs.filter((b) => activeColors.includes(b.grade.color));

    for (const b of filtered) {
      const li = document.createElement("li");
      li.innerHTML = `
        <span class="bloc-name">${b.name}</span>
        <span class="bloc-grade" style="color:${arkoseColor(b.grade.color)};">
          ${"▮".repeat(b.grade.bars)}
        </span>
      `;
      li.onclick = () => loadBloc(b.name);
      dom.blocList.appendChild(li);
    }
  }

  async function loadBloc(name) {
    const ref = doc(db, "blocs", name);
    const snap = await getDoc(ref);
    if (!snap.exists()) return;

    const bloc = snap.data();
    currentBloc = name;
    currentBlocOwner = bloc.owner || null;
    isCreatingNew = false;

    dom.blocName.value = bloc.name;
    dom.blocGradeColor.value = bloc.grade.color;
    dom.blocGradeBars.value = String(bloc.grade.bars);
    dom.blocDesc.value = bloc.desc;

    for (const h of holds) {
      const saved = bloc.holds.find((s) => s.id === h.id);
      h.state = saved ? saved.state : "none";
    }

    if (bloc.owner) {
      const ownerSnap = await getDoc(doc(db, "users", bloc.owner));
      const ownerPseudo = ownerSnap.exists() ? ownerSnap.data().pseudo : "Inconnu";
      dom.blocOwner.textContent = `Ouvert par ${ownerPseudo}`;
    } else {
      dom.blocOwner.textContent = "";
    }

    const finishers = bloc.finishers || [];
    const user = auth.currentUser;

    dom.finishCount.textContent = `${finishers.length} grimpeur(s) ont fini ce bloc`;

    if (user) {
      dom.toggleFinish.textContent = finishers.includes(user.uid) ? "☒" : "☑";
    } else {
      dom.toggleFinish.textContent = "☑";
    }

    syncControls();

    board.render();
  }

  function newBloc() {
    const user = auth.currentUser;
    if (!user) {
      alert("Connecte-toi pour créer un nouveau bloc.");
      return;
    }

    for (const h of holds) h.state = "none";
    board.render();

    currentBloc = null;
    currentBlocOwner = null;
    isCreatingNew = true;

    dom.blocName.value = "";
    dom.blocDesc.value = "";
    dom.blocGradeColor.value = "jaune";
    dom.blocGradeBars.value = "1";
    dom.blocOwner.textContent = "";
    dom.finishCount.textContent = "";
    dom.toggleFinish.textContent = "☑";

    syncControls();
  }

  async function toggleFinish() {
    const user = auth.currentUser;
    if (!user) return alert("Connecte-toi pour valider un bloc.");
    if (!currentBloc) return;

    const ref = doc(db, "blocs", currentBloc);
    const snap = await getDoc(ref);
    if (!snap.exists()) return;

    const bloc = snap.data();
    bloc.finishers = bloc.finishers || [];

    if (bloc.finishers.includes(user.uid)) {
      bloc.finishers = bloc.finishers.filter((uid) => uid !== user.uid);
    } else {
      bloc.finishers.push(user.uid);
    }

    await setDoc(ref, bloc);
    await loadBloc(currentBloc);
  }

  async function deleteCurrentBloc() {
    const user = auth.currentUser;
    if (!user) {
      alert("Tu dois être connecté pour supprimer un bloc.");
      return;
    }
    if (user.uid !== currentBlocOwner) {
      alert("Tu ne peux pas supprimer un bloc qui ne t'appartient pas.");
      return;
    }

    await deleteDoc(doc(db, "blocs", currentBloc));
    currentBloc = null;
    currentBlocOwner = null;
    isCreatingNew = false;
    setDeleteVisible(false);
    syncControls();
    await loadBlocs();
  }

  function onLogout() {
    currentBloc = null;
    currentBlocOwner = null;
    isCreatingNew = false;
    setDeleteVisible(false);
    setSaveVisible(false);
    dom.blocOwner.textContent = "";
    dom.finishCount.textContent = "";
    dom.toggleFinish.textContent = "☑";
    syncControls();
  }

  async function onAuthChanged(user) {
    if (!user) {
      // When logging out, exit creation mode
      isCreatingNew = false;
    }

    syncControls();

    // If a bloc is already loaded, refresh UI (finish checkbox state)
    if (currentBloc && !isCreatingNew) {
      await loadBloc(currentBloc);
    }
  }

  // Wire UI
  dom.saveBloc.onclick = saveBloc;
  dom.newBloc.onclick = newBloc;
  dom.deleteBloc.onclick = deleteCurrentBloc;
  dom.toggleFinish.onclick = toggleFinish;
  for (const cb of dom.filters) cb.onchange = () => loadBlocs();

  // Default hidden/visible state on boot
  setSaveVisible(false);
  setNewBlocVisible(false);
  setToggleFinishVisible(false);

  return {
    loadBlocs,
    loadBloc,
    newBloc,
    onLogout,
    onAuthChanged
  };
}
