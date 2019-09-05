import React from 'react';
import PropTypes from 'prop-types';
import stylePropType from 'react-style-proptype';

const iconPaths = {
  back: 'M25.8.8c1 1 1 2.6 0 3.6L8.7 21.5h36.8c1.4 0 2.5 1.1 2.5 2.5s-1.1 2.5-2.5 2.5H8.6l17.1 17.1c1 1 1 2.6 0 3.6s-2.6 1-3.6 0L.7 25.8c-.5-.5-.7-1-.7-1.8s.3-1.3.7-1.8L22.2.8c1-1 2.6-1 3.6 0zM46.4 76.9c0-1.4-1.1-2.5-2.5-2.5a2.5 2.5 0 0 0-2.5 2.5v7.5H4.5v-7.5c0-1.4-1.1-2.5-2.5-2.5a2.5 2.5 0 0 0-2.5 2.5V87c0 1.4 1.1 2.5 2.5 2.5h41.9c1.4 0 2.5-1.1 2.5-2.5V76.9z',
  bucket: 'M47.4 34.8L45 26.1l-.3-1.1-.1-.2-.1-.3c-1-2.4-2.9-3.3-4.8-4.2-1.4-.6-2.9-1.3-4.2-2.7L24.6 6.7c-.3-3.4-3.1-6-6.6-6h-2.2c-3.6 0-6.6 3-6.6 6.6v11.5l-7 7a7.7 7.7 0 0 0 .1 10.9l8.3 8.3a7.6 7.6 0 0 0 5.5 2.3c2.1 0 4-.8 5.5-2.3l19.1-19 .3.2-2.1 8.5c-.4 1.2-.7 2.6-.7 4 0 4.3 2.9 6.2 4.9 6.2S48 43 48 38.7c0-1.4-.2-2.8-.6-3.9zm-28.5 7.6a4.2 4.2 0 0 1-5.7 0l-8.3-8.3a4 4 0 0 1-1.2-2.8c0-1 .4-2.1 1.2-2.8l15.9-15.9v7.8a4 4 0 0 0-2.1 3.6l.3 1.5c.3.8.8 1.4 1.5 1.8a4 4 0 0 0 6.3-3.3c0-1.5-.9-2.9-2.2-3.6V12L37 24.4l-18.1 18zm-3-38H18c1.5 0 2.8 1.2 2.8 2.8L13 15V7.2c0-1.5 1.3-2.8 2.9-2.8z',
  eyedropper: 'M46.1 1.9a6.36 6.36 0 0 0-9.1 0L26.5 12.4l-1.1-1.1c-.5-.5-1-.7-1.6-.8h-1.2c-.6.1-1.1.4-1.6.8-.2.2-.4.5-.5.7 0 .1-.1.2-.1.3-.1.3-.2.6-.2.9v.3c0 .2 0 .4.1.6.1.3.2.6.3.8s.3.5.5.7l.7.7L3.5 34.7c-.2.2-.4.5-.5.8L.3 42c-.5 1.3-.4 2.9.4 4.1A4.5 4.5 0 0 0 4.3 48c.6 0 1.1-.1 1.6-.3l6.5-2.6c.3-.1.6-.3.8-.5l18.3-18.3.7.7c.1.1.2.1.2.2.2.1.3.2.5.3.4.2.9.4 1.4.4.3 0 .6 0 .9-.1a3 3 0 0 0 1.1-.6c.1-.1.2-.1.2-.2.4-.4.6-.8.8-1.3.1-.4.2-.8.1-1.2 0-.2-.1-.4-.1-.6-.1-.2-.1-.4-.2-.6-.1-.3-.3-.5-.5-.7l-1.1-1.1L46.1 11c2.5-2.5 2.5-6.6 0-9.1zM10.3 40.7l-5 2 2-5 18-18 3 3-18 18z',
  forward: 'M22.2 47.2c-1-1-1-2.6 0-3.6l17.1-17.1H2.5C1.1 26.5 0 25.4 0 24s1.1-2.5 2.5-2.5H39.4L22.3 4.3c-1-1-1-2.6 0-3.6s2.6-1 3.6 0l21.4 21.4c.5.5.7 1.1.7 1.8s-.3 1.3-.7 1.8L25.8 47.2c-1 1-2.6 1-3.6 0zM46.4 76.9c0-1.4-1.1-2.5-2.5-2.5a2.5 2.5 0 0 0-2.5 2.5v7.5H4.5v-7.5c0-1.4-1.1-2.5-2.5-2.5a2.5 2.5 0 0 0-2.5 2.5V87c0 1.4 1.1 2.5 2.5 2.5h41.9c1.4 0 2.5-1.1 2.5-2.5V76.9z',
  grid: 'M48 2.4s0-.1 0 0v-.3l-.1-.3C47.6.8 46.7 0 45.5 0h-43-.1-.1-.1l-.3.1A2.5 2.5 0 0 0 0 2.5V45.9l.1.3c.3 1 1.2 1.8 2.4 1.8H45.9l.3-.1a2.4 2.4 0 0 0 1.8-2.4V2.4c0 .1 0 0 0 0zM38 5h5v16.5H26.5V5H38zM21.3 5h.2v16.5H5V5h16.3zM10 43H5V26.5h16.5V43H10zm16.7 0h-.2V26.5H43V43H26.7z',
  peg: 'M4.2,0c2.3,0,4.2,1.9,4.2,4.2S6.5,8.4,4.2,8.4S0,6.5,0,4.2S1.9,0,4.2,0z M24,0c2.3,0,4.2,1.9,4.2,4.2S26.3,8.4,24,8.4s-4.2-1.9-4.2-4.2S21.7,0,24,0z M4.2,19.8c2.3,0,4.2,1.9,4.2,4.2s-1.9,4.2-4.2,4.2S0,26.3,0,24S1.9,19.8,4.2,19.8z M43.8,0C46.1,0,48,1.9,48,4.2s-1.9,4.2-4.2,4.2s-4.2-1.9-4.2-4.2S41.5,0,43.8,0z M43.8,19.8c2.3,0,4.2,1.9,4.2,4.2s-1.9,4.2-4.2,4.2s-4.2-1.9-4.2-4.2S41.5,19.8,43.8,19.8z M24,19.8c2.3,0,4.2,1.9,4.2,4.2s-1.9,4.2-4.2,4.2s-4.2-1.9-4.2-4.2S21.7,19.8,24,19.8z M4.2,39.6c2.3,0,4.2,1.9,4.2,4.2c0,2.3-1.9,4.2-4.2,4.2S0,46.1,0,43.8C0,41.5,1.9,39.6,4.2,39.6z M24,39.6c2.3,0,4.2,1.9,4.2,4.2S26.3,48,24,48s-4.2-1.9-4.2-4.2S21.7,39.6,24,39.6z M43.8,39.6c2.3,0,4.2,1.9,4.2,4.2S46.1,48,43.8,48s-4.2-1.9-4.2-4.2S41.5,39.6,43.8,39.6z',
  pencil: 'M46.6 6.5l-5.1-5.1C40.5.5 39.3 0 38 0c-1.3 0-2.5.5-3.4 1.4L2.9 33.1c-.8.8-1.3 1.7-1.5 2.8L.1 42.7c-.3 1.3 0 2.7.9 3.7S3.2 48 4.5 48c.3 0 .5 0 .8-.1l6.8-1.3c1.1-.2 2-.7 2.8-1.5l31.7-31.7c1.9-1.9 1.9-5 0-6.9zm-42 37.9h-.2c-.2 0-.4-.1-.6-.3-.2-.2-.2-.5-.2-.7l1.1-5.5 5.4 5.4-5.5 1.1zm8.8-3l-6.8-6.8L31 10.2l6.9 6.8-24.5 24.4zm30.5-30.5l-3.5 3.5-6.8-6.8L37.1 4c.3-.3.6-.4.9-.4.4 0 .7.2.9.4l5 5.1c.3.3.4.6.4.9 0 .4-.2.7-.4.9z',
  rectangle: 'M29.5 0v5h-11V0h11zm0 48v-5h-11v5h11zM0 29.5h5v-11H0v11zM34.5 5H43v8.5h5v-10C48 1.6 46.4 0 44.5 0h-10v5zM48 18.5h-5v11.1h5V18.5zm-43-5V5h8.5V0h-10A3.5 3.5 0 0 0 0 3.5v10h5zm38 21V43h-8.5v5h10c1.9 0 3.5-1.6 3.5-3.5v-10h-5zM13.5 43H5v-8.5H0v10C0 46.4 1.6 48 3.5 48h10v-5z',
  redo: 'M26.2 13.6h13.2l-9.1-9.1c-1-1-1-2.6 0-3.6s2.6-1 3.6 0l13.4 13.4c.5.5.7 1.1.7 1.8s-.3 1.3-.7 1.8L33.8 31.4c-1 1-2.6 1-3.6 0s-1-2.6 0-3.6l9.1-9.1H26c-17.4 0-20.3 6.8-20.3 11.6 0 3.8 1 7.4 4.7 9.8 1.8 1.2 5.2 1.8 8 2 2.9.2 3.8 1.4 3.8 3v.4c-.2 1.6-1.9 2.3-4 2.3h-.8c-10.6 0-18-7.2-17.4-18 .6-10.1 7.8-16.5 26.2-16.2z',
  reset: 'M25.3 10.1H12.4l5.8-5.8c1-1 1-2.6 0-3.6s-2.6-1-3.6 0L4.5 10.8c-1 1-1 2.6 0 3.6l10.1 10.1c1 1 2.6 1 3.6 0s1-2.6 0-3.6l-5.8-5.8h12.9a13.9 13.9 0 1 1 0 27.8c-7.7 0-13.9-6.2-13.9-13.9 0-1.4-1.1-2.5-2.5-2.5S6.4 27.6 6.4 29a18.9 18.9 0 1 0 37.8.1 19 19 0 0 0-18.9-19z',
  save: 'M7.8 17.2c1-1 2.6-1 3.6 0l10.1 10.1V2.5C21.5 1.1 22.6 0 24 0s2.5 1.1 2.5 2.5V27.4l10.1-10.1c1-1 2.6-1 3.6 0s1 2.6 0 3.6L25.8 35.3c-.5.5-1 .7-1.8.7s-1.3-.3-1.8-.7L7.8 20.8c-1-1-1-2.6 0-3.6zm39.7 18.2c0-1.4-1.1-2.5-2.5-2.5a2.5 2.5 0 0 0-2.5 2.5v7.5H5.6v-7.5c0-1.4-1.1-2.5-2.5-2.5a2.5 2.5 0 0 0-2.5 2.5v10.1C.5 46.9 1.6 48 3 48h42c1.4 0 2.5-1.1 2.5-2.5V35.4z',
  tile: 'M48 2.4s0-.1 0 0v-.3l-.1-.3C47.6.8 46.7 0 45.5 0h-43-.1-.1-.1l-.3.1A2.5 2.5 0 0 0 0 2.5V45.9l.1.3c.3 1 1.2 1.8 2.4 1.8H45.9l.3-.1a2.4 2.4 0 0 0 1.8-2.4V2.4c0 .1 0 0 0 0zM38 5h5v16.5H26.5V5H38zM10 43H5V26.5h16.5V43H10z',
  undo: 'M48 29.8c.6 10.8-6.8 18-17.4 18h-.8c-2 0-3.7-.7-4-2.3v-.4c0-1.6 1-2.8 3.8-3 2.9-.2 6.2-.8 8-2 3.7-2.5 4.7-6 4.7-9.8 0-4.8-2.9-11.6-20.3-11.6H8.6l9.1 9.1c1 1 1 2.6 0 3.6s-2.6 1-3.6 0L.7 17.9c-.4-.5-.7-1.1-.7-1.8s.3-1.3.7-1.8L14.2.9c1-1 2.6-1 3.6 0s1 2.6 0 3.6l-9.1 9.1h13.2c18.3-.3 25.5 6.1 26.1 16.2z',
};

export const iconNames = Object.keys(iconPaths);

const Icon = ({
  color,
  name,
  size,
  style,
}) => (
  <svg
    height={size}
    preserveAspectRatio="xMinYMin"
    style={{ shapeRendering: 'geometricPrecision', ...style }}
    viewBox="0 0 48 48"
    width={size}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d={iconPaths[name]}
      fill={color}
      fillRule="evenodd"
    />
  </svg>
);

Icon.propTypes = {
  color: PropTypes.string,
  name: PropTypes.oneOf(iconNames).isRequired,
  size: PropTypes.number,
  style: stylePropType,
};
Icon.defaultProps = {
  color: 'currentColor',
  size: 14,
  style: {},
};

export default Icon;
