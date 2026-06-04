#!/usr/bin/env node
import { program } from "commander";
import GediStacker from "./GediStacker";

program.action(async () => {
  console.log(` \nInitializing GediStacker..`);
  const gediStacker = new GediStacker();
  await gediStacker.load();
  await gediStacker.register();
  await gediStacker.stack();
});

program.parse(process.argv);
