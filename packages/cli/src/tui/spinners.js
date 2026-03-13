// Spinner animation frames
const spinnerFrames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];

let currentFrame = 0;

export function getSpinner() {
  const frame = spinnerFrames[currentFrame % spinnerFrames.length];
  currentFrame++;
  return frame;
}

export function resetSpinner() {
  currentFrame = 0;
}

export function animateSpinner(text) {
  return `${getSpinner()} ${text}`;
}
