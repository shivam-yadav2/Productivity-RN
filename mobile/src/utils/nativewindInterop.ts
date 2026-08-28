import { Pressable } from 'react-native';
import Animated from 'react-native-reanimated';

/**
 * IMPORTANT: Reanimated components in this app are deliberately NOT registered with
 * NativeWind's `cssInterop`, so they take `style` and ignore `className`.
 *
 * react-native-css-interop resolves a component's inline `style` prop by spreading it
 * into the style object it builds from `className`
 * (`assignToTarget(props, {...declaration}, ...)` in native-interop). Spreading a
 * `useAnimatedStyle()` result copies its keys into a plain object and destroys the
 * handle Reanimated needs, so the animation silently stops running. Registering the
 * component makes that happen whether or not a `className` is actually passed.
 *
 * The convention that avoids it: an animated component carries `style` only, and any
 * Tailwind classes live on a plain RN element wrapped around or nested inside it.
 */
export const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
