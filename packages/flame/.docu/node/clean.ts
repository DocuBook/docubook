import { rm } from "node:fs/promises";
import { existsSync } from "node:fs";
import { logger } from "./logger";

const DIST = ".docu/dist";
const CACHE = ".docu/build-cache.json";

async function clean() {
  logger.buildStart();
  logger.spinner.start("Cleaning build artifacts...");

  let removed = 0;

  if (existsSync(DIST)) {
    await rm(DIST, { recursive: true, force: true });
    removed++;
  }

  if (existsSync(CACHE)) {
    await rm(CACHE, { force: true });
    removed++;
  }

  if (removed === 0) {
    logger.spinner.info("Nothing to clean");
  } else {
    logger.spinner.stop(`Cleaned ${removed} item(s)`);
  }
}

clean().catch((err) => {
  console.error("Clean failed:", err);
  process.exit(1);
});
