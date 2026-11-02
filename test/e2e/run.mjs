import { spawn } from "node:child_process";
import { serveBuild } from "./server.mjs";
const server = await serveBuild();
try {
  for (const [test, page] of [["kitchen-sink", "kitchen-sink"], ["blocks", "kitchen-sink"], ["ftl-output", "ftl-output"]]) {
    const child = spawn(process.execPath, [`test/e2e/${test}.e2e.mjs`, `${server.origin}/kitchen-sink/examples/${page}.html`], { stdio: "inherit" });
    const code = await new Promise((resolve, reject) => { child.once("error", reject); child.once("exit", resolve); });
    if (code !== 0) throw new Error(`${test} browser tests failed (${code})`);
  }
} finally { await server.close(); }
