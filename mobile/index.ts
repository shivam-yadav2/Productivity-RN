import 'react-native-gesture-handler';
import './src/utils/nativewindInterop';
import { Platform } from 'react-native';
import { registerRootComponent } from 'expo';
import {
  registerWidgetTaskHandler,
  registerWidgetConfigurationScreen,
} from 'react-native-android-widget';

import App from './App';
import { widgetTaskHandler } from './src/widgets/widgetTaskHandler';
import { WidgetConfigurationScreen } from './src/widgets/WidgetConfigurationScreen';

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);

// Home-screen widgets are Android-only, and their registration reaches for AppRegistry
// APIs (`registerHeadlessTask`) that react-native-web does not implement — calling them
// unguarded throws during startup on web, which is how the web verification builds run.
if (Platform.OS === 'android') {
  // Widgets render in a separate headless JS instance — launched by Android to draw or
  // update a widget, with no main App tree involved at all.
  registerWidgetTaskHandler(widgetTaskHandler);

  // Opened by the launcher when a widget is added, and again via long-press → Configure.
  registerWidgetConfigurationScreen(WidgetConfigurationScreen);
}
