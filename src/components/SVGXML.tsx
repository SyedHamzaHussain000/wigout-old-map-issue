import React from 'react';
import {SvgXml} from 'react-native-svg';

type props = {
  icon?: any;
  width?: any;
  height?: any;
  style?: any;
};

const SVGXml = ({icon, width = 24, height = 33, style}: props) => {
  if (!icon) {
    return null;
  }
  return <SvgXml xml={icon} height={height} width={width} style={style} />;
};

export default SVGXml;
