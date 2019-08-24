import React, { Component, createRef } from 'react';
import PropTypes from 'prop-types';
import styled, { css } from 'styled-components';
import { connect } from 'react-redux';
import isNull from 'lodash/isNull';
import throttle from 'lodash/throttle';
import { ActionCreators as UndoActionCreators } from 'redux-undo';

import ControlPanel from './controlPanel';
import SummaryPanel from './summaryPanel';
import { colors, gridColors } from '../util/colors';
import { clearCanvas, downloadCanvas } from '../util/canvas';
import { clearCanvas as clearCanvasData, fillPixel } from '../store/actions';
import { batchGroupBy } from '../store/reducers';
import {
  BLURRY_LINE_SHIFT,
  CELL_SIZE,
  GRID_TYPES,
  NUM_ROWS,
  PEG_SHIFT,
  SIZE,
} from '../util/constants';

const isGridLines = props => props.gridType === GRID_TYPES.lines;
const dpi = window.devicePixelRatio;
const canvasProps = {
  height: SIZE * dpi,
  width: SIZE * dpi,
  style: { height: SIZE, width: SIZE },
};

// styled components
const gridLineStyles = css`
  border-left: 0.5px solid ${colors.darkGray};
  border-top: 0.5px solid ${colors.darkGray};
`;
const Container = styled.div`
  align-items: center;
  display: flex;
  height: 100%;
  justify-content: center;
  position: relative;
  width: 100%;
`;
const DisplayCanvas = styled.canvas`
  pointer-events: none;
  position: absolute;
  z-index: 0;
`;
const EventCanvas = styled.canvas`
  z-index: 2;
`;
const GridCanvas = styled.canvas`
  ${props => (isGridLines(props) ? gridLineStyles : '')}
  pointer-events: none;
  position: absolute;
  z-index: ${props => (isGridLines(props) ? 1 : 0)};
`;

class Canvas extends Component {
  constructor() {
    super();
    this.displayCanvas = createRef();
    this.eventCanvas = createRef();
    this.gridCanvas = createRef();
    this.lastEventRow = null;
    this.lastEventCol = null;
    this.shouldCanvasReset = false;

    this.cancelDrag = this.cancelDrag.bind(this);
    this.downloadCanvas = this.downloadCanvas.bind(this);
    this.handleClick = this.handleClick.bind(this);
    this.handleDrag = throttle(this.handleDrag.bind(this), 5);
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleMouseDown = this.handleMouseDown.bind(this);
    this.handleMouseMove = this.handleMouseMove.bind(this);
    this.handleMouseOut = this.handleMouseOut.bind(this);
    this.handleMouseUp = this.handleMouseUp.bind(this);
    this.resetCanvas = this.resetCanvas.bind(this);
  }

  componentDidMount() {
    this.scrollContainer = document.getElementById('scrollContainer');
    const eventCanvas = this.eventCanvas.current;

    this.ctx = {
      display: this.displayCanvas.current.getContext('2d'),
      event: eventCanvas.getContext('2d'),
      grid: this.gridCanvas.current.getContext('2d'),
    };

    this.ctx.display.scale(dpi, dpi);
    this.ctx.event.scale(dpi, dpi);
    this.ctx.grid.scale(dpi, dpi);

    this.drawGrid();

    document.addEventListener('keydown', this.handleKeyDown);
    eventCanvas.addEventListener('mousemove', this.handleMouseMove);
    document.addEventListener('mouseup', this.cancelDrag);
    eventCanvas.oncontextmenu = (ev) => {
      this.handleClick(ev, true);
      return false;
    };
  }

  componentWillUnmount() {
    document.removeEventListener('keydown', this.handleKeyDown);
    document.removeEventListener('mouseup', this.cancelDrag);
  }

  componentDidUpdate(prevProps, prevState) {
    if (this.shouldCanvasReset) {
      this.props.clearHistory();
      this.shouldCanvasReset = false;
    }
    clearCanvas(this.gridCanvas.current);
    clearCanvas(this.displayCanvas.current);
    this.drawGrid();
    this.drawArt();
  }

  shouldComponentUpdate(nextProps) {
    const { gridType, historyIndex } = this.props;
    const redoClicked = nextProps.historyIndex < historyIndex;
    const undoClicked = nextProps.historyIndex > historyIndex;
    const gridTypeChanged = nextProps.gridType !== gridType;
    if (gridTypeChanged || undoClicked || redoClicked || this.shouldCanvasReset) {
      return true;
    }
    return false;
  }

  handleClick(ev, isRightClick) {
    const { canvas, color } = this.props;
    const row = this.calcRowFromMouseX(ev.clientX);
    const col = this.calcColFromMouseY(ev.clientY);
    const fill = isRightClick ? null : color.hex;
    if (canvas[row][col] !== fill) {
      this.drawCell(row, col, 'display', fill);
      this.props.fillPixel(row, col, fill);
    }
  }

  handleDrag(ev) {
    this.handleClick(ev, ev.buttons === 2);
  }

  handleKeyDown(ev) {
    if (ev.ctrlKey|| ev.metaKey) {
      if (ev.key === 'z') {
        this.props.undo();
      }
      if (ev.key === 'y') {
        this.props.redo();
      }
    }
  }

