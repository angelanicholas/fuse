import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { connect } from 'react-redux';
import isEmpty from 'lodash/isEmpty';
import Bead from './bead';
import { colors, perlerColors, perlerHexStrings } from '../util/colors';
import { CELL_SIZE } from '../util/constants';
import { canvasQuotes } from '../util/canvas';

// styled components
const BeadSummary = styled.div`
  align-items: center;
  display: flex;
  flex-flow: row nowrap;
  padding: 1em;
`;
const Text = styled.p`
  color: ${colors.darkGray};
  font-size: 1em;
  flex: 0.8;
  margin-left: 1em;
`;
const Container = styled.div`
  background-color: ${colors.white};
  bottom: 0;
  box-shadow: 0 0 0.2em ${colors.transparentBlack};
  display: flex;
  flex-flow: column nowrap;
  overflow-y: scroll;
  overflow-x: none;
  padding: 0.5em 1em;
  position: absolute;
  right: 0;
  top: 0;
  width: ${CELL_SIZE * 12}px;
`;
const InfoText = styled.p`
  color: ${colors.mediumLightGray};
  font-size: 0.9em;
  font-weight: 500;
  letter-spacing: 0.02em;
  line-height: 1.6;
  margin: 2em 1em 0 1em;
  text-align: center;
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

const SummaryPanel = ({ canvas, usedColors }) => {
  const canvasColors = usedColors || getUsedColors(canvas);
  const isCanvasEmpty = isEmpty(canvasColors);
  const quote = isCanvasEmpty ? canvasQuotes[Math.floor(Math.random() * canvasQuotes.length)] : {};

  return (
    <Container>
      {isCanvasEmpty ? (
        <>
          <InfoText>{quote.text}</InfoText>
          <InfoText>— {quote.author}</InfoText>
        </>
      ) : Object.values(canvasColors).map(bead => (
        <BeadSummary key={`beadSummary-${bead.color}`}>
          <Bead color={bead.color} size={1.8} />
          <Text>{bead.name}</Text>
          <Text>{bead.quantity}</Text>
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

export default connect(mapStateToProps)(SummaryPanel);
