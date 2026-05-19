import chalk from "chalk";

const isCI = !!(process.env.CI || process.env.NO_COLOR);
const LOG_LEVEL = process.env.LOG_LEVEL || "info";
const levels = { debug: 0, info: 1, warn: 2, error: 3 };
const current = levels[LOG_LEVEL] ?? levels.info;

const log = {
  debug: (msg) =>
    current <= levels.debug && console.log(isCI ? `[debug] ${msg}` : `${chalk.gray("●")} ${msg}`),
  info: (msg) =>
    current <= levels.info && console.log(isCI ? `[info] ${msg}` : `${chalk.blue("ℹ")} ${msg}`),
  success: (msg) =>
    current <= levels.info && console.log(isCI ? `[ok] ${msg}` : `${chalk.green("✔")} ${msg}`),
  warn: (msg) =>
    current <= levels.warn && console.log(isCI ? `[warn] ${msg}` : `${chalk.yellow("⚠")} ${msg}`),
  error: (msg) =>
    current <= levels.error &&
    console.log(isCI ? `[error] ${msg}` : `\n${chalk.red("✖")} ${chalk.bold(msg)}\n`),
};

export default log;
