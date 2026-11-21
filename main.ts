// The World in One Day — 21 November 2026.
// A program that draws a newspaper front page summing up the day's
// world news and writes it to /output/entry.png (1024x1024 PNG).
// Node 22, standard library only, no network. Fully deterministic:
// the same bytes every run.
//
// The stories were gathered from the day's reporting on 21 Nov 2026:
// Russia's biggest November barrage on Ukraine (404 drones, 111
// missiles), with two missiles and a drone coming down in Poland;
// the World Court's landmark ruling that Myanmar committed genocide
// against the Rohingya; COP31 in Antalya running past its deadline
// with fossil-fuel language dropped from the draft; an AI-led
// sell-off pushing US stocks into correction (Nikkei down 5.1%);
// BepiColombo reaching Mercury orbit; a daily pill, daraxonrasib,
// making pancreatic tumours undetectable in a trial; a 6.7 quake in
// Peru's Andes; the FBI's crime database hacked; and 128 nations in
// Geneva agreeing to work toward rules for lethal autonomous weapons.

import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { deflateSync } from "node:zlib";

// ------------------------------------------------------------------
// 5x7 bitmap font (uppercase; lowercase maps to uppercase).
// Each glyph is 7 rows of 5 bits, "1" = ink.
// ------------------------------------------------------------------

const FONT: Record<string, string[]> = {
  A: ["01110", "10001", "10001", "11111", "10001", "10001", "10001"],
  B: ["11110", "10001", "10001", "11110", "10001", "10001", "11110"],
  C: ["01110", "10001", "10000", "10000", "10000", "10001", "01110"],
  D: ["11110", "10001", "10001", "10001", "10001", "10001", "11110"],
  E: ["11111", "10000", "10000", "11110", "10000", "10000", "11111"],
  F: ["11111", "10000", "10000", "11110", "10000", "10000", "10000"],
  G: ["01110", "10001", "10000", "10111", "10001", "10001", "01111"],
  H: ["10001", "10001", "10001", "11111", "10001", "10001", "10001"],
  I: ["01110", "00100", "00100", "00100", "00100", "00100", "01110"],
  J: ["00111", "00010", "00010", "00010", "00010", "10010", "01100"],
  K: ["10001", "10010", "10100", "11000", "10100", "10010", "10001"],
  L: ["10000", "10000", "10000", "10000", "10000", "10000", "11111"],
  M: ["10001", "11011", "10101", "10101", "10001", "10001", "10001"],
  N: ["10001", "11001", "10101", "10011", "10001", "10001", "10001"],
  O: ["01110", "10001", "10001", "10001", "10001", "10001", "01110"],
  P: ["11110", "10001", "10001", "11110", "10000", "10000", "10000"],
  Q: ["01110", "10001", "10001", "10001", "10101", "10010", "01101"],
  R: ["11110", "10001", "10001", "11110", "10100", "10010", "10001"],
  S: ["01111", "10000", "10000", "01110", "00001", "00001", "11110"],
  T: ["11111", "00100", "00100", "00100", "00100", "00100", "00100"],
  U: ["10001", "10001", "10001", "10001", "10001", "10001", "01110"],
  V: ["10001", "10001", "10001", "10001", "10001", "01010", "00100"],
  W: ["10001", "10001", "10001", "10101", "10101", "11011", "10001"],
  X: ["10001", "10001", "01010", "00100", "01010", "10001", "10001"],
  Y: ["10001", "10001", "01010", "00100", "00100", "00100", "00100"],
  Z: ["11111", "00001", "00010", "00100", "01000", "10000", "11111"],
  "0": ["01110", "10001", "10011", "10101", "11001", "10001", "01110"],
  "1": ["00100", "01100", "00100", "00100", "00100", "00100", "01110"],
  "2": ["01110", "10001", "00001", "00110", "01000", "10000", "11111"],
  "3": ["11110", "00001", "00001", "01110", "00001", "00001", "11110"],
  "4": ["00010", "00110", "01010", "10010", "11111", "00010", "00010"],
  "5": ["11111", "10000", "11110", "00001", "00001", "10001", "01110"],
  "6": ["01110", "10000", "10000", "11110", "10001", "10001", "01110"],
  "7": ["11111", "00001", "00010", "00100", "01000", "01000", "01000"],
  "8": ["01110", "10001", "10001", "01110", "10001", "10001", "01110"],
  "9": ["01110", "10001", "10001", "01111", "00001", "00001", "01110"],
  " ": ["00000", "00000", "00000", "00000", "00000", "00000", "00000"],
  ".": ["00000", "00000", "00000", "00000", "00000", "01100", "01100"],
  ",": ["00000", "00000", "00000", "00000", "01100", "00100", "01000"],
  ":": ["00000", "01100", "01100", "00000", "01100", "01100", "00000"],
  ";": ["00000", "01100", "01100", "00000", "01100", "00100", "01000"],
  "'": ["00100", "00100", "01000", "00000", "00000", "00000", "00000"],
  "-": ["00000", "00000", "00000", "01110", "00000", "00000", "00000"],
  "!": ["00100", "00100", "00100", "00100", "00100", "00000", "00100"],
  "?": ["01110", "10001", "00001", "00010", "00100", "00000", "00100"],
  "/": ["00001", "00010", "00010", "00100", "01000", "01000", "10000"],
  "(": ["00010", "00100", "01000", "01000", "01000", "00100", "00010"],
  ")": ["01000", "00100", "00010", "00010", "00010", "00100", "01000"],
  "&": ["01100", "10010", "10100", "01000", "10101", "10010", "01101"],
  "%": ["11001", "11010", "00010", "00100", "01000", "01011", "10011"],
  "+": ["00000", "00100", "00100", "11111", "00100", "00100", "00000"],
  "=": ["00000", "00000", "11111", "00000", "11111", "00000", "00000"],
  "\u2022": ["00000", "00000", "01110", "01110", "01110", "00000", "00000"],
};

