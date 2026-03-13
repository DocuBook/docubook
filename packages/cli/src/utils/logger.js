import chalk from "chalk";

const log = {
  info: (msg) => console.log(`${chalk.blue("ℹ")} ${msg}`),
  success: (msg) => console.log(`${chalk.green("✔")} ${msg}`),
  warn: (msg) => console.log(`${chalk.yellow("⚠")} ${msg}`),
  error: (msg) => console.log(`\n${chalk.red("✖")} ${chalk.bold(msg)}\n`),
};

export default log;