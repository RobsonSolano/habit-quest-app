import { registerRootComponent } from 'expo';
import 'react-native-screens';
import * as Sentry from '@sentry/react-native';

import { initSentry } from './src/lib/sentry';
import App from './App';

// Inicializar Sentry o mais cedo possível (antes de qualquer componente)
initSentry();

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// Sentry.wrap captura erros não tratados no React e envia ao Sentry
registerRootComponent(Sentry.wrap(App));
