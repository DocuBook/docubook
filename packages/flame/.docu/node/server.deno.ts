import { denoAdapter } from "./runtime";
import { runServer } from "./server.impl";

await runServer(denoAdapter);
