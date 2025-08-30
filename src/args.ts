import z, { prettifyError } from "zod";
import { parseArgs, type ParseArgsOptionsType } from "util";
import { zodVerifyPath } from "./utils";
import { Glob } from "bun";

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
  },
  strict: true,
  allowPositionals: true,
});

const argsSchema = z.object({
  source: z.string({ error: "Invalid source path" }).superRefine(zodVerifyPath),
  clone: z.string().superRefine(zodVerifyPath),
  clean: z.boolean(),
});

export async function getArgs(): Promise<z.infer<typeof argsSchema>> {
  const maybeArgs = await argsSchema.safeParseAsync(values);

  if (!maybeArgs.success) {
    throw TypeError(prettifyError(maybeArgs.error));
  }

  return maybeArgs.data;
}
