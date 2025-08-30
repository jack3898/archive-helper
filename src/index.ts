import path, { dirname } from "path";
import { getArgs } from "./args";
import { $, Glob } from "bun";
import { compressInPlace, sha256HashFile } from "./file";

const args = await getArgs();

const newFilesDir = path.join(args.clone, "files");

if (args.clean) {
  await $`rm -rf ${args.clone}`;
  await $`mkdir ${args.clone}`;
}

const sourceFiles = new Glob("**/*").scan(args.source);

type ManifestItem = {
  path: string;
  sha256: string;
  sizeMB: number;
};

const manifest: ManifestItem[] = [];

console.log("Starting the compression of media...");

for await (const sourceFile of sourceFiles) {
  console.log(`Processing ${sourceFile}`);

  const sourceFilePath = path.join(args.source, sourceFile);
  const newFilePath = path.join(newFilesDir, sourceFile);

  await $`mkdir -p ${dirname(newFilePath)}`;
  await $`cp ${sourceFilePath} ${newFilePath}`;
  await compressInPlace(newFilePath);
}

console.log("Generating a manifest file...");

const cloneDir = new Glob("*/**").scan(args.clone);

for await (const clonedFile of cloneDir) {
  const clonedFilePath = path.join(args.clone, clonedFile);

  console.log(`Calculating meta for ${clonedFilePath}`);

  const sha256 = await sha256HashFile(clonedFilePath);
  const sizeMB = Bun.file(clonedFilePath).size / 1000 ** 2;

  manifest.push({
    path: clonedFile,
    sha256,
    sizeMB,
  });
}

Bun.file(path.join(args.clone, "manifest.json")).write(
  JSON.stringify(manifest, null, 2)
);
