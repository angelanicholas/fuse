export const BUCKET_FILL = 'BUCKET_FILL';
export const CHANGE_COLOR = 'CHANGE_COLOR';
export const CHANGE_GRID_TYPE = 'CHANGE_GRID_TYPE';
export const CHANGE_TOOL_TYPE = 'CHANGE_TOOL_TYPE';
export const CLEAR_CANVAS = 'CLEAR_CANVAS';
export const FILL_PIXEL = 'FILL_PIXEL';
export const FILL_RECTANGLE = 'FILL_RECTANGLE';

export const bucketFill = (row, col, fill) => ({
  type: BUCKET_FILL,
  row,
  col,
  fill,
});

export const changeColor = (color) => ({
  type: CHANGE_COLOR,
  color,
});

export const changeGridType = (gridType) => ({
  type: CHANGE_GRID_TYPE,
  gridType,
});

export const changeToolType = (toolType) => ({
  type: CHANGE_TOOL_TYPE,
  toolType,
});

export const clearCanvas = () => ({
  type: CLEAR_CANVAS,
});

export const fillPixel = (row, col, fill) => ({
  type: FILL_PIXEL,
  row,
  col,
  fill,
});

export const fillRectangle = (
  rowStart,
  rowEnd,
  colStart,
  colEnd,
  fill,
) => {
  return {
    type: FILL_RECTANGLE,
    colEnd,
    colStart,
    fill,
    rowEnd,
    rowStart,
  };
};
