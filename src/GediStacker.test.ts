import { FITSParsed, FITSParser } from "jsfitsio";
import FitsHandler from "./utils/FitsHandler";

it("create a new file correctly", async () => {
  const fitsInput = await FITSParser.loadFITS("./src/tests/input2.fit");
  if (fitsInput) {
    FitsHandler.saveFile("./src/tests/generated-new2.fits", fitsInput);
  }
});

it("should create identical files", async () => {
  const fileuri: string = "./src/tests/input.fits";
  const fitsFile = await FITSParser.loadFITS(fileuri);

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
    FITSParser.saveFITSLocally(newDataFile, "./src/tests/generated-new.fits");
    //    FITSWriter.writeFITSFile(fitsFile, "./src/tests/generated3.fits");
  }
});

it("should normalize the generated FITS", () => {});