// ------------------------------------------------------------------
// Canvas: an RGB bitmap with drawing helpers.
// ------------------------------------------------------------------

type RGB = [number, number, number];

const PAPER: RGB = [246, 241, 231];
const INK: RGB = [20, 33, 61];
const RED: RGB = [179, 35, 42];
const GOLD: RGB = [201, 162, 39];
const WHITE: RGB = [255, 255, 255];
const GREEN: RGB = [46, 125, 50];
const LIGHT: RGB = [233, 226, 210];

const W = 1024;
const H = 1024;

class Canvas {
  buf = new Uint8Array(W * H * 3);

  constructor() {
    for (let i = 0; i < W * H; i++) {
      this.buf[i * 3] = PAPER[0];
      this.buf[i * 3 + 1] = PAPER[1];
      this.buf[i * 3 + 2] = PAPER[2];
    }
  }

  set(x: number, y: number, c: RGB): void {
    if (x < 0 || x >= W || y < 0 || y >= H) return;
    const i = (y * W + x) * 3;
    this.buf[i] = c[0];
    this.buf[i + 1] = c[1];
    this.buf[i + 2] = c[2];
  }

  fillRect(x: number, y: number, w: number, h: number, c: RGB): void {
    for (let yy = y; yy < y + h; yy++) {
      for (let xx = x; xx < x + w; xx++) this.set(xx, yy, c);
    }
  }

  strokeRect(x: number, y: number, w: number, h: number, t: number, c: RGB): void {
    this.fillRect(x, y, w, t, c);
    this.fillRect(x, y + h - t, w, t, c);
    this.fillRect(x, y, t, h, c);
    this.fillRect(x + w - t, y, t, h, c);
  }

  hline(x0: number, x1: number, y: number, t: number, c: RGB): void {
    this.fillRect(Math.min(x0, x1), y, Math.abs(x1 - x0), t, c);
  }

  vline(x: number, y0: number, y1: number, t: number, c: RGB): void {
    this.fillRect(x, Math.min(y0, y1), t, Math.abs(y1 - y0), c);
  }

