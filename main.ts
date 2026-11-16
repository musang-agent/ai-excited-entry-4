// Did You Feel That? — ai-excited-01 entry (Node 22, standard library only).
//
// Reads the entry image beside this script, validates it against the
// competition gate (PNG or JPEG by magic bytes, at most 1 MiB and at most
// 1024 by 1024 pixels), writes the identical bytes to
// $MAKEFUN_OUTPUT_DIR/entry.png (default /output), then re-reads the
// output and proves the copy is byte-identical with a sha256 check.
//
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const MAX_BYTES = 1024 * 1024;
const MAX_DIM = 1024;

const here = dirname(fileURLToPath(import.meta.url));
const sourcePath = join(here, 'entry.png');
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
const outPath = join(outDir, 'entry.png');

const bytes = readFileSync(sourcePath);
if (bytes.length > MAX_BYTES) {
  throw new Error(`entry.png is ${bytes.length} bytes, over the 1 MiB limit`);
}

const isPng =
  bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47;
const isJpeg = bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
if (!isPng && !isJpeg) {
  throw new Error('entry.png is neither PNG nor JPEG (magic bytes do not match)');
}

let width;
let height;
if (isPng) {
  // PNG: width and height are the first 8 bytes of the IHDR chunk data,
  // at offsets 16 and 20, big-endian. A file shorter than that cannot
  // hold a header at all.
  if (bytes.length < 24) {
    throw new Error('malformed PNG: too short to hold an IHDR chunk');
  }
  width = bytes.readUInt32BE(16);
  height = bytes.readUInt32BE(20);
} else {
  // JPEG: walk the segments until a Start Of Frame marker (0xC0-0xCF,
  // except 0xC4, 0xC8, 0xCC) gives height then width, big-endian.
  // Stop at the scan data (SOS, 0xDA): no frame header past it counts.
  let pos = 2;
  while (pos + 9 < bytes.length) {
    if (bytes[pos] !== 0xff) {
      throw new Error('malformed JPEG: expected a marker');
    }
    const marker = bytes[pos + 1];
    if (marker === 0xda) {
      throw new Error('malformed JPEG: reached scan data with no Start Of Frame');
    }
    const len = bytes.readUInt16BE(pos + 2);
    if (
      marker >= 0xc0 &&
      marker <= 0xcf &&
      marker !== 0xc4 &&
      marker !== 0xc8 &&
      marker !== 0xcc
    ) {
      height = bytes.readUInt16BE(pos + 5);
      width = bytes.readUInt16BE(pos + 7);
      break;
    }
    pos += 2 + len;
  }
  if (width === undefined || height === undefined) {
    throw new Error('malformed JPEG: no Start Of Frame segment found');
  }
}
if (width === 0 || height === 0) {
  throw new Error('malformed image: header claims a zero dimension');
}
if (width > MAX_DIM || height > MAX_DIM) {
  throw new Error(`image is ${width}x${height}, over the 1024x1024 limit`);
}

mkdirSync(outDir, { recursive: true });
writeFileSync(outPath, bytes);

// Second check, independent of the hash: the file that landed on disk
// must be the same length as the source and carry the same magic bytes.
const written = readFileSync(outPath);
if (written.length !== bytes.length) {
  throw new Error(
    `output is ${written.length} bytes, source is ${bytes.length} bytes`,
  );
}
if (!written.subarray(0, 4).equals(bytes.subarray(0, 4))) {
  throw new Error('output magic bytes differ from the source image');
}
const sha = (buf) => createHash('sha256').update(buf).digest('hex');
if (sha(written) !== sha(bytes)) {
  throw new Error('output differs from the source image');
}
const format = isPng ? 'PNG' : 'JPEG';
console.log(
  `wrote ${outPath}: ${format} ${width}x${height}, ${bytes.length} bytes, sha256 ${sha(bytes)}`,
);
