import {
  parseCDRString,
  parseInt,
  parseUint,
  parseUintToBigInt,
} from "./parser";
import { createArrayBuffer } from "./buffer";
import {
  CDRSchema,
  CDRSchemaDictionaryField,
  CDRSchemaDictionaryValue,
  CDRSchemaIntValue,
  CDRSchemaSequenceValue,
  CDRSchemaStringValue,
  CDRSchemaUintValue,
} from "./schema";

function base64ToArrayBuffer(base64) {
  const binaryString = atob(base64);

  const encoder = new TextEncoder();
  const binaryArray = encoder.encode(binaryString);

  return binaryArray.buffer;
}

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

test("Parse UInt64 to number with overflow", () => {
  const bytes = createArrayBuffer(
    new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0]),
  );
  bytes.shift(1); // Misalign
  expect(parseUint(bytes, 64)).toBe(1);
});

test("Parse UInt64 to bigint", () => {
  const bytes = createArrayBuffer(
    new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0]),
  );
  bytes.shift(1); // Misalign
  expect(parseUintToBigInt(bytes, 64)).toBe(4294967297n);
});

test("Parse Video Frame Schema Message", () => {
  const data =
    "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";

  const cameraPacketSchema: CDRSchemaDictionaryValue<{
    stamp_s: CDRSchemaDictionaryField<CDRSchemaIntValue>;
    stamp_ns: CDRSchemaDictionaryField<CDRSchemaUintValue>;
    frame_id: CDRSchemaDictionaryField<CDRSchemaStringValue>;
    data: CDRSchemaDictionaryField<CDRSchemaSequenceValue<CDRSchemaUintValue>>;
  }> = {
    type: "dictionary",
    items: {
      stamp_s: { index: 0, value: { type: "int", len: 32 } },
      stamp_ns: {
        index: 1,
        value: { type: "uint", len: 32, format: "number" },
      },
      frame_id: { index: 2, value: { type: "string" } },
      data: {
        index: 3,
        value: {
          type: "sequence",
          itemSchema: { type: "uint", len: 8, format: "number" },
        },
      },
    },
  };

  const parsed = parseCDRString(data, cameraPacketSchema, {
    maxSequenceSize: 10000,
  });
  expect(parsed.payload.stamp_s).toBe(1747238941);
  expect(parsed.payload.stamp_ns).toBe(291125000);
  expect(parsed.payload.frame_id).toBe("62");
  expect(parsed.payload.data).toHaveLength(5456);
});