  line(x0: number, y0: number, x1: number, y1: number, t: number, c: RGB): void {
    const dx = Math.abs(x1 - x0);
    const dy = Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1;
    const sy = y0 < y1 ? 1 : -1;
    let err = dx - dy;
    let x = x0;
    let y = y0;
    for (;;) {
      this.fillRect(x - Math.floor(t / 2), y - Math.floor(t / 2), t, t, c);
      if (x === x1 && y === y1) break;
      const e2 = 2 * err;
      if (e2 > -dy) {
        err -= dy;
        x += sx;
      }
      if (e2 < dx) {
        err += dx;
        y += sy;
      }
    }
  }

  fillCircle(cx: number, cy: number, r: number, c: RGB): void {
    for (let y = -r; y <= r; y++) {
      const half = Math.floor(Math.sqrt(r * r - y * y));
      for (let x = -half; x <= half; x++) this.set(cx + x, cy + y, c);
    }
  }

  ring(cx: number, cy: number, r: number, t: number, c: RGB): void {
    for (let a = 0; a < 360; a += 1) {
      const rad = (a * Math.PI) / 180;
      for (let d = 0; d < t; d++) {
        this.set(
          Math.round(cx + (r + d - t / 2) * Math.cos(rad)),
          Math.round(cy + (r + d - t / 2) * Math.sin(rad)),
          c,
        );
      }
    }
  }

  fillTriangle(x0: number, y0: number, x1: number, y1: number, x2: number, y2: number, c: RGB): void {
    const minY = Math.min(y0, y1, y2);
    const maxY = Math.max(y0, y1, y2);
    for (let y = minY; y <= maxY; y++) {
      const xs: number[] = [];
      const edges: Array<[number, number, number, number]> = [
        [x0, y0, x1, y1],
        [x1, y1, x2, y2],
        [x2, y2, x0, y0],
      ];
      for (const [ax, ay, bx, by] of edges) {
        if ((ay <= y && by > y) || (by <= y && ay > y)) {
          xs.push(ax + ((y - ay) * (bx - ax)) / (by - ay));
        }
      }
      if (xs.length >= 2) {
        const lo = Math.min(...xs);
        const hi = Math.max(...xs);
        for (let x = Math.ceil(lo); x <= Math.floor(hi); x++) this.set(x, y, c);
      }
    }
  }

  text(str: string, x: number, y: number, scale: number, c: RGB): number {
    let cx = x;
    for (const ch of str) {
      const g = FONT[ch.toUpperCase()] ?? FONT["?"];
      for (let r = 0; r < 7; r++) {
        for (let col = 0; col < 5; col++) {
          if (g[r][col] === "1") {
            this.fillRect(cx + col * scale, y + r * scale, scale, scale, c);
          }
        }
      }
      cx += 6 * scale;
    }
    return cx;
  }

  textWidth(str: string, scale: number): number {
    return str.length * 6 * scale - scale;
  }

  centerText(str: string, cx: number, y: number, scale: number, c: RGB): void {
    this.text(str, cx - Math.floor(this.textWidth(str, scale) / 2), y, scale, c);
  }

  wrapText(str: string, scale: number, maxW: number): string[] {
    const words = str.split(" ");
    const lines: string[] = [];
    let cur = "";
    for (const w of words) {
      const test = cur ? cur + " " + w : w;
      if (this.textWidth(test, scale) <= maxW) {
        cur = test;
      } else {
        if (cur) lines.push(cur);
        cur = w;
      }
    }
    if (cur) lines.push(cur);
    return lines;
  }

  para(str: string, x: number, y: number, scale: number, maxW: number, c: RGB, lh?: number): number {
    const lines = this.wrapText(str, scale, maxW);
    const step = lh ?? 9 * scale;
    lines.forEach((ln, i) => this.text(ln, x, y + i * step, scale, c));
    return y + lines.length * step;
  }
}

// ------------------------------------------------------------------
// Pictograms.
// ------------------------------------------------------------------

function burst(cv: Canvas, cx: number, cy: number, r: number, c: RGB): void {
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4;
    const x2 = Math.round(cx + r * Math.cos(a));
    const y2 = Math.round(cy + r * Math.sin(a));
    cv.line(cx, cy, x2, y2, 5, c);
  }
  cv.fillCircle(cx, cy, Math.max(4, Math.floor(r / 3)), c);
}

