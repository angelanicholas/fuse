import React, { Component, createRef } from 'react';
import PropTypes from 'prop-types';
import styled, { css } from 'styled-components';
import { connect } from 'react-redux';
import isNull from 'lodash/isNull';
import throttle from 'lodash/throttle';
import { ActionCreators as UndoActionCreators } from 'redux-undo';
import ControlPanel from './controlPanel';
import SummaryPanel from './summaryPanel';
import { colors, paletteColors, tileColors } from '../util/colors';
import { clearCanvas, cursors, downloadCanvas, getSessionItem } from '../util/canvas';
import { batchGroupBy } from '../store/reducers';
import {
  bucketFill,
  changeColor,
  changeToolType,
  clearCanvas as clearCanvasData,
  fillPixel,
  fillRectangle,
  shiftCanvas,
} from '../store/actions';
import {
  BLURRY_LINE_SHIFT,
  CELL_SIZE,
  GRID_TYPES,
  HEIGHT,
  NUM_ROWS,
  NUM_COLS,
  PEG_SHIFT,
  TOOL_TYPES,
  WIDTH,
} from '../util/constants';

const dpi = window.devicePixelRatio;
const canvasProps = {
  height: HEIGHT * dpi,
  style: { height: HEIGHT, width: WIDTH },
  width: WIDTH * dpi,
};

