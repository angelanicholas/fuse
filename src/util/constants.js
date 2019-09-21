export let HEIGHT = window.innerHeight;
export let WIDTH = window.innerWidth;
export const CELL_SIZE = 20;
export const NUM_ROWS = Math.floor(window.innerHeight / CELL_SIZE);
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
