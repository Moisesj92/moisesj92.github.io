import { z } from "zod";
import type { AgentConfig } from "../config/schema";
import type { Tool, ToolContext, ToolResult } from "../types";
import { downloadCv } from "./download-cv";
import { leaveMessage } from "./leave-message";
import { searchExperience } from "./search-experience";
import { showProject } from "./show-project";

/** Todos los tools que el motor conoce. Cada tenant habilita un subconjunto en agent.yaml. */
const ALL_TOOLS: Tool<never>[] = [
  searchExperience as Tool<never>,
  showProject as Tool<never>,
  downloadCv as Tool<never>,
  leaveMessage as Tool<never>,
];

/** Forma que Gemini espera en `tools[].functionDeclarations[]`. */
export interface FunctionDeclarationJson {
  name: string;
  description: string;
  parametersJsonSchema: unknown;
}

export class UnknownToolError extends Error {
  constructor(name: string) {
    super(`Tool desconocido o no habilitado: ${name}`);
    this.name = "UnknownToolError";
  }
}

/**
 * Registro de tools de un tenant. Expone las declaraciones para el modelo
 * y ejecuta llamadas validando los argumentos con el Zod de cada tool.
 */
export class ToolRegistry {
  private readonly tools = new Map<string, Tool<never>>();

  constructor(config: AgentConfig) {
    for (const name of config.tools) {
      const tool = ALL_TOOLS.find((t) => t.name === name);
      if (!tool) {
        throw new Error(
          `agent.yaml de "${config.id}" habilita el tool "${name}", que no existe en el motor`,
        );
      }
      this.tools.set(name, tool);
    }
  }

  declarations(): FunctionDeclarationJson[] {
    return [...this.tools.values()].map((t) => {
      // Gemini valida el schema; la clave meta `$schema` no forma parte de él.
      const schema: Record<string, unknown> = z.toJSONSchema(t.input);
      delete schema.$schema;
      return {
        name: t.name,
        description: t.description,
        parametersJsonSchema: schema,
      };
    });
  }

  has(name: string): boolean {
    return this.tools.has(name);
  }

  /**
   * Ejecuta un tool. Argumentos inválidos devuelven `ok: false` con el
   * detalle: el modelo puede corregir y reintentar; un 500 no le sirve.
   */
  async run(name: string, args: unknown, ctx: ToolContext): Promise<ToolResult> {
    const tool = this.tools.get(name);
    if (!tool) throw new UnknownToolError(name);

    const parsed = tool.input.safeParse(args);
    if (!parsed.success) {
      return {
        ok: false,
        error: `Argumentos inválidos: ${parsed.error.issues
          .map((i) => `${i.path.join(".") || "(raíz)"}: ${i.message}`)
          .join("; ")}`,
      };
    }
    if (tool.sideEffect) {
      console.info(`[tools] side effect: ${name} session=${ctx.sessionId}`);
    }
    return tool.run(parsed.data as never, ctx);
  }
}
