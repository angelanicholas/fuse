import React from 'react';
import styled from 'styled-components';
import PixelArtEditor from './components/pixelArtEditor';
import { colors } from './util/colors';
import './App.css';

const Container = styled.div`
  background-color: ${colors.lightGray};
  height: 100vh;
  overflow: hidden;
  pointer-events: all;
  position: relative;
  width: 100vw;
`;

function App() {
  return (
    <Container id="scrollContainer" className="App">
      <PixelArtEditor />
    </Container>
  );
}

export default App;