  handleMouseMove(ev) {
    const row = this.calcRowFromMouseX(ev.clientX);
    const col = this.calcColFromMouseY(ev.clientY);

    if (!isNull(this.lastEventRow) && !isNull(this.lastEventCol)) {
      this.drawCell(this.lastEventRow, this.lastEventCol, 'event', null);
    }
    this.drawCell(row, col, 'event', colors.transparentBlack);

    this.lastEventRow = row;
    this.lastEventCol = col;
  }

  handleMouseDown() {
    batchGroupBy.start();
    const eventCanvas = this.eventCanvas.current;
    this.drawCell(this.lastEventRow, this.lastEventCol, 'event', null);
    eventCanvas.removeEventListener('mousemove', this.handleMouseMove);
    eventCanvas.addEventListener('mousemove', this.handleDrag);
  }

  handleMouseOut() {
    this.drawCell(this.lastEventRow, this.lastEventCol, 'event', null);
  }

  handleMouseUp() {
    const eventCanvas = this.eventCanvas.current;
    eventCanvas.removeEventListener('mousemove', this.handleDrag);
    eventCanvas.addEventListener('mousemove', this.handleMouseMove);
    batchGroupBy.end();
  }

  calcColFromMouseY(y) {
    return Math.floor((y + this.scrollContainer.scrollTop - this.gridCanvas.current.offsetTop)
      / CELL_SIZE);
  }

  calcRowFromMouseX(x) {
    return Math.floor((x + this.scrollContainer.scrollLeft - this.gridCanvas.current.offsetLeft)
      / CELL_SIZE);
  }

  cancelDrag() {
    this.eventCanvas.current.removeEventListener('mousemove', this.handleDrag);
  }

  downloadCanvas() {
    downloadCanvas(this.displayCanvas.current);
  }

  drawArt() {
    for (let i = 0; i < NUM_ROWS; i += 1) {
      for (let j = 0; j < NUM_ROWS; j += 1) {
        this.drawCell(i, j, 'display', this.props.canvas[i][j]);
      }
    }
  }

  drawCell(rowCount, colCount, canvasName, fill) {
    const { gridType } = this.props;
    const canvas = this.ctx[canvasName];
    const rectArgs = [rowCount * CELL_SIZE, colCount * CELL_SIZE, CELL_SIZE, CELL_SIZE];
    const arcArgs = [rowCount * CELL_SIZE + PEG_SHIFT, colCount * CELL_SIZE + PEG_SHIFT,
      2, 0, 2 * Math.PI];
    canvas.lineWidth = 0.5;

    if (canvasName === 'grid') {
      switch (gridType) {
        case GRID_TYPES.lines:
          canvas.strokeStyle = colors.darkestGray;
          rectArgs[0] += BLURRY_LINE_SHIFT;
          rectArgs[1] += BLURRY_LINE_SHIFT;
          canvas.strokeRect(...rectArgs);
          break;
        case GRID_TYPES.pegs:
          canvas.fillStyle = colors.darkGray;
          canvas.beginPath();
          canvas.arc(...arcArgs);
          canvas.fill();
          break;
        default:
          canvas.fillStyle = fill;
          canvas.fillRect(...rectArgs);
          break;
      }
    } else if (fill) {
      canvas.fillStyle = fill;
      if (gridType === GRID_TYPES.pegs) {
        canvas.beginPath();
        arcArgs[2] = CELL_SIZE / 2;
        canvas.arc(...arcArgs);
        canvas.clearRect(...rectArgs);
        canvas.fill();
      } else {
        canvas.fillRect(...rectArgs);
      }
    } else {
      canvas.clearRect(...rectArgs);
    }
  }

  drawGrid() {
    for (let i = 0; i < NUM_ROWS; i += 1) {
      for (let j = 0; j < NUM_ROWS; j += 1) {
        this.drawCell(i, j, 'grid', gridColors[(i + j) % 2]);
      }
    }
  }

  resetCanvas() {
    this.shouldCanvasReset = true;
    this.props.clearCanvasData();
  }

  render() {
    return (
      <Container>
        <GridCanvas
          gridType={this.props.gridType}
          ref={this.gridCanvas}
          {...canvasProps}
        />
        <DisplayCanvas
          ref={this.displayCanvas}
          {...canvasProps}
        />
        <EventCanvas
          onBlur={this.handleMouseOut}
          onClick={this.handleClick}
          onMouseDown={this.handleMouseDown}
          onMouseOut={this.handleMouseOut}
          onMouseUp={this.handleMouseUp}
          ref={this.eventCanvas}
          {...canvasProps}
        />
        <ControlPanel
          onReset={this.resetCanvas}
          onSave={this.downloadCanvas}
        />
        <SummaryPanel />
      </Container>
    );
  }
}

Canvas.propTypes = {
  canvas: PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.string)),
  color: PropTypes.shape({
    hex: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
  }),
  gridType: PropTypes.oneOf(Object.values(GRID_TYPES)),
};

const mapStateToProps = ({ canvas, color, gridType }) => {
  return {
    canvas: canvas.present,
    color,
    gridType,
    historyIndex: canvas.limit - canvas.index,
  };
};
const mapDispatchToProps = dispatch => {
  return {
    clearHistory: () => dispatch(UndoActionCreators.clearHistory()),
    clearCanvasData: () => dispatch(clearCanvasData()),
    fillPixel: (row, col, fill) => dispatch(fillPixel(row, col, fill)),
    redo: () => dispatch(UndoActionCreators.redo()),
    undo: () => dispatch(UndoActionCreators.undo()),
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(Canvas);
