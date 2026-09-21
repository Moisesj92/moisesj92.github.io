import { type es } from '@/i18n/dictionaries/es'

export const en: typeof es = {
  meta: {
    title: 'Arsenio Jiménez — Systems Engineer / Full Stack Developer',
    titleTemplate: '%s - Arsenio Jiménez',
    description:
      'Senior Full-Stack Engineer with 7+ years building complete digital products: e-commerce, real-time systems, SaaS platforms. From idea to production.',
  },
  nav: {
    home: 'Home',
    about: 'About',
    projects: 'Projects',
    menu: 'Menu',
    navigation: 'Navigation',
    closeMenu: 'Close menu',
    switchLocale: 'Cambiar a español',
    switchLocaleLabel: 'ES',
    themeToggle: 'Toggle theme',
    themeSwitchTo: { light: 'Switch to light theme', dark: 'Switch to dark theme' },
  },
  social: {
    github: 'Follow on GitHub',
    linkedin: 'Connect on LinkedIn',
    email: 'Send me an email',
  },
  home: {
    title: 'Systems Engineer and Full Stack Developer.',
    intro:
      'I’m Arsenio. I build complete digital products — from architecture to deployment. In over 7 years I’ve taken business ideas to production: e-commerce with real payments, real-time access control systems, and internal tools that replace manual processes.',
    skillsHeading: 'What I do',
    skills: [
      {
        title: 'Products & Platforms',
        items: [
          'Complete web applications (SPA / SSR)',
          'E-commerce with payment gateways',
          'Real-time systems (monitoring, chat, notifications)',
          'CRMs and internal tools',
          'MVPs ready to validate fast',
        ],
      },
      {
        title: 'Architecture & Quality',
        items: [
          'API design (REST / GraphQL)',
          'Hexagonal architecture / DDD',
          'Automated testing (unit, e2e, integration)',
          'CI/CD and continuous deployment',
          'Observability (logging, error tracking, metrics)',
        ],
      },
    ],
    stackTitle: 'Tech stack',
    stack:
      'JavaScript/TypeScript · React/Next.js · Node.js · Ruby on Rails · PHP/Laravel · PostgreSQL · Redis · Docker · AWS/GCP · Firebase · WebSockets · WebRTC · Git · GitHub Actions',
    agent: {
      title: 'Talk to my assistant',
      description:
        'A voice agent that answers questions about my experience from a verified corpus. Ask it what you would ask me.',
      cta: 'Open voice assistant',
    },
    work: 'Work',
    workCta: 'View profile on LinkedIn',
    cvCta: 'Download CV (PDF)',
    present: 'Present',
    until: 'until',
  },
  about: {
    metaTitle: 'About',
    title: 'I’m Arsenio Jiménez. I build digital products end to end.',
    paragraphs: [
      'I build complete digital products — from architecture to deployment. In over 7 years as a Full-Stack engineer, I’ve taken business ideas to production: e-commerce platforms that process real payments, access control systems that monitor buildings in real time, and internal tools that replace manual processes with automated workflows.',
      'What sets me apart isn’t the list of technologies I know, but what I do with them: understand the business problem, design the right solution (not the most complex one), build it fast, and make sure it scales. I’ve worked solo and on teams, at startups and established companies, always focused on delivering real value to the end user.',
      'I move comfortably between frontend and backend, between relational and NoSQL databases, between REST and GraphQL APIs. I make technical decisions, do code reviews, and get my hands dirty in production when needed.',
    ],
    experience: 'Professional experience',
    education: 'Education',
    languages: 'Languages',
    languageList: [
      { name: 'Spanish', level: 'Native' },
      { name: 'English', level: 'B2' },
    ],
  },
  projects: {
    metaTitle: 'Projects',
    title: 'Recent projects.',
    intro:
      'Products I’ve worked on lately, from an AI voice agent to logistics and e-commerce platforms.',
    visit: 'Visit site',
  },
  footer: {
    rights: 'All rights reserved.',
  },
  resume: [
    {
      company: 'Comunidad Feliz',
      title: 'Software Engineer',
      start: { label: 'Aug 2024', dateTime: '2024-08' },
      end: { label: 'Sep 2025', dateTime: '2025-09' },
      description:
        'Built from scratch a web project that enabled report visualization for one of the company’s business verticals: access control. Implemented browser-based hardware integration for taking photos (guest registration), scanning QR codes (invitations), and making calls (intercom). Developed a real-time solution using Firebase for monitoring entrances and enhancing security.',
    },
    {
      company: 'Alseco',
      title: 'Full Stack Developer',
      start: { label: 'Jul 2022', dateTime: '2022-07' },
      end: { label: 'Jun 2024', dateTime: '2024-06' },
      description:
        'Built a B2B e-commerce platform with price comparison and purchasing through payment gateway integration (Transbank – ETpay), selling directly from producers. Delivered a B2C website connected to automatic delivery via Cabify. Designed and developed from scratch a CRM for warehouse inventory management and invoicing.',
    },
    {
      company: 'PeopleWork',
      title: 'Full Stack Developer',
      start: { label: 'Sep 2021', dateTime: '2021-09' },
      end: { label: 'Jun 2022', dateTime: '2022-06' },
      description:
        'Led the end-to-end implementation of a digital signature feature essential for legally validating employee payslips, integrating external identity-verification services and SMS-based PIN authentication. Improved product quality by introducing API mocking, FactoryBot workflows, and external API endpoint testing with RSpec.',
    },
    {
      company: 'Centribal',
      title: 'Full Stack Developer',
      start: { label: 'Mar 2021', dateTime: '2021-03' },
      end: { label: 'Aug 2021', dateTime: '2021-08' },
      description:
        'Joined a project with a critical client-committed deadline where progress was significantly behind schedule. Contributed across the stack: JavaScript frontend for insurance selection and tailored offer generation, and Laravel backend with design patterns for the administrative workflow.',
    },
    {
      company: 'Celcom SMS',
      title: 'Full Stack Developer',
      start: { label: 'Mar 2020', dateTime: '2020-03' },
      end: { label: 'Mar 2021', dateTime: '2021-03' },
      description:
        'Maintained an online academy platform similar to Masterclass with a Laravel backend and Vue.js frontend. Developed a feature preventing simultaneous video playback on multiple devices. Resolved issues related to credit card payments and invoice generation.',
    },
    {
      company: 'GPS Position',
      title: 'Web Developer',
      start: { label: 'Jan 2019', dateTime: '2019-01' },
      end: { label: 'Mar 2020', dateTime: '2020-03' },
      description:
        'Development of fleet control platforms and GPS services, focused on improving processes and building new tools. Web and mobile app development for iOS and Android.',
    },
  ],
  educationList: [
    {
      school: 'Universidad Bicentenaria de Aragua',
      degree: 'Systems Engineer',
      period: '2010 – 2015',
      description:
        'General Systems Theory, Systems Analysis & Design, Expert Systems, Neural Networks. Second leader of the UBANET study group (Microsoft). Participated in the Ingenium online classes project.',
    },
  ],
  projectList: [
    {
      name: 'Voice assistant',
      description:
        'Closed-domain voice agent that answers about my experience from a verified corpus: Next.js, Gemini Live, BM25 retrieval, evals and cost control. I am the first tenant. (2026)',
      href: 'https://voice-agent-flax-six.vercel.app/',
      label: 'voice-agent-flax-six.vercel.app',
    },
    {
      name: 'Neo Warehouse',
      description:
        'Warehouse management system — SPA web platform to optimize logistics operations and inventory control. (2026)',
      href: 'https://frontend-neowarehouse.vercel.app/',
      label: 'frontend-neowarehouse.vercel.app',
    },
    {
      name: 'Tienda Capullito',
      description: 'E-commerce website for gift products. (2025 – 2026)',
      href: 'https://www.tiendacapullito.cl/',
      label: 'tiendacapullito.cl',
    },
  ],
}
