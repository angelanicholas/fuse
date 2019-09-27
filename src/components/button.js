import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { COLOR_MODES } from '../util/constants';
import { uiColors } from '../util/colors';

const Container = styled.button`
  align-items: center;
  appearance: none;
  -moz-appearance: none;
  -webkit-appearance: none;
  background-color: transparent;
  border: none;
  border-radius: 0.5em;
  cursor: pointer;
  color: ${p => uiColors[`${p.colorMode.toLowerCase()}Text${p.isActive ? 'Active' : ''}`]};
  display: flex;
  font-size: 0.8em;
  font-weight: 500;
  justify-content: center;
  letter-spacing: 0.1em;
  outline: none;
  overflow: hidden;
  padding: 0.75em;
  text-transform: uppercase;
  user-select: none;
  &:focus,
  &:hover {
    color: ${p => uiColors[`${p.colorMode.toLowerCase()}TextHover`]};
  }
  &:disabled {
    color: ${p => uiColors[`${p.colorMode.toLowerCase()}TextDisabled`]};
    cursor: default;
  }
`;

const Button = ({
  children,
  label,
  ...rest,
}) => (
  <Container
    aria-label={label}
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
  colorMode: COLOR_MODES.day,
  isActive: false,
  type: 'button',
};

export default Button;