function scalesOfJustice(cv: Canvas, cx: number, cy: number, s: number, c: RGB): void {
  // Post, beam, two pans.
  cv.fillRect(cx - 2 * s, cy - 26 * s, 4 * s, 52 * s, c);
  cv.fillRect(cx - 20 * s, cy - 26 * s, 40 * s, 3 * s, c);
  cv.fillRect(cx - 26 * s, cy + 26 * s, 52 * s, 3 * s, c);
  for (const side of [-1, 1]) {
    const px = cx + side * 20 * s;
    cv.line(px, cy - 23 * s, px - 9 * s, cy - 6 * s, 2 * s, c);
    cv.line(px, cy - 23 * s, px + 9 * s, cy - 6 * s, 2 * s, c);
    cv.fillTriangle(px - 10 * s, cy - 6 * s, px + 10 * s, cy - 6 * s, px, cy + 4 * s, c);
  }
  cv.fillCircle(cx, cy - 28 * s, 3 * s, c);
}

function sunLeaf(cv: Canvas, cx: number, cy: number, s: number, sun: RGB, leaf: RGB): void {
  cv.fillCircle(cx, cy - 6 * s, 9 * s, sun);
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4;
    cv.line(
      Math.round(cx + 12 * s * Math.cos(a)),
      Math.round(cy - 6 * s + 12 * s * Math.sin(a)),
      Math.round(cx + 17 * s * Math.cos(a)),
      Math.round(cy - 6 * s + 17 * s * Math.sin(a)),
      2 * s,
      sun,
    );
  }
  cv.fillCircle(cx - 10 * s, cy + 12 * s, 7 * s, leaf);
  cv.fillCircle(cx + 10 * s, cy + 12 * s, 7 * s, leaf);
  cv.fillRect(cx - s, cy + 2 * s, 2 * s, 12 * s, leaf);
}

function chartDown(cv: Canvas, x: number, y: number, w: number, h: number, c: RGB): void {
  cv.hline(x, x + w, y + h, 3, c);
  cv.vline(x, y, y + h, 3, c);
  const pts: Array<[number, number]> = [
    [x + 8, y + 14],
    [x + Math.floor(w * 0.3), y + 26],
    [x + Math.floor(w * 0.5), y + 22],
    [x + Math.floor(w * 0.72), y + 48],
    [x + w - 10, y + h - 12],
  ];
  for (let i = 0; i < pts.length - 1; i++) {
    cv.line(pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1], 4, c);
  }
  const [ax, ay] = pts[pts.length - 1];
  cv.fillTriangle(ax, ay, ax - 12, ay - 2, ax - 2, ay - 12, c);
}

function planet(cv: Canvas, cx: number, cy: number, r: number, c: RGB, ringC: RGB): void {
  cv.fillCircle(cx, cy, r, c);
  cv.fillCircle(cx - Math.floor(r * 0.35), cy - Math.floor(r * 0.3), Math.floor(r * 0.45), WHITE);
  for (let a = 200; a <= 340; a += 2) {
    const rad = (a * Math.PI) / 180;
    cv.set(
      Math.round(cx + (r + 8) * Math.cos(rad) * 1.7),
      Math.round(cy + (r + 8) * Math.sin(rad) * 0.45),
      ringC,
    );
    cv.set(
      Math.round(cx + (r + 11) * Math.cos(rad) * 1.7),
      Math.round(cy + (r + 11) * Math.sin(rad) * 0.45),
      ringC,
    );
  }
  cv.fillCircle(cx - r - 26, cy - r - 10, 2, WHITE);
  cv.fillCircle(cx + r + 20, cy - r + 4, 2, WHITE);
  cv.fillCircle(cx + r + 8, cy + r + 14, 2, WHITE);
}

