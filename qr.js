// 最小 QR 编码器：byte 模式，版本 1–3，纠错等级 M，单块。
// 只服务于一张固定短网址，够用即可，不引入第三方库。
// 返回值：{ size, modules }，modules 为 size×size 的 0/1 数组（1 为深色）。

const ECC_FORMAT_M = 0b00;

const VERSIONS = [
  null,
  { size: 21, data: 16, ecc: 10, align: [] },
  { size: 25, data: 28, ecc: 16, align: [18] },
  { size: 29, data: 44, ecc: 26, align: [22] },
];

const EXP = new Array(512);
const LOG = new Array(256);
{
  let x = 1;
  for (let i = 0; i < 255; i += 1) {
    EXP[i] = x;
    LOG[x] = i;
    x <<= 1;
    if (x & 0x100) x ^= 0x11d;
  }
  for (let i = 255; i < 512; i += 1) EXP[i] = EXP[i - 255];
}

function mul(a, b) {
  if (a === 0 || b === 0) return 0;
  return EXP[LOG[a] + LOG[b]];
}

function generator(degree) {
  let poly = [1];
  for (let i = 0; i < degree; i += 1) {
    const next = new Array(poly.length + 1).fill(0);
    for (let j = 0; j < poly.length; j += 1) {
      next[j] ^= poly[j];
      next[j + 1] ^= mul(poly[j], EXP[i]);
    }
    poly = next;
  }
  return poly;
}

function reedSolomon(data, degree) {
  const gen = generator(degree);
  const rem = new Array(degree).fill(0);
  for (const byte of data) {
    const factor = byte ^ rem.shift();
    rem.push(0);
    for (let i = 0; i < degree; i += 1) rem[i] ^= mul(gen[i + 1], factor);
  }
  return rem;
}

function buildCodewords(version, bytes) {
  const spec = VERSIONS[version];
  const bits = [];
  const push = (value, length) => {
    for (let i = length - 1; i >= 0; i -= 1) bits.push((value >>> i) & 1);
  };

  push(0b0100, 4);
  push(bytes.length, 8);
  bytes.forEach((byte) => push(byte, 8));

  const capacity = spec.data * 8;
  for (let i = 0; i < 4 && bits.length < capacity; i += 1) bits.push(0);
  while (bits.length % 8 !== 0) bits.push(0);

  const words = [];
  for (let i = 0; i < bits.length; i += 8) {
    let value = 0;
    for (let j = 0; j < 8; j += 1) value = (value << 1) | bits[i + j];
    words.push(value);
  }

  let pad = 0;
  while (words.length < spec.data) {
    words.push(pad % 2 === 0 ? 0xec : 0x11);
    pad += 1;
  }

  return words.concat(reedSolomon(words, spec.ecc));
}

function formatBits(mask) {
  const data = (ECC_FORMAT_M << 3) | mask;
  let rem = data;
  for (let i = 0; i < 10; i += 1) {
    rem = (rem << 1) ^ ((rem >>> 9) * 0x537);
  }
  return ((data << 10) | (rem & 0x3ff)) ^ 0x5412;
}

const MASKS = [
  (row, col) => (row + col) % 2 === 0,
  (row) => row % 2 === 0,
  (row, col) => col % 3 === 0,
  (row, col) => (row + col) % 3 === 0,
  (row, col) => (Math.floor(row / 2) + Math.floor(col / 3)) % 2 === 0,
  (row, col) => ((row * col) % 2) + ((row * col) % 3) === 0,
  (row, col) => (((row * col) % 2) + ((row * col) % 3)) % 2 === 0,
  (row, col) => (((row + col) % 2) + ((row * col) % 3)) % 2 === 0,
];

function drawFinder(size, modules, fn, centerX, centerY) {
  for (let dy = -4; dy <= 4; dy += 1) {
    for (let dx = -4; dx <= 4; dx += 1) {
      const x = centerX + dx;
      const y = centerY + dy;
      if (x < 0 || y < 0 || x >= size || y >= size) continue;
      const dist = Math.max(Math.abs(dx), Math.abs(dy));
      modules[y * size + x] = dist !== 2 && dist !== 4 ? 1 : 0;
      fn[y * size + x] = 1;
    }
  }
}

function drawAlign(size, modules, fn, centerX, centerY) {
  for (let dy = -2; dy <= 2; dy += 1) {
    for (let dx = -2; dx <= 2; dx += 1) {
      const x = centerX + dx;
      const y = centerY + dy;
      if (x < 0 || y < 0 || x >= size || y >= size) continue;
      modules[y * size + x] = Math.max(Math.abs(dx), Math.abs(dy)) !== 1 ? 1 : 0;
      fn[y * size + x] = 1;
    }
  }
}

