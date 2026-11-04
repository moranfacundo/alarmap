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
 * URL pública de la política de privacidad.
 * PENDIENTE: definir antes de publicar (ver docs/OPEN_DECISIONS.md). Con `null` la app avisa que aún no existe.
 */
export const PRIVACY_POLICY_URL: string | null = null;
