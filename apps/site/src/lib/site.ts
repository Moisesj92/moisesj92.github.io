export const site = {
  name: 'Arsenio Jiménez',
  url: process.env.NEXT_PUBLIC_SITE_URL ?? 'https://moisesj92.github.io',
  email: 'arsenio.jimenez92@outlook.com',
  github: 'https://github.com/Moisesj92',
  linkedin: 'https://www.linkedin.com/in/ajdeveloper',
  voiceAgent: 'https://voice-agent-flax-six.vercel.app/',
  cvPdf: 'https://moisesj92.github.io/cv/Arsenio_Jimenez_CV.pdf',
  /* Umami autoalojado (Vercel + Neon propio). El website-id es público. */
  analytics: {
    src: 'https://umami-ivory-one.vercel.app/stats',
    websiteId: 'de689ba5-e719-4f8e-a884-c85a90a9c9fc',
    domain: 'moisesj92.github.io',
  },
  /* Fotos de la portada (licencia Unsplash; se acredita al autor en el pie). */
  photoCredits: [
    { name: 'Caio Silva', url: 'https://unsplash.com/@caaaaaaaaaio' },
    { name: 'Clay Banks', url: 'https://unsplash.com/@claybanks' },
    { name: 'Micho', url: 'https://unsplash.com/@michofuk' },
    { name: 'Marvin Meyer', url: 'https://unsplash.com/@marvelous' },
  ],
}
