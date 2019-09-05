import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { connect } from 'react-redux';
import { ActionCreators as UndoActionCreators } from 'redux-undo';

import Bead from './bead';
import ButtonComponent from './button';
import ButtonToggle from './buttonToggle';
import Icon from './icon';
import Swatch from './swatch';
import { changeColor, changeGridType, changeToolType } from '../store/actions';
import { colors, perlerColors } from '../util/colors';
import { CELL_SIZE, GRID_TYPES, TOOL_TYPES } from '../util/constants';

const gridTypeOptions = Object.values(GRID_TYPES).map(type => ({
  iconName: type.toLowerCase(),
  value: type,
}));
const toolTypeOptions = Object.values(TOOL_TYPES).map(type => ({
  iconName: type.toLowerCase(),
  value: type,
}));

// styled components
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
const ColorInfoText = styled.p`
  color: ${colors.darkGray};
  font-size: 1em;
  flex: 0.8;
  margin-left: 1em;
`;
const ColorPalette = styled.div`
  display: flex;
  flex-flow: row wrap;
  margin-bottom: 1em;
`;
const Container = styled.div`
  background-color: ${colors.white};
  bottom: 0;
  box-shadow: 0 0 0.2em ${colors.transparentBlack};
  display: flex;
  flex-flow: column nowrap;
  padding: 0.5em 1em;
  position: absolute;
  top: 0;
  width: ${CELL_SIZE * 12}px;
  left: 0;
`;

const ControlPanel = ({
  canRedo,
  canUndo,
  color,
  gridType,
  onGridTypeToggle,
  onReset,
  onSave,
  onSwatchClick,
  onToolTypeToggle,
  redo,
  toolType,
  undo,
}) => {
  return (
    <Container>
      <ButtonGroup>
        <Button
          disabled={!canUndo}
          label="Undo Action"
          onClick={undo}
        >
          <Icon name="back" />
        </Button>
        <Button
          disabled={!canRedo}
          label="Redo Action"
          onClick={redo}
        >
          <Icon name="forward" />
        </Button>
        <Button
          label="Download Canvas"
          onClick={onSave}
        >
          <Icon name="save" />
        </Button>
        <Button
          label="Reset Canvas"
          onClick={onReset}
        >
          <Icon name="reset" />
        </Button>
      </ButtonGroup>
      <ButtonToggle
        activeIndex={gridTypeOptions.findIndex(o => o.value === gridType)}
        onClick={onGridTypeToggle}
        options={gridTypeOptions}
      />
      <ButtonToggle
        activeIndex={toolTypeOptions.findIndex(o => o.value === toolType)}
        onClick={onToolTypeToggle}
        options={toolTypeOptions}
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
            onClick={onSwatchClick}
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
};

const mapStateToProps = ({
  canvas,
  color,
  gridType,
  toolType,
}) => {
  return {
    canRedo: canvas.future.length > 0,
    canUndo: canvas.past.length > 0,
    color,
    gridType,
    toolType,
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
