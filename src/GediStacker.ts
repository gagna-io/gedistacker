import FitsHandler from "./utils/FitsHandler";

class GediStacker {
  private fitsHandler: FitsHandler;

  constructor() {
    console.log(" \nLoading files..");
    this.fitsHandler = new FitsHandler();
  }

  public async run() {
    await this.fitsHandler.run();
  }
}

export default GediStacker;