function maskPenalty(modules, size) {
  let penalty = 0;

  for (let y = 0; y < size; y += 1) {
    let run = 1;
    for (let x = 1; x < size; x += 1) {
      if (modules[y * size + x] === modules[y * size + x - 1]) {
        run += 1;
      } else {
        if (run >= 5) penalty += 3 + (run - 5);
        run = 1;
      }
    }
    if (run >= 5) penalty += 3 + (run - 5);
  }

  for (let x = 0; x < size; x += 1) {
    let run = 1;
    for (let y = 1; y < size; y += 1) {
      if (modules[y * size + x] === modules[(y - 1) * size + x]) {
        run += 1;
      } else {
        if (run >= 5) penalty += 3 + (run - 5);
        run = 1;
      }
    }
    if (run >= 5) penalty += 3 + (run - 5);
  }

  for (let y = 0; y < size - 1; y += 1) {
    for (let x = 0; x < size - 1; x += 1) {
      const sum =
        modules[y * size + x] +
        modules[y * size + x + 1] +
        modules[(y + 1) * size + x] +
        modules[(y + 1) * size + x + 1];
      if (sum === 0 || sum === 4) penalty += 3;
    }
  }

  const pattern = [1, 0, 1, 1, 1, 0, 1];
  const runLength = (line, start) => {
    let index = start;
    if (index < 0 || index >= line.length) return 0;
    const value = line[index];
    let length = 0;
    while (index >= 0 && index < line.length && line[index] === value) {
      length += 1;
      index += 1;
    }
    return length;
  };

  for (let y = 0; y < size; y += 1) {
    const row = Array.from({ length: size }, (_, x) => modules[y * size + x]);
    for (let x = 0; x + 7 <= size; x += 1) {
      if (!pattern.every((value, offset) => row[x + offset] === value)) continue;
      if (runLength(row.slice(0, x).reverse(), 0) >= 4) penalty += 40;
      if (runLength(row.slice(x + 7), 0) >= 4) penalty += 40;
    }
  }

  for (let x = 0; x < size; x += 1) {
    const col = Array.from({ length: size }, (_, y) => modules[y * size + x]);
    for (let y = 0; y + 7 <= size; y += 1) {
      if (!pattern.every((value, offset) => col[y + offset] === value)) continue;
      if (runLength(col.slice(0, y).reverse(), 0) >= 4) penalty += 40;
      if (runLength(col.slice(y + 7), 0) >= 4) penalty += 40;
    }
  }

  let dark = 0;
  for (const value of modules) dark += value;
  const percent = (dark * 100) / (size * size);
  penalty += Math.floor(Math.abs(percent - 50) / 5) * 10;

  return penalty;
}

function placeFormat(size, modules, fn, mask) {
  const bits = formatBits(mask);
  const bit = (index) => ((bits >>> index) & 1) !== 0;
  const set = (x, y, dark) => {
    modules[y * size + x] = dark ? 1 : 0;
    fn[y * size + x] = 1;
  };

  for (let i = 0; i <= 5; i += 1) set(8, i, bit(i));
  set(8, 7, bit(6));
  set(8, 8, bit(7));
  set(7, 8, bit(8));
  for (let i = 9; i < 15; i += 1) set(14 - i, 8, bit(i));

  for (let i = 0; i < 8; i += 1) set(size - 1 - i, 8, bit(i));
  for (let i = 8; i < 15; i += 1) set(8, size - 15 + i, bit(i));
  set(8, size - 8, true);
}

export function qrMatrix(text) {
  const bytes = Array.from(new TextEncoder().encode(text));

  let version = 0;
  for (let v = 1; v <= 3; v += 1) {
    if (12 + bytes.length * 8 + 4 <= VERSIONS[v].data * 8) {
      version = v;
      break;
    }
  }
  if (!version) throw new Error('QR payload too long for version 3-M');

  const spec = VERSIONS[version];
  const size = spec.size;
  const codewords = buildCodewords(version, bytes);

  const modules = new Uint8Array(size * size);
  const fn = new Uint8Array(size * size);
  const setFunction = (x, y, dark) => {
    modules[y * size + x] = dark ? 1 : 0;
    fn[y * size + x] = 1;
  };

  drawFinder(size, modules, fn, 3, 3);
  drawFinder(size, modules, fn, size - 4, 3);
  drawFinder(size, modules, fn, 3, size - 4);

  for (let i = 8; i < size - 8; i += 1) {
    setFunction(6, i, i % 2 === 0);
    setFunction(i, 6, i % 2 === 0);
  }

  spec.align.forEach((center) => {
    if (fn[center * size + center]) return;
    drawAlign(size, modules, fn, center, center);
  });

  setFunction(8, size - 8, true);

  for (let i = 0; i <= 8; i += 1) {
    if (i !== 6) {
      if (!fn[i * size + 8]) setFunction(8, i, false);
      if (!fn[8 * size + i]) setFunction(i, 8, false);
    }
  }
  for (let i = 0; i < 8; i += 1) {
    if (!fn[8 * size + size - 1 - i]) setFunction(size - 1 - i, 8, false);
    if (!fn[(size - 7 + i) * size + 8]) setFunction(8, size - 7 + i, false);
  }

  let bitIndex = 0;
  let upward = true;
  for (let right = size - 1; right >= 1; right -= 2) {
    if (right === 6) right = 5;
    for (let vert = 0; vert < size; vert += 1) {
      for (let j = 0; j < 2; j += 1) {
        const x = right - j;
        const y = upward ? size - 1 - vert : vert;
        if (fn[y * size + x]) continue;
        let dark = 0;
        if (bitIndex < codewords.length * 8) {
          dark = (codewords[bitIndex >>> 3] >>> (7 - (bitIndex & 7))) & 1;
        }
        modules[y * size + x] = dark;
        bitIndex += 1;
      }
    }
    upward = !upward;
  }

  let bestMask = 0;
  let bestPenalty = Infinity;
  let bestModules = null;

  for (let mask = 0; mask < 8; mask += 1) {
    const trial = modules.slice();
    const apply = MASKS[mask];
    for (let y = 0; y < size; y += 1) {
      for (let x = 0; x < size; x += 1) {
        if (!fn[y * size + x] && apply(y, x)) trial[y * size + x] ^= 1;
      }
    }
    const penalty = maskPenalty(trial, size);
    if (penalty < bestPenalty) {
      bestPenalty = penalty;
      bestMask = mask;
      bestModules = trial;
    }
  }

  const fnCopy = fn.slice();
  placeFormat(size, bestModules, fnCopy, bestMask);

  return { size, modules: bestModules };
}
