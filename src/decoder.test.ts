import {
  CDRSchemaField,
  CDRSchemaIntValue,
  CDRSchemaSequenceValue,
  CDRSchemaStringValue,
  CDRSchemaUintValue,
} from "./schema";

import { decodeCDR, decodeInt, decodeUint } from "./decoder";
import { createArrayBuffer } from "./buffer";

test("Decode Int8", () => {
  const bytes = createArrayBuffer(new Uint8Array([1, 9, 9, 9]));
  expect(decodeInt(bytes, 8)).toBe(BigInt(1));
});

test("Decode Int16", () => {
  const bytes = createArrayBuffer(new Uint8Array([0, 0, 1, 0, 9, 9]));
  bytes.shift(1); // Misalign
  expect(decodeInt(bytes, 16)).toBe(BigInt(1));
});

test("Decode Int32", () => {
  const bytes = createArrayBuffer(
    new Uint8Array([0, 0, 0, 0, 1, 0, 0, 0, 9, 9]),
  );
  bytes.shift(1); // Misalign
  expect(decodeInt(bytes, 32)).toBe(BigInt(1));
});

test("Decode Int64", () => {
  const bytes = createArrayBuffer(
    new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0]),
  );
  bytes.shift(1); // Misalign
  expect(decodeUint(bytes, 64)).toBe(BigInt(4294967297));
});
