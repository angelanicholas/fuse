import React, { Component, createRef } from 'react';
import PropTypes from 'prop-types';
import styled, { css } from 'styled-components';
import isNull from 'lodash/isNull';

import Bead from './bead';
import ButtonComponent from './button';
import ButtonToggle from './buttonToggle';
import Icon from './icon';
import Swatch from './swatch';
import { colors, perlerColors } from '../util/colors';
import { clearCanvas, downloadCanvas } from '../util/canvas';

let SIZE = 575;
const NUM_ROWS = 29;
const CELL_SIZE = Math.floor(SIZE / NUM_ROWS);
SIZE = CELL_SIZE * NUM_ROWS;
const GRID_COLORS = [colors.white, colors.lightGray];
const GRID_TYPES = { pegs: 'Peg', lines: 'Grid', squares: 'Tile' };
const LINE_SHIFT = -0.5;
const PEG_SHIFT = 0.5 * CELL_SIZE;

const initDataArray = () => new Array(NUM_ROWS).fill(0).map(() => new Array(NUM_ROWS).fill(null));
const buttonToggleOptions = Object.values(GRID_TYPES).map(type => ({ value: type }));
const gridLineStyles = `0.5px solid ${colors.darkGray}`;
const isGridLines = props => props.gridType === GRID_TYPES.lines;
const dpi = window.devicePixelRatio;
const canvasProps = {
  height: SIZE * dpi,
  width: SIZE * dpi,
  style: { height: SIZE, width: SIZE },
};
const panelStyles = css`
  background-color: ${colors.white};
  bottom: 0;
  box-shadow: 0 0 0.2em ${colors.transparentBlack};
  display: flex;
  flex-flow: column nowrap;
  padding: 0.5em 1em;
  position: absolute;
  top: 0;
  width: ${CELL_SIZE * 12}px;
`;

// styled components
const BeadSummary = styled.div`
  align-items: center;
  display: flex;
  flex-flow: row nowrap;
  padding: 1em;
`;
const ColorInfoText = styled.p`
  color: ${colors.darkGray};
  font-size: 1em;
  flex: 0.8;
  margin-left: 1em;
`;
const Button = styled(ButtonComponent)`
  margin-bottom: 1em;
`;
const ButtonGroup = styled.div`
  display: flex;
  flex-flow: row nowrap;
  justify-content: space-between;
  button {
    flex: 1;
    margin-left: 1em;
    &:first-child {
      margin-left: 0;
    }
  }
`;
const ColorInfo = styled.div`
  align-items: center;
  display: flex;
  margin-bottom: 1em;
  padding: 1em;
  width: 100%;
`;
const ColorPalette = styled.div`
  display: flex;
  flex-flow: row wrap;
  margin-bottom: 1em;
`;
const Container = styled.div`
  align-items: center;
  display: flex;
  height: 100%;
  justify-content: center;
  position: relative;
  width: 100%;
`;
const ControlPanel = styled.div`
  ${panelStyles}
  left: 0;
`;
const SummaryPanel = styled.div`
  ${panelStyles}
  right: 0;
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
  border-left: ${props => (isGridLines(props) ? gridLineStyles : 0)};
  border-top: ${props => (isGridLines(props) ? gridLineStyles : 0)};
  pointer-events: none;
  position: absolute;
  z-index: ${props => (isGridLines(props) ? 1 : 0)};
`;

class PixelArtEditor extends Component {
  constructor(props) {
    super(props);

    this.state = {
      color: perlerColors[0],
      gridType: props.gridType,
      usedColors: {},
    };

    this.displayCanvas = createRef();
    this.eventCanvas = createRef();
    this.gridCanvas = createRef();

    this.undoHistory = [];
    this.redoHistory = [];
    this.lastEventRow = null;
    this.lastEventCol = null;
    this.savedData = initDataArray();

    this.downloadCanvas = this.downloadCanvas.bind(this);
    this.handleButtonToggle = this.handleButtonToggle.bind(this);
    this.handleClick = this.handleClick.bind(this);
    this.handleDrag = this.handleDrag.bind(this);
    this.handleMouseDown = this.handleMouseDown.bind(this);
    this.handleMouseMove = this.handleMouseMove.bind(this);
    this.handleMouseOut = this.handleMouseOut.bind(this);
    this.handleMouseUp = this.handleMouseUp.bind(this);
    this.handleSwatchClick = this.handleSwatchClick.bind(this);
    this.redoLastAction = this.redoLastAction.bind(this);
    this.resetCanvas = this.resetCanvas.bind(this);
    this.undoLastAction = this.undoLastAction.bind(this);
    this.submitAction = this.submitAction.bind(this);
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

    eventCanvas.addEventListener('mousemove', this.handleMouseMove);
    document.body.addEventListener('mouseup', () => {
      eventCanvas.removeEventListener('mousemove', this.handleDrag);
    });
    eventCanvas.oncontextmenu = (ev) => {
      this.handleClick(ev, true);
      return false;
    };
  }

  componentDidUpdate(prevProps, prevState) {
    if (this.state.gridType !== prevState.gridType) {
      clearCanvas(this.gridCanvas.current);
      this.drawGrid();
      if (this.displayCanvas) {
        clearCanvas(this.displayCanvas.current);
        this.drawArt();
      }
    }
  }

  handleClick(ev, isRightClick) {
    const row = this.calcRowFromMouseX(ev.clientX);
    const col = this.calcColFromMouseY(ev.clientY);
    const oldFill = this.savedData[row][col];
    const newFill = isRightClick ? null : this.state.color.hex;

    if ((!isRightClick && !oldFill) || (oldFill !== newFill)) {
      this.submitAction({
        row, col, newFill, oldFill,
      }, this.undoHistory);
    }
  }

