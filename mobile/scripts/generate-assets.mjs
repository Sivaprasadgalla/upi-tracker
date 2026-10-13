import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

// Table for CRC-32 calculation
const crcTable = [];
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  crcTable[n] = c;
}

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function createChunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii');
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(data.length, 0);

  const body = Buffer.concat([typeBuf, data]);
  const crc = crc32(body);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc, 0);

  return Buffer.concat([lenBuf, body, crcBuf]);
}

function encodeRGBAtoPNG(width, height, rgbaBuffer) {
  // Signature
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  // IHDR
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // 8-bit depth
  ihdr[9] = 6; // RGBA color type
  ihdr[10] = 0; // deflate
  ihdr[11] = 0; // filter method
  ihdr[12] = 0; // non-interlaced
  const ihdrChunk = createChunk('IHDR', ihdr);

  // Scanlines with filter byte 0
  const scanlineLen = width * 4 + 1;
  const rawData = Buffer.alloc(height * scanlineLen);

  for (let y = 0; y < height; y++) {
    const rawOffset = y * scanlineLen;
    rawData[rawOffset] = 0; // Filter None
    rgbaBuffer.copy(rawData, rawOffset + 1, y * width * 4, (y + 1) * width * 4);
  }

  const idatData = zlib.deflateSync(rawData, { level: 9 });
  const idatChunk = createChunk('IDAT', idatData);
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([sig, ihdrChunk, idatChunk, iendChunk]);
}

// Draw fintech logo (Indian Rupee + UPI Arrows inside iOS squircle)
function renderFintechLogo(width, height, isSplash = false) {
  const buf = Buffer.alloc(width * height * 4);

  const cx = width / 2;
  const cy = height / 2;
  const iconSize = isSplash ? Math.min(width, height) * 0.28 : width * 0.88;
  const halfIcon = iconSize / 2;
  const cornerRadius = iconSize * 0.23;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;

      if (isSplash) {
        // Deep modern dark background
        const bgRatio = y / height;
        const bgR = Math.round(11 + 6 * bgRatio);
        const bgG = Math.round(15 + 10 * bgRatio);
        const bgB = Math.round(28 + 20 * bgRatio);
        buf[idx] = bgR;
        buf[idx + 1] = bgG;
        buf[idx + 2] = bgB;
        buf[idx + 3] = 255;
      }

      // Inside Icon Squircle
      const dx = Math.abs(x - cx);
      const dy = Math.abs(y - cy);

      if (dx <= halfIcon && dy <= halfIcon) {
        // Calculate rounded corner distance
        const ox = Math.max(0, dx - (halfIcon - cornerRadius));
        const oy = Math.max(0, dy - (halfIcon - cornerRadius));
        const dist = Math.sqrt(ox * ox + oy * oy);

        if (dist <= cornerRadius) {
          // Antialiasing factor
          const aa = Math.min(1, Math.max(0, cornerRadius - dist + 0.8));

          // Rich Fintech Gradient: Deep Midnight Indigo -> Royal Sapphire -> Vivid Cyan
          const gradRatio = ((x - (cx - halfIcon)) + (y - (cy - halfIcon))) / (iconSize * 2);

          // Base Gradient Colors
          let r = Math.round(15 * (1 - gradRatio) + 14 * gradRatio);
          let g = Math.round(23 * (1 - gradRatio) + 116 * gradRatio);
          let b = Math.round(42 * (1 - gradRatio) + 244 * gradRatio);

          // Subtle glowing radial highlight from top-left
          const lightDist = Math.hypot(x - (cx - halfIcon * 0.5), y - (cy - halfIcon * 0.5));
          const highlight = Math.max(0, 1 - lightDist / (iconSize * 0.85));
          r = Math.min(255, r + Math.round(highlight * 70));
          g = Math.min(255, g + Math.round(highlight * 90));
          b = Math.min(255, b + Math.round(highlight * 100));

          // Rupee & UPI Arrow Geometry in the center
          const relX = (x - cx) / (iconSize * 0.5); // -1 to 1
          const relY = (y - cy) / (iconSize * 0.5); // -1 to 1

          let isGlyph = false;

          // Top Rupee bar
          if (relY >= -0.42 && relY <= -0.30 && relX >= -0.32 && relX <= 0.32) {
            isGlyph = true;
          }
          // Second Rupee bar
          if (relY >= -0.22 && relY <= -0.10 && relX >= -0.32 && relX <= 0.28) {
            isGlyph = true;
          }
          // Vertical stem
          if (relY >= -0.42 && relY <= 0.35 && relX >= -0.25 && relX <= -0.13) {
            isGlyph = true;
          }
          // Upper loop of Rupee
          if (relX >= -0.20 && relX <= 0.32 && relY >= -0.30 && relY <= 0.05) {
            const loopX = (relX - (-0.1));
            const loopY = (relY - (-0.12));
            const rDist = Math.hypot(loopX * 1.3, loopY * 2.2);
            if (rDist >= 0.22 && rDist <= 0.46) {
              isGlyph = true;
            }
          }
          // Downward diagonal leg
          if (relY >= 0.02 && relY <= 0.38) {
            const expectedX = -0.18 + (relY - 0.02) * 1.25;
            if (Math.abs(relX - expectedX) <= 0.07) {
              isGlyph = true;
            }
          }
          // Dynamic UPI forward chevron arrow at bottom-right
          if (relX >= 0.10 && relX <= 0.38 && relY >= 0.12 && relY <= 0.40) {
            const chevDist = Math.abs((relX - 0.22) - (relY - 0.26));
            if (chevDist <= 0.06 && relX + relY <= 0.65) {
              isGlyph = true;
            }
          }

          if (isGlyph) {
            // Luminous Emerald to Cyan UPI energy gradient
            const glyphG = Math.round(230 + 25 * gradRatio);
            const glyphB = Math.round(250 - 40 * gradRatio);
            buf[idx] = Math.round(buf[idx] * (1 - aa) + 255 * aa);
            buf[idx + 1] = Math.round(buf[idx + 1] * (1 - aa) + glyphG * aa);
            buf[idx + 2] = Math.round(buf[idx + 2] * (1 - aa) + glyphB * aa);
            buf[idx + 3] = isSplash ? 255 : Math.round(255 * aa);
          } else {
            buf[idx] = Math.round(buf[idx] * (1 - aa) + r * aa);
            buf[idx + 1] = Math.round(buf[idx + 1] * (1 - aa) + g * aa);
            buf[idx + 2] = Math.round(buf[idx + 2] * (1 - aa) + b * aa);
            buf[idx + 3] = isSplash ? 255 : Math.round(255 * aa);
          }
        }
      }
    }
  }

  return encodeRGBAtoPNG(width, height, buf);
}

const assetsDir = path.resolve('mobile/assets');
if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir, { recursive: true });
}

console.log('🎨 Generating modern fintech app icon (1024x1024)...');
const iconPng = renderFintechLogo(1024, 1024, false);
fs.writeFileSync(path.join(assetsDir, 'icon.png'), iconPng);
fs.writeFileSync(path.join(assetsDir, 'adaptive-icon.png'), iconPng);

console.log('🎨 Generating modern splash screen (1242x2688)...');
const splashPng = renderFintechLogo(1242, 2688, true);
fs.writeFileSync(path.join(assetsDir, 'splash.png'), splashPng);

console.log('🎨 Generating modern web favicon (192x192)...');
const faviconPng = renderFintechLogo(192, 192, false);
fs.writeFileSync(path.join(assetsDir, 'favicon.png'), faviconPng);

console.log('✨ All premium app logo and splash assets generated successfully!');

