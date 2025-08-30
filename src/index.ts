import path from "path";
import { getArgs } from "./args";

const args = await getArgs();

const sourceFilesIterator = args.glob.scan(args.source);

type ManifestItem = {
  path: string;
  sha256: string;
};

const manifest: ManifestItem[] = [];

for await (const sourceFile of sourceFilesIterator) {
  const joinedPath = path.join(args.source, sourceFile);

  console.log(`Processing ${joinedPath}`);

  const file = Bun.file(joinedPath).stream();
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
  });
}

Bun.file("./manifest.json").write(JSON.stringify(manifest, null, 2));
