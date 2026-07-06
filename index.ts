import { mathjax } from "@mathjax/src/js/mathjax.js";
import { parseArgs } from "util";
import { TeX } from "@mathjax/src/js/input/tex.js";
import { SVG } from "@mathjax/src/js/output/svg.js";
import { liteAdaptor } from "@mathjax/src/js/adaptors/liteAdaptor.js";
import { RegisterHTMLHandler } from "@mathjax/src/js/handlers/html.js";

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

const { positionals } = parseArgs({
  args: Bun.argv,
  strict: true,
  allowPositionals: true,
});
if (positionals.length !== 3) {
  throw new Error("pass math as a positional");
}
const node = document.convert(String(positionals[2]), {});
let svgDoc = adaptor.serializeXML(adaptor.getElement("svg", node));
svgDoc = svgDoc.replaceAll(/currentColor/g, "var(--math-color)");
svgDoc = svgDoc.replace(/<defs>/, `<defs><style>${CSS}</style>`);
console.log(svgDoc);
// This is the last thing to do to release worker resources.
document.done();