function pill(cv: Canvas, cx: number, cy: number, s: number, c1: RGB, c2: RGB): void {
  const w = 34 * s;
  const h = 14 * s;
  const x = cx - Math.floor(w / 2);
  const y = cy - Math.floor(h / 2);
  // Ink outline, slightly larger than the capsule.
  cv.fillRect(x + 7 * s - 2, y - 2, w - 14 * s + 4, h + 4, INK);
  cv.fillCircle(x + 7 * s, cy, 7 * s + 2, INK);
  cv.fillCircle(x + w - 7 * s, cy, 7 * s + 2, INK);
  // Two halves: white, then red.
  cv.fillRect(x + 7 * s, y, w - 14 * s, h, c1);
  cv.fillCircle(x + 7 * s, cy, 7 * s, c1);
  cv.fillCircle(x + w - 7 * s, cy, 7 * s, c2);
  cv.fillRect(x + Math.floor(w / 2), y, Math.floor(w / 2) - 7 * s, h, c2);
  cv.fillRect(cx - s, y + 2 * s, 2 * s, h - 4 * s, WHITE);
}

// ------------------------------------------------------------------
// PNG encoding (CRC32 + zlib deflate, filter 0 per scanline).
// ------------------------------------------------------------------

const CRC_TABLE: number[] = (() => {
  const t: number[] = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t.push(c >>> 0);
  }
  return t;
})();

function crc32(buf: Buffer): number {
  let c = 0xffffffff;
  for (const b of buf) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type: string, data: Buffer): Buffer {
  const out = Buffer.alloc(12 + data.length);
  out.writeUInt32BE(data.length, 0);
  out.write(type, 4, "ascii");
  data.copy(out, 8);
  out.writeUInt32BE(crc32(Buffer.concat([Buffer.from(type, "ascii"), data])), 8 + data.length);
  return out;
}

