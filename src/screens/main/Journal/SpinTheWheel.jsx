/* eslint-disable react-native/no-inline-styles */
import React, {useState, useEffect, useRef} from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  Dimensions,
  Animated,
  Easing,
  Alert,
  TouchableOpacity,
} from 'react-native';
import AppColors from '../../../utils/AppColors';
import AppText from '../../../components/AppTextComps/AppText';
import {useCustomNavigation} from '../../../utils/Hooks';
import BackIcon from '../../../components/AppTextComps/BackIcon';
import Svg, {Path, G, Text as SvgText, TSpan} from 'react-native-svg';
import LineBreak from '../../../components/LineBreak';
import {responsiveHeight} from '../../../utils/Responsive_Dimensions';

const {width} = Dimensions.get('window');
const WHEEL_SIZE = width * 0.9;
const RADIUS = WHEEL_SIZE / 2;
const DURATION = 10000; // 10 seconds

const SPINNER_COLORS = [
  AppColors.BTNCOLOURS,
  AppColors.LIGHT_BTNCOLOURS,
  AppColors.THEME_COLOR,
  AppColors.PRIMARY,
  AppColors.Yellow,
  AppColors.hotPink,
  AppColors.royalBlue,
  AppColors.darkYellow,
  AppColors.lowGreen,
];

