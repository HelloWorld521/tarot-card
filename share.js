// 分享卡绘制：Canvas 2D 手绘 1080×1440 竖版海报，导出 PNG。
// 图上只出现正面信息（名字、三个品质、钩子），绝不出现代价与背面场景。
// 文案全部读 data/config.js 的 share 配置，本文件不写界面文案。

import { config } from './data/config.js';
import { qrMatrix } from './qr.js';

const WIDTH = 1080;
const HEIGHT = 1440;
const SUPERSAMPLE = 2;

const INK = '#f1e9dc';
const GOLD = '#c7a86b';
const BG = '#0a0710';
const SERIF =
  '"Songti SC","STSong","Source Han Serif SC","Noto Serif CJK SC","Noto Serif SC",serif';

function hueOf(name) {
  let hue = 216;
  for (const char of Array.from(name || '')) {
    hue = (hue * 37 + char.codePointAt(0)) % 360;
  }
  return hue;
}

function firstChar(name) {
  return Array.from((name || '').trim())[0] || '·';
}

function drawSpaced(ctx, text, centerX, baselineY, size, spacing, color, weight = 400) {
  const chars = Array.from(String(text));
  ctx.font = `${weight} ${size}px ${SERIF}`;
  ctx.fillStyle = color;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';

  const widths = chars.map((char) => ctx.measureText(char).width);
  const total = widths.reduce((sum, value) => sum + value, 0) + spacing * (chars.length - 1);
  let x = centerX - total / 2;
  chars.forEach((char, index) => {
    ctx.fillText(char, x, baselineY);
    x += widths[index] + spacing;
  });
  return total;
}

function drawDiamond(ctx, x, y, size, color) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(Math.PI / 4);
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.4;
  ctx.strokeRect(-size / 2, -size / 2, size, size);
  ctx.restore();
}

function drawFrame(ctx) {
  ctx.strokeStyle = 'rgba(199,168,107,0.55)';
  ctx.lineWidth = 1.6;
  ctx.strokeRect(46, 46, WIDTH - 92, HEIGHT - 92);

  ctx.strokeStyle = 'rgba(199,168,107,0.22)';
  ctx.lineWidth = 1;
  ctx.strokeRect(60, 60, WIDTH - 120, HEIGHT - 120);

  drawDiamond(ctx, 46, 46, 16, 'rgba(199,168,107,0.7)');
  drawDiamond(ctx, WIDTH - 46, 46, 16, 'rgba(199,168,107,0.7)');
  drawDiamond(ctx, 46, HEIGHT - 46, 16, 'rgba(199,168,107,0.7)');
  drawDiamond(ctx, WIDTH - 46, HEIGHT - 46, 16, 'rgba(199,168,107,0.7)');
}

