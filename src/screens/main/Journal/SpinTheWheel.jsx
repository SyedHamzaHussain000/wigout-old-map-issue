/* eslint-disable react-native/no-inline-styles */
import React, {useState, useEffect, useRef} from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  Dimensions,
  Alert,
  TouchableOpacity,
} from 'react-native';
import ScreenWrapper from '../../../components/ScreenWrapper';
import Modal from 'react-native-modal';
import FastImage from 'react-native-fast-image';
import AppColors from '../../../utils/AppColors';
import AppText from '../../../components/AppTextComps/AppText';
import {useCustomNavigation} from '../../../utils/Hooks';
import BackIcon from '../../../components/AppTextComps/BackIcon';
import LineBreak from '../../../components/LineBreak';
import {
  responsiveHeight,
  responsiveWidth,
} from '../../../utils/Responsive_Dimensions';
import AppButton from '../../../components/AppButton';
import AnimatedReanimated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
} from 'react-native-reanimated';
import CasinoSpinningWheel from '../../../components/CasinoSpinningWheel';

const {width} = Dimensions.get('window');
const WHEEL_SIZE = width * 0.9;
const RADIUS = WHEEL_SIZE / 2;
const DURATION = 6000; // 6 seconds

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
  const wheelRef = useRef(null);
  const [winner, setWinner] = useState(null);
  const [spinning, setSpinning] = useState(true);
  const [celebrating, setCelebrating] = useState(false);

  useEffect(() => {
    // Small delay to ensure component is ready
    setTimeout(() => {
      wheelRef.current?.spin();
    }, 500);
  }, []);

  const handleSpinEnd = winningOption => {
    setSpinning(false);
    setWinner(winningOption);
  };

  const startSpin = () => {
    setSpinning(true);
    setWinner(null);
    wheelRef.current?.spin();
  };

  const handleWinnerAccept = () => {
    setCelebrating(true);
    // Let confetti run for a bit before navigating
    setTimeout(() => {
      if (winner) {
        navigateToRoute('HomeDetails', {placeDetails: winner});
      } else {
        Alert.alert('Info', 'This is a custom option with no details.');
      }
      setCelebrating(false);
    }, 5000);
  };

  return (
    <ScreenWrapper>
      <SafeAreaView style={{flex: 1}}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <BackIcon
              onBackPress={() => goBack()}
              iconColor={AppColors.BLACK}
            />
            <AppText
              title={'Spin the Wheel'}
              textColor={AppColors.BLACK}
              textSize={2.5}
              textFontWeight
            />
            <View style={{width: 40}} />
          </View>

          <View style={styles.wheelContainer}>
            <TouchableOpacity
              onPress={winner && !spinning ? handleWinnerAccept : null}
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
                textColor={'#996515'}
                textSize={3}
                textFontWeight
                textAlignment={'center'}
                paddingBottom={10}
              />
            </TouchableOpacity>

            <View style={styles.wheelWrapper}>
              <CasinoSpinningWheel
                ref={wheelRef}
                data={options}
                onSpinEnd={handleSpinEnd}
                size={WHEEL_SIZE}
                duration={DURATION}
                fingerPointer={true}
              />
            </View>

            {/* Bottom Actions */}
            {!spinning && winner && (
              <View style={styles.actionContainer}>
                <AppButton
                  title={`Let's Go to ${
                    winner.name.length > 20
                      ? winner.name.substring(0, 20) + '...'
                      : winner.name
                  }!`}
                  handlePress={handleWinnerAccept}
                  btnBackgroundColor={'#996515'}
                  btnWidth={85}
                />
                <TouchableOpacity
                  onPress={startSpin}
                  style={styles.spinAgainBtn}>
                  <AppText
                    title={'Spin Again'}
                    textColor={'#D4AF37'}
                    textSize={1.6}
                    textFontWeight
                  />
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>

        {/* Celebration Modal */}
        <Modal
          isVisible={celebrating}
          animationIn="zoomIn"
          animationOut="zoomOut"
          backdropOpacity={0.2}
          style={{margin: 0}}>
          <View style={styles.gifContainer}>
            <FastImage
              source={require('../../../assets/gif/goAgainAnimation.gif')}
              style={{height: '100%', width: '100%'}}
              resizeMode={FastImage.resizeMode.contain}
            />
          </View>
        </Modal>
      </SafeAreaView>
    </ScreenWrapper>
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
  actionContainer: {
    marginTop: 40,
    width: '100%',
    alignItems: 'center',
    gap: 15,
  },
  spinAgainBtn: {
    paddingVertical: 10,
  },
  gifContainer: {
    height: responsiveHeight(95),
    width: responsiveWidth(100),
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999,
  },
});

export default SpinTheWheel;
