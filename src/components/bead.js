import React from 'react';
import PropTypes from 'prop-types';
import tinycolor from 'tinycolor2';
import styled, { css } from 'styled-components';

// shared styles
const borderRadiusStyles = css`
  border-radius: ${p => p.size * 2}em / ${p => p.size}em;
`;
// styled components
const Container = styled.div`
  ${borderRadiusStyles}
  background-image: linear-gradient(to right, ${p => p.dark8}, ${p => p.light3}, ${p => p.dark8});
  box-shadow: 0 0 2em rgba(0, 0, 0, 0.02);
  display: inline-block;
  flex: none;
  height: ${p => p.size * 1.3}em;
  position: relative;
  width: ${p => p.size}em;
  &:before {
    ${borderRadiusStyles}
    background-color: ${p => p.color};
    content: '';
    height: ${p => p.size / 2}em;
    left: 0;
    position: absolute;
    top: -0.05em;
    width: ${p => p.size}em;
  }
  &:after {
    background-color: ${p => p.dark10};
    background-image: linear-gradient(to bottom, ${p => p.dark10}, ${p => p.dark14});
    border-radius: ${p => p.size * 1.25}em / ${p => p.size / 2}em;
    content: '';
    height: ${p => p.size / 4.5}em;
    left: calc(50% - ${p => p.size / 3.5}em);
    position: absolute;
    top: ${p => p.size / 8}em;
    width: ${p => p.size / 1.75}em;
  }
`;

const Bead = ({ color, size }) => (
  <Container
    color={color}
    dark8={tinycolor(color).darken(8).toHexString()}
    dark10={tinycolor(color).darken(10).toHexString()}
    dark14={tinycolor(color).darken(14).toHexString()}
    light3={tinycolor(color).lighten(3).toHexString()}
    size={size}
  />
);

Bead.propTypes = {
  color: PropTypes.string.isRequired,
  size: PropTypes.number,
};
Bead.defaultProps = {
  size: 2.5,
};

export default Bead;
