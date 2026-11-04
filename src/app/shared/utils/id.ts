/** Genera un identificador único local (no requiere red ni módulos nativos). */
export function newId(): string {
  const random = Math.random().toString(36).slice(2, 10);
  return `${Date.now().toString(36)}-${random}`;
}
