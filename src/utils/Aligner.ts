import cvModule from "@techstark/opencv-js";
import { createCanvas } from "canvas";
import FitsReader from "./FitsHandler";

class Aligner {
  private fitsReader: FitsReader;
  private cv: any;

  constructor() {
    this.fitsReader = new FitsReader();
  }

  async initialise() {
    this.cv = await cvModule;
  }

  fitsTo8BitMat(frame: any) {
    const { data, width, height } = frame;

    let min = Infinity,
      max = -Infinity;
    for (const v of data) {
      if (v < min) min = v;
      if (v > max) max = v;
    }

    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext("2d");
    const imgData = ctx.createImageData(width, height);

    for (let i = 0; i < data.length; i++) {
      const v = ((data[i] - min) / (max - min)) * 255;
      imgData.data[i * 4 + 0] = v;
      imgData.data[i * 4 + 1] = v;
      imgData.data[i * 4 + 2] = v;
      imgData.data[i * 4 + 3] = 255;
    }

    ctx.putImageData(imgData, 0, 0);
    return this.cv.imread(canvas);
  }

  detectStars(mat: any) {
    const gray = new cv.Mat();
    this.cv.cvtColor(mat, gray, this.cv.COLOR_RGBA2GRAY);

    const orb = new this.cv.ORB(800);
    const keypoints = new this.cv.KeyPointVector();
    const descriptors = new this.cv.Mat();

    orb.detectAndCompute(gray, new this.cv.Mat(), keypoints, descriptors);

    gray.delete();
    orb.delete();

    return { keypoints, descriptors };
  }

  matchStars(descRef: any, descImg: any) {
    const bf = new this.cv.BFMatcher(cv.NORM_HAMMING, true);
    const matches = new this.cv.DMatchVector();
    bf.match(descRef, descImg, matches);

    const good = [];
    for (let i = 0; i < Math.min(matches.size(), 60); i++) {
      good.push(matches.get(i));
    }

    bf.delete();
    matches.delete();

    return good;
  }

  estimateTransform(refStars: any, imgStars: any, matches: any) {
    const src: any[] = [];
    const dst: any[] = [];

    matches.forEach((m: any) => {
      const p1 = imgStars.keypoints.get(m.trainIdx).pt;
      const p2 = refStars.keypoints.get(m.queryIdx).pt;
      src.push(p1.x, p1.y);
      dst.push(p2.x, p2.y);
    });

    const srcMat = this.cv.matFromArray(matches.length, 2, this.cv.CV_32F, src);
    const dstMat = this.cv.matFromArray(matches.length, 2, this.cv.CV_32F, dst);

    const transform = this.cv.estimateAffinePartial2D(
      srcMat,
      dstMat,
      new this.cv.Mat(),
      this.cv.RANSAC
    );

    srcMat.delete();
    dstMat.delete();

    return transform;
  }

  warpFloatFrame(frame: any, transform: any) {
    const srcMat = this.cv.matFromArray(
      frame.height,
      frame.width,
      this.cv.CV_32FC1,
      frame.data
    );

    const dstMat = new this.cv.Mat();
    const dsize = new this.cv.Size(frame.width, frame.height);

    this.cv.warpAffine(
      srcMat,
      dstMat,
      transform,
      dsize,
      this.cv.INTER_LINEAR,
      this.cv.BORDER_CONSTANT,
      new this.cv.Scalar(0)
    );

    const out = Float32Array.from(dstMat.data32F);

    srcMat.delete();
    dstMat.delete();

    return {
      width: frame.width,
      height: frame.height,
      data: out,
    };
  }

  async alignFITS(refPath: any, targetPath: any, outPath: any) {
    console.log("Loading FITS...");
    const ref = this.fitsReader.readFile(refPath);
    const img = this.fitsReader.readFile(targetPath);

    console.log("Detecting stars...");
    const refMat = this.fitsTo8BitMat(ref);
    const imgMat = this.fitsTo8BitMat(img);

    const refStars = this.detectStars(refMat);
    const imgStars = this.detectStars(imgMat);

    console.log("Matching...");
    const matches = this.matchStars(refStars.descriptors, imgStars.descriptors);

    if (matches.length < 12) {
      throw new Error("Not enough star matches");
    }

    console.log("Estimating transform...");
    const transform = this.estimateTransform(refStars, imgStars, matches);

    console.log("Warping FITS...");
    const aligned = this.warpFloatFrame(img, transform);

    console.log("Writing aligned FITS...");
    this.fitsReader.saveFile(outPath, aligned.data);

    console.log("✅ Done:", outPath);

    // cleanup
    refMat.delete();
    imgMat.delete();
    refStars.keypoints.delete();
    imgStars.keypoints.delete();
    refStars.descriptors.delete();
    imgStars.descriptors.delete();
    transform.delete();
  }
}

export default Aligner;
