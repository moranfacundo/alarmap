// Expo's runtime: its fetch, whose response streams a body, and URL, TextDecoderStream and
// structuredClone. Metro runs it before this file only when something imports it, and nothing
// else does in a release build, which would then get React Native's fetch, with no body.
import 'expo';
import { AppRegistry, Image, Platform, processColor } from 'react-native';
import { mount } from '@ng-native/platform';
import { currentConditions, deviceTokens, watchConditions } from '@ng-native/device';
import { loadFonts } from '@ng-native/expo/fonts';
import { getFabricUIManager, registerPlatformComponents, styleSheetOf } from '@ng-native/fabric';
import { withComponentInputBinding } from '@angular/router';
import { provideNativeRouter } from '@ng-native/router';
import { App } from './app/app.ts';
import { routes } from './app/app.routes.ts';
import { GlobalStyles } from './app/shared/theme/global-styles.ts';

registerPlatformComponents(Platform.OS);

// Hoja global (tipografía Inter + color de texto). Se lee después de declarar la clase.
const globalStyles = styleSheetOf(GlobalStyles);

/** Monta la app. Se llama cuando las fuentes ya están registradas. */
function start(rootTag: number): void {
  const app = mount(rootTag, App, getFabricUIManager(), {
    globalStyles,
    // Navegación nativa; `withComponentInputBinding` entrega los parámetros de ruta como inputs.
    providers: [provideNativeRouter(routes, withComponentInputBinding())],
    // Colours, as the integers the platform wants.
    processColor,
    // What `@media` resolves against. Without it every media query is false and a responsive
    // layout renders as its smallest case.
    conditions: currentConditions(),
    // Values only the device knows - the hairline width, which is a third of a point on a 3x
    // screen. Without it `1px` is what you get, and that is a visibly fat divider.
    tokens: deviceTokens(),
    // Turns a `require('./x.png')` into something native can load. Without it images are blank.
    resolveAssetSource: (value) => Image.resolveAssetSource(value as never),
  });

  // Re-resolves the conditions when the device rotates or the theme changes. A rotation dirties
  // no component and no binding, so without this nothing re-renders and `dark:` stops following
  // the system switch. It stops with the app, which Android destroys when it recreates the
  // activity, so the app mounted in its place is the only one still watching.
  const stopWatching = watchConditions(app.engine);
  app.applicationRef.onDestroy(stopWatching);
}

AppRegistry.registerRunnable('main', ({ rootTag }) => {
  // Si las fuentes fallan, la app arranca igualmente con la fuente del sistema.
  void loadFonts(globalStyles)
    .catch((error: unknown) => console.error('No se pudieron cargar las fuentes', error))
    .then(() => start(Number(rootTag)));
});
