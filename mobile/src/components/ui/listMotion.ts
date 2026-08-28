import { FadeInDown, FadeOut, LinearTransition } from 'react-native-reanimated';
import { timing } from '../../utils/motion';

/** Staggered entrance for list rows — capped so long lists don't crawl in. */
export const listItemEntering = (index = 0) =>
  FadeInDown.springify().damping(19).mass(0.8).delay(Math.min(index * 32, 220));

/** Row exit — quick fade so deletions feel responsive. */
export const listItemExiting = FadeOut.duration(timing.fast.duration);

/** Smooth reflow when rows are added, removed, filtered, or reordered. */
export const listItemLayout = LinearTransition.springify().damping(22).stiffness(180).mass(0.9);
