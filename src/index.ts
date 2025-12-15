#!/usr/bin/env node
import { program } from "commander";
import GediStacker from "./GediStacker";

program.action(() => {
  console.log(` \nInitializing GediStacker..`);
  const gediStacker = new GediStacker();
  gediStacker.run();
});

program.parse(process.argv);
