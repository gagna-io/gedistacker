import fs from "fs";
import { FITSParser, FITSWriter } from "jsfitsio";

export interface Fits {
  header: any;
  data: any;
  width: number;
  height: number;
  bitbix: any;
}

class FitsReader {
  private lights: any[];
  private flats: any[];
  private darks: any[];
  private bias: any[];

  constructor() {
    this.lights = [];
    fs.readdir("./light/", (err, files) => {
      if (!err) {
        files.forEach((file) =>
          this.lights.push(this.readFile(`./light/${file}`))
        );
      }
    });

    this.darks = [];
    fs.readdir("./dark/", (err, files) => {
      if (!err) {
        files.forEach((file) =>
          this.darks.push(this.readFile(`./dark/${file}`))
        );
      }
    });

    this.flats = [];
    fs.readdir("./flat/", (err, files) => {
      if (!err) {
        files.forEach((file) =>
          this.flats.push(this.readFile(`./flat/${file}`))
        );
      }
    });

    this.bias = [];
    fs.readdir("./bias/", (err, files) => {
      if (!err) {
        files.forEach((file) =>
          this.bias.push(this.readFile(`./bias/${file}`))
        );
      }
    });
  }

  public load() {
    this.lights.map((light) => this.readFile(light));
  }

  private async readFile(path: string) {
    console.log(` \nReading file ${path}`);
    const fileuri: string = "./test/inputs/x0c70103t_c1f.fits";
    const fits = await FITSParser.loadFITS(path);
    if (fits) {
      let fitsHeader = fits.header;
      console.log("***********************'");
      console.log(fitsHeader);
      //      let fitsData = fits.data;
    }
  }
}
export default FitsReader;
