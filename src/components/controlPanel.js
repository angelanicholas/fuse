import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { connect } from 'react-redux';
import { ActionCreators as UndoActionCreators } from 'redux-undo';

import Bead from './bead';
import Button from './button';
import ButtonToggle from './buttonToggle';
import Icon from './icon';
import Swatch from './swatch';
import { getSessionItem } from '../util/canvas';
import { colors, uiColors, paletteColors } from '../util/colors';
import {
  CELL_SIZE,
  GRID_TYPES,
  TOOL_TYPES,
  COLOR_MODES,
} from '../util/constants';
import {
  changeColor,
  changeColorMode,
  changeGridType,
  changeToolType,
} from '../store/actions';

const colorModeOptions = Object.keys(COLOR_MODES).map(type => ({
  label: COLOR_MODES[type],
  value: type,
}));
const gridTypeOptions = Object.keys(GRID_TYPES).map(type => ({
  label: GRID_TYPES[type],
  value: type,
}));
const toolTypeOptions = Object.keys(TOOL_TYPES).map(type => ({
  label: TOOL_TYPES[type],
  value: type,
}));

// styled components
const ButtonGroup = styled.div`
  display: flex;
  flex-flow: row nowrap;
`;
const ColorInfo = styled.div`
  align-items: center;
  display: flex;
  margin: 1em 0.5em 1em;
  padding-bottom: 2em;
  border-bottom: 1px solid ${colors.lightGray};
`;
const ColorInfoTextWrapper = styled.div`
  display: flex;
  flex-flow: column nowrap;
  height: 100%;
  justify-content: center;
  margin-left: 1em;
`;
const ColorInfoText = styled.p`
  color: ${colors.gray};
  display: block;
  font-size: 0.75em;
  font-weight: 600;
  letter-spacing: 0.04em;
  margin: 0.2em 0;
  text-transform: uppercase;
  user-select: none;
`;
const ColorPalette = styled.div`
  display: flex;
  flex-flow: row wrap;
  margin: 0.5em 0 0 0em;
`;
const Container = styled.div`
  padding: 0.25em 1.25em;
  height: 100%;
  width: ${CELL_SIZE * 11}px;
  z-index: 3;
`;
const GridIcon = styled(Icon)`
  left: 0.8em;
  position: absolute;
  top: 0.6em;
  z-index: 0;
`;
const Label = styled.p`
  color: ${colors.darkGray};
  font-size: 0.75em;
  font-weight: 500;
  letter-spacing: 0.04em;
  margin: 2em 0.5em 0.5em;
  text-transform: uppercase;
  user-select: none;
`;

const ControlPanel = ({
  canRedo,
  canUndo,
  color,
  colorMode,
  gridType,
  onColorModeToggle,
  onGridTypeToggle,
  onReset,
  onSave,
  onSaveWithGrid,
  onSwatchClick,
  onToolTypeToggle,
  redo,
  showBeadInfo,
  showSaveWithGrid,
  toolType,
  undo,
}) => {
  return (
    <Container
      style={{
        background: `${uiColors[`${colorMode.toLowerCase()}Background`]}`,
      }}
    >
      {showBeadInfo && (
        <ColorInfo>
          <Bead color={color.hex} />
          <ColorInfoTextWrapper>
            <ColorInfoText>{color.name}</ColorInfoText>
            <ColorInfoText>{color.code}</ColorInfoText>
          </ColorInfoTextWrapper>
        </ColorInfo>
      )}
      <Label>Tool</Label>
      <ButtonToggle
        colorMode={colorMode}
        onClick={onToolTypeToggle}
        options={toolTypeOptions}
        value={toolType}
      />
      {showBeadInfo && (
        <>
          <Label>Grid Style</Label>
          <ButtonToggle
            colorMode={colorMode}
            onClick={onGridTypeToggle}
            options={gridTypeOptions}
            value={gridType}
          />
        </>
      )}
      <Label>History</Label>
      <ButtonGroup>
        <Button
          colorMode={colorMode}
          label="New"
          onClick={onReset}
        >
          <Icon name="new" />
        </Button>
        <Button
          colorMode={colorMode}
          disabled={!canUndo}
          label="Undo"
          onClick={undo}
        >
          <Icon name="back" />
        </Button>
        <Button
          colorMode={colorMode}
          disabled={!canRedo}
          label="Redo"
          onClick={redo}
        >
          <Icon name="forward" />
        </Button>
        <Button
          colorMode={colorMode}
          label="Save"
          onClick={onSave}
        >
          <Icon name="save" />
        </Button>
        {showSaveWithGrid && (
          <Button
            colorMode={colorMode}
            label="Save With Grid"
            onClick={onSaveWithGrid}
            style={{ position: 'relative' }}
          >
            <GridIcon
              name={gridType.toLowerCase()}
              size={8}
            />
            <Icon
              name="save"
              style={{ zIndex: 1 }}
            />
          </Button>
        )}
      </ButtonGroup>
      <Label>Colors</Label>
      <ColorPalette>
        {paletteColors.map(paletteColor => (
          <Swatch
            color={paletteColor}
            colorMode={colorMode}
            isSelected={paletteColor.hex === color.hex}
            key={`Swatch-${paletteColor.hex}`}
            onClick={onSwatchClick}
          />
        ))}
      </ColorPalette>
      <Label>Theme</Label>
      <ButtonToggle
        colorMode={colorMode}
        onClick={onColorModeToggle}
        options={colorModeOptions}
        value={colorMode}
      />
    </Container>
  );
}

ControlPanel.propTypes = {
  color: PropTypes.shape({
    hex: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
  }).isRequired,
  onReset: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
  onSaveWithGrid: PropTypes.func.isRequired,
  showBeadInfo: PropTypes.bool,
  showSaveWithGrid: PropTypes.bool,
};
ControlPanel.defaultProps = {
  showBeadInfo: false,
  showSaveWithGrid: false,
};

const mapStateToProps = ({
  canvas,
  color,
  colorMode,
  gridType,
  toolType,
}) => {
  let sessionColor = getSessionItem('color');
  return {
    canRedo: canvas.future.length > 0,
    canUndo: canvas.past.length > 0,
    colorMode: getSessionItem('colorMode') || colorMode,
    color: sessionColor ? JSON.parse(sessionColor) : color,
    gridType: getSessionItem('gridType') || gridType,
    toolType: getSessionItem('toolType') || toolType,
  };
};
const mapDispatchToProps = dispatch => {
  return {
    onColorModeToggle: (ev, toggleOption) => dispatch(changeColorMode(toggleOption.label)),
    onGridTypeToggle: (ev, toggleOption) => dispatch(changeGridType(toggleOption.label)),
    onToolTypeToggle: (ev, toggleOption) => dispatch(changeToolType(toggleOption.label)),
    onSwatchClick: (color) => dispatch(changeColor(color)),
    redo: () => dispatch(UndoActionCreators.redo()),
    undo: () => dispatch(UndoActionCreators.undo()),
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(ControlPanel);
