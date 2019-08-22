import { combineReducers } from 'redux';
import { CLEAR_CANVAS, CHANGE_COLOR, FILL_PIXEL } from '../actions';
import { NUM_ROWS } from '../../util/constants';
import { perlerColors } from '../../util/colors';

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
      const nextState = [...state];
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

export default combineReducers({
  canvas,
  color,
});