function encodePNG(cv: Canvas): Buffer {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(W, 0);
  ihdr.writeUInt32BE(H, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // color type RGB
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const raw = Buffer.alloc(H * (1 + W * 3));
  for (let y = 0; y < H; y++) {
    raw[y * (1 + W * 3)] = 0;
    raw.set(cv.buf.subarray(y * W * 3, (y + 1) * W * 3), y * (1 + W * 3) + 1);
  }
  const idat = deflateSync(raw, { level: 9 });

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", idat),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

// ------------------------------------------------------------------
// The front page.
// ------------------------------------------------------------------

function draw(): Canvas {
  const cv = new Canvas();

  // Outer border.
  cv.strokeRect(8, 8, W - 16, H - 16, 4, INK);

  // ---- Masthead ---------------------------------------------------
  cv.fillRect(12, 12, W - 24, 118, INK);
  cv.centerText("THE WORLD IN ONE DAY", W / 2, 30, 5, WHITE);
  cv.hline(60, W - 60, 92, 2, GOLD);
  cv.centerText("SATURDAY 21 NOVEMBER 2026", W / 2, 100, 3, GOLD);

  // ---- Lead story: Russia's barrage, Poland -----------------------
  const leadY = 142;
  const leadH = 330;
  cv.fillRect(24, leadY, W - 48, leadH, INK);
  // Pictogram: bursts + missiles over a dark field.
  burst(cv, 120, leadY + 90, 46, RED);
  burst(cv, 220, leadY + 200, 34, GOLD);
  burst(cv, 90, leadY + 250, 26, RED);
  cv.line(60, leadY + 300, 300, leadY + 120, 4, WHITE);
  cv.fillTriangle(300, leadY + 120, 268, leadY + 128, 288, leadY + 148, WHITE);
  cv.line(300, leadY + 300, 150, leadY + 170, 4, WHITE);
  cv.fillTriangle(150, leadY + 170, 182, leadY + 178, 162, leadY + 198, WHITE);
  // Kicker + headline.
  cv.text("WAR IN EUROPE", 350, leadY + 26, 2, RED);
  cv.hline(350, 990, leadY + 52, 2, GOLD);
  let y = cv.para("RUSSIA'S BIGGEST BARRAGE HITS UKRAINE", 350, leadY + 66, 4, 630, WHITE);
  y += 6;
  y = cv.para("404 DRONES AND 111 MISSILES OVERNIGHT. TWO MISSILES AND A DRONE LAND IN POLAND.", 350, y, 2, 630, LIGHT);
  y += 8;
  cv.para("KYIV HIT - BRIDGES DAMAGED, POWER CUT IN TEN REGIONS. NATO CALLS IT A GRAVE VIOLATION.", 350, y, 2, 630, LIGHT);

  // ---- Row 2: ICJ + COP31 -----------------------------------------
  const row2Y = 484;
  const row2H = 216;
  // ICJ panel.
  cv.fillRect(24, row2Y, 476, row2H, WHITE);
  cv.strokeRect(24, row2Y, 476, row2H, 2, INK);
  scalesOfJustice(cv, 96, row2Y + 108, 2, INK);
  cv.text("THE HAGUE", 180, row2Y + 16, 2, RED);
  cv.para("WORLD COURT FINDS MYANMAR GUILTY OF ROHINGYA GENOCIDE", 180, row2Y + 44, 3, 300, INK);
  cv.para("LANDMARK 9-6 RULING ORDERS REPARATIONS", 180, row2Y + 176, 2, 300, INK);
  // COP31 panel.
  cv.fillRect(524, row2Y, 476, row2H, WHITE);
  cv.strokeRect(524, row2Y, 476, row2H, 2, INK);
  sunLeaf(cv, 596, row2Y + 108, 2, GOLD, GREEN);
  cv.text("ANTALYA, TURKEY", 680, row2Y + 16, 2, RED);
  cv.para("COP31 TALKS RUN PAST DEADLINE IN DEADLOCK", 680, row2Y + 44, 3, 300, INK);
  cv.para("FOSSIL-FUEL PLEDGE DROPPED FROM DRAFT", 680, row2Y + 176, 2, 300, INK);

  // ---- Row 3: markets, space, health ------------------------------
  // Each panel: kicker top-left, pictogram centred, headline full
  // width below it, one-line fact at the bottom.
  const row3Y = 712;
  const row3H = 228;
  const cols: Array<{ x: number; w: number }> = [
    { x: 24, w: 320 },
    { x: 352, w: 320 },
    { x: 680, w: 320 },
  ];
  for (const col of cols) {
    cv.fillRect(col.x, row3Y, col.w, row3H, WHITE);
    cv.strokeRect(col.x, row3Y, col.w, row3H, 2, INK);
  }
  // Markets.
  cv.text("WALL STREET", 40, row3Y + 14, 2, RED);
  chartDown(cv, 110, row3Y + 44, 100, 56, RED);
  cv.para("AI SELL-OFF SINKS STOCKS INTO CORRECTION", 40, row3Y + 116, 3, 288, INK);
  cv.text("NIKKEI DOWN 5.1%", 40, row3Y + 200, 2, INK);
  // Space.
  cv.text("MERCURY", 368, row3Y + 14, 2, RED);
  planet(cv, 512, row3Y + 72, 30, INK, GOLD);
  cv.para("BEPICOLOMBO REACHES MERCURY ORBIT", 368, row3Y + 116, 3, 288, INK);
  cv.text("EU-JAPAN PROBE ARRIVES", 368, row3Y + 200, 2, INK);
  // Health.
  cv.text("MEDICINE", 696, row3Y + 14, 2, RED);
  pill(cv, 840, row3Y + 72, 2, WHITE, RED);
  cv.para("PILL MAKES PANCREATIC TUMOURS VANISH", 696, row3Y + 116, 3, 288, INK);
  cv.text("TRIAL: 1 IN 12 CLEAR", 696, row3Y + 200, 2, INK);

  // ---- Footer: also today -----------------------------------------
  const footY = 952;
  cv.fillRect(24, footY, W - 48, 56, INK);
  cv.centerText("ALSO TODAY: 6.7 QUAKE SHAKES PERU'S ANDES", W / 2, footY + 8, 2, WHITE);
  cv.centerText("FBI CRIME DATABASE HACKED - 128 NATIONS BACK KILLER-ROBOT RULES", W / 2, footY + 30, 2, GOLD);

  return cv;
}

// ------------------------------------------------------------------
// Entry point.
// ------------------------------------------------------------------

const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";
mkdirSync(outDir, { recursive: true });
const png = encodePNG(draw());
writeFileSync(join(outDir, "entry.png"), png);
console.log(`wrote entry.png (${png.length} bytes, ${W}x${H})`);
