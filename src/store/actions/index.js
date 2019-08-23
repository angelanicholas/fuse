export const CHANGE_COLOR = 'CHANGE_COLOR';
export const CHANGE_GRID_TYPE = 'CHANGE_GRID_TYPE';
export const CLEAR_CANVAS = 'CLEAR_CANVAS';
export const FILL_PIXEL = 'FILL_PIXEL';

export const changeColor = (color) => ({
  type: CHANGE_COLOR,
  color,
});

export const changeGridType = (gridType) => ({
  type: CHANGE_GRID_TYPE,
  gridType,
});


export const clearCanvas = () => ({
  type: CLEAR_CANVAS,
});

export const fillPixel = (row, col, fill) => {
  return {
    type: FILL_PIXEL,
    row,
    col,
    fill,
  };
};
