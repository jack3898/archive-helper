import path, { basename, dirname } from "path";
import { getArgs } from "./args";
import { $, Glob } from "bun";

const args = await getArgs();

await $`rm -rf ${args.clone}`;
await $`mkdir ${args.clone}`;

if (args.clone) {
  console.log(`Copying to ${args.clone}...`);

  await $`cp -R ${args.source}/* ${args.clone}`;
}

const source = args.clone ?? args.source;

const sourceFilesIterator = new Glob("**/*").scan(source);
const videoFilesIterator = new Glob("**/*.[mM][pP]4").scan(source);

type ManifestItem = {
  path: string;
  sha256: string;
  sizeGB: number;
};

const manifest: ManifestItem[] = [];

console.log("Searching for mp4s to compress...");

for await (const sourceFile of videoFilesIterator) {
  const sourceFilePath = path.join(source, sourceFile);
  const dir = dirname(sourceFilePath);
  const name = basename(sourceFilePath);
  const compressedFilePath = path.join(dir, `TEMP-${name}`);

  console.log(`Compressing ${sourceFilePath}...`);

  await $`HandBrakeCLI -i ${sourceFilePath} -o ${compressedFilePath} -e x265 -q 21 --all-audio --all-subtitles --subtitle-burned=none --audio-copy-mask aac,ac3,mp3,dts --audio-fallback ffac3`.quiet();
  await $`rm ${sourceFilePath}`;
  await $`mv ${compressedFilePath} ${sourceFilePath}`;
}

console.log("Generating manifest file...");

for await (const sourceFile of sourceFilesIterator) {
  const sourceFilePath = path.join(args.source, sourceFile);
  const file = Bun.file(sourceFilePath).stream();
  const sizeGB = Bun.file(sourceFilePath).size / 1000 ** 3;
  const hasher = new Bun.CryptoHasher("sha256");
  const reader = file.getReader();

  while (true) {
    const { value, done } = await reader.read();

    if (done) {
      break;
    }

    hasher.update(value); // value is a Uint8Array chunk
  }

  const hex = hasher.digest("hex");

  manifest.push({
    path: sourceFile,
    sha256: hex,
    sizeGB,
  });
}

Bun.file(path.join(source, "manifest.json")).write(
  JSON.stringify(manifest, null, 2)
);