// styled components
const gridLineStyles = css`
  border-left: 0.5px solid ${colors.gray};
`;
const Container = styled.div`
  display: flex;
  flex-flow: row nowrap;
  height: 100%;
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
  ${props => (props.gridType === GRID_TYPES.lined ? gridLineStyles : '')}
  pointer-events: none;
  position: absolute;
  z-index: ${props => (props.gridType === GRID_TYPES.lined ? 1 : 0)};
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
    this.lastToolType = null;
    this.shouldCanvasUpdate = false;
    this.shouldClearHistory = false;
    this.startDragRow = null;
    this.startDragCol = null;

    this.clearCanvas = this.clearCanvas.bind(this);
    this.handleDrag = throttle(this.handleDrag.bind(this), 5);
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleMouseDown = this.handleMouseDown.bind(this);
    this.handleMouseMove = this.handleMouseMove.bind(this);
    this.handleMouseOut = this.handleMouseOut.bind(this);
    this.handleMouseUp = this.handleMouseUp.bind(this);
    this.save = this.save.bind(this);
    this.saveWithGrid = this.saveWithGrid.bind(this);
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

    if (this.props.gridType !== GRID_TYPES.noGrid) {
      this.drawGrid();
    }

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

    this.gridCanvas.current.style.zIndex = this.props.gridType === GRID_TYPES.lined ? '1' : '0';
    clearCanvas(this.displayCanvas.current);
    clearCanvas(this.eventCanvas.current);
    clearCanvas(this.gridCanvas.current);

    if (this.props.gridType !== GRID_TYPES.noGrid) {
      this.drawGrid();
    }
    this.drawArt();
  }

  shouldComponentUpdate(nextProps) {
    const { colorMode, gridType, historyIndex, toolType } = this.props;
    const redoClicked = nextProps.historyIndex < historyIndex;
    const undoClicked = nextProps.historyIndex > historyIndex;
    const colorModeChanged = nextProps.colorMode !== colorMode;
    const gridTypeChanged = nextProps.gridType !== gridType;
    const toolTypeChanged = nextProps.toolType !== toolType;

    if (toolType !== TOOL_TYPES.eyedropper && nextProps.toolType === TOOL_TYPES.eyedropper) {
      this.lastToolType = toolType;
    }

    if (colorModeChanged
      || gridTypeChanged
      || toolTypeChanged
      || undoClicked
      || redoClicked
      || this.shouldCanvasUpdate
    ) {
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
        this.fillPixel(ev, false);
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
    batchGroupBy.start();
    switch (this.props.toolType) {
      case TOOL_TYPES.rectangle:
        this.startDragCol = this.calcColFromMouseX(ev.clientX);
        this.startDragRow = this.calcRowFromMouseY(ev.clientY);
        this.drawCell(this.lastEventRow, this.lastEventCol, 'event', null);
        this.eventCanvas.current.removeEventListener('mousemove', this.handleMouseMove);
        break;
      case TOOL_TYPES.pencil:
        this.drawCell(this.lastEventRow, this.lastEventCol, 'event', null);
        this.eventCanvas.current.removeEventListener('mousemove', this.handleMouseMove);
        break;
      case TOOL_TYPES.move:
        this.drawCell(this.lastEventRow, this.lastEventCol, 'event', null);
        this.startDragRow = this.calcRowFromMouseY(ev.clientY);
        this.startDragCol = this.calcColFromMouseX(ev.clientX);
        this.gridCanvas.current.style.zIndex = this.props.gridType === GRID_TYPES.lined ? '3' : '0';
        this.ctx.event.drawImage(this.displayCanvas.current, 0, 0, WIDTH, HEIGHT);
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
    const {
      bucketFill,
      changeToolType,
      color,
      gridType,
      shiftCanvas,
      toolType,
    } = this.props;

    if (this.isCanvasEvent) {
      batchGroupBy.end();
      switch (toolType) {
        case TOOL_TYPES.eyedropper:
          this.changeColor(ev);
          changeToolType(this.lastToolType);
          this.lastToolType = null;
          break;
        default:
          this.eventCanvas.current.addEventListener('mousemove', this.handleMouseMove);
          switch (toolType) {
            case TOOL_TYPES.rectangle:
              this.drawRectangle(ev);
              this.startDragRow = null;
              this.startDragCol = null;
              break;
            case TOOL_TYPES.pencil:
              this.fillPixel(ev, true);
              break;
            case TOOL_TYPES.bucket:
              this.shouldCanvasUpdate = true;
              bucketFill(
                this.calcRowFromMouseY(ev.clientY),
                this.calcColFromMouseX(ev.clientX),
                this.isRightClick ? null : color.hex,
              );
              break;
            case TOOL_TYPES.move:
              this.gridCanvas.current.style.zIndex = gridType === GRID_TYPES.lined ? '1' : '0';
              this.displayCanvas.current.style.zIndex = '0';
              shiftCanvas(
                Math.min(this.calcColFromMouseX(ev.clientX) - this.startDragCol, NUM_COLS),
                Math.min(this.calcRowFromMouseY(ev.clientY) - this.startDragRow, NUM_ROWS),
              );
              this.startDragRow = null;
              this.startDragCol = null;
              clearCanvas(this.displayCanvas.current);
              this.ctx.display.drawImage(this.eventCanvas.current, 0, 0, WIDTH, HEIGHT);
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
    return Math.min(Math.max(colIndex, 0), NUM_COLS - 1);
  }

  changeColor(ev) {
    const row = this.calcRowFromMouseY(ev.clientY);
    const col = this.calcColFromMouseX(ev.clientX);
    const clickedColor = this.props.canvas[row][col];
    if (clickedColor) {
      this.props.changeColor(paletteColors.find(color => color.hex === clickedColor));
    }
  }

  clearCanvas() {
    this.shouldCanvasUpdate = true;
    this.shouldClearHistory = true;
    this.props.clearCanvasData();
  }

  drawArt() {
    for (let i = 0; i < NUM_ROWS; i += 1) {
      for (let j = 0; j < NUM_COLS; j += 1) {
        this.drawCell(i, j, 'display', this.props.canvas[i][j]);
      }
    }
  }

  drawRectangle(ev) {
    const isDragging = ev.buttons === 1 || ev.buttons === 2;
    const canvasName = isDragging ? 'event' : 'display';
    const canvas = this.ctx[canvasName];
    const isPegs = this.props.gridType === GRID_TYPES.pegs;
    let col = Math.min(Math.max(0, this.calcColFromMouseX(ev.clientX)), NUM_COLS - 1);
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
        case GRID_TYPES.lined:
          canvas.strokeStyle = colors.darkGray;
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
    const gridColors = tileColors[this.props.colorMode.toLowerCase()];
    for (let i = 0; i < NUM_ROWS; i += 1) {
      for (let j = 0; j < NUM_COLS; j += 1) {
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

  save() {
    downloadCanvas(this.displayCanvas.current);
  }

  saveWithGrid() {
    if (this.props.gridType !== GRID_TYPES.noGrid) {
      this.ctx.grid.drawImage(this.displayCanvas.current, 0, 0, WIDTH, HEIGHT);
      downloadCanvas(this.gridCanvas.current);
      clearCanvas(this.gridCanvas.current);
      this.drawGrid();
    } else {
      this.save();
    }
  }

  shiftCanvas(ev) {
    const row = this.calcRowFromMouseY(ev.clientY);
    const col = this.calcColFromMouseX(ev.clientX);
    const x = Math.min(col - this.startDragCol, NUM_COLS) * CELL_SIZE;
    const y = Math.min(row - this.startDragRow, NUM_ROWS) * CELL_SIZE;
    clearCanvas(this.eventCanvas.current);
    this.ctx.event.drawImage(this.displayCanvas.current, x, y, WIDTH, HEIGHT);
  }

  render() {
    const { gridType, showSummaryPanel, toolType } = this.props;
    const { url, url2x, x, y } = cursors[toolType.toLowerCase()];

    return (
      <Container>
        <ControlPanel
          onReset={this.clearCanvas}
          onSave={this.save}
          onSaveWithGrid={this.saveWithGrid}
        />
        <Container>
          <GridCanvas
            gridType={gridType}
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
            style={{
              cursor: `url(${url}) ${x} ${y}, default`, // eslint-disable-next-line
              cursor: `-webkit-image-set(url(${url}) 1x, url(${url2x}) 2x) ${x} ${y}, default`,
              ...canvasProps.style,
            }}
          />
        </Container>
        {showSummaryPanel && <SummaryPanel />}
      </Container>
    );
  }
}

Canvas.propTypes = {
  canvas: PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.string)).isRequired,
  color: PropTypes.shape({
    hex: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
  }).isRequired,
  gridType: PropTypes.oneOf(Object.values(GRID_TYPES)).isRequired,
  historyIndex: PropTypes.number,
  showSummaryPanel: PropTypes.bool,
  toolType: PropTypes.oneOf(Object.values(TOOL_TYPES)).isRequired,
};

Canvas.defaultProps = {
  showSummaryPanel: false,
};

const mapStateToProps = ({
  canvas,
  color,
  colorMode,
  gridType,
  toolType,
}) => {
  const sessionColor = getSessionItem('color');
  return {
    canvas: canvas.present,
    color: sessionColor ? JSON.parse(sessionColor) : color,
    colorMode,
    gridType: getSessionItem('gridType') || gridType,
    historyIndex: canvas.limit - canvas.index,
    toolType: getSessionItem('toolType') || toolType,
  };
};

const mapDispatchToProps = dispatch => {
  return {
    bucketFill: (row, col, fill) => dispatch(bucketFill(row, col, fill)),
    changeColor: color => dispatch(changeColor(color)),
    changeToolType: toolType => dispatch(changeToolType(toolType)),
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
