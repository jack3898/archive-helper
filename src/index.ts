import path, { dirname, relative } from "path";
import { getArgs } from "./args";
import { $, Glob } from "bun";
import { compressInPlace, sha256HashFile } from "./file";
import type { Stats } from "fs";
import { CODEC, QUALITY } from "./constants";

const args = await getArgs();

const newFilesDir = path.join(args.clone, "files");

if (args.clean) {
  await $`rm -rf ${args.clone}`;
  await $`mkdir ${args.clone}`;
}

type ManifestItem = {
  path: string;
  stats: Record<string, unknown>;
  sha256: string;
};

const manifest = {
  handbrake: {
    cliVersion: (await $`HandBrakeCLI --version | grep -i HandBrake`)
      .text()
      .trim(),
    quality: QUALITY,
    codec: CODEC,
    note: "Most of the original video metadata is preserved (framerate, subtitles, resolution) it is just some lossy compression.",
  },
  date: new Date().toISOString(),
  meta: [] as ManifestItem[],
};

console.log("Starting the compression of media...");

for await (const sourceFile of new Glob("**/*").scan(args.source)) {
  console.log(`Processing ${sourceFile}`);

  const sourceFilePath = path.join(args.source, sourceFile);
  const newFilePath = path.join(newFilesDir, sourceFile);

  await $`mkdir -p ${dirname(newFilePath)}`;
  await $`cp ${sourceFilePath} ${newFilePath}`;
  await compressInPlace(newFilePath);
}

console.log("Generating a manifest file...");

for await (const clonedFile of new Glob("*/**").scan(args.clone)) {
  const clonedFilePath = path.join(args.clone, clonedFile);
  const originalFilePath = path.join(
    args.source,
    relative("files", clonedFile)
  );

  console.log(`Calculating meta for ${clonedFilePath}`);

  const sha256 = await sha256HashFile(clonedFilePath);
  const stat = await Bun.file(originalFilePath).stat();

  manifest.meta.push({
    path: clonedFile,
    stats: {
      ...stat,
      atime: new Date(stat.atimeMs),
      ctime: new Date(stat.ctimeMs),
      mtime: new Date(stat.mtimeMs),
      birthtime: new Date(stat.birthtimeMs),
      size: stat.size,
      sizeMeasurement: "bytes",
    },
    sha256,
  });
}

Bun.file(path.join(args.clone, "manifest.json")).write(
  JSON.stringify(manifest, null, 2)
);
