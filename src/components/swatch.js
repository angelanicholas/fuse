import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { colors } from '../util/colors';

// styled components
const Container = styled.div`
  background-color: ${p => p.hex};
  border-radius: ${p => p.size / 2}px;
  cursor: pointer;
  height: ${p => p.size}px;
  margin: 0 0.4em 0.4em 0;
  position: relative;
  width: ${p => p.size}px;
  &:before {
    content: '';
    background-color: transparent;
    border: ${p => `${p.borderWidth}px solid ${p.isSelected ? colors.white : 'transparent'}`};
    border-radius: ${p => (p.size - p.borderWidth) / 2}px;
    box-sizing: border-box;
    position: absolute;
    top: ${p => p.borderWidth}px;
    left: ${p => p.borderWidth}px;
    height: ${p => p.size - p.borderWidth * 2}px;
    width: ${p => p.size - p.borderWidth * 2}px;
  }
`;

const Swatch = ({
  color,
  isSelected,
  onClick,
  size,
}) => (
  <Container
    borderWidth={Math.floor(size / 10)}
    hex={color.hex}
    isSelected={isSelected}
    onClick={() => onClick(color)}
    size={size}
    title={color.name}
  />
);

Swatch.propTypes = {
  color: PropTypes.shape({
    hex: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
  }).isRequired,
  isSelected: PropTypes.bool.isRequired,
  size: PropTypes.number,
  onClick: PropTypes.func.isRequired,
};

Swatch.defaultProps = {
  size: 22,
};

export default Swatch;
