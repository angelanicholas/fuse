export const CLEAR_CANVAS = 'CLEAR_CANVAS';
export const FILL_PIXEL = 'FILL_PIXEL';
export const CHANGE_COLOR = 'CHANGE_COLOR';

export const changeColor = (color) => ({
  type: CHANGE_COLOR,
  color,
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
