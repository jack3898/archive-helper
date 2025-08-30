import path from "path";
import { homedir } from "os";
import { statSync } from "fs";
import type z from "zod";

export function expandHome(filepath: string): string {
  if (!filepath) {
    return filepath;
  }

  if (filepath.startsWith("~")) {
    return path.join(homedir(), filepath.slice(1));
  }

  return filepath;
}

export async function fileOrDirExists(path: string): Promise<boolean> {
  try {
    return statSync(expandHome(path)).isDirectory() || Bun.file(path).exists();
  } catch {
    return false;
  }
}

export async function zodVerifyPath(
  path: string,
  ctx: z.core.$RefinementCtx<string>
) {
  const exists = await fileOrDirExists(path);

  if (!exists) {
    ctx.addIssue({
      code: "custom",
      message: `Directory does not exist: ${path}`,
    });
  }
}
