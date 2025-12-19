import fs from "fs";
import jsfits from "jsfitsio";

// export function readFITS(path: string) {
//   const buffer = fs.readFileSync(path).buffer;
//   const fits = new jsfits.FITSFile(buffer);
//   const hdu = fits.getHDU(0);

//   return {
//     header: hdu.header,
//     data: Float32Array.from(hdu.data),
//     width: hdu.header.naxis1,
//     height: hdu.header.naxis2,
//   };
// }

// export function writeFITS(path, frame) {
//   const fits = new jsfits.FITSFile();

//   fits.addHDU({
//     header: {
//       SIMPLE: true,
//       BITPIX: -32,
//       NAXIS: 2,
//       NAXIS1: frame.width,
//       NAXIS2: frame.height,
//     },
//     data: Float32Array.from(frame.data),
//   });

//   fs.writeFileSync(path, Buffer.from(fits.write()));
// }
