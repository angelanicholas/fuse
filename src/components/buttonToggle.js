import React, { Component } from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import ButtonComponent from './button';
import { colors } from '../util/colors';

// styled components
const Container = styled.div`
  display: flex;
  flex-flow: row nowrap;
  margin-bottom: 1em;
  width: 100%;
`;
const Button = styled(ButtonComponent)`
  background-color: ${props => props.color};
  color: ${props => props.textColor};
  text-decoration: ${props => (props.isActive ? 'underline' : 'none')};
  flex: 1;
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

class ButtonToggle extends Component {
  constructor(props) {
    super(props);
    this.state = {
      activeIndex: props.activeIndex,
    };
    this.handleClick = this.handleClick.bind(this);
  }

  handleClick(ev, option, i) {
    this.setState({ activeIndex: i });
    this.props.onClick(ev, option);
  }

  render() {
    const {
      color,
      options,
      onClick,
      textColor,
      ...rest
    } = this.props;
    const { activeIndex } = this.state;

    return (
      <Container {...rest}>
        {options.map((option, i) => (
          <Button
            color={color}
            isActive={activeIndex === i}
            key={`toggleButton-${option.label || option.value}`}
            label={option.label || option.value}
            onClick={ev => this.handleClick(ev, option, i)}
            textColor={textColor}
            value={option.value}
          >
            {option.label || option.value}
          </Button>
        ))}
      </Container>
    );
  }
}

ButtonToggle.propTypes = {
  activeIndex: PropTypes.number.isRequired,
  color: PropTypes.string,
  onClick: PropTypes.func.isRequired,
  options: PropTypes.arrayOf(PropTypes.shape({
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    label: PropTypes.string,
  })).isRequired,
  textColor: PropTypes.string,
};
ButtonToggle.defaultProps = {
  color: colors.white,
  textColor: colors.darkGray,
};

export default ButtonToggle;
