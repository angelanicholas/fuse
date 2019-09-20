import React from 'react';
import PropTypes from 'prop-types';
import stylePropType from 'react-style-proptype';
import styled from 'styled-components';
import { colors } from '../util/colors';

const Container = styled.button`
  align-items: center;
  appearance: none;
  -moz-appearance: none;
  -webkit-appearance: none;
  background-color: ${props => props.color};
  border: none;
  border-radius: 0.5em;
  color: ${props => props.textColor};
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
    color: ${colors.darkestGray};
  }
  &:disabled {
    color: ${colors.lightGray};
    pointer-events: none;
  }
`;

const Button = ({ children, label, ...rest }) => (
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
  color: PropTypes.string,
  label: PropTypes.string.isRequired,
  onClick: PropTypes.func.isRequired,
  style: stylePropType,
  textColor: PropTypes.string,
  type: PropTypes.oneOf(['button', 'submit', 'reset']),
};
Button.defaultProps = {
  color: 'transparent',
  style: {},
  textColor: colors.gray,
  type: 'button',
};

export default Button;
