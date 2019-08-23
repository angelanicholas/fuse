import { combineReducers } from 'redux';
import undoable, { excludeAction } from 'redux-undo';
import { GRID_TYPES, NUM_ROWS } from '../../util/constants';
import { perlerColors } from '../../util/colors';
import cloneDeep from 'lodash/cloneDeep';
import {
  CLEAR_CANVAS,
  CHANGE_COLOR,
  CHANGE_GRID_TYPE,
  FILL_PIXEL,
} from '../actions';

function newCanvas() {
  return new Array(NUM_ROWS).fill(0).map(() => new Array(NUM_ROWS).fill(null));
}

const initialCanvasState = newCanvas();
function canvas(state = initialCanvasState, action) {
  switch (action.type) {
    case CLEAR_CANVAS:
      return newCanvas();
    case FILL_PIXEL:
      const { row, col, fill } = action;
      const nextState = cloneDeep(state);
      nextState[row][col] = fill;
      return nextState;
    default:
      return state;
  }
};

const initialColorState = perlerColors[0];
function color(state = initialColorState, action) {
  switch (action.type) {
    case CHANGE_COLOR:
      return action.color;
    default:
      return state;
  }
};

const initialGridTypeState = GRID_TYPES.pegs;
function gridType(state = initialGridTypeState, action) {
  switch (action.type) {
    case CHANGE_GRID_TYPE:
      return action.gridType;
    default:
      return state;
  }
};

export default combineReducers({
  canvas: undoable(canvas, {
    filter: excludeAction([
      CHANGE_COLOR,
      CHANGE_GRID_TYPE,
    ]),
  }),
  color,
  gridType,
});
