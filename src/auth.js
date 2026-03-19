export function setupAuth({
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
  onUserChanged
}) {
  function closeModals() {
    dom.signupModal.classList.add("hidden");
    dom.loginModal.classList.add("hidden");
    document.body.classList.remove("overlay-active");
  }

  function openSignupModal() {
    dom.signupModal.classList.remove("hidden");
    document.body.classList.add("overlay-active");
    dom.authPseudo.focus();
  }

  function openLoginModal() {
    dom.loginModal.classList.remove("hidden");
    document.body.classList.add("overlay-active");
    dom.authLoginEmail.focus();
  }

  dom.authOpenSignup.onclick = openSignupModal;
  dom.authOpenLogin.onclick = openLoginModal;
  dom.signupClose.onclick = closeModals;
  dom.loginClose.onclick = closeModals;

  // Close when clicking outside the modal content
  dom.signupModal.addEventListener("click", (e) => {
    if (e.target === dom.signupModal) closeModals();
  });
  dom.loginModal.addEventListener("click", (e) => {
    if (e.target === dom.loginModal) closeModals();
  });

  dom.authGoogle.onclick = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const cred = await signInWithPopup(auth, provider);
      const user = cred.user;

      const ref = doc(db, "users", user.uid);
      const snap = await getDoc(ref);

      if (!snap.exists()) {
        const pseudo = prompt("Choisis un pseudo :");
        await setDoc(ref, {
          pseudo: pseudo || user.displayName || "Anonyme"
        });
      }
    } catch (e) {
      dom.authStatus.textContent = e?.message || String(e);
    }
  };

  dom.authSignup.onclick = async () => {
    try {
      const cred = await createUserWithEmailAndPassword(auth, dom.authEmail.value, dom.authPassword.value);
      const user = cred.user;

      await setDoc(doc(db, "users", user.uid), {
        pseudo: dom.authPseudo.value || "Anonyme"
      });

      dom.authPassword.value = "";
      closeModals();
    } catch (e) {
      dom.authStatus.textContent = e?.message || String(e);
    }
  };

  dom.authLogin.onclick = async () => {
    try {
      await signInWithEmailAndPassword(auth, dom.authLoginEmail.value, dom.authLoginPassword.value);
      dom.authLoginPassword.value = "";
      closeModals();
    } catch (e) {
      dom.authStatus.textContent = e?.message || String(e);
    }
  };

  dom.authLogout.onclick = async () => {
    await signOut(auth);
  };

  onAuthStateChanged(auth, async (user) => {
    if (user) {
      const snap = await getDoc(doc(db, "users", user.uid));
      const pseudo = snap.exists() ? snap.data().pseudo : "Anonyme";

      dom.authStatus.textContent = `Connecté en tant que ${pseudo}`;
      dom.authLogout.style.display = "inline-block";
      dom.authOpenLogin.style.display = "none";
      dom.authOpenSignup.style.display = "none";
      dom.authGoogle.style.display = "none";

      await onUserChanged?.(user, { pseudo });
      return;
    }

    dom.authStatus.textContent = "Non connecté";
    dom.authLogout.style.display = "none";
    dom.authOpenLogin.style.display = "inline-block";
    dom.authOpenSignup.style.display = "inline-block";
    dom.authGoogle.style.display = "inline-block";

    await onUserChanged?.(null);
  });
}
