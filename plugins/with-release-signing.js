// Firma de release: `android/` se regenera con prebuild, así que el parche de
// build.gradle vive aquí. Las credenciales NO van al repo: se leen de
// ~/.gradle/gradle.properties (ALARMAP_UPLOAD_*). Sin ellas, release cae a debug
// (solo para desarrollo; Play lo rechaza).
const { withAppBuildGradle } = require('expo/config-plugins');

const MARCA = '// alarmap-release-signing';

module.exports = function withReleaseSigning(config) {
  return withAppBuildGradle(config, (cfg) => {
    let g = cfg.modResults.contents;
    if (g.includes(MARCA)) return cfg;

    g = g.replace(
      /signingConfigs \{\s*debug \{/,
      (m) =>
        `signingConfigs {\n        ${MARCA}\n        release {\n            if (project.hasProperty('ALARMAP_UPLOAD_STORE_FILE')) {\n                storeFile file(project.property('ALARMAP_UPLOAD_STORE_FILE'))\n                storePassword project.property('ALARMAP_UPLOAD_STORE_PASSWORD')\n                keyAlias project.property('ALARMAP_UPLOAD_KEY_ALIAS')\n                keyPassword project.property('ALARMAP_UPLOAD_KEY_PASSWORD')\n            }\n        }\n        debug {`
    );
    g = g.replace(
      /(release \{\s*\/\/ Caution[\s\S]*?)signingConfig signingConfigs\.debug/,
      "$1signingConfig project.hasProperty('ALARMAP_UPLOAD_STORE_FILE') ? signingConfigs.release : signingConfigs.debug"
    );
    cfg.modResults.contents = g;
    return cfg;
  });
};
