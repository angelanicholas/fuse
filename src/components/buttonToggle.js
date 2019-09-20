import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import ButtonComponent from './button';
import Icon from './icon';
import { colors } from '../util/colors';

// styled components
const Container = styled.div`
  display: flex;
  flex-flow: row nowrap;
  width: 100%;
`;
const Button = styled(ButtonComponent)`
  background-color: ${props => props.color};
  color: ${props => props.textColor};
  text-decoration: ${props => (props.isActive ? 'underline' : 'none')};
  &:focus,
  &:hover {
    color: ${colors.darkestGray};
  }
  &:first-child {
    border-top-right-radius: 0;
    border-bottom-right-radius: 0;
    border-right: 0;
  }
  &:last-child {
    border-top-left-radius: 0;
    border-bottom-left-radius: 0;
  }
  &:not(:first-child):not(:last-child) {
    border-radius: 0;
    border-right: 0;
  }
`;

const ButtonToggle = ({
  color,
  options,
  onClick,
  textColor,
  value,
  ...rest
}) => (
  <Container {...rest}>
    {options.map(option => (
      <Button
        color={color}
        isActive={value === option.value}
        key={`toggleButton-${option.label || option.value}`}
        label={option.label || option.value}
        onClick={ev => onClick(ev, option)}
        textColor={textColor}
        value={option.value}
      >
        {option.iconName ? (
          <Icon
            name={option.iconName}
            color={value === option.value ? colors.darkestGray : 'currentColor'}
          />
        ) : option.label || option.value}
      </Button>
    ))}
  </Container>
);

ButtonToggle.propTypes = {
  color: PropTypes.string,
  onClick: PropTypes.func.isRequired,
  options: PropTypes.arrayOf(PropTypes.shape({
    iconName: PropTypes.string,
    label: PropTypes.string,
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  })).isRequired,
  textColor: PropTypes.string,
  value: PropTypes.string.isRequired,
};
ButtonToggle.defaultProps = {
  color: 'transparent',
  textColor: colors.gray,
};

export default ButtonToggle;
