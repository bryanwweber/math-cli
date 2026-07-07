import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { unlink } from "node:fs/promises";
import { parse } from "node-html-parser";

const SCRIPT_PATH = "./index.ts";

describe("CLI Tests", () => {
  beforeAll(async () => {
    await Bun.write("test-input.txt", "E=mc^2");
  });

  afterAll(async () => {
    try {
      await unlink("test-input.txt");
      await unlink("test-output.txt");
    } catch {
      // Ignore cleanup errors
    }
  });

  it("reads from file and writes to stdout", async () => {
    const proc = Bun.spawn([
      "bun",
      "run",
      SCRIPT_PATH,
      "-i",
      "test-input.txt",
      "-o",
      "-",
    ]);
    const text = await new Response(proc.stdout).text();
    await proc.exited;

    const root = parse(text);
    const element = root.querySelector('[data-latex="E=mc^2"]');
    expect(element).not.toBeNull();
  });

  it("reads from stdin and writes to file", async () => {
    const proc = Bun.spawn(
      ["bun", "run", SCRIPT_PATH, "-i", "-", "-o", "test-output.txt"],
      {
        stdin: "pipe",
      },
    );

    proc.stdin.write("a^2+b^2=c^2");
    proc.stdin.end();
    await proc.exited;

    const out = await Bun.file("test-output.txt").text();
    const root = parse(out);
    const element = root.querySelector('[data-latex="a^2+b^2=c^2"]');
    expect(element).not.toBeNull();
  });

  it("outputs an SVG containing the data-latex attribute from stdin to stdout", async () => {
    const inputText = "F=ma";
    const proc = Bun.spawn(["bun", "run", SCRIPT_PATH, "-i", "-", "-o", "-"], {
      stdin: "pipe",
    });

    proc.stdin.write(inputText);
    proc.stdin.end();

    const out = await new Response(proc.stdout).text();
    await proc.exited;

    const root = parse(out);
    const element = root.querySelector(`[data-latex="${inputText}"]`);
    expect(element).not.toBeNull();
  });

  it("loads modules asynchronously as needed", async () => {
    // The input \perp requires MathJax to asynchronously load some font information
    // This test ensures that we await the *Promise versions of the functions
    const inputText = "\\perp";
    const proc = Bun.spawn(["bun", "run", SCRIPT_PATH, "-i", "-", "-o", "-"], {
      stdin: "pipe",
    });

    proc.stdin.write(inputText);
    proc.stdin.end();

    const out = await new Response(proc.stdout).text();
    await proc.exited;

    const root = parse(out);
    const elements = root.querySelectorAll("[data-latex]");
    const match = elements.find(
      (el) => el.getAttribute("data-latex") === inputText,
    );

    expect(match).toBeDefined();
  });
});
