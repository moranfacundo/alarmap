/**
 * Datos fijos de la aplicación y de su autoría.
 * Se concentran aquí para cambiarlos en un solo lugar.
 */
export const APP_NAME = 'AlarMap';

export const APP_DESCRIPTION = 'Alarmas simples, locales y sin cuentas.';

/** Datos de autoría que se muestran en la pantalla "Acerca de". */
export const AUTHOR = {
  name: 'Facundo Morán',
  links: [
    { id: 'github', label: 'GitHub', url: 'https://github.com/moranfacundo' },
    { id: 'linkedin', label: 'LinkedIn', url: 'https://www.linkedin.com/in/moranfacundo/' },
    { id: 'website', label: 'Sitio web', url: 'https://facundo-moran.dev/' },
  ],
} as const;

/**
 * URL pública de la política de privacidad (texto versionado en `docs/PRIVACY_POLICY.md`).
 * Con `null` la app muestra un resumen en un diálogo en lugar de abrir el navegador.
 */
export const PRIVACY_POLICY_URL: string | null =
  'https://github.com/moranfacundo/alarmap/blob/main/docs/PRIVACY_POLICY.md';
