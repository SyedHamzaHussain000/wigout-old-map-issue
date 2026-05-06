import React, {useRef, useImperativeHandle, forwardRef, useState} from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Easing,
  Dimensions,
  Image,
} from 'react-native';
import Svg, {Path, G, Text as SvgText} from 'react-native-svg';
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

export const SPINNER_COLORS = [
  '#FF5252', // Red
  '#448AFF', // Blue
  '#4CAF50', // Green
  '#FFEB3B', // Yellow
  '#9C27B0', // Purple
  '#FF9800', // Orange
  '#00BCD4', // Cyan
  '#E91E63', // Pink
  '#8BC34A', // Light Green
  '#3F51B5', // Indigo
  '#FFC107', // Amber
  '#009688', // Teal
  '#795548', // Brown
  '#607D8B', // Blue Grey
  '#F44336', // Deep Red
];

const WheelSpinner = forwardRef<WheelRef, WheelSpinnerProps>(
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
    const spinValue = useRef(new Animated.Value(0)).current;
    const [isSpinning, setIsSpinning] = useState(false);
    const radius = size / 2;

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

      // Random rotations (min 5 full spins) + random extra angle
      const randomAngle = Math.random() * 360;
      const finalAngle = 360 * 5 + randomAngle;

      Animated.timing(spinValue, {
        toValue: finalAngle,
        duration: duration,
        easing: Easing.out(Easing.quad),
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

      // Pointer is at the TOP (90 degrees in SVG coordinate system logic or adjust accordingly)
      // If we start the first segment at 0 (Right), and we rotate CLOCKWISE.
      // To find what's at the TOP (270 degrees in SVG circle starting from Right 0),
      // we need to offset.

      // Simpler: Find what segment is at 0 degrees (Right) and then offset by -90 for Top.
      // index = (360 - (normalizedAngle + 90)) % 360 / segmentAngle

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

    const renderWheel = () => {
      const numberOfSegments = data.length;
      if (numberOfSegments === 0) {
        return null;
      }
      const anglePerSegment = 360 / numberOfSegments;

      return data.map((option, index) => {
        const startAngle = index * anglePerSegment;
        const endAngle = startAngle + anglePerSegment;
        const color = SPINNER_COLORS[index % SPINNER_COLORS.length];
        const midAngle = startAngle + anglePerSegment / 2;

        return (
          <G key={option.id + index}>
            <Path
              d={describeArc(radius, radius, radius, startAngle, endAngle)}
              fill={color}
              stroke="white"
              strokeWidth="1"
            />
            <G rotation={midAngle} origin={`${radius}, ${radius}`}>
              <SvgText
                x={radius}
                y={radius - radius * 0.6}
                fill="white"
                textAnchor="middle"
                alignmentBaseline="middle"
                fontSize={size * 0.04}
                fontWeight="bold"
                transform={`rotate(-90, ${radius}, ${radius - radius * 0.6})`}>
                {option.name.length > 12
                  ? option.name.substring(0, 10) + '...'
                  : option.name}
              </SvgText>
            </G>
          </G>
        );
      });
    };

    const spin = spinValue.interpolate({
      inputRange: [0, 360],
      outputRange: ['0deg', '360deg'],
    });

    return (
      <View style={[styles.container, {width: size, height: size}]}>
        <Animated.View
          style={{transform: [{rotate: spin}], width: size, height: size}}>
          <Svg width={size} height={size}>
            {renderWheel()}
            <G transform={`translate(${radius - 20}, ${radius - 20})`}>
              <Path
                d="M 20 20 m -20, 0 a 20,20 0 1,0 40,0 a 20,20 0 1,0 -40,0"
                fill="white"
                stroke={AppColors.BTNCOLOURS}
                strokeWidth="2"
              />
            </G>
          </Svg>
        </Animated.View>
        {fingerPointer ? (
          <Image
            source={AppImages.fingerDown}
            style={styles.fingerPointer}
            resizeMode="contain"
          />
        ) : (
          <View
            style={[
              styles.normalPointer,
              {borderBottomColor: AppColors.BTNCOLOURS},
            ]}
          />
        )}
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
  fingerPointer: {
    position: 'absolute',
    top: -30,
    width: 50,
    height: 50,
    zIndex: 10,
    // tintColor: AppColors.BTNCOLOURS,
  },
  normalPointer: {
    position: 'absolute',
    top: -15,
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
    zIndex: 10,
  },
});

export default WheelSpinner;
