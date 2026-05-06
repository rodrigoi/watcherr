import { expect, test } from "bun:test";

import { extractFileExtension } from "@/lib";

test("extracts extension from a simple filename", () => {
  expect(extractFileExtension("file.txt")).toBe(".txt");
});

test("extracts extension from a full path", () => {
  expect(extractFileExtension("Show.S01E01/Show.S01E01.exe")).toBe(".exe");
});

test("returns empty string when no extension", () => {
  expect(extractFileExtension("no-extension")).toBe("");
});

test("extracts the last extension for compound names", () => {
  expect(extractFileExtension("archive.tar.gz")).toBe(".gz");
});
