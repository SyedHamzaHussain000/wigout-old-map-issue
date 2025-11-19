import React, { useMemo } from 'react';
import {
  View,
  StyleSheet,
  ViewStyle,
  StyleProp,
  Animated,
  Easing,
} from 'react-native';
import AppColors from '../utils/AppColors';


type Props = {
  /** progress can be 0..1 (fraction) or 0..100 (percentage). */
  progress?: number;
  /** optional container style (use to set width or let it flex) */
  style?: StyleProp<ViewStyle>;
  /** enable a smooth animation when progress changes */
  animated?: boolean;
  /** animation duration in ms (only if animated=true) */
  animationDuration?: number;
};

const RatingWithProgressbar = ({
  progress = 0,
  style,
  animated = false,
  animationDuration = 400,
}: Props) => {
  // Normalize input:
  // If user passed >1 assume they used 0..100, convert to fraction
  const normalized = useMemo(() => {
    if (!Number.isFinite(progress)) return 0;
    if (progress > 1) return Math.max(0, Math.min(progress / 100, 1));
    return Math.max(0, Math.min(progress, 1));
  }, [progress]);

  // For animated width: keep an Animated.Value
  const animatedValue = useMemo(() => new Animated.Value(normalized), []); // created once

  // update animation when normalized changes
  React.useEffect(() => {
    if (!animated) {
      animatedValue.setValue(normalized);
      return;
    }
    Animated.timing(animatedValue, {
      toValue: normalized,
      duration: animationDuration,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false, // width can't use native driver
    }).start();
  }, [normalized, animated, animationDuration, animatedValue]);

  // width style: if animated use interpolation, otherwise compute percent string
  const progressStyle = animated
    ? {
        width: animatedValue.interpolate({
          inputRange: [0, 1],
          outputRange: ['0%', '100%'],
        }),
      }
    : { width: `${normalized * 100}%` };

  return (
    <View style={[styles.container, style]}>
      {/* if animated, use Animated.View otherwise plain View */}
      {animated ? (
        // @ts-ignore animated typing for style with percentage string
        <Animated.View style={[styles.progress, progressStyle]} />
      ) : (
        <View style={[styles.progress, progressStyle]} />
      )}
    </View>
  );
};

export default RatingWithProgressbar;

const styles = StyleSheet.create({
  container: {
    // default container: full width of parent (make sure parent has width/flex)
    width: '100%',
    height: 10,
    backgroundColor: AppColors.WHITE,
    borderRadius: 6,
    overflow: 'hidden',
  },
  progress: {
    height: '100%',
    backgroundColor: AppColors.BLACK,
    borderRadius: 6,
  },
});
