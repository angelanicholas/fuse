import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { uiColors } from '../util/colors';
import { COLOR_MODES } from '../util/constants';

const Container = styled.button`
  align-items: center;
  appearance: none;
  -moz-appearance: none;
  -webkit-appearance: none;
  background-color: transparent;
  border: none;
  border-radius: 0.5em;
  color: ${uiColors[`${p => p.colorMode}Text${p => p.isActive ? 'Active' : ''}`]};
  cursor: pointer;
  display: flex;
  font-size: 0.8em;
  font-weight: 500;
  justify-content: center;
  letter-spacing: 0.1em;
  outline: none;
  overflow: hidden;
  padding: 0.75em;
  text-transform: uppercase;
  transition: color 0.5s ease;
  user-select: none;
  &:focus,
  &:hover {
    color: ${uiColors[`${p => p.colorMode}TextHover`]};
  }
  &:disabled {
    color: ${uiColors[`${p => p.colorMode}TextDisabled`]};
    pointer-events: none;
  }
`;

const Button = ({
  children,
  colorMode,
  label,
  ...rest,
}) => (
  <Container
    aria-label={label}
    colorMode={colorMode.toLowerCase()}
    title={label}
    {...rest}
  >
    {children}
  </Container>
);

Button.propTypes = {
  children: PropTypes.node.isRequired,
  colorMode: PropTypes.oneOf(Object.values(COLOR_MODES)),
  isActive: PropTypes.bool,
  label: PropTypes.string.isRequired,
  onClick: PropTypes.func.isRequired,
  type: PropTypes.oneOf(['button', 'submit', 'reset']),
};
Button.defaultProps = {
  colorMode: COLOR_MODES.night,
  isActive: false,
  type: 'button',
};

export default Button;
