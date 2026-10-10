import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

function createPNG(width, height, isMaskable = false) {
  // RGBA buffer
  const rowSize = width * 4 + 1; // 1 filter byte per row
  const rawData = Buffer.alloc(rowSize * height);

  const cx = width / 2;
  const cy = height / 2;
  const radius = isMaskable ? width * 0.38 : width * 0.44;

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize;
    rawData[rowOffset] = 0; // Filter type 0 (None)

    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * 4;
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Background: Deep Industrial Navy #0f172a
      let r = 15, g = 23, b = 42, a = 255;

      // Outer circular emblem ring
      if (dist < radius && dist > radius - Math.max(3, width * 0.03)) {
        // Gold/Amber accent #f59e0b
        r = 245; g = 158; b = 11;
      } else if (dist <= radius - Math.max(3, width * 0.03)) {
        // Inner badge: #1e293b
        r = 30; g = 41; b = 59;

        // Draw Stylized Rotogravure Cylinder & "EP" Monogram
        // Center cylinder shape: vertical cylinder in amber/cyan
        const cylW = width * 0.28;
        const cylH = height * 0.38;
        if (Math.abs(dx) < cylW / 2 && Math.abs(dy) < cylH / 2) {
          // Cylinder metallic shading
          const shade = 0.7 + 0.3 * Math.cos((dx / (cylW / 2)) * (Math.PI / 2));
          r = Math.min(255, Math.floor(245 * shade));
          g = Math.min(255, Math.floor(158 * shade));
          b = Math.min(255, Math.floor(11 * shade));
        }

        // Horizontal printing rollers lines
        if (Math.abs(dy) < cylH / 2 && (Math.abs(dy) % (height * 0.08) < Math.max(2, height * 0.015))) {
          r = 14; g = 165; b = 233; // Sky blue roll guide
        }

        // Center Monogram dot
        if (Math.abs(dx) < width * 0.06 && Math.abs(dy) < height * 0.06) {
          r = 255; g = 255; b = 255;
        }
      }

      rawData[pxOffset] = r;
      rawData[pxOffset + 1] = g;
      rawData[pxOffset + 2] = b;
      rawData[pxOffset + 3] = a;
    }
  }

  const compressed = zlib.deflateSync(rawData);

  // PNG Header
  const header = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR Chunk
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // Bit depth
  ihdr[9] = 6; // RGBA
  ihdr[10] = 0; // Compression
  ihdr[11] = 0; // Filter
  ihdr[12] = 0; // Interlace
  const ihdrChunk = createChunk('IHDR', ihdr);

  // IDAT Chunk
  const idatChunk = createChunk('IDAT', compressed);

  // IEND Chunk
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([header, ihdrChunk, idatChunk, iendChunk]);
}

function createChunk(type, data) {
  const length = data.length;
  const chunk = Buffer.alloc(length + 12);
  chunk.writeUInt32BE(length, 0);
  chunk.write(type, 4);
  data.copy(chunk, 8);
  const crc = crc32(chunk.subarray(4, length + 8));
  chunk.writeUInt32BE(crc >>> 0, length + 8);
  return chunk;
}

// Precomputed CRC table
const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = ((c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1));
  }
  crcTable[n] = c;
}

function crc32(buf) {
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) {
    crc = crcTable[(crc ^ buf[i]) & 0xFF] ^ (crc >>> 8);
  }
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

const publicDir = path.resolve('public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Generate Icons
console.log('Generating PWA icons...');
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), createPNG(180, 180, false));
fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), createPNG(192, 192, false));
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), createPNG(512, 512, false));
fs.writeFileSync(path.join(publicDir, 'pwa-maskable-512x512.png'), createPNG(512, 512, true));
fs.writeFileSync(path.join(publicDir, 'favicon.ico'), createPNG(64, 64, false));

// Generate SVG Icon
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="none">
  <rect width="512" height="512" rx="104" fill="#0f172a"/>
  <circle cx="256" cy="256" r="210" stroke="#f59e0b" stroke-width="16" fill="#1e293b"/>
  <!-- Rotogravure Cylinder Graphic -->
  <rect x="176" y="140" width="160" height="232" rx="24" fill="#334155" stroke="#f59e0b" stroke-width="8"/>
  <rect x="196" y="160" width="120" height="40" rx="8" fill="#f59e0b" opacity="0.9"/>
  <rect x="196" y="215" width="120" height="24" rx="6" fill="#38bdf8"/>
  <rect x="196" y="250" width="120" height="24" rx="6" fill="#f59e0b"/>
  <rect x="196" y="285" width="120" height="24" rx="6" fill="#10b981"/>
  <rect x="196" y="320" width="120" height="32" rx="6" fill="#6366f1"/>
  <!-- Elite Packaging Engraved Monogram -->
  <circle cx="256" cy="256" r="48" fill="#0f172a" stroke="#f59e0b" stroke-width="6"/>
  <text x="256" y="268" font-family="Arial, sans-serif" font-weight="900" font-size="34" fill="#f59e0b" text-anchor="middle">EP</text>
  <!-- Roller Axis Pin -->
  <line x1="256" y1="90" x2="256" y2="140" stroke="#94a3b8" stroke-width="16" stroke-linecap="round"/>
  <line x1="256" y1="372" x2="256" y2="422" stroke="#94a3b8" stroke-width="16" stroke-linecap="round"/>
</svg>`;

fs.writeFileSync(path.join(publicDir, 'icon.svg'), svg, 'utf-8');
console.log('Icons generated successfully in public/');
