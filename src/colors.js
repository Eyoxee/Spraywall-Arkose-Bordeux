export const HOLD_STATE_COLORS = {
  none: "transparent",
  foot: "yellow",
  hand: "blue",
  start: "green",
  finish: "red"
};

export function arkoseColor(color) {
  return {
    jaune: "#FFD800",
    vert: "#00C853",
    bleu: "#2979FF",
    rouge: "#D50000",
    noir: "#000000",
    violet: "#AA00FF"
  }[color];
}
