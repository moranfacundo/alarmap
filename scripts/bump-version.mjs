#!/usr/bin/env node
// Sube la versión de la app en un solo paso.
//
// Uso: npm run version:bump -- 0.2.0
//
// Actualiza `version` en package.json y app.json, e incrementa `android.versionCode`
// (Google Play exige que cada build publicado tenga un versionCode mayor).
// Es idempotente: si la versión ya es la pedida, no cambia nada.
// NO crea tags ni commits: eso se hace a mano (ver CONTRIBUTING.md, "Versiones y tags").
import { readFileSync, writeFileSync } from 'node:fs';

const nueva = process.argv[2];
if (!nueva || !/^\d+\.\d+\.\d+$/.test(nueva)) {
  console.error('Uso: npm run version:bump -- X.Y.Z   (por ejemplo 0.2.0)');
  process.exit(1);
}

/** Lee un JSON, aplica `cambiar` y lo vuelve a escribir con el mismo formato (2 espacios). */
function actualizar(ruta, cambiar) {
  const json = JSON.parse(readFileSync(ruta, 'utf8'));
  const resultado = cambiar(json);
  writeFileSync(ruta, `${JSON.stringify(json, null, 2)}\n`);
  return resultado;
}

const previa = actualizar('package.json', (pkg) => {
  const anterior = pkg.version;
  pkg.version = nueva;
  return anterior;
});

const versionCode = actualizar('app.json', (app) => {
  const android = (app.expo.android ??= {});
  // Solo se incrementa si la versión realmente cambió (así el script es idempotente).
  if (app.expo.version !== nueva) android.versionCode = (android.versionCode ?? 0) + 1;
  app.expo.version = nueva;
  return android.versionCode;
});

console.log(`Versión: ${previa} -> ${nueva} (android.versionCode = ${versionCode})`);
