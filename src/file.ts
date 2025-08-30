import { $ } from "bun";
import { join, basename, dirname, extname } from "path";
import { CODEC, QUALITY } from "./constants";

const videos: ReadonlySet<string> = new Set([
  ".mp4",
  ".MP4",
  ".m4v",
  ".M4V",
  ".mkv",
  ".MKV",
]);

export async function compressInPlace(pathString: string): Promise<void> {
  if (videos.has(extname(pathString))) {
    await compressVideo(pathString);
  }
}

async function compressVideo(pathString: string): Promise<void> {
  const dir = dirname(pathString);
  const name = basename(pathString);
  const compressedFilePath = join(dir, `TEMP-${name}`);

  await $`HandBrakeCLI -i ${pathString} -o ${compressedFilePath} -e ${CODEC} -q ${QUALITY} --all-audio --all-subtitles --subtitle-burned=none --audio-copy-mask aac,ac3,mp3,dts --audio-fallback ffac3`.quiet();
  await $`rm ${pathString}`;
  await $`mv ${compressedFilePath} ${pathString}`;
}

export async function sha256HashFile(filePath: string): Promise<string> {
  const file = Bun.file(filePath).stream();
  const hasher = new Bun.CryptoHasher("sha256");
  const reader = file.getReader();

  while (true) {
    const { value, done } = await reader.read();

    if (done) {
      break;
    }

    hasher.update(value);
  }

  return hasher.digest("hex");
}
