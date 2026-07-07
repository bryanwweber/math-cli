import { parseArgs } from "node:util";
import { liteAdaptor } from "@mathjax/src/js/adaptors/liteAdaptor.js";
import { RegisterHTMLHandler } from "@mathjax/src/js/handlers/html.js";
import { TeX } from "@mathjax/src/js/input/tex.js";
import { mathjax } from "@mathjax/src/js/mathjax.js";
import { SVG } from "@mathjax/src/js/output/svg.js";
import "@mathjax/src/js/util/asyncLoad/esm.js";

import "@mathjax/src/js/input/tex/base/BaseConfiguration.js";
import "@mathjax/src/js/input/tex/ams/AmsConfiguration.js";
import "@mathjax/src/js/input/tex/boldsymbol/BoldsymbolConfiguration.js";
import "@mathjax/src/js/input/tex/newcommand/NewcommandConfiguration.js";
import "@mathjax/src/js/input/tex/noundefined/NoUndefinedConfiguration.js";

const adaptor = liteAdaptor();
RegisterHTMLHandler(adaptor);

const tex = new TeX({
  packages: ["base", "ams", "boldsymbol", "newcommand", "noundefined"],
});
const svg = new SVG({ fontCache: "local", useXlink: false });

const document = mathjax.document("", { InputJax: tex, OutputJax: svg });

const { values } = parseArgs({
  args: Bun.argv.slice(2),
  options: {
    input: { type: "string", short: "i" },
    output: { type: "string", short: "o" },
  },
  strict: true,
  allowPositionals: true,
});

if (!values.input || !values.output) {
  console.error("Usage: bun run script.ts -i <file|-> -o <file|->");
  process.exit(1);
}

let mathInput = "";
if (values.input === "-") {
  for await (const chunk of process.stdin) {
    mathInput += chunk.toString();
  }
} else {
  mathInput = await Bun.file(values.input).text();
}

const node = await document.convertPromise(mathInput, {
  display: false,
});
const svgNode = adaptor.getElement("svg", node);
let svgDoc = adaptor.serializeXML(svgNode);
svgDoc = svgDoc.replaceAll(/currentColor/g, "var(--math-text-color)");
if (values.output === "-") {
  process.stdout.write(svgDoc);
} else {
  await Bun.write(values.output, svgDoc);
}
// This is the last thing to do to release worker resources.
await document.done();
