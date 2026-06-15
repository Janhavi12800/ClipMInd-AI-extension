import { writeFileSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { deflateSync } from 'zlib'

const __dirname = dirname(fileURLToPath(import.meta.url))
const iconsDir = join(__dirname, '../public/icons')
mkdirSync(iconsDir, { recursive: true })

function crc32(buf) {
  let c = 0xffffffff
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i]
    for (let j = 0; j < 8; j++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
  }
  return (c ^ 0xffffffff) >>> 0
}

function chunk(type, data) {
  const typeBuf = Buffer.from(type)
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length)
  const combined = Buffer.concat([typeBuf, data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(combined))
  return Buffer.concat([len, combined, crc])
}

function createPNG(size, r, g, b) {
  const pixels = []
  for (let y = 0; y < size; y++) {
    pixels.push(0)
    for (let x = 0; x < size; x++) {
      const cx = x - size / 2
      const cy = y - size / 2
      const inShield = Math.abs(cx) + Math.abs(cy) * 1.4 < size * 0.35
      if (inShield) pixels.push(255, 255, 255, 255)
      else pixels.push(r, g, b, 255)
    }
  }

  const compressed = deflateSync(Buffer.from(pixels))
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8; ihdr[9] = 6

  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr),
    chunk('IDAT', compressed),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

for (const size of [16, 32, 48, 128]) {
  writeFileSync(join(iconsDir, `icon-${size}.png`), createPNG(size, 13, 148, 136))
  console.log(`Created icon-${size}.png`)
}
