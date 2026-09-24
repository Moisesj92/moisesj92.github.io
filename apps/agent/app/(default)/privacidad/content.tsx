import { RETENTION_DAYS } from '@/core/observability/turn-log'
import { Section } from '@repo/ui/Section'
import { SimpleLayout } from '@repo/ui/SimpleLayout'
import { loadTenant } from '../../_lib/tenant-server'

/**
 * Aviso de privacidad. Redactado para la Ley 19.628 (vigente) y la Ley
 * 21.719 (en vigor desde el 1 de diciembre de 2026): finalidad, datos,
 * plazo, terceros y derechos. Los valores del tenant vienen de agent.yaml.
 */
export async function PrivacyContent({ tenant: tenantId }: { tenant?: string }) {
  const tenant = await loadTenant(tenantId)
  const name = tenant.displayName
  const email = tenant.links.contactEmail
  const responsible = tenant.legal.responsible ?? `${name}, como responsable del tratamiento.`

  return (
    <SimpleLayout
      title="Privacidad"
      intro={`Qué guarda este asistente cuando conversas con él, durante cuánto tiempo y cómo puedes pedir que se borre.`}
    >
      <div className="space-y-16 text-base text-zinc-600 dark:text-zinc-400">
        <Section title="Responsable">
          <p>
            {responsible}
            {email && (
              <>
                {' '}
                Contacto: <a href={`mailto:${email}`} className="text-teal-500 hover:underline">{email}</a>.
              </>
            )}
          </p>
        </Section>

        <Section title="Qué se guarda">
          <ul className="list-disc space-y-2 pl-5">
            <li>
              <strong className="text-zinc-800 dark:text-zinc-100">La transcripción</strong> de cada turno (lo que preguntaste y
              lo que respondió el asistente), con correos electrónicos y teléfonos reemplazados por marcadores antes de
              guardarse.
            </li>
            <li>
              <strong className="text-zinc-800 dark:text-zinc-100">Datos técnicos</strong> del turno: canal (voz o texto),
              modelo usado, latencia, documentos consultados y si la respuesta fue un rechazo.
            </li>
            <li>
              <strong className="text-zinc-800 dark:text-zinc-100">El origen de la visita</strong>, si el enlace por el que
              llegaste lo traía: una etiqueta como el nombre de la empresa a la que se envió el enlace. Se guarda junto a la
              conversación, con el mismo plazo de borrado.
            </li>
            <li>
              <strong className="text-zinc-800 dark:text-zinc-100">Un identificador cifrado de tu conexión</strong> (hash con
              sal de la dirección IP, no la IP), solo para limitar abusos. No permite identificarte.
            </li>
            <li>
              Si decides <strong className="text-zinc-800 dark:text-zinc-100">dejar un mensaje</strong>, tu nombre, correo y el
              texto, para que {name} pueda responderte. Es lo único que se guarda con datos de contacto, y solo porque tú los
              entregas para eso.
            </li>
          </ul>
        </Section>

        <Section title="Qué no se guarda">
          <p>
            <strong className="text-zinc-800 dark:text-zinc-100">Nunca el audio.</strong> Tu voz se transmite en tiempo real al
            proveedor de voz para transcribirla y responder, y no se almacena en ningún sistema de {name}.
          </p>
        </Section>

        <Section title="Estadísticas de visitas">
          <p>
            Las visitas se miden con <strong className="text-zinc-800 dark:text-zinc-100">Umami</strong>, una herramienta de
            código abierto alojada en la misma infraestructura que este asistente, no en un servicio de terceros.{' '}
            <strong className="text-zinc-800 dark:text-zinc-100">No usa cookies</strong> ni guarda tu dirección IP: la usa en
            el momento para estimar país y ciudad, y la descarta. Registra qué páginas se ven y algunas acciones (iniciar una
            conversación, descargar el CV, dejar un mensaje), nunca lo que dices o escribes. Las estadísticas son agregadas
            y no permiten identificarte.
          </p>
        </Section>

        <Section title="Para qué">
          <p>
            Para responder tus preguntas, para que {name} lea los mensajes que le dejes, y para mejorar el asistente
            (ver qué se pregunta y qué responde mal). No se usa para publicidad ni se vende ni cede a terceros.
          </p>
        </Section>

        <Section title="Cuánto tiempo">
          <p>
            Las transcripciones se borran automáticamente a los {RETENTION_DAYS} días. Los mensajes que dejes se conservan
            hasta que {name} los responda o tú pidas borrarlos.
          </p>
        </Section>

        <Section title="Quién más participa">
          <ul className="list-disc space-y-2 pl-5">
            <li>
              <strong className="text-zinc-800 dark:text-zinc-100">Google (Gemini)</strong> procesa el audio y el texto para
              generar las respuestas, bajo sus propias condiciones de servicio.
            </li>
            <li>
              <strong className="text-zinc-800 dark:text-zinc-100">Vercel</strong> aloja la aplicación y{' '}
              <strong className="text-zinc-800 dark:text-zinc-100">Neon</strong> la base de datos.
            </li>
            <li>
              <strong className="text-zinc-800 dark:text-zinc-100">Cloudflare Turnstile</strong> verifica que quien inicia una
              conversación por voz es una persona y no un programa.
            </li>
          </ul>
        </Section>

        <Section title="Tus derechos">
          <p>
            Puedes pedir acceso a lo que se guardó de tus conversaciones, su rectificación o su eliminación, conforme a la
            Ley 19.628 y, desde el 1 de diciembre de 2026, a la Ley 21.719 sobre protección de datos personales.
            {email ? (
              <>
                {' '}
                Escribe a <a href={`mailto:${email}`} className="text-teal-500 hover:underline">{email}</a> indicando la fecha
                y hora aproximadas de la conversación.
              </>
            ) : null}
          </p>
        </Section>

        <Section title="Consentimiento">
          <p>
            La conversación por voz solo empieza cuando pulsas el botón y aceptas este aviso; el micrófono nunca se activa
            solo. El modo texto guarda la transcripción en las mismas condiciones.
          </p>
        </Section>
      </div>
    </SimpleLayout>
  )
}
