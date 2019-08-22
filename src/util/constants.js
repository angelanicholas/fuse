export let SIZE = 575;
export const NUM_ROWS = 29;
export const CELL_SIZE = Math.floor(SIZE / NUM_ROWS);
SIZE = CELL_SIZE * NUM_ROWS;
export const PEG_SHIFT = 0.5 * CELL_SIZE;
export const BLURRY_LINE_SHIFT = -0.5;
export const GRID_TYPES = { pegs: 'Peg', lines: 'Grid', squares: 'Tile' };
