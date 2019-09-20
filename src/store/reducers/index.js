import { combineReducers } from 'redux';
import undoable, { excludeAction, groupByActionTypes } from 'redux-undo';
import { GRID_TYPES, NUM_ROWS, TOOL_TYPES } from '../../util/constants';
import { bucketFill } from '../../util/canvas';
import { perlerColors } from '../../util/colors';
import cloneDeep from 'lodash/cloneDeep';
import cuid from 'cuid';
import {
  BUCKET_FILL,
  CLEAR_CANVAS,
  CHANGE_COLOR,
  CHANGE_GRID_TYPE,
  CHANGE_TOOL_TYPE,
  FILL_PIXEL,
  FILL_RECTANGLE,
  SHIFT_CANVAS,
} from '../actions';

function newCanvas() {
  return new Array(NUM_ROWS).fill(0).map(() => new Array(NUM_ROWS).fill(null));
}

const initialCanvasState = newCanvas();
function canvas(state = initialCanvasState, action) {
  switch (action.type) {
    case CLEAR_CANVAS:
      const nextState = newCanvas();
      sessionStorage.setItem('canvas', JSON.stringify(nextState));
      return nextState;
    case FILL_PIXEL: {
      const { row, col, fill, shouldStoreInSession } = action;
      const nextState = cloneDeep(state);
      nextState[row][col] = fill;
      if (shouldStoreInSession) {
        sessionStorage.setItem('canvas', JSON.stringify(nextState));
      }
      return nextState;
    }
    case FILL_RECTANGLE: {
      const { colEnd, colStart, fill, rowEnd, rowStart } = action;
      const nextState = cloneDeep(state);
      for (let row = rowStart; row <= rowEnd; row += 1) {
        for (let col = colStart; col <= colEnd; col += 1) {
          nextState[row][col] = fill;
        }
      }
      sessionStorage.setItem('canvas', JSON.stringify(nextState));
      return nextState;
    }
    case BUCKET_FILL: {
      const { row, col, fill } = action;
      const nextState = bucketFill(cloneDeep(state), row, col, fill);
      sessionStorage.setItem('canvas', JSON.stringify(nextState));
      return nextState;
    }
    case SHIFT_CANVAS: {
      let { x, y } = action;
      const nextState = cloneDeep(state);
      while (x > 0) {
        nextState.forEach((row) => {
          row.pop();
          row.unshift(null);
        });
        x--;
      }
      while (x < 0) {
        nextState.forEach((row) => {
          row.shift();
          row.push(null);
        });
        x++;
      }
      while (y > 0) {
        nextState.unshift(nextState.pop().map(() => null));
        y--;
      }
      while (y < 0) {
        nextState.push(nextState.shift().map(() => null));
        y++;
      }
      sessionStorage.setItem('canvas', JSON.stringify(nextState));
      return nextState;
    }
    default: {
      return state;
    }
  }
};

const initialColorState = perlerColors[0];
function color(state = initialColorState, action) {
  switch (action.type) {
    case CHANGE_COLOR:
      sessionStorage.setItem('color', JSON.stringify(action.color));
      return action.color;
    default:
      return state;
  }
};

const initialGridTypeState = GRID_TYPES.tiled;
function gridType(state = initialGridTypeState, action) {
  switch (action.type) {
    case CHANGE_GRID_TYPE:
      sessionStorage.setItem('gridType', action.gridType);
      return action.gridType;
    default:
      return state;
  }
};

const initialToolTypeState = TOOL_TYPES.pencil;
function toolType(state = initialToolTypeState, action) {
  switch (action.type) {
    case CHANGE_TOOL_TYPE:
      sessionStorage.setItem('toolType', action.toolType);
      return action.toolType;
    default:
      return state;
  }
};

export const batchGroupBy = {
  _group: null,
  _groupChosen: false,
  start(group = cuid()) {
    this._group = group;
    this._groupChosen = false;
  },
  end() {
    this._group = this._groupChosen ? null : this._group;
  },
  init(rawActions) {
    const defaultGroupBy = groupByActionTypes(rawActions);
    return (action) => {
      this._groupChosen = true;
      return this._group || defaultGroupBy(action);
    };
  },
};

export default combineReducers({
  canvas: undoable(canvas, {
    filter: excludeAction([
      CHANGE_COLOR,
      CHANGE_GRID_TYPE,
      CHANGE_TOOL_TYPE,
    ]),
    groupBy: batchGroupBy.init([
      FILL_PIXEL,
      FILL_RECTANGLE,
      BUCKET_FILL,
      SHIFT_CANVAS,
    ]),
  }),
  color,
  gridType,
  toolType,
});
