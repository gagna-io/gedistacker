import { createCanvas, Image } from "canvas";
import FitsReader from "./FitsHandler";
import { FITSParsed, FITSParser } from "jsfitsio";

class Aligner {
  private cv: any;
  private refStars: any;

  constructor() {
    (global as any).HTMLCanvasElement = createCanvas(1, 1).constructor;
    (global as any).HTMLImageElement = Image;
    (global as any).Image = Image;
  }

  initialise(refFrame: FITSParsed) {
    try {
      console.log("\nInitializing registration..");
      console.log("Detecting stars for reference image");
      this.refStars = this.detectStars2(refFrame);
    } catch (e) {
      console.log("Initialization failed", e);
    }
  }

  async alignFITS(img: FITSParsed, index: number) {
    console.log("Loading FITS...");
    const outPath = `./_registered/light-${index}.fits`;

    try {
      /*** NEW ***/
      console.log("Detecting stars for light...");
      const stars = this.detectStars2(img);

      console.log("Matching stars...");
      const matches = this.matchStars2(this.refStars, stars);

      console.log("Solve transform...");
      const t = this.solveTransform2(stars, this.refStars, matches);

      console.log("Warp image...");
      const aligned = this.warpImage2(img, t);
      FITSParser.saveFITSLocally(aligned, outPath);
    } catch (e) {
      console.log("Failed to align v2 code", e);
    }
  }

  detectStars2(frame: FITSParsed) {
    const { data: dataPart, header } = frame;
    const widthMatch = header.getItems().find((h: any) => h._key === "NAXIS1");
    const w = (widthMatch?._value as number) || 0;
    const heightMatch = header.getItems().find((h: any) => h._key === "NAXIS2");
    const h = (heightMatch?._value as number) || 0;
    const stars: { x: number; y: number; flux: number }[] = [];
    const data = Float32Array.from(dataPart);

    // --- robust background
    const sorted = Array.from(data).sort((a, b) => a - b);
    const median = sorted[Math.floor(sorted.length / 2)];

    const absDev = sorted.map((v) => Math.abs(v - median));
    absDev.sort((a, b) => a - b);
    const mad = absDev[Math.floor(absDev.length / 2)];

    const threshold = median + 5 * mad;
    const visited = new Uint8Array(data.length);

    const idx = (x: number, y: number) => y * w + x;

    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        const i = idx(x, y);
        if (visited[i] || data[i] < threshold) continue;

        let sumI = 0,
          sumX = 0,
          sumY = 0,
          count = 0;
        const stack = [[x, y]];

        while (stack.length) {
          const [sx, sy] = stack.pop()!;
          const si = idx(sx, sy);
          if (visited[si] || data[si] < threshold) continue;

          visited[si] = 1;
          const I = data[si];
          sumI += I;
          sumX += sx * I;
          sumY += sy * I;
          count++;

          for (let dy = -1; dy <= 1; dy++)
            for (let dx = -1; dx <= 1; dx++) stack.push([sx + dx, sy + dy]);
        }

        if (count >= 4 && count <= 80) {
          stars.push({ x: sumX / sumI, y: sumY / sumI, flux: sumI });
        }
      }
    }

    return stars;
  }

  matchStars2(
    ref: { x: number; y: number }[],
    img: { x: number; y: number }[],
    maxDist = 15
  ) {
    const matches: [number, number][] = [];

    for (let i = 0; i < img.length; i++) {
      let best = -1;
      let bestD = Infinity;

      for (let j = 0; j < ref.length; j++) {
        const d = Math.hypot(img[i].x - ref[j].x, img[i].y - ref[j].y);
        if (d < bestD && d < maxDist) {
          bestD = d;
          best = j;
        }
      }

      if (best !== -1) matches.push([i, best]);
    }

    return matches;
  }

  solveTransform2(
    img: { x: number; y: number }[],
    ref: { x: number; y: number }[],
    matches: [number, number][]
  ) {
    let cx1 = 0,
      cy1 = 0,
      cx2 = 0,
      cy2 = 0;

    for (const [i, j] of matches) {
      cx1 += img[i].x;
      cy1 += img[i].y;
      cx2 += ref[j].x;
      cy2 += ref[j].y;
    }

    cx1 /= matches.length;
    cy1 /= matches.length;
    cx2 /= matches.length;
    cy2 /= matches.length;

    let num = 0,
      den = 0;
    for (const [i, j] of matches) {
      const x1 = img[i].x - cx1;
      const y1 = img[i].y - cy1;
      const x2 = ref[j].x - cx2;
      const y2 = ref[j].y - cy2;

      num += x1 * y2 - y1 * x2;
      den += x1 * x2 + y1 * y2;
    }

    const angle = Math.atan2(num, den);

    let scale = 0;
    for (const [i, j] of matches) {
      scale +=
        Math.hypot(ref[j].x - cx2, ref[j].y - cy2) /
        Math.hypot(img[i].x - cx1, img[i].y - cy1);
    }
    scale /= matches.length;

    return {
      scale,
      angle,
      tx: cx2 - scale * (cx1 * Math.cos(angle) - cy1 * Math.sin(angle)),
      ty: cy2 - scale * (cx1 * Math.sin(angle) + cy1 * Math.cos(angle)),
    };
  }

  warpImage2(
    frame: FITSParsed,
    t: { scale: number; angle: number; tx: number; ty: number }
  ) {
    const { data: dataPart, header } = frame;
    const widthMatch = header.getItems().find((h: any) => h._key === "NAXIS1");
    const w = (widthMatch?._value as number) || 0;
    const heightMatch = header.getItems().find((h: any) => h._key === "NAXIS2");
    const h = (heightMatch?._value as number) || 0;
    const data = Float32Array.from(dataPart);

    const out = new Float32Array(data.length);
    const cos = Math.cos(-t.angle);
    const sin = Math.sin(-t.angle);

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const xs = (cos * (x - t.tx) - sin * (y - t.ty)) / t.scale;
        const ys = (sin * (x - t.tx) + cos * (y - t.ty)) / t.scale;

        const x0 = Math.floor(xs);
        const y0 = Math.floor(ys);

        if (x0 >= 0 && x0 + 1 < w && y0 >= 0 && y0 + 1 < h) {
          const dx = xs - x0;
          const dy = ys - y0;

          const i = y0 * w + x0;
          const v =
            data[i] * (1 - dx) * (1 - dy) +
            data[i + 1] * dx * (1 - dy) +
            data[i + w] * (1 - dx) * dy +
            data[i + w + 1] * dx * dy;

          out[y * w + x] = v;
        }
      }
    }
    const out2: Uint8Array<ArrayBufferLike>[] = Uint8Array.from(
      out,
      (v) => v | 0
    ) as unknown as Uint8Array<ArrayBufferLike>[];

    const retImage: FITSParsed = {
      data: out2,
      header: frame.header,
    };
    return retImage;
  }
}

export default Aligner;
