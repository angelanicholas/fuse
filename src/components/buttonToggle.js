import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import ButtonComponent from './button';
import Icon from './icon';
import { COLOR_MODES } from '../util/constants';

// styled components
const Container = styled.div`
  display: flex;
  flex-flow: row nowrap;
  width: 100%;
`;
const Button = styled(ButtonComponent)`
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
  colorMode,
  options,
  onClick,
  textColor,
  value,
  ...rest
}) => {
  return (
    <Container {...rest}>
      {options.map(option => (
        <Button
          colorMode={colorMode}
          isActive={value === option.label}
          key={`toggleButton-${option.label || option.value}`}
          label={option.label || option.value}
          onClick={ev => onClick(ev, option)}
        >
          <Icon name={option.value} />
        </Button>
      ))}
    </Container>
  );
}

ButtonToggle.propTypes = {
  colorMode: PropTypes.oneOf(Object.values(COLOR_MODES)).isRequired,
  onClick: PropTypes.func.isRequired,
  options: PropTypes.arrayOf(PropTypes.shape({
    iconName: PropTypes.string,
    label: PropTypes.string,
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  })).isRequired,
  value: PropTypes.string.isRequired,
};

export default ButtonToggle;