function drawBackground(ctx) {
  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  const glow = ctx.createRadialGradient(540, 640, 60, 540, 640, 820);
  glow.addColorStop(0, 'rgba(38,24,56,0.85)');
  glow.addColorStop(0.55, 'rgba(20,13,30,0.45)');
  glow.addColorStop(1, 'rgba(10,7,16,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  const shade = ctx.createLinearGradient(0, 0, 0, HEIGHT);
  shade.addColorStop(0, 'rgba(0,0,0,0.35)');
  shade.addColorStop(0.45, 'rgba(0,0,0,0)');
  shade.addColorStop(1, 'rgba(0,0,0,0.45)');
  ctx.fillStyle = shade;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
}

function drawAvatar(ctx, name, cx, cy, radius) {
  const hue = hueOf(name);
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.fillStyle = `hsl(${hue}, 30%, 27%)`;
  ctx.fill();

  ctx.strokeStyle = 'rgba(199,168,107,0.75)';
  ctx.lineWidth = 1.6;
  ctx.stroke();

  const letter = firstChar(name);
  ctx.font = `400 58px ${SERIF}`;
  ctx.fillStyle = INK;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(letter, cx, cy + 2);
}

function drawDivider(ctx, y) {
  ctx.strokeStyle = 'rgba(199,168,107,0.35)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(540 - 78, y);
  ctx.lineTo(540 - 18, y);
  ctx.moveTo(540 + 18, y);
  ctx.lineTo(540 + 78, y);
  ctx.stroke();
  drawDiamond(ctx, 540, y, 10, 'rgba(199,168,107,0.55)');
}

function drawParadoxBadge(ctx, label) {
  ctx.font = `400 24px ${SERIF}`;
  const textWidth = ctx.measureText(label).width + 4 * (Array.from(label).length - 1);
  const boxWidth = textWidth + 42;
  const boxHeight = 46;
  const x = WIDTH - 84 - boxWidth;
  const y = 92;

  ctx.strokeStyle = 'rgba(199,168,107,0.6)';
  ctx.lineWidth = 1;
  ctx.strokeRect(x, y, boxWidth, boxHeight);

  ctx.fillStyle = 'rgba(199,168,107,0.9)';
  ctx.font = `400 24px ${SERIF}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, x + boxWidth / 2, y + boxHeight / 2 + 1);
}

function drawQr(ctx, share) {
  let matrix = null;
  try {
    matrix = qrMatrix(share.qrUrl);
  } catch (error) {
    matrix = null;
  }

  if (!matrix) {
    ctx.fillStyle = 'rgba(199,168,107,0.85)';
    ctx.font = `400 30px ${SERIF}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(share.qrText, 540, 1190);
    return;
  }

  const plate = 222;
  const quiet = 4;
  const moduleSize = plate / (matrix.size + quiet * 2);
  const left = (WIDTH - plate) / 2;
  const top = 1064;

  ctx.fillStyle = '#f4eee2';
  ctx.fillRect(left, top, plate, plate);

  ctx.fillStyle = BG;
  for (let y = 0; y < matrix.size; y += 1) {
    for (let x = 0; x < matrix.size; x += 1) {
      if (!matrix.modules[y * matrix.size + x]) continue;
      const px = left + (x + quiet) * moduleSize;
      const py = top + (y + quiet) * moduleSize;
      ctx.fillRect(px, py, Math.ceil(moduleSize), Math.ceil(moduleSize));
    }
  }
}

export function createShareCard(result, traitById) {
  const share = config.copy.share;

  const source = document.createElement('canvas');
  source.width = WIDTH * SUPERSAMPLE;
  source.height = HEIGHT * SUPERSAMPLE;
  const ctx = source.getContext('2d');
  ctx.scale(SUPERSAMPLE, SUPERSAMPLE);

  drawBackground(ctx);
  drawFrame(ctx);

  ctx.textBaseline = 'alphabetic';
  ctx.textAlign = 'center';
  drawSpaced(ctx, share.kicker, 540, 146, 32, 9, 'rgba(199,168,107,0.92)');

  drawAvatar(ctx, result.name, 540, 246, 52);

  drawSpaced(ctx, result.name, 540, 386, 76, 6, INK, 400);
  drawDivider(ctx, 436);

  // 分享图只露总分，不露四维分项与任何代价信息。左上角与右上角的「矛盾体」对称。
  if (result.scores && typeof result.scores.total === 'number') {
    ctx.fillStyle = 'rgba(199,168,107,0.9)';
    ctx.font = `400 22px ${SERIF}`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(share.score.replace('{total}', result.scores.total), 84, 120);
  }

  const names = result.traits.map((id) => traitById[id]?.name || '');
  names.forEach((name, index) => {
    drawSpaced(ctx, name, 540, 580 + index * 170, 140, 26, INK, 400);
  });

  drawSpaced(ctx, share.hook, 540, 1020, 36, 8, 'rgba(199,168,107,0.95)');

  drawQr(ctx, share);

  ctx.fillStyle = 'rgba(199,168,107,0.82)';
  ctx.font = `400 26px ${SERIF}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(share.qrText, 540, 1330);

  if (result.paradox) drawParadoxBadge(ctx, share.paradox);

  const output = document.createElement('canvas');
  output.width = WIDTH;
  output.height = HEIGHT;
  const outCtx = output.getContext('2d');
  outCtx.imageSmoothingEnabled = true;
  outCtx.imageSmoothingQuality = 'high';
  outCtx.drawImage(source, 0, 0, WIDTH, HEIGHT);

  return {
    width: WIDTH,
    height: HEIGHT,
    dataUrl: output.toDataURL('image/png'),
  };
}
