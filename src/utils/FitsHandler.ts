import { promises as fs } from "fs";
import { FITSParsed, FITSParser } from "jsfitsio";
import Aligner from "./Aligner";

export interface Fits {
  header: any;
  data: any;
  width: number;
  height: number;
  bitbix: any;
}

class FitsHandler {
  private aligner;
  private lights: FITSParsed[] = [];
  private flats: FITSParsed[] = [];
  private darks: FITSParsed[] = [];
  private bias: FITSParsed[] = [];

  constructor() {
    this.aligner = new Aligner();
  }

  public async load() {
    this.lights = [];
    const lightFiles = await fs.readdir("./light/");
    for (const file of lightFiles) {
      const c = await this.readFile(`./light/${file}`);
      if (c) {
        this.lights.push(c);
      }
    }
    console.log(`\nLoaded ${this.lights.length} light frames`);

    this.darks = [];
    const darkFiles = await fs.readdir("./dark/");
    for (const file of darkFiles) {
      const c = await this.readFile(`./dark/${file}`);
      if (c) {
        this.darks.push(c);
      }
    }
    console.log(`\nLoaded ${this.darks.length} dark frames`);

    this.flats = [];
    const flatFiles = await fs.readdir("./flat/");
    for (const file of flatFiles) {
      const c = await this.readFile(`./flat/${file}`);
      if (c) {
        this.flats.push(c);
      }
    }
    console.log(`\nLoaded ${this.flats.length} flat frames`);

    this.bias = [];
    const biasFiles = await fs.readdir("./bias/");
    for (const file of biasFiles) {
      const c = await this.readFile(`./bias/${file}`);
      if (c) {
        this.bias.push(c);
      }
    }
    console.log(`\nLoaded ${this.bias.length} bias frames`);
  }

  async registerLights() {
    console.log("\nRegistering lights");
    console.log("\nInit complete");
    const noLights = this.lights.length;
    const referenceFrame = this.lights[Math.floor(noLights / 2)];
    this.aligner.initialise(referenceFrame);
    this.lights.forEach(async (light, index) => {
      console.log(`\Registering light ${index} ( of ${noLights})`);
      await this.aligner.alignFITS(light, index);
    });
  }

  stackLights() {
    console.log(`\nStacking lights: ${this.lights.length}`);
    // this.lights.forEach((light, index) =>
    //   this.saveFile(`./_reg/file-${index}.fits`, light)
    // );
  }

  async readFile(path: string): Promise<FITSParsed | undefined> {
    const fits = await FITSParser.loadFITS(path);
    if (fits) {
      return fits;
    } else {
      console.warn(`Warning, file ${path} not loaded`);
    }
  }

  public static saveFile(path: string, fitsFile: FITSParsed) {
    try {
      console.log("trying to create file ", path);
      if (fitsFile?.data) {
        const newData: any[] = [];
        let k = 5800;

        fitsFile.data.forEach((dataRow, index) => {
          newData.push(
            Array.from(dataRow).slice(k).concat(Array.from(dataRow).slice(0, k))
          );
        });

        const newDataFile: FITSParsed = {
          ...fitsFile,
          data: newData,
        };
        if (newDataFile) {
          FITSParser.saveFITSLocally(newDataFile, path);
        }
      }
    } catch (e) {
      console.log("FAILED TO CREATE FILE ", e);
    }
  }
}
export default FitsHandler;
