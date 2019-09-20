import React, { useState } from 'react';
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
import { colors, perlerColors } from '../util/colors';
import { changeColor, changeGridType, changeToolType } from '../store/actions';
import {
  CELL_SIZE,
  GRID_TYPES,
  TOOL_TYPES,
} from '../util/constants';

const gridTypeOptions = Object.values(GRID_TYPES).map(type => ({
  iconName: type.toLowerCase(),
  value: type,
}));
const toolTypeOptions = Object.values(TOOL_TYPES).map(type => ({
  iconName: type.toLowerCase(),
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
  margin: 1em 0 0 0em;
  /* white swatch needs extra border for visibility */
  .swatchContainer:last-child .swatchIcon {
    border: 1px solid ${colors.lightGray};
    box-sizing: border-box;
    &:before {
      left: 1px;
      top: 1px;
    }
  }
`;
const Container = styled.div`
  background-color: ${colors.white};
  bottom: 0;
  box-shadow: 0 0 0.25em ${colors.mediumLightGray};
  display: flex;
  flex-flow: column nowrap;
  padding: 1em 1.5em;
  position: absolute;
  top: 0;
  width: ${CELL_SIZE * 12}px;
  left: 0;
`;
const GridIcon = styled(Icon)`
  left: 0.8em;
  position: absolute;
  top: 0.6em;
  z-index: 0;
`;
const Label = styled.p`
  color: ${colors.gray};
  font-size: 0.75em;
  font-weight: 500;
  letter-spacing: 0.04em;
  margin: 1.5em 0.5em 0.5em;
  text-transform: uppercase;
  user-select: none;
`;

const ControlPanel = ({
  canRedo,
  canUndo,
  color,
  gridType,
  onGridTypeToggle,
  onReset,
  onSave,
  onSaveWithGrid,
  onSwatchClick,
  onToolTypeToggle,
  redo,
  toolType,
  undo,
}) => {
  const [hoveredColor, setHoveredColor] = useState(null);
  const beadColor = hoveredColor || color;
  return (
    <Container>
      <ColorInfo>
        <Bead color={beadColor.hex} />
        <ColorInfoTextWrapper>
          <ColorInfoText>{beadColor.name}</ColorInfoText>
          <ColorInfoText>{beadColor.code}</ColorInfoText>
        </ColorInfoTextWrapper>
      </ColorInfo>
      <Label>Grid Style</Label>
      <ButtonToggle
        onClick={onGridTypeToggle}
        options={gridTypeOptions}
        value={gridType}
      />
      <Label>Tool</Label>
      <ButtonToggle
        onClick={onToolTypeToggle}
        options={toolTypeOptions}
        value={toolType}
      />
      <Label>History</Label>
      <ButtonGroup>
        <Button
          label="New"
          onClick={onReset}
        >
          <Icon name="new" />
        </Button>
        <Button
          disabled={!canUndo}
          label="Undo"
          onClick={undo}
        >
          <Icon name="back" />
        </Button>
        <Button
          disabled={!canRedo}
          label="Redo"
          onClick={redo}
        >
          <Icon name="forward" />
        </Button>
        <Button
          label="Save"
          onClick={onSave}
        >
          <Icon name="save" />
        </Button>
        <Button
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
      </ButtonGroup>
      <Label>Perler Colors</Label>
      <ColorPalette>
        {perlerColors.map(perlerColor => (
          <Swatch
            color={perlerColor}
            isSelected={perlerColor.hex === color.hex}
            key={`Swatch-${perlerColor.hex}`}
            onClick={onSwatchClick}
            onMouseOver={() => setHoveredColor(perlerColor)}
            onMouseOut={() => setHoveredColor(null)}
          />
        ))}
      </ColorPalette>
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
};

const mapStateToProps = ({
  canvas,
  color,
  gridType,
  toolType,
}) => {
  let sessionColor = getSessionItem('color');
  return {
    canRedo: canvas.future.length > 0,
    canUndo: canvas.past.length > 0,
    color: sessionColor ? JSON.parse(sessionColor) : color,
    gridType: getSessionItem('gridType') || gridType,
    toolType: getSessionItem('toolType') || toolType,
  };
};
const mapDispatchToProps = dispatch => {
  return {
    onGridTypeToggle: (ev, toggleOption) => dispatch(changeGridType(toggleOption.value)),
    onToolTypeToggle: (ev, toggleOption) => dispatch(changeToolType(toggleOption.value)),
    onSwatchClick: (color) => dispatch(changeColor(color)),
    redo: () => dispatch(UndoActionCreators.redo()),
    undo: () => dispatch(UndoActionCreators.undo()),
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(ControlPanel);
