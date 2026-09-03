const EOCD_SIGNATURE = 0x06054b50;
const CENTRAL_SIGNATURE = 0x02014b50;
const LOCAL_SIGNATURE = 0x04034b50;

function findEndOfCentralDirectory(view) {
  const minOffset = Math.max(0, view.byteLength - 65_557);

  for (let offset = view.byteLength - 22; offset >= minOffset; offset -= 1) {
    if (view.getUint32(offset, true) === EOCD_SIGNATURE) {
      return offset;
    }
  }

  throw new Error("Archive ZIP invalide : fin du répertoire central introuvable.");
}

function safeEntryPath(raw) {
  const value = String(raw ?? "")
    .replace(/\\/g, "/")
    .replace(/^\.\/+/, "");

  if (
    !value ||
    value.startsWith("/") ||
    value.split("/").some(part => part === "..")
  ) {
    throw new Error(`Chemin ZIP non sûr : ${raw}`);
  }

  return value;
}

async function inflateRaw(bytes) {
  if (typeof DecompressionStream !== "function") {
    throw new Error(
      "Cette archive utilise Deflate, mais ce navigateur ne fournit pas DecompressionStream."
    );
  }

  let stream;

  try {
    stream = new Blob([bytes])
      .stream()
      .pipeThrough(new DecompressionStream("deflate-raw"));
  } catch (error) {
    throw new Error(
      "Impossible de décompresser cette archive ZIP dans ce navigateur.",
      { cause: error }
    );
  }

  return new Uint8Array(
    await new Response(stream).arrayBuffer()
  );
}

async function decodeEntry(buffer, view, entry) {
  const offset = entry.localHeaderOffset;

  if (view.getUint32(offset, true) !== LOCAL_SIGNATURE) {
    throw new Error(`Archive ZIP invalide : entrée ${entry.name}.`);
  }

  const fileNameLength = view.getUint16(offset + 26, true);
  const extraLength = view.getUint16(offset + 28, true);
  const dataOffset = offset + 30 + fileNameLength + extraLength;

  const compressed = new Uint8Array(
    buffer,
    dataOffset,
    entry.compressedSize
  );

  let result;

  if (entry.method === 0) {
    result = new Uint8Array(compressed);
  } else if (entry.method === 8) {
    result = await inflateRaw(compressed);
  } else {
    throw new Error(
      `Compression ZIP non prise en charge (${entry.method}) pour ${entry.name}.`
    );
  }

  if (result.byteLength !== entry.uncompressedSize) {
    throw new Error(
      `Taille inattendue après extraction de ${entry.name}.`
    );
  }

  return result;
}

export async function readZipFile(file) {
  const buffer = await file.arrayBuffer();
  const view = new DataView(buffer);
  const eocd = findEndOfCentralDirectory(view);

  const diskNumber = view.getUint16(eocd + 4, true);
  const centralDisk = view.getUint16(eocd + 6, true);
  const entryCount = view.getUint16(eocd + 10, true);
  const centralSize = view.getUint32(eocd + 12, true);
  const centralOffset = view.getUint32(eocd + 16, true);

  if (
    diskNumber !== 0 ||
    centralDisk !== 0 ||
    entryCount === 0xffff ||
    centralSize === 0xffffffff ||
    centralOffset === 0xffffffff
  ) {
    throw new Error("Les archives multi-disques / ZIP64 ne sont pas prises en charge.");
  }

  const decoder = new TextDecoder("utf-8");
  const entries = [];
  let offset = centralOffset;

  for (let index = 0; index < entryCount; index += 1) {
    if (view.getUint32(offset, true) !== CENTRAL_SIGNATURE) {
      throw new Error("Archive ZIP invalide : répertoire central corrompu.");
    }

    const flags = view.getUint16(offset + 8, true);
    const method = view.getUint16(offset + 10, true);
    const compressedSize = view.getUint32(offset + 20, true);
    const uncompressedSize = view.getUint32(offset + 24, true);
    const fileNameLength = view.getUint16(offset + 28, true);
    const extraLength = view.getUint16(offset + 30, true);
    const commentLength = view.getUint16(offset + 32, true);
    const localHeaderOffset = view.getUint32(offset + 42, true);

    if (flags & 0x0001) {
      throw new Error("Les archives ZIP chiffrées ne sont pas prises en charge.");
    }

    if (
      compressedSize === 0xffffffff ||
      uncompressedSize === 0xffffffff ||
      localHeaderOffset === 0xffffffff
    ) {
      throw new Error("Les archives ZIP64 ne sont pas prises en charge.");
    }

    const nameBytes = new Uint8Array(
      buffer,
      offset + 46,
      fileNameLength
    );

    const name = safeEntryPath(decoder.decode(nameBytes));

    entries.push({
      name,
      directory: name.endsWith("/"),
      method,
      compressedSize,
      uncompressedSize,
      localHeaderOffset
    });

    offset += 46 + fileNameLength + extraLength + commentLength;
  }

  const files = new Map();

  for (const entry of entries) {
    if (entry.directory) continue;
    files.set(entry.name, await decodeEntry(buffer, view, entry));
  }

  return files;
}
