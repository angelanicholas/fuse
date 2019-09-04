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
import { clearCanvas as clearCanvasData, fillPixel, fillRectangle } from '../store/actions';
import { batchGroupBy } from '../store/reducers';
import {
  BLURRY_LINE_SHIFT,
  CELL_SIZE,
  GRID_TYPES,
  NUM_ROWS,
  PEG_SHIFT,
  SIZE,
  TOOL_TYPES,
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
    this.startRectangleRow = null;
    this.startRectangleCol = null;
    this.shouldCanvasReset = false;
    this.isRightClick = false;

    this.cancelDrag = this.cancelDrag.bind(this);
    this.downloadCanvas = this.downloadCanvas.bind(this);
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
    eventCanvas.oncontextmenu = ev => false;
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

  handleDrag(ev) {
    switch (this.props.toolType) {
      case TOOL_TYPES.pixel:
        this.fillPixel(ev);
        break;
      case TOOL_TYPES.rectangle:
        this.drawRectangle(ev);
        break;
      case TOOL_TYPES.eyedropper:
        this.fillPixel(ev);
        break;
      default:
        break;
    }
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
    const row = this.calcColFromMouseX(ev.clientX);
    const col = this.calcRowFromMouseY(ev.clientY);

    if (!isNull(this.lastEventRow) && !isNull(this.lastEventCol)) {
      this.drawCell(this.lastEventRow, this.lastEventCol, 'event', null);
    }
    this.drawCell(row, col, 'event', colors.transparentBlack);

    this.lastEventRow = row;
    this.lastEventCol = col;
  }

  handleMouseDown(ev) {
    batchGroupBy.start();
    const eventCanvas = this.eventCanvas.current;
    this.drawCell(this.lastEventRow, this.lastEventCol, 'event', null);
    this.isRightClick = ev.buttons === 2;

    if (this.props.toolType === TOOL_TYPES.rectangle) {
      this.startRectangleCol = this.calcColFromMouseX(ev.clientX);
      this.startRectangleRow = this.calcRowFromMouseY(ev.clientY);
    }

    eventCanvas.removeEventListener('mousemove', this.handleMouseMove);
    eventCanvas.addEventListener('mousemove', this.handleDrag);
  }

  handleMouseOut() {
    this.drawCell(this.lastEventRow, this.lastEventCol, 'event', null);
  }

  handleMouseUp(ev) {
    const eventCanvas = this.eventCanvas.current;
    eventCanvas.removeEventListener('mousemove', this.handleDrag);
    eventCanvas.addEventListener('mousemove', this.handleMouseMove);
    batchGroupBy.end();

    if (this.props.toolType === TOOL_TYPES.rectangle) {
      this.drawRectangle(ev);
      this.startRectangleRow = null;
      this.startRectangleCol = null;
    }

    this.isRightClick = false;
  }

  calcRowFromMouseY(y) {
    const rowIndex = Math.floor((y + this.scrollContainer.scrollTop - this.gridCanvas.current.offsetTop) / CELL_SIZE);
    return Math.min(Math.max(rowIndex, 0), NUM_ROWS - 1);
  }

  calcColFromMouseX(x) {
    const colIndex = Math.floor((x + this.scrollContainer.scrollLeft - this.gridCanvas.current.offsetLeft) / CELL_SIZE);
    return Math.min(Math.max(colIndex, 0), NUM_ROWS - 1);
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
        this.drawCell(i, j, 'display', this.props.canvas[j][i]);
      }
    }
  }

  drawRectangle(ev) {
    const isDragging = ev.buttons === 1 || ev.buttons === 2;
    const canvasName = isDragging ? 'event' : 'display';
    const canvas = this.ctx[canvasName];
    const isPegs = this.props.gridType === GRID_TYPES.pegs;
    let col = this.calcColFromMouseX(ev.clientX);
    let row = this.calcRowFromMouseY(ev.clientY);
    let { startRectangleCol, startRectangleRow } = this;
    let height = col - startRectangleCol;
    let width = row - startRectangleRow;

    // if dragging above startRectangleCol, draw in reverse
    if (height < 0) {
      if (isPegs) {
        startRectangleCol = col;
        col = this.startRectangleCol;
        height = Math.abs(height) + 1;
      } else {
        height -= 1;
        startRectangleCol += 1;
      }
    } else {
      height += 1;
    }
    // if dragging left of startRectangleRow, draw in reverse
    if (width < 0) {
      if (isPegs) {
        startRectangleRow = row;
        row = this.startRectangleRow;
        width = Math.abs(width) + 1;
      } else {
        width -= 1;
        startRectangleRow += 1;
      }
    } else {
      width += 1;
    }

    // if dragging, draw a transparent shape on event canvas,
    // otherwise fill shape with selected color to paint on display canvas
    const fill = isDragging ? colors.transparentBlack : this.props.color.hex;
    canvas.fillStyle = fill;

    const rectArgs = [
      startRectangleCol * CELL_SIZE,
      startRectangleRow * CELL_SIZE,
      height * CELL_SIZE,
      width * CELL_SIZE,
    ];

    clearCanvas(this.eventCanvas.current);

    if (isPegs) {
      for (let i = startRectangleCol; i <= col; i++) {
        for (let j = startRectangleRow; j <= row; j++) {
          this.drawCell(i, j, canvasName, fill);
        }
      }
    } else {
      canvas.fillRect(...rectArgs);
    }

    if (!isDragging) {
      this.props.fillRectangle(
        startRectangleRow,
        row,
        startRectangleCol,
        col,
        this.isRightClick ? null : fill,
      );

      if (this.isRightClick) {
        canvas.clearRect(...rectArgs);
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

  fillPixel(ev) {
    const { canvas, color } = this.props;
    const row = this.calcColFromMouseX(ev.clientX);
    const col = this.calcRowFromMouseY(ev.clientY);
    const fill = ev.buttons === 2 ? null : color.hex;
    if (canvas[row][col] !== fill) {
      this.drawCell(row, col, 'display', fill);
      this.props.fillPixel(col, row, fill);
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
  historyIndex: PropTypes.number,
  toolType: PropTypes.oneOf(Object.values(TOOL_TYPES)),
};

const mapStateToProps = ({
  canvas,
  color,
  gridType,
  toolType,
}) => {
  return {
    canvas: canvas.present,
    color,
    gridType,
    historyIndex: canvas.limit - canvas.index,
    toolType,
  };
};
const mapDispatchToProps = dispatch => {
  return {
    clearCanvasData: () => dispatch(clearCanvasData()),
    clearHistory: () => dispatch(UndoActionCreators.clearHistory()),
    fillPixel: (row, col, fill) => dispatch(fillPixel(row, col, fill)),
    fillRectangle: (rowStart, rowEnd, colStart, colEnd, fill) => dispatch(
      fillRectangle(rowStart, rowEnd, colStart, colEnd, fill),
    ),
    redo: () => dispatch(UndoActionCreators.redo()),
    undo: () => dispatch(UndoActionCreators.undo()),
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(Canvas);
