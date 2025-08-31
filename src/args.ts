import z, { prettifyError } from "zod";
import { parseArgs } from "util";
import { zodVerifyPath } from "./utils";
import { PRESETS } from "./constants";

const { values } = parseArgs({
  args: Bun.argv,
  options: {
    source: {
      type: "string",
      short: "s",
    },
    clone: {
      type: "string",
    },
    clean: {
      type: "boolean",
      default: false,
    },
    preset: {
      type: "string",
    },
  },
  strict: true,
  allowPositionals: true,
});

const argsSchema = z.object({
  source: z.string({ error: "Invalid source path" }).superRefine(zodVerifyPath),
  clone: z.string().superRefine(zodVerifyPath),
  clean: z.boolean(),
  preset: z
    .enum(Object.keys(PRESETS) as (keyof typeof PRESETS)[])
    .transform((type) => PRESETS[type]),
});

async function getArgs(): Promise<z.infer<typeof argsSchema>> {
  const maybeArgs = await argsSchema.safeParseAsync(values);

  if (!maybeArgs.success) {
    throw TypeError(prettifyError(maybeArgs.error));
  }

  return maybeArgs.data;
}

export const args = await getArgs();
