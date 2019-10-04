export const CELL_SIZE = 20;
export let HEIGHT = Math.floor(window.innerHeight / CELL_SIZE) * CELL_SIZE - CELL_SIZE * 2;
export let WIDTH = Math.floor(window.innerWidth / CELL_SIZE) * CELL_SIZE - CELL_SIZE * 11;
export const NUM_ROWS = Math.floor(WIDTH / CELL_SIZE);
export const NUM_COLS = Math.floor(window.innerWidth / CELL_SIZE);
export const PEG_SHIFT = 0.5 * CELL_SIZE;
export const BLURRY_LINE_SHIFT = -0.5;

export const GRID_TYPES = {
  // pegs: 'Peg',
  tiled: 'Tiled',
  lined: 'Lined',
  noGrid: 'None',
};

export const TOOL_TYPES = {
  pencil: 'Pencil',
  rectangle: 'Rectangle',
  bucket: 'Bucket',
  eyedropper: 'Eyedropper',
  move: 'Move',
 };

 export const COLOR_MODES = {
   day: 'Day',
   night: 'Night',
 };
