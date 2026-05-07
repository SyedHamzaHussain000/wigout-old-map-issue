import React, {useRef, useImperativeHandle, forwardRef, useState} from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Easing,
  Dimensions,
  Image,
} from 'react-native';
import Svg, {
  Path,
  G,
  Circle,
  Text as SvgText,
  Defs,
  RadialGradient,
  Stop,
} from 'react-native-svg';
import AppColors from '../utils/AppColors';
import AppImages from '../assets/images/AppImages';

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
  fingerPointer?: boolean;
}

export interface WheelRef {
  spin: () => void;
}

const CASINO_COLORS = {
  GOLD: '#D4AF37',
  GOLD_LIGHT: '#F9F295',
  DARK_GOLD: '#996515',
  BLACK: '#1A1A1A',
  RED: '#B22222',
  WHITE: '#FFFFFF',
};

const CasinoSpinningWheel = forwardRef<WheelRef, WheelSpinnerProps>(
  (
    {
      data,
      onSpinEnd,
      size = width * 0.8,
      duration = 5000,
      fingerPointer = false,
    },
    ref,
  ) => {
    const ballValue = useRef(new Animated.Value(0)).current;
    const [isSpinning, setIsSpinning] = useState(false);
    const radius = size / 2;
    const outerRingWidth = 12;
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
      ballValue.setValue(0);

      const randomAngle = Math.random() * 360;
      const ballFinalAngle = 360 * 10 + randomAngle;

      Animated.timing(ballValue, {
        toValue: ballFinalAngle,
        duration: duration,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start(({finished}) => {
        if (finished) {
          setIsSpinning(false);
          calculateWinner(randomAngle);
        }
      });
    };

    const calculateWinner = (ballAngle: number) => {
      const numberOfSegments = data.length;
      const segmentAngle = 360 / numberOfSegments;
      const normalizedAngle = ballAngle % 360;
      const indexAtPointer = Math.floor(normalizedAngle / segmentAngle);
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

    const renderWheel = () => {
      const numberOfSegments = data.length;
      if (numberOfSegments === 0) {
        return null;
      }
      const anglePerSegment = 360 / numberOfSegments;

      return data.map((option, index) => {
        const startAngle = index * anglePerSegment;
        const endAngle = startAngle + anglePerSegment;
        const color = index % 2 === 0 ? CASINO_COLORS.BLACK : CASINO_COLORS.RED;
        const midAngle = startAngle + anglePerSegment / 2;

        return (
          <G key={option.id + index}>
            <Path
              d={describeArc(radius, radius, innerRadius, startAngle, endAngle)}
              fill={color}
              stroke={CASINO_COLORS.GOLD}
              strokeWidth="0.5"
            />
            <G rotation={midAngle} origin={`${radius}, ${radius}`}>
              <SvgText
                x={radius}
                y={radius - innerRadius * 0.65}
                fill={CASINO_COLORS.WHITE}
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
        const pos = polarToCartesian(radius, radius, radius - 6, angle);
        lights.push(
          <Circle
            key={`light-${i}`}
            cx={pos.x}
            cy={pos.y}
            r="1.5"
            fill={CASINO_COLORS.GOLD_LIGHT}
          />,
        );
      }
      return lights;
    };

    const ballSpin = ballValue.interpolate({
      inputRange: [0, 360],
      outputRange: ['0deg', '360deg'],
    });

    return (
      <View style={[styles.container, {width: size, height: size}]}>
        <Svg width={size} height={size} style={styles.svg}>
          <Defs>
            <RadialGradient
              id="grad"
              cx="50%"
              cy="50%"
              r="50%"
              fx="50%"
              fy="50%">
              <Stop
                offset="0%"
                stopColor={CASINO_COLORS.GOLD_LIGHT}
                stopOpacity="1"
              />
              <Stop
                offset="100%"
                stopColor={CASINO_COLORS.DARK_GOLD}
                stopOpacity="1"
              />
            </RadialGradient>
          </Defs>

          {/* Outer Ring */}
          <Circle
            cx={radius}
            cy={radius}
            r={radius - 4}
            fill={CASINO_COLORS.BLACK}
            stroke={CASINO_COLORS.DARK_GOLD}
            strokeWidth="8"
          />

          {renderWheel()}
          {renderLights()}

          {/* Center Hub */}
          <Circle
            cx={radius}
            cy={radius}
            r={22}
            fill="url(#grad)"
            stroke={CASINO_COLORS.DARK_GOLD}
            strokeWidth="2"
          />
          <Circle
            cx={radius}
            cy={radius}
            r={4}
            fill={CASINO_COLORS.DARK_GOLD}
          />
        </Svg>

        <Animated.View
          style={[
            styles.ballContainer,
            {
              width: size,
              height: size,
              transform: [{rotate: ballSpin}],
            },
          ]}
          pointerEvents="none">
          <View
            style={[
              styles.ball,
              {
                top: outerRingWidth + 2,
              },
            ]}
          />
        </Animated.View>

        {/* {!isSpinning && (
          fingerPointer ? (
            <Image
              source={AppImages.fingerDown}
              style={styles.fingerPointer}
              resizeMode="contain"
            />
          ) : (
            <View style={styles.pointerWrapper}>
               <View style={[styles.normalPointer, {borderBottomColor: CASINO_COLORS.GOLD}]} />
            </View>
          )
        )} */}
      </View>
    );
  },
);

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  svg: {
    backgroundColor: 'transparent',
  },
  ballContainer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  ball: {
    position: 'absolute',
    width: 15,
    height: 15,
    borderRadius: 10,
    backgroundColor: CASINO_COLORS.WHITE,
    borderWidth: 1,
    borderColor: CASINO_COLORS.GOLD,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.8,
    shadowRadius: 2,
  },
  fingerPointer: {
    position: 'absolute',
    top: -30,
    width: 50,
    height: 50,
    zIndex: 100,
  },
  pointerWrapper: {
    position: 'absolute',
    top: -10,
    zIndex: 100,
  },
  normalPointer: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 12,
    borderRightWidth: 12,
    borderBottomWidth: 24,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    transform: [{rotate: '180deg'}],
  },
});

export default CasinoSpinningWheel;
