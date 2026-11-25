// Input: one job — keyboard + mouse, turned into a plain action object the
// world reads. No game rules here.
export const ACTION_CONFIRM = 'confirm';
export const ACTION_PAUSE = 'pause';
export const ACTION_MUTE = 'mute';
export const ACTION_START = 'start';

const KEYMAP = {
  ArrowUp: 'up', KeyW: 'up',
  ArrowDown: 'down', KeyS: 'down',
  ArrowLeft: 'left', KeyA: 'left',
  ArrowRight: 'right', KeyD: 'right',
  KeyE: ACTION_CONFIRM, Space: ACTION_CONFIRM, Enter: ACTION_START,
  KeyP: ACTION_PAUSE, Escape: ACTION_PAUSE,
  KeyM: ACTION_MUTE,
};

export function createInput(canvas) {
  const held = new Set();
  const pressed = new Set();
  let click = null;

  function onKeyDown(event) {
    const action = KEYMAP[event.code];
    if (!action) return;
    event.preventDefault();
    if (!event.repeat) pressed.add(action);
    held.add(action);
  }
  function onKeyUp(event) {
    held.delete(KEYMAP[event.code]);
  }
  function onMouseDown(event) {
    const rect = canvas.getBoundingClientRect();
    click = {
      x: ((event.clientX - rect.left) / rect.width) * canvas.width,
      y: ((event.clientY - rect.top) / rect.height) * canvas.height,
    };
  }
  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  canvas.addEventListener('mousedown', onMouseDown);

  return {
    // Direction held this frame, as {x, y} in -1..1.
    move() {
      return {
        x: (held.has('right') ? 1 : 0) - (held.has('left') ? 1 : 0),
        y: (held.has('down') ? 1 : 0) - (held.has('up') ? 1 : 0),
      };
    },
    // Actions pressed since the last read; each fires once.
    takePressed() {
      const out = new Set(pressed);
      pressed.clear();
      return out;
    },
    // A mouse click since the last read, in canvas pixels, or null.
    takeClick() {
      const out = click;
      click = null;
      return out;
    },
  };
}
