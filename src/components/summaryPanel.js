import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { connect } from 'react-redux';
import isEmpty from 'lodash/isEmpty';
import orderBy from 'lodash/orderBy';
import Bead from './bead';
import { changeColor } from '../store/actions';
import { colors, perlerColors, perlerHexStrings } from '../util/colors';
import { CELL_SIZE } from '../util/constants';
import { canvasQuotes } from '../util/canvas';

// styled components
const BeadSummary = styled.div`
  align-items: center;
  cursor: pointer;
  display: flex;
  flex-flow: row nowrap;
  padding: 1em;
`;
const Container = styled.div`
  background-color: ${colors.white};
  bottom: 0;
  box-shadow: 0 0 0.25em ${colors.mediumLightGray};
  display: flex;
  flex-flow: column nowrap;
  overflow-y: auto;
  overflow-x: none;
  padding: 0.5em 1em;
  position: absolute;
  right: 0;
  top: 0;
  width: ${CELL_SIZE * 12}px;
`;
const Text = styled.p`
  color: ${colors.gray};
  font-size: 0.75em;
  font-weight: 600;
  letter-spacing: 0.04em;
  margin-left: 1em;
  text-transform: uppercase;
  user-select: none;
`;
const TextWrapper = styled.div`
  display: flex;
  flex-flow: row nowrap;
  justify-content: space-between;
  width: 100%;
`;
const QuoteText = styled.p`
  color: ${colors.gray};
  font-size: 0.9em;
  font-weight: 500;
  letter-spacing: 0.02em;
  line-height: 1.6;
  margin: 2em 1em 0 1em;
  text-align: center;
  user-select: none;
`;

function getUsedColors(canvas) {
  const usedColors = {};
  canvas.forEach((row) => {
    for (let i = 0; i < row.length; i += 1) {
      const beadColor = row[i];
      if (beadColor === null) continue; // eslint-disable-line
      if (usedColors[beadColor]) {
        usedColors[beadColor].quantity += 1;
      } else {
        usedColors[beadColor] = {
          color: beadColor,
          name: perlerColors.find(perlerColor => perlerColor.hex === beadColor).name,
          quantity: 1,
        };
      }
    }
  });
  return usedColors;
}

const SummaryPanel = ({ canvas, handleBeadSummaryClick, usedColors }) => {
  const canvasColors = usedColors || getUsedColors(canvas);
  const isCanvasEmpty = isEmpty(canvasColors);
  const quote = canvasQuotes[Math.floor(Math.random() * canvasQuotes.length)];
  const sortedCanvasColors = orderBy(canvasColors, 'quantity', 'desc');
  return (
    <Container>
      {isCanvasEmpty ? (
        <>
          <QuoteText>{quote.text}</QuoteText>
          <QuoteText>— {quote.author}</QuoteText>
        </>
      ) : Object.values(sortedCanvasColors).map(({ color, name, quantity }) => (
        <BeadSummary
          key={`beadSummary-${color}`}
          onClick={() => handleBeadSummaryClick(perlerColors.find(perlerColor => perlerColor.hex === color))}
        >
          <Bead color={color} size={1.5} />
          <TextWrapper>
            <Text>{name}</Text>
            <Text>{quantity}</Text>
          </TextWrapper>
        </BeadSummary>
      ))}
    </Container>
  );
}

SummaryPanel.propTypes = {
  usedColors: PropTypes.shape({
    [PropTypes.oneOf(perlerHexStrings)]: PropTypes.shape({
      color: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      quantity: PropTypes.number.isRequired,
    })}),
};

const mapStateToProps = ({ canvas }) => {
  return {
    canvas: canvas.present,
  };
};
const mapDispatchToProps = dispatch => {
  return {
    handleBeadSummaryClick: (color) => dispatch(changeColor(color)),
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(SummaryPanel);
