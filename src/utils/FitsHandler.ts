import fs from "fs";
import { FITSParsed, FITSParser, FITSWriter } from "jsfitsio";

export interface Fits {
  header: any;
  data: any;
  width: number;
  height: number;
  bitbix: any;
}

class FitsHandler {
  private lights: FITSParsed[] = [];
  private flats: FITSParsed[] = [];
  private darks: FITSParsed[] = [];
  private bias: FITSParsed[] = [];

  constructor() {}

  public async run() {
    this.lights = [];
    fs.readdir("./light/", (err, files) => {
      if (!err) {
        files.forEach(async (file) => {
          const c = await this.readFile(`./light/${file}`);
          if (c) {
            this.lights.push(c);
          }
        });
        console.log(`\nLoaded ${this.lights.length} light frames`);
      }
    });

    this.darks = [];
    fs.readdir("./dark/", (err, files) => {
      if (!err) {
        files.forEach(async (file) => {
          const c = await this.readFile(`./dark/${file}`);
          if (c) {
            this.darks.push(c);
          }
        });
        console.log(`\nLoaded ${this.darks.length} dark frames`);
      }
    });

    this.flats = [];
    fs.readdir("./flat/", (err, files) => {
      if (!err) {
        files.forEach(async (file) => {
          const c = await this.readFile(`./flat/${file}`);
          if (c) {
            this.flats.push(c);
          }
        });
        console.log(`\nLoaded ${this.flats.length} flat frames`);
      }
    });

    this.bias = [];
    fs.readdir("./bias/", (err, files) => {
      if (!err) {
        files.forEach(async (file) => {
          const c = await this.readFile(`./bias/${file}`);
          if (c) {
            this.bias.push(c);
          }
        });
      }
      console.log(`\nLoaded ${this.bias.length} bias frames`);
    });

    this.lights.forEach((light, index) =>
      this.saveFile(
        `./_reg/file-${index}.fits`,
        light.data as unknown as Float32Array<ArrayBuffer>
      )
    );
  }

  async readFile(path: string): Promise<FITSParsed | undefined> {
    console.info(` \nReading file ${path}`);
    const fits = await FITSParser.loadFITS(path);
    if (fits) {
      // let fitsHeader = fits.header;
      // console.log("***********************'");
      // console.log(fitsHeader);
      return fits;
    } else {
      console.warn(`Warning, file ${path} not loaded`);
    }
  }

  saveFile(path: string, data: Float32Array<ArrayBuffer>) {
    const fp = {
      header: null,
      data,
    } as unknown as FITSParsed;

    FITSWriter.writeFITSFile(fp, path);
  }
}
export default FitsHandler;
