/**
 * Datos del sitio principal (portafolio). Los mismos que en src/lib/site.ts
 * del sitio; el agente enlaza de vuelta a él. No pertenece a ningún tenant:
 * lo específico de la persona sigue en tenants/<id>/.
 */
export const site = {
  name: 'Arsenio Jiménez',
  url: process.env.NEXT_PUBLIC_SITE_URL ?? 'https://moisesj92.github.io',
}

/** Textos fijos de la navegación (el agente no tiene i18n de interfaz). */
export const nav = {
  home: 'Inicio',
  portfolio: 'Portafolio',
  projects: 'Proyectos',
  debug: 'Depuración',
  menu: 'Menú',
  navigation: 'Navegación',
  closeMenu: 'Cerrar menú',
  themeToggle: 'Cambiar tema',
  themeSwitchTo: { light: 'Cambiar a tema claro', dark: 'Cambiar a tema oscuro' },
  rights: 'Todos los derechos reservados.',
}