  handleDrag(ev) {
    this.handleClick(ev, ev.buttons === 2);
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
    this.redoHistory = [];
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
  }

  handleButtonToggle(ev) {
    this.setState({ gridType: ev.currentTarget.value });
  }

  handleSwatchClick(color) {
    this.setState({ color });
  }

  calcBeadTotals() {
    const usedColors = {};
    this.savedData.forEach((row) => {
      for (let i = 0; i < row.length; i += 1) {
        const beadColor = row[i];
        if (beadColor === null) continue; // eslint-disable-line
        if (usedColors[beadColor]) {
          usedColors[beadColor].quantity += 1;
        } else {
          usedColors[beadColor] = {
            color: beadColor,
            name: perlerColors.find(perlerColor => perlerColor.hex === beadColor).name,
            quantity: 1,
          };
        }
      }
    });
    this.setState({ usedColors });
  }

  calcColFromMouseY(y) {
    return Math.floor((y + this.scrollContainer.scrollTop - this.gridCanvas.current.offsetTop)
      / CELL_SIZE);
  }

  calcRowFromMouseX(x) {
    return Math.floor((x + this.scrollContainer.scrollLeft - this.gridCanvas.current.offsetLeft)
      / CELL_SIZE);
  }

  downloadCanvas() {
    downloadCanvas(this.displayCanvas.current);
  }

  drawArt() {
    for (let i = 0; i < NUM_ROWS; i += 1) {
      for (let j = 0; j < NUM_ROWS; j += 1) {
        this.drawCell(i, j, 'display', this.savedData[i][j]);
      }
    }
  }

  drawCell(rowCount, colCount, canvasName, fill) {
    const { gridType } = this.state;
    const canvas = this.ctx[canvasName];
    const rectArgs = [rowCount * CELL_SIZE, colCount * CELL_SIZE, CELL_SIZE, CELL_SIZE];
    const arcArgs = [rowCount * CELL_SIZE + PEG_SHIFT, colCount * CELL_SIZE + PEG_SHIFT,
      2, 0, 2 * Math.PI];
    canvas.lineWidth = 0.5;

    if (canvasName === 'grid') {
      switch (gridType) {
        case GRID_TYPES.lines:
          canvas.strokeStyle = colors.darkestGray;
          rectArgs[0] += LINE_SHIFT;
          rectArgs[1] += LINE_SHIFT;
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
        this.drawCell(i, j, 'grid', GRID_COLORS[(i + j) % 2]);
      }
    }
  }

  resetCanvas() {
    clearCanvas(this.displayCanvas.current);
    this.savedData = initDataArray();
    this.undoHistory = [];
    this.redoHistory = [];
  }

  redoLastAction() {
    if (this.redoHistory.length) {
      const { oldFill: newFill, newFill: oldFill, ...rest } = this.redoHistory.pop();
      this.submitAction({ oldFill, newFill, ...rest }, this.undoHistory);
    }
  }

  submitAction(action, history) {
    history.push(action);
    const { row, col, newFill } = action;
    this.savedData[row][col] = newFill;
    this.drawCell(row, col, 'display', newFill);
    this.calcBeadTotals();
  }

  undoLastAction() {
    if (this.undoHistory.length) {
      const { oldFill: newFill, newFill: oldFill, ...rest } = this.undoHistory.pop();
      this.submitAction({ oldFill, newFill, ...rest }, this.redoHistory);
    }
  }

  render() {
    const { color, gridType, usedColors } = this.state;

    return (
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
          onClick={this.handleClick}
          onMouseDown={this.handleMouseDown}
          onMouseOut={this.handleMouseOut}
          onMouseUp={this.handleMouseUp}
          ref={this.eventCanvas}
          {...canvasProps}
        />
        <ControlPanel>
          <ButtonGroup>
            <Button
              label="Undo Action"
              onClick={this.undoLastAction}
            >
              <Icon name="back" />
            </Button>
            <Button
              label="Redo Action"
              onClick={this.redoLastAction}
            >
              <Icon name="forward" />
            </Button>
            <Button
              label="Download Canvas"
              onClick={this.downloadCanvas}
            >
              <Icon name="save" />
            </Button>
            <Button
              label="Reset Canvas"
              onClick={this.resetCanvas}
            >
              <Icon name="reset" />
            </Button>
          </ButtonGroup>
          <ButtonToggle
            activeIndex={buttonToggleOptions.findIndex(o => o.value === gridType)}
            onClick={this.handleButtonToggle}
            options={buttonToggleOptions}
          />
          <ColorInfo>
            <Bead color={color.hex} />
            <ColorInfoText>
              {color.name}
            </ColorInfoText>
          </ColorInfo>
          <ColorPalette>
            {perlerColors.map(perlerColor => (
              <Swatch
                color={perlerColor}
                isSelected={perlerColor.hex === color.hex}
                key={`Swatch-${perlerColor.hex}`}
                onClick={this.handleSwatchClick}
              />
            ))}
          </ColorPalette>
        </ControlPanel>
        <SummaryPanel>
          {Object.values(usedColors).map(bead => (
            <BeadSummary key={`beadSummary-${bead.color}`}>
              <Bead color={bead.color} size={2} />
              <ColorInfoText>{bead.name}</ColorInfoText>
              <ColorInfoText>{bead.quantity}</ColorInfoText>
            </BeadSummary>
          ))}
        </SummaryPanel>
      </Container>
    );
  }
}

PixelArtEditor.propTypes = {
  gridType: PropTypes.oneOf(Object.values(GRID_TYPES)),
};
PixelArtEditor.defaultProps = {
  gridType: GRID_TYPES.pegs,
};

export default PixelArtEditor;
