import React, {useRef, useImperativeHandle, forwardRef, useState} from 'react';
import {View, StyleSheet, Animated, Easing, Dimensions} from 'react-native';
import Svg, {
  Path,
  G,
  Circle,
  Rect,
  Text as SvgText,
  Defs,
  RadialGradient,
  Stop,
  Polygon,
} from 'react-native-svg';

const {width} = Dimensions.get('window');

interface Option {
  id: string;
  name: string;
  fullData?: any;
}

interface WheelSpinnerProps {
  data: Option[];
  onSpinEnd: (winner: Option) => void;
  size?: number;
  duration?: number;
}

export interface WheelRef {
  spin: () => void;
}

const JACKPOT_COLORS = {
  BG_DARK: '#2D051D', // Darker base for the wheel
  PRIMARY: '#47082E', // Mandatory
  SECONDARY: '#6E3357', // Mandatory
  ACCENT_LIGHT: '#A35284', // Lighter purple for gradients
  WHITE: '#FFFFFF',
  GOLD: '#D4AF37',
};

const JackpotSpinner = forwardRef<WheelRef, WheelSpinnerProps>(
  ({data, onSpinEnd, size = width * 0.8, duration = 5000}, ref) => {
    const spinValue = useRef(new Animated.Value(0)).current;
    const [isSpinning, setIsSpinning] = useState(false);
    const radius = size / 2;
    const outerRingWidth = 15;
    const innerRadius = radius - outerRingWidth;

    useImperativeHandle(ref, () => ({
      spin: () => {
        if (isSpinning || data.length === 0) {
          return;
        }
        startSpin();
      },
    }));

    const startSpin = () => {
      setIsSpinning(true);
      spinValue.setValue(0);

      const randomAngle = Math.random() * 360;
      const finalAngle = 360 * 10 + randomAngle;

      Animated.timing(spinValue, {
        toValue: finalAngle,
        duration: duration,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start(({finished}) => {
        if (finished) {
          setIsSpinning(false);
          calculateWinner(finalAngle);
        }
      });
    };

    const calculateWinner = (finalAngle: number) => {
      const numberOfSegments = data.length;
      const segmentAngle = 360 / numberOfSegments;
      const normalizedAngle = finalAngle % 360;

      const indexAtPointer = Math.floor(
        ((360 - (normalizedAngle % 360)) % 360) / segmentAngle,
      );

      const winningOption = data[indexAtPointer % numberOfSegments];
      onSpinEnd(winningOption);
    };

    const polarToCartesian = (
      centerX: number,
      centerY: number,
      r: number,
      angleInDegrees: number,
    ) => {
      const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
      return {
        x: centerX + r * Math.cos(angleInRadians),
        y: centerY + r * Math.sin(angleInRadians),
      };
    };

    const describeArc = (
      x: number,
      y: number,
      r: number,
      startAngle: number,
      endAngle: number,
    ) => {
      const start = polarToCartesian(x, y, r, endAngle);
      const end = polarToCartesian(x, y, r, startAngle);
      const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';
      return [
        'M',
        start.x,
        start.y,
        'A',
        r,
        r,
        0,
        largeArcFlag,
        0,
        end.x,
        end.y,
        'L',
        x,
        y,
        'Z',
      ].join(' ');
    };

    const renderWheelSegments = () => {
      const numberOfSegments = data.length;
      if (numberOfSegments === 0) {
        return null;
      }
      const anglePerSegment = 360 / numberOfSegments;

      return data.map((option, index) => {
        const startAngle = index * anglePerSegment;
        const endAngle = startAngle + anglePerSegment;
        const color =
          index % 2 === 0 ? JACKPOT_COLORS.PRIMARY : JACKPOT_COLORS.SECONDARY;
        const midAngle = startAngle + anglePerSegment / 2;

        return (
          <G key={option.id + index}>
            <Path
              d={describeArc(radius, radius, innerRadius, startAngle, endAngle)}
              fill={color}
              stroke={JACKPOT_COLORS.BG_DARK}
              strokeWidth="0.5"
            />
            <G rotation={midAngle} origin={`${radius}, ${radius}`}>
              <SvgText
                x={radius}
                y={radius - innerRadius * 0.65}
                fill={JACKPOT_COLORS.WHITE}
                textAnchor="middle"
                alignmentBaseline="middle"
                fontSize={size * 0.035}
                fontWeight="bold"
                transform={`rotate(-90, ${radius}, ${
                  radius - innerRadius * 0.65
                })`}>
                {option.name.length > 12
                  ? option.name.substring(0, 10) + '...'
                  : option.name}
              </SvgText>
            </G>
          </G>
        );
      });
    };

    const renderLights = () => {
      const lights = [];
      const numLights = 24;
      for (let i = 0; i < numLights; i++) {
        const angle = (i * 360) / numLights;
        const pos = polarToCartesian(radius, radius, radius - 7, angle);
        lights.push(
          <Circle
            key={`light-${i}`}
            cx={pos.x}
            cy={pos.y}
            r="1.8"
            fill={JACKPOT_COLORS.WHITE}
          />,
        );
      }
      return lights;
    };

    const rotation = spinValue.interpolate({
      inputRange: [0, 360],
      outputRange: ['0deg', '360deg'],
    });

    return (
      <View style={[styles.container, {width: size, height: size + 80}]}>
        <Svg width={size} height={size + 80} style={styles.svg}>
          <Defs>
            <RadialGradient id="centerGrad" cx="50%" cy="50%" r="50%">
              <Stop offset="0%" stopColor={JACKPOT_COLORS.ACCENT_LIGHT} />
              <Stop offset="100%" stopColor={JACKPOT_COLORS.BG_DARK} />
            </RadialGradient>
          </Defs>

          {/* Stand/Base (Static) */}
          <G transform={'translate(0, 15)'}>
            <Polygon
              points={`${radius - 45},${size + 40} ${radius + 45},${
                size + 40
              } ${radius + 15},${radius} ${radius - 15},${radius}`}
              fill={JACKPOT_COLORS.BG_DARK}
            />
            <Rect
              x={radius - 65}
              y={size + 35}
              width={130}
              height={15}
              rx={5}
              fill={JACKPOT_COLORS.PRIMARY}
            />
          </G>

          {/* Wheel Frame (Static) */}
          <Circle
            cx={radius}
            cy={radius + 15}
            r={radius}
            fill={JACKPOT_COLORS.BG_DARK}
            stroke={JACKPOT_COLORS.PRIMARY}
            strokeWidth="1"
          />
          <G transform={'translate(0, 15)'}>{renderLights()}</G>
        </Svg>

        {/* Spinning Wheel Content */}
        <Animated.View
          style={[
            styles.spinningWrapper,
            {
              width: size,
              height: size,
              top: 15,
              transform: [{rotate: rotation}],
            },
          ]}>
          <Svg width={size} height={size}>
            {renderWheelSegments()}
          </Svg>
        </Animated.View>

        {/* Static Center and Pointer Overlay */}
        <View
          style={[styles.overlay, {width: size, height: size + 80}]}
          pointerEvents="none">
          <Svg width={size} height={size + 80}>
            {/* Center Hub */}
            <Circle
              cx={radius}
              cy={radius + 15}
              r={22}
              fill="url(#centerGrad)"
              stroke={JACKPOT_COLORS.WHITE}
              strokeWidth="2"
            />
            <Circle
              cx={radius}
              cy={radius + 15}
              r={5}
              fill={JACKPOT_COLORS.WHITE}
            />

            {/* Pointer at the Top */}
            <G transform={`translate(${radius - 15}, 0)`}>
              <Polygon
                points="0,0 30,0 15,35"
                fill={JACKPOT_COLORS.PRIMARY}
                stroke={JACKPOT_COLORS.WHITE}
                strokeWidth="2"
              />
            </G>
          </Svg>
        </View>
      </View>
    );
  },
);

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    backgroundColor: 'transparent',
  },
  svg: {
    backgroundColor: 'transparent',
  },
  spinningWrapper: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default JackpotSpinner;
