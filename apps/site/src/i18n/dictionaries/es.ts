export const es = {
  meta: {
    title: 'Arsenio Jiménez — Ingeniero de Sistemas / Full Stack Developer',
    titleTemplate: '%s - Arsenio Jiménez',
    description:
      'Ingeniero Full-Stack Senior con +7 años construyendo productos digitales completos: e-commerce, sistemas en tiempo real, plataformas SaaS. De la idea a producción.',
  },
  nav: {
    home: 'Inicio',
    about: 'Sobre mí',
    projects: 'Proyectos',
    menu: 'Menú',
    navigation: 'Navegación',
    closeMenu: 'Cerrar menú',
    switchLocale: 'Switch to English',
    switchLocaleLabel: 'EN',
    themeToggle: 'Cambiar tema',
    themeSwitchTo: { light: 'Cambiar a tema claro', dark: 'Cambiar a tema oscuro' },
  },
  social: {
    github: 'Ver en GitHub',
    linkedin: 'Ver en LinkedIn',
    email: 'Escribirme por correo',
  },
  home: {
    title: 'Ingeniero de Sistemas y desarrollador Full Stack.',
    intro:
      'Soy Arsenio. Construyo productos digitales completos — desde la arquitectura hasta el deploy. En más de 7 años he llevado ideas de negocio a producción: e-commerce con pagos reales, sistemas de control de acceso en tiempo real y herramientas internas que reemplazan procesos manuales.',
    skillsHeading: 'Lo que sé hacer',
    skills: [
      {
        title: 'Productos & Plataformas',
        items: [
          'Aplicaciones web completas (SPA / SSR)',
          'E-commerce con pasarelas de pago',
          'Sistemas en tiempo real (monitoreo, chat, notificaciones)',
          'CRMs y herramientas internas',
          'MVPs listos para validar rápido',
        ],
      },
      {
        title: 'Arquitectura & Calidad',
        items: [
          'Diseño de APIs (REST / GraphQL)',
          'Arquitectura hexagonal / DDD',
          'Testing automatizado (unit, e2e, integración)',
          'CI/CD y despliegue continuo',
          'Observabilidad (logging, error tracking, métricas)',
        ],
      },
    ],
    stackTitle: 'Stack técnico',
    stack:
      'JavaScript/TypeScript · React/Next.js · Node.js · Ruby on Rails · PHP/Laravel · PostgreSQL · Redis · Docker · AWS/GCP · Firebase · WebSockets · WebRTC · Git · GitHub Actions',
    agent: {
      title: 'Habla con mi asistente',
      description:
        'Un agente de voz que responde preguntas sobre mi experiencia a partir de un corpus verificado. Pregúntale lo que le preguntarías a mí.',
      cta: 'Abrir asistente de voz',
    },
    work: 'Experiencia',
    workCta: 'Ver perfil en LinkedIn',
    cvCta: 'Descargar CV (PDF)',
    present: 'Actualidad',
    until: 'hasta',
  },
  about: {
    metaTitle: 'Sobre mí',
    title: 'Soy Arsenio Jiménez. Construyo productos digitales de punta a punta.',
    paragraphs: [
      'Construyo productos digitales completos — desde la arquitectura hasta el deploy. En más de 7 años como ingeniero Full-Stack, he llevado ideas de negocio a producción: plataformas e-commerce que procesan pagos reales, sistemas de control de acceso que monitorean edificios en tiempo real, y herramientas internas que reemplazan procesos manuales por flujos automatizados.',
      'Lo que me diferencia no es la lista de tecnologías que manejo, sino lo que hago con ellas: entender el problema del negocio, diseñar la solución correcta (no la más compleja), construirla rápido y asegurar que escale. He trabajado solo y en equipo, en startups y empresas establecidas, siempre con foco en entregar valor real al usuario final.',
      'Me muevo con comodidad entre frontend y backend, entre bases de datos relacionales y NoSQL, entre APIs REST y GraphQL. Tomo decisiones técnicas, hago code reviews y me ensucio las manos en producción cuando hace falta.',
    ],
    experience: 'Experiencia profesional',
    education: 'Educación',
    languages: 'Idiomas',
    languageList: [
      { name: 'Español', level: 'Nativo' },
      { name: 'Inglés', level: 'B2' },
    ],
  },
  projects: {
    metaTitle: 'Proyectos',
    title: 'Proyectos recientes.',
    intro:
      'Productos en los que he trabajado últimamente, desde un agente de voz con IA hasta plataformas de logística y e-commerce.',
    visit: 'Visitar sitio',
  },
  footer: {
    rights: 'Todos los derechos reservados.',
    photos: 'Fotos de',
    on: 'en',
    analytics: 'Este sitio mide las visitas de forma anónima y sin cookies.',
  },
  resume: [
    {
      company: 'Comunidad Feliz',
      title: 'Software Engineer',
      start: { label: 'Ago 2024', dateTime: '2024-08' },
      end: { label: 'Sep 2025', dateTime: '2025-09' },
      description:
        'Construí desde cero un proyecto web que permitió la visualización de reportes para una de las verticales de negocio de la empresa: control de acceso. Implementé integración de hardware en el navegador para tomar fotos (registro de visitas), escanear códigos QR (invitaciones) y realizar llamadas (intercomunicador). Desarrollé una solución en tiempo real usando Firebase para monitorear accesos y mejorar la seguridad.',
    },
    {
      company: 'Alseco',
      title: 'Full Stack Developer',
      start: { label: 'Jul 2022', dateTime: '2022-07' },
      end: { label: 'Jun 2024', dateTime: '2024-06' },
      description:
        'Construí una plataforma e-commerce B2B que permitía comparación de precios y compras con integración de pasarelas de pago (Transbank – ETpay), vendiendo directamente desde productores. Entregué un sitio B2C conectado a despacho automático vía Cabify. Diseñé y desarrollé desde cero un CRM para gestión de inventario de bodegas y facturación.',
    },
    {
      company: 'PeopleWork',
      title: 'Full Stack Developer',
      start: { label: 'Sep 2021', dateTime: '2021-09' },
      end: { label: 'Jun 2022', dateTime: '2022-06' },
      description:
        'Lideré la implementación end-to-end de una funcionalidad de firma digital esencial para validar legalmente las liquidaciones de sueldo, integrando servicios externos de verificación de identidad y autenticación por PIN vía SMS. Mejoré la calidad del producto introduciendo API mocking, workflows con FactoryBot y testing de endpoints externos con RSpec.',
    },
    {
      company: 'Centribal',
      title: 'Full Stack Developer',
      start: { label: 'Mar 2021', dateTime: '2021-03' },
      end: { label: 'Ago 2021', dateTime: '2021-08' },
      description:
        'Me uní a un proyecto con un deadline crítico donde el avance estaba significativamente atrasado. Contribuí en todo el stack: frontend en JavaScript para selección de seguros y generación de ofertas personalizadas, y backend en Laravel con patrones de diseño para el flujo administrativo.',
    },
    {
      company: 'Celcom SMS',
      title: 'Full Stack Developer',
      start: { label: 'Mar 2020', dateTime: '2020-03' },
      end: { label: 'Mar 2021', dateTime: '2021-03' },
      description:
        'Mantuve una plataforma de academia online estilo Masterclass con backend en Laravel y frontend en Vue.js. Desarrollé una funcionalidad que prevenía la reproducción simultánea de videos en múltiples dispositivos. Resolví problemas relacionados con pagos con tarjeta de crédito y generación de facturas.',
    },
    {
      company: 'GPS Position',
      title: 'Web Developer',
      start: { label: 'Ene 2019', dateTime: '2019-01' },
      end: { label: 'Mar 2020', dateTime: '2020-03' },
      description:
        'Desarrollo de plataformas de control de flotas y servicios GPS, enfocado en mejorar procesos y desarrollar nuevas herramientas. Desarrollo web y aplicaciones móviles para iOS y Android.',
    },
  ],
  educationList: [
    {
      school: 'Universidad Bicentenaria de Aragua',
      degree: 'Ingeniero de Sistemas',
      period: '2010 – 2015',
      description:
        'Teoría General de Sistemas, Análisis y Diseño de Sistemas, Sistemas Expertos, Redes Neuronales. Segundo líder del grupo de estudios UBANET (Microsoft). Participé en el proyecto de clases online Ingenium.',
    },
  ],
  projectList: [
    {
      name: 'Asistente de voz',
      description:
        'Agente de voz de dominio cerrado que responde sobre mi experiencia a partir de un corpus verificado: Next.js, Gemini Live, recuperación BM25, evals y control de costos. Yo soy el primer tenant. (2026)',
      href: 'https://voice-agent-flax-six.vercel.app/',
      label: 'voice-agent-flax-six.vercel.app',
    },
    {
      name: 'Neo Warehouse',
      description:
        'Sistema de gestión de almacenes — plataforma web SPA para optimizar operaciones logísticas y control de inventario. (2026)',
      href: 'https://frontend-neowarehouse.vercel.app/',
      label: 'frontend-neowarehouse.vercel.app',
    },
    {
      name: 'Tienda Capullito',
      description: 'Web para la venta de productos de regalo. (2025 – 2026)',
      href: 'https://www.tiendacapullito.cl/',
      label: 'tiendacapullito.cl',
    },
  ],
}
