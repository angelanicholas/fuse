import React, { Component, createRef } from 'react';
import PropTypes from 'prop-types';
import styled, { css } from 'styled-components';
import { connect } from 'react-redux';
import isNull from 'lodash/isNull';
import throttle from 'lodash/throttle';
import { ActionCreators as UndoActionCreators } from 'redux-undo';

import ControlPanel from './controlPanel';
import SummaryPanel from './summaryPanel';
import { colors, gridColors, perlerColors } from '../util/colors';
import { clearCanvas, downloadCanvas } from '../util/canvas';
import {
  bucketFill,
  changeColor,
  clearCanvas as clearCanvasData,
  fillPixel,
  fillRectangle,
  shiftCanvas,
} from '../store/actions';
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
  style: { height: SIZE, width: SIZE },
  width: SIZE * dpi,
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

    this.isRightClick = false;
    this.lastEventRow = null;
    this.lastEventCol = null;
    this.shouldCanvasUpdate = false;
    this.shouldClearHistory = false;
    this.startDragRow = null;
    this.startDragCol = null;

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
    document.addEventListener('mouseup', this.handleMouseUp);
    eventCanvas.addEventListener('mousemove', this.handleMouseMove);
    eventCanvas.oncontextmenu = ev => false;
  }

  componentWillUnmount() {
    document.removeEventListener('keydown', this.handleKeyDown);
    document.removeEventListener('mouseup', this.handleMouseUp);
  }

  componentDidUpdate(prevProps, prevState) {
    if (this.shouldCanvasUpdate) {
      this.shouldCanvasUpdate = false;
    }
    if (this.shouldClearHistory) {
      this.props.clearHistory();
    }
    this.gridCanvas.current.style.zIndex = this.props.gridType === GRID_TYPES.lines ? '1' : '0';
    clearCanvas(this.displayCanvas.current);
    clearCanvas(this.eventCanvas.current);
    clearCanvas(this.gridCanvas.current);
    this.drawGrid();
    this.drawArt();
  }

  shouldComponentUpdate(nextProps) {
    const { gridType, historyIndex } = this.props;

    const redoClicked = nextProps.historyIndex < historyIndex;
    const undoClicked = nextProps.historyIndex > historyIndex;
    const gridTypeChanged = nextProps.gridType !== gridType;

    if (gridTypeChanged || undoClicked || redoClicked || this.shouldCanvasUpdate) {
      return true;
    }

    return false;
  }

  handleDrag(ev) {
    switch (this.props.toolType) {
      case TOOL_TYPES.eyedropper:
        this.changeColor(ev);
        break;
      case TOOL_TYPES.pencil:
        this.fillPixel(ev);
        break;
      case TOOL_TYPES.rectangle:
        this.drawRectangle(ev);
        break;
      case TOOL_TYPES.move:
        this.shiftCanvas(ev);
        break;
      default:
        break;
    }
  }

  handleKeyDown(ev) {
    ev.preventDefault();

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
    const row = this.calcRowFromMouseY(ev.clientY);
    const col = this.calcColFromMouseX(ev.clientX);

    if (!isNull(this.lastEventRow) && !isNull(this.lastEventCol)) {
      this.drawCell(this.lastEventRow, this.lastEventCol, 'event', null);
    }

    this.drawCell(row, col, 'event', colors.transparentBlack);
    this.lastEventRow = row;
    this.lastEventCol = col;
  }

  handleMouseDown(ev) {
    switch (this.props.toolType) {
      case TOOL_TYPES.rectangle:
        this.startDragCol = this.calcColFromMouseX(ev.clientX);
        this.startDragRow = this.calcRowFromMouseY(ev.clientY);
        this.drawCell(this.lastEventRow, this.lastEventCol, 'event', null);
        this.eventCanvas.current.removeEventListener('mousemove', this.handleMouseMove);
        break;
      case TOOL_TYPES.pencil:
        batchGroupBy.start();
        this.drawCell(this.lastEventRow, this.lastEventCol, 'event', null);
        this.eventCanvas.current.removeEventListener('mousemove', this.handleMouseMove);
        break;
      case TOOL_TYPES.move:
        this.drawCell(this.lastEventRow, this.lastEventCol, 'event', null);
        this.startDragRow = this.calcRowFromMouseY(ev.clientY);
        this.startDragCol = this.calcColFromMouseX(ev.clientX);
        this.gridCanvas.current.style.zIndex = this.props.gridType === GRID_TYPES.lines ? '3' : '0';
        this.ctx.event.drawImage(this.displayCanvas.current, 0, 0, SIZE, SIZE);
        this.displayCanvas.current.style.zIndex = '-1';
        this.eventCanvas.current.removeEventListener('mousemove', this.handleMouseMove);
        break;
      default:
        break;
    }

    this.isCanvasEvent = true;
    this.isRightClick = ev.buttons === 2;
    document.addEventListener('mousemove', this.handleDrag);
  }

  handleMouseOut(ev) {
    if (ev.buttons !== 1 && ev.buttons !== 2) {
      this.drawCell(this.lastEventRow, this.lastEventCol, 'event', null);
    }
  }

  handleMouseUp(ev) {
    if (this.isCanvasEvent) {
      switch (this.props.toolType) {
        case TOOL_TYPES.eyedropper:
          this.changeColor(ev);
          break;
        default:
          this.eventCanvas.current.addEventListener('mousemove', this.handleMouseMove);
          switch (this.props.toolType) {
            case TOOL_TYPES.rectangle:
              this.drawRectangle(ev);
              this.startDragRow = null;
              this.startDragCol = null;
              break;
            case TOOL_TYPES.pencil:
              batchGroupBy.end();
              this.fillPixel(ev);
              break;
            case TOOL_TYPES.bucket:
              this.shouldCanvasUpdate = true;
              this.props.bucketFill(
                this.calcRowFromMouseY(ev.clientY),
                this.calcColFromMouseX(ev.clientX),
                this.props.color.hex,
              );
              break;
            case TOOL_TYPES.move:
              this.gridCanvas.current.style.zIndex = this.props.gridType === GRID_TYPES.lines ? '1' : '0';
              this.displayCanvas.current.style.zIndex = '0';
              this.props.shiftCanvas(
                Math.min(this.calcColFromMouseX(ev.clientX) - this.startDragCol, NUM_ROWS),
                Math.min(this.calcRowFromMouseY(ev.clientY) - this.startDragRow, NUM_ROWS),
              );
              this.startDragRow = null;
              this.startDragCol = null;
              clearCanvas(this.displayCanvas.current);
              this.ctx.display.drawImage(this.eventCanvas.current, 0, 0, SIZE, SIZE);
              clearCanvas(this.eventCanvas.current);
              break;
            default:
              break;
          }
          break;
      }
      this.isRightClick = false;
      this.isCanvasEvent = false;
      document.removeEventListener('mousemove', this.handleDrag);
    }
  }

  calcRowFromMouseY(y) {
    const rowIndex = Math.floor((y + this.scrollContainer.scrollTop - this.gridCanvas.current.offsetTop) / CELL_SIZE);
    return Math.min(Math.max(rowIndex, 0), NUM_ROWS - 1);
  }

  calcColFromMouseX(x) {
    const colIndex = Math.floor((x + this.scrollContainer.scrollLeft - this.gridCanvas.current.offsetLeft) / CELL_SIZE);
    return Math.min(Math.max(colIndex, 0), NUM_ROWS - 1);
  }

  changeColor(ev) {
    const row = this.calcRowFromMouseY(ev.clientY);
    const col = this.calcColFromMouseX(ev.clientX);
    const clickedColor = this.props.canvas[row][col];
    if (clickedColor) {
      this.props.changeColor(perlerColors.find(color => color.hex === clickedColor));
    }
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

  drawRectangle(ev) {
    const isDragging = ev.buttons === 1 || ev.buttons === 2;
    const canvasName = isDragging ? 'event' : 'display';
    const canvas = this.ctx[canvasName];
    const isPegs = this.props.gridType === GRID_TYPES.pegs;
    let col = Math.min(Math.max(0, this.calcColFromMouseX(ev.clientX)), NUM_ROWS - 1);
    let row = Math.min(Math.max(0, this.calcRowFromMouseY(ev.clientY)), NUM_ROWS - 1);
    let { startDragCol, startDragRow } = this;
    let height = col - startDragCol;
    let width = row - startDragRow;

    // if dragging above initial onClick, draw in reverse
    if (height < 0) {
      if (isPegs) {
        startDragCol = col;
        col = this.startDragCol;
        height = Math.abs(height) + 1;
      } else {
        height -= 1;
        startDragCol += 1;
      }
    } else {
      height += 1;
    }
    // if dragging left of initial click, draw in reverse
    if (width < 0) {
      if (isPegs) {
        startDragRow = row;
        row = this.startDragRow;
        width = Math.abs(width) + 1;
      } else {
        width -= 1;
        startDragRow += 1;
      }
    } else {
      width += 1;
    }

    // if dragging, draw a transparent shape on event canvas,
    // otherwise fill shape with selected color to paint on display canvas
    const color = this.isRightClick ? null : this.props.color.hex;
    const fill = isDragging ? colors.transparentBlack : color;
    canvas.fillStyle = fill;

    const rectArgs = [
      startDragCol * CELL_SIZE,
      startDragRow * CELL_SIZE,
      height * CELL_SIZE,
      width * CELL_SIZE,
    ];

    clearCanvas(this.eventCanvas.current);

    if (isPegs) {
      for (let i = startDragRow; i <= row; i++) {
        for (let j = startDragCol; j <= col; j++) {
          this.drawCell(i, j, canvasName, fill);
        }
      }
    } else {
      canvas.fillRect(...rectArgs);
    }

    if (!isDragging) {
      this.props.fillRectangle(
        startDragRow,
        row,
        startDragCol,
        col,
        this.isRightClick ? null : fill,
      );

      if (this.isRightClick) {
        canvas.clearRect(...rectArgs);
      }
    }
  }

  drawCell(row, col, canvasName, fill) {
    const { gridType } = this.props;
    const canvas = this.ctx[canvasName];
    const rectArgs = [col * CELL_SIZE, row * CELL_SIZE, CELL_SIZE, CELL_SIZE];
    const arcArgs = [col * CELL_SIZE + PEG_SHIFT, row * CELL_SIZE + PEG_SHIFT,
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
    const row = this.calcRowFromMouseY(ev.clientY);
    const col = this.calcColFromMouseX(ev.clientX);
    const fill = ev.buttons === 2 || ev.button === 2 ? null : color.hex;
    if (canvas[row][col] !== fill) {
      this.drawCell(row, col, 'display', fill);
      this.props.fillPixel(row, col, fill);
    }
  }

  resetCanvas() {
    this.shouldCanvasUpdate = true;
    this.shouldClearHistory = true;
    this.props.clearCanvasData();
  }

  shiftCanvas(ev) {
    const row = this.calcRowFromMouseY(ev.clientY);
    const col = this.calcColFromMouseX(ev.clientX);
    const x = Math.min(col - this.startDragCol, NUM_ROWS) * CELL_SIZE;
    const y = Math.min(row - this.startDragRow, NUM_ROWS) * CELL_SIZE;
    clearCanvas(this.eventCanvas.current);
    this.ctx.event.drawImage(this.displayCanvas.current, x, y, SIZE, SIZE);
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
    bucketFill: (row, col, fill) => dispatch(bucketFill(row, col, fill)),
    changeColor: (color) => dispatch(changeColor(color)),
    clearCanvasData: () => dispatch(clearCanvasData()),
    clearHistory: () => dispatch(UndoActionCreators.clearHistory()),
    fillPixel: (row, col, fill) => dispatch(fillPixel(row, col, fill)),
    fillRectangle: (rowStart, rowEnd, colStart, colEnd, fill) => dispatch(
      fillRectangle(rowStart, rowEnd, colStart, colEnd, fill),
    ),
    redo: () => dispatch(UndoActionCreators.redo()),
    shiftCanvas: (x, y) => dispatch(shiftCanvas(x, y)),
    undo: () => dispatch(UndoActionCreators.undo()),
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(Canvas);
