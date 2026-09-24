import { z } from "zod";

/**
 * Origen de la visita: el utm_source con el que llegó (una empresa, "linkedin",
 * "portafolio"...). Viene del navegador y termina en /admin, así que el juego de
 * caracteres va cerrado y todo lo que no cumpla se descarta en vez de fallar.
 */
export const originSchema = z
  .string()
  .max(64)
  .regex(/^[\w.-]+$/)
  .transform((s) => s.toLowerCase())
  .optional()
  .catch(undefined);

/** Sesiones sin utm_source: llegaron directo al agente o desde un enlace sin marcar. */
export const DIRECT_ORIGIN = "directo";
