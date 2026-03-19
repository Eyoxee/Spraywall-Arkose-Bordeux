export function getDom() {
  const byId = (id) => {
    const el = document.getElementById(id);
    if (!el) throw new Error(`Missing element #${id}`);
    return el;
  };

  return {
    boardImg: byId("board-img"),
    svg: byId("holds-layer"),
    selector: byId("hold-selector"),
    selectorList: byId("selector-list"),
    selectorClose: byId("selector-close"),

    stateSelector: byId("state-selector"),
    stateSelectorTitle: byId("state-selector-title"),
    stateButtons: Array.from(document.querySelectorAll("#state-buttons button")),
    stateSelectorClose: byId("state-selector-close"),

    blocName: byId("bloc-name"),
    blocGradeColor: byId("bloc-grade-color"),
    blocGradeBars: byId("bloc-grade-bars"),
    blocDesc: byId("bloc-desc"),
    saveBloc: byId("save-bloc"),
    newBloc: byId("new-bloc"),
    toggleFinish: byId("toggle-finish"),
    finishCount: byId("finish-count"),
    deleteBloc: byId("delete-bloc"),
    blocOwner: byId("bloc-owner"),
    blocList: byId("bloc-list"),
    filters: Array.from(document.querySelectorAll("#filters input[type=checkbox]")),

    authGoogle: byId("auth-google"),
    authOpenSignup: byId("auth-open-signup"),
    authOpenLogin: byId("auth-open-login"),
    authLogout: byId("auth-logout"),
    authStatus: byId("auth-status"),

    signupModal: byId("auth-signup-modal"),
    signupClose: byId("auth-signup-close"),
    authPseudo: byId("auth-pseudo"),
    authEmail: byId("auth-email"),
    authPassword: byId("auth-password"),
    authSignup: byId("auth-signup"),

    loginModal: byId("auth-login-modal"),
    loginClose: byId("auth-login-close"),
    authLoginEmail: byId("auth-login-email"),
    authLoginPassword: byId("auth-login-password"),
    authLogin: byId("auth-login")
  };
}
