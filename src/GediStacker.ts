import FitsHandler from "./utils/FitsHandler";

class GediStacker {
  private fitsHandler: FitsHandler;

  constructor() {
    console.log(" \nGediStacker v0.0.1");
    this.fitsHandler = new FitsHandler();
  }

  public async load() {
    console.log(" \nLoading files..");
    await this.fitsHandler.load();
  }

  public async register() {
    await this.fitsHandler.registerLights();
  }

  public async stack() {
    this.fitsHandler.stackLights();
  }
}

export default GediStacker;