const SpinTheWheel = ({route}) => {
  const {options} = route.params || {options: []};
  const {goBack, navigateToRoute} = useCustomNavigation();
  const [winner, setWinner] = useState(null);
  const [spinning, setSpinning] = useState(true);
  const spinValue = useRef(new Animated.Value(0)).current;

  // Colors from the mockup (Dark Burgundy / Reddish Pink)

  useEffect(() => {
    startSpin();
  }, []);

  const startSpin = () => {
    setSpinning(true);
    setWinner(null);
    spinValue.setValue(0);

    // Random rotations (min 10 full spins) + random extra angle
    const randomAngle = Math.random() * 360;
    const finalAngle = 360 * 10 + randomAngle;

    Animated.timing(spinValue, {
      toValue: finalAngle,
      duration: DURATION,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start(({finished}) => {
      if (finished) {
        setSpinning(false);
        calculateWinner(finalAngle);
      }
    });
  };

  const calculateWinner = finalAngle => {
    const numberOfSegments = options.length;
    const segmentAngle = 360 / numberOfSegments;
    const normalizedAngle = finalAngle % 360;

    // The pointer is at 90 degrees (right side) or 270 (top)?
    // Usually 0 is right. In SVG, 0 is typically 3 o'clock.
    // Let's assume the pointer is at the RIGHT (0 degrees) for now or adjust logic.
    // Actually, rotation rotates the whole group.
    // If we rotate CLOCKWISE, the segment at 0 moves to +angle.
    // To find which segment is at the pointer (say, at 0 degrees), we check:
    // (360 - (normalizedAngle % 360)) % 360 / segmentAngle

    // Let's assume pointer is at 0 (Right).
    // The wheel rotates clockwise.
    // The index of the item at 0 degrees is determined by how much we backed up.

    const indexAtPointer = Math.floor(
      ((360 - normalizedAngle) % 360) / segmentAngle,
    );

    const winningOption = options[indexAtPointer];
    setWinner(winningOption);
  };

  const handleWinnerPress = () => {
    console.log('winner:----', winner);
    if (winner?.fullData) {
      navigateToRoute('HomeDetails', {placeDetails: winner.fullData});
    } else {
      Alert.alert('Info', 'This is a custom option with no details.');
    }
  };

  const polarToCartesian = (centerX, centerY, radius, angleInDegrees) => {
    const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
    return {
      x: centerX + radius * Math.cos(angleInRadians),
      y: centerY + radius * Math.sin(angleInRadians),
    };
  };

  const describeArc = (x, y, radius, startAngle, endAngle) => {
    const start = polarToCartesian(x, y, radius, endAngle);
    const end = polarToCartesian(x, y, radius, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';
    const d = [
      'M',
      start.x,
      start.y,
      'A',
      radius,
      radius,
      0,
      largeArcFlag,
      0,
      end.x,
      end.y,
      'L',
      x,
      y,
      'L',
      start.x,
      start.y,
    ].join(' ');
    return d;
  };

  const renderWheel = () => {
    const numberOfSegments = options.length;
    const anglePerSegment = 360 / numberOfSegments;

    return options.map((option, index) => {
      const startAngle = index * anglePerSegment;
      const endAngle = startAngle + anglePerSegment;
      const color = SPINNER_COLORS[index % SPINNER_COLORS.length];

      // Calculate text position (mid-angle)
      const midAngle = startAngle + anglePerSegment / 2;
      // Position text closer to outer edge but centered
      // We need to rotate text to match the segment

      // We will rotate the text group

      return (
        <G key={option.id}>
          <Path
            d={describeArc(RADIUS, RADIUS, RADIUS, startAngle, endAngle)}
            fill={color}
          />
          <G rotation={midAngle} origin={`${RADIUS}, ${RADIUS}`}>
            {/* Text placed at a certain radius, rotated -90 to be perpendicular or 0 to be radial? */}
            {/* Let's try radial text placement */}
            <SvgText
              x={RADIUS}
              y={RADIUS - RADIUS * 0.65} // Distance from center
              fill="white"
              textAnchor="middle"
              alignmentBaseline="middle"
              fontSize="14"
              fontWeight="bold"
              transform={`rotate(-90, ${RADIUS}, ${RADIUS - RADIUS * 0.65})`} // Maybe adjust rotation for readability
            >
              {option.name.length > 15
                ? option.name.substring(0, 15) + '...'
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
    <SafeAreaView style={{flex: 1, backgroundColor: AppColors.WHITE}}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <BackIcon onBackPress={() => goBack()} iconColor={AppColors.BLACK} />
          <AppText
            title={'Spin the Wheel'}
            textColor={AppColors.BLACK}
            textSize={2.5}
            textFontWeight
          />
          <View style={{width: 40}} />
        </View>

        {/* <LineBreak space={5} /> */}

        <View style={styles.wheelContainer}>
          <TouchableOpacity
            onPress={winner && !spinning ? handleWinnerPress : null}
            activeOpacity={0.7}
            disabled={!winner || spinning}>
            <AppText
              title={
                spinning
                  ? 'Spinning...'
                  : winner
                  ? `Selected: ${winner.name}`
                  : 'Ready?'
              }
              textColor={AppColors.BTNCOLOURS}
              textSize={3}
              textFontWeight
              textAlignment={'center'}
              paddingBottom={10}
            />
            {winner && !spinning && winner.fullData && (
              <AppText
                title={'(Tap to view details)'}
                textColor={AppColors.GRAY}
                textSize={1.5}
                textAlignment={'center'}
                paddingBottom={10}
              />
            )}
          </TouchableOpacity>

          <View style={styles.wheelWrapper}>
            {/* The Wheel */}
            <Animated.View
              style={{
                transform: [{rotate: spin}],
                width: WHEEL_SIZE,
                height: WHEEL_SIZE,
              }}>
              <Svg width={WHEEL_SIZE} height={WHEEL_SIZE}>
                {renderWheel()}
                {/* Center Circle (White Hole) */}
                <Path
                  d={`M ${RADIUS} ${RADIUS} m -30, 0 a 30,30 0 1,0 60,0 a 30,30 0 1,0 -60,0`}
                  fill="white"
                />
              </Svg>
            </Animated.View>

            {/* Pointer / Indicator */}
            {/* Placing a pointer at the top (0 degrees in polar calculation logic is -90 usually, but let's stick to visual) */}
            {/* If we start Arc from -90 (Top), then pointer at Top is index 0 */}

            {/* Let's add a visual pointer overlay */}
            <View style={styles.pointer} />
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginTop: responsiveHeight(2),
  },
  wheelContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wheelWrapper: {
    width: WHEEL_SIZE,
    height: WHEEL_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  pointer: {
    position: 'absolute',
    top: -20, // Adjust based on expectation
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 15,
    borderRightWidth: 15,
    borderBottomWidth: 30,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: AppColors.BTNCOLOURS, // Pointer color
    transform: [{rotate: '180deg'}], // Pointing down
  },
});

export default SpinTheWheel;
