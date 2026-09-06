import 'react-native-gesture-handler';
import './src/utils/nativewindInterop';
import { registerRootComponent } from 'expo';
import { registerWidgetTaskHandler } from 'react-native-android-widget';

import App from './App';
import { widgetTaskHandler } from './src/widgets/widgetTaskHandler';

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);

// Home-screen widgets run this in a separate headless JS instance — launched by Android
// to render/update a widget, with no main App tree involved at all.
registerWidgetTaskHandler(widgetTaskHandler);
