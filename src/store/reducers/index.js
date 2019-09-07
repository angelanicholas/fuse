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
} from '../actions';

function newCanvas() {
  return new Array(NUM_ROWS).fill(0).map(() => new Array(NUM_ROWS).fill(null));
}

const initialCanvasState = newCanvas();
function canvas(state = initialCanvasState, action) {
  switch (action.type) {
    case CLEAR_CANVAS:
      return newCanvas();
    case FILL_PIXEL: {
      const { row, col, fill } = action;
      const nextState = cloneDeep(state);
      nextState[row][col] = fill;
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
      return nextState;
    }
    case BUCKET_FILL: {
      const { row, col, fill } = action;
      const nextState = cloneDeep(state);
      return bucketFill(nextState, row, col, fill);
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

const initialToolTypeState = TOOL_TYPES.pencil;
function toolType(state = initialToolTypeState, action) {
  switch (action.type) {
    case CHANGE_TOOL_TYPE:
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
      BUCKET_FILL,
      FILL_PIXEL,
      FILL_RECTANGLE,
    ])
  }),
  color,
  gridType,
  toolType,
});
