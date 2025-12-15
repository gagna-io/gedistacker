import FitsReader from "./utils/FitsReader";

class GediStacker {
  private fitsReader: FitsReader;

  constructor() {
    this.fitsReader = new FitsReader();
  }

  public run() {
    console.log(" \nLoading files..");
    this.fitsReader.load();
  }
}

export default GediStacker;
