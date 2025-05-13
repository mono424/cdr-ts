import { parseInt, parseUint } from "./parser";
import { createArrayBuffer } from "./buffer";

test("Parse Int8", () => {
  const bytes = createArrayBuffer(new Uint8Array([1, 9, 9, 9]));
  expect(parseInt(bytes, 8)).toBe(1);
});

test("Parse Int16", () => {
  const bytes = createArrayBuffer(new Uint8Array([0, 0, 1, 0, 9, 9]));
  bytes.shift(1); // Misalign
  expect(parseInt(bytes, 16)).toBe(1);
});

test("Parse Int32", () => {
  const bytes = createArrayBuffer(
    new Uint8Array([0, 0, 0, 0, 1, 0, 0, 0, 9, 9]),
  );
  bytes.shift(1); // Misalign
  expect(parseInt(bytes, 32)).toBe(1);
});

test("Parse Int64", () => {
  const bytes = createArrayBuffer(
    new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0]),
  );
  bytes.shift(1); // Misalign
  expect(parseUint(bytes, 64)).toBe(BigInt(4294967297));
});
