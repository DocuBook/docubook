import { rm } from "node:fs/promises";
import { existsSync } from "node:fs";

const DIST = ".docu/dist";
const CACHE = ".docu/build-cache.json";

async function clean() {
  let removed = 0;

  if (existsSync(DIST)) {
    await rm(DIST, { recursive: true, force: true });
    removed++;
    console.log(DIST);
  }

  if (existsSync(CACHE)) {
    await rm(CACHE, { force: true });
    removed++;
    console.log(CACHE);
  }

  if (removed === 0) {
    console.log("✅ Nothing to clean");
  } else {
    console.log("✨ Cleaned " + removed + " item(s)");
  }
}

clean().catch((err) => {
  console.error("Clean failed:", err);
  process.exit(1);
});