import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

function createPNG(width, height, drawFn) {
  // Generate RGBA raw buffer
  const rowSize = width * 4;
  const rawData = Buffer.alloc(height * (rowSize + 1));

  for (let y = 0; y < height; y++) {
    const rowOffset = y * (rowSize + 1);
    rawData[rowOffset] = 0; // Filter type 0 (None)
    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * 4;
      const [r, g, b, a] = drawFn(x, y, width, height);
      rawData[pxOffset] = r;
      rawData[pxOffset + 1] = g;
      rawData[pxOffset + 2] = b;
      rawData[pxOffset + 3] = a;
    }
  }

  const compressed = zlib.deflateSync(rawData);

  // PNG Header
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  // IHDR chunk
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace
  const ihdrChunk = createChunk('IHDR', ihdr);

  // IDAT chunk
  const idatChunk = createChunk('IDAT', compressed);

  // IEND chunk
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function crc32(buf) {
  let c;
  const table = [];
  for (let n = 0; n < 256; n++) {
    c = n;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[n] = c;
  }

  let crc = 0 ^ (-1);
  for (let i = 0; i < buf.length; i++) {
    crc = (crc >>> 8) ^ table[(crc ^ buf[i]) & 0xff];
  }
  return (crc ^ (-1)) >>> 0;
}

function createChunk(type, data) {
  const len = data.length;
  const chunk = Buffer.alloc(4 + 4 + len + 4);
  chunk.writeUInt32BE(len, 0);
  chunk.write(type, 4, 4, 'ascii');
  data.copy(chunk, 8);
  const typeAndData = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crcVal = crc32(typeAndData);
  chunk.writeUInt32BE(crcVal, 8 + len);
  return chunk;
}

// Draw NegoFact Logo
function drawNegoFactIcon(isMaskable = false) {
  return (x, y, w, h) => {
    const nx = (x / w) * 2 - 1; // -1 to 1
    const ny = (y / h) * 2 - 1; // -1 to 1
    const distCenter = Math.sqrt(nx * nx + ny * ny);

    // Background gradient (Dark slate to emerald/indigo navy)
    const gradY = (ny + 1) / 2; // 0 to 1
    let bgR = Math.round(15 * (1 - gradY) + 6 * gradY);
    let bgG = Math.round(23 * (1 - gradY) + 18 * gradY);
    let bgB = Math.round(42 * (1 - gradY) + 36 * gradY);

    if (isMaskable) {
      // Full bleed for maskable
    } else {
      // Rounded corner squircle
      const cornerR = 0.82;
      const ax = Math.abs(nx);
      const ay = Math.abs(ny);
      if (ax > 0.88 || ay > 0.88) {
        const dx = Math.max(0, ax - 0.72);
        const dy = Math.max(0, ay - 0.72);
        if (Math.sqrt(dx * dx + dy * dy) > 0.22) {
          return [0, 0, 0, 0]; // Transparent outside squircle
        }
      }
    }

    // Emerald border glow
    const scaleFactor = isMaskable ? 0.75 : 0.9;
    const sx = nx / scaleFactor;
    const sy = ny / scaleFactor;

    // Outer card icon
    const isCard = Math.abs(sx) < 0.65 && Math.abs(sy) < 0.65;
    
    // POS Register / Tag Shape
    // Tag top angled
    const inTag = Math.abs(sx) < 0.52 && sy > -0.52 && sy < 0.52;
    const inTopBar = Math.abs(sx) < 0.52 && sy >= -0.52 && sy <= -0.28;
    const inScreen = Math.abs(sx) < 0.42 && sy > -0.24 && sy < 0.12;
    const inKeypad = Math.abs(sx) < 0.42 && sy > 0.16 && sy < 0.44;

    // Glowing accent colors
    // Emerald: 16, 185, 129
    // Teal/Cyan: 6, 182, 212
    // Indigo: 99, 102, 241
    if (inTopBar) {
      return [16, 185, 129, 255]; // Emerald top bar
    }

    if (inScreen) {
      // High contrast emerald-cyan display
      const screenGrad = (sy + 0.24) / 0.36;
      const r = Math.round(4 + 12 * screenGrad);
      const g = Math.round(30 + 40 * screenGrad);
      const b = Math.round(40 + 60 * screenGrad);
      
      // Draw "$" or trend arrow in screen
      if (Math.abs(sx) < 0.18 && Math.abs(sy + 0.06) < 0.1) {
        return [52, 211, 153, 255]; // bright emerald symbol
      }
      return [r, g, b, 255];
    }

    if (inKeypad) {
      // Keypad dots grid
      const kx = Math.floor((sx + 0.42) / (0.84 / 3));
      const ky = Math.floor((sy - 0.16) / (0.28 / 2));
      const relKx = ((sx + 0.42) % (0.84 / 3)) / (0.84 / 3);
      const relKy = ((sy - 0.16) % (0.28 / 2)) / (0.28 / 2);
      
      if (relKx > 0.2 && relKx < 0.8 && relKy > 0.2 && relKy < 0.8) {
        if (kx === 2 && ky === 1) {
          return [16, 185, 129, 255]; // Emerald action button
        }
        return [71, 85, 105, 255]; // slate key
      }
      return [30, 41, 59, 255];
    }

    if (inTag) {
      return [15, 23, 42, 255]; // Tag background
    }

    // Outer subtle border
    if (Math.abs(sx) < 0.56 && Math.abs(sy) < 0.56) {
      return [51, 65, 85, 255];
    }

    return [bgR, bgG, bgB, 255];
  };
}

const publicDir = path.resolve('public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Generate Icons
console.log('Generating PWA Icons...');
fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), createPNG(192, 192, drawNegoFactIcon(false)));
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), createPNG(512, 512, drawNegoFactIcon(false)));
fs.writeFileSync(path.join(publicDir, 'pwa-maskable-512x512.png'), createPNG(512, 512, drawNegoFactIcon(true)));
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), createPNG(180, 180, drawNegoFactIcon(false)));
fs.writeFileSync(path.join(publicDir, 'favicon.ico'), createPNG(64, 64, drawNegoFactIcon(false)));

console.log('PWA icons created successfully in /public!');
