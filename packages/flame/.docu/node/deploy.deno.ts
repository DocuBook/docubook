import { runDeploy } from "./deploy.shared";

runDeploy().catch((err) => {
  console.error("Deploy failed:", err);
  process.exit(1);
});
