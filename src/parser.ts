import { CDRBuffer, arrayBufferFromBase64, createArrayBuffer } from "./buffer";
import { CDRSchema, MapSchema } from "./schema";

export interface CDRHeader {
  representationIdentifier: bigint;
  representationOptions: bigint;
}

export interface ParserOptions {
  maxSequenceSize: number;
  maxStringSize: number;
}

export const parseInt = (bytes: CDRBuffer, intBitLen: number): number => {
  const byteLen = Math.floor(intBitLen / 8);
  bytes.align(byteLen);

  let value = 0;
  for (let i = 0; i < byteLen; i++) {
    const [byte] = bytes.shift(1);
    value = value | (byte << (i * 8));
  }

  return value;
};

export const parseUint = (bytes: CDRBuffer, uintBitLen: number): bigint => {
  const byteLen = Math.floor(uintBitLen / 8);
  bytes.align(byteLen);

  let value = BigInt(0);
  for (let i = 0; i < byteLen; i++) {
    const [byte] = bytes.shift(1);
    value = value | (BigInt(byte) << BigInt(i * 8));
  }

  return value;
};

export const parseFloat = (bytes: CDRBuffer, intBitLen: number): number => {
  const byteLen = Math.floor(intBitLen / 8);
  bytes.align(byteLen);

  return bytes.shiftAsDataView(byteLen).getFloat32(0, true);
};

export const parseString = (
  bytes: CDRBuffer,
  maxStringSize: number,
): string => {
  const stringLen = parseUint(bytes, 32);

  if (stringLen > BigInt(maxStringSize)) {
    throw new Error(
      `String length ${stringLen} exceeds maxStringSize ${maxStringSize}`,
    );
  }

  let value = "";
  for (let i = BigInt(0); i < stringLen - BigInt(1); i++) {
    const [byte] = bytes.shift(1);
    value += String.fromCharCode(byte);
  }
  bytes.shift(1); // remove null terminator

  return value;
};

export const parseCDRHeader = (bytes: CDRBuffer): CDRHeader => {
  const representationIdentifier = parseUint(bytes, 16);
  const representationOptions = parseUint(bytes, 16);

  return {
    representationIdentifier,
    representationOptions,
  };
};

const parseSequence = (
  bytes: CDRBuffer,
  itemSchema: CDRSchema,
  options: ParserOptions,
): MapSchema<CDRSchema>[] => {
  // bytes.shift(1); // skip some byte (?)
  const seqLen = parseUint(bytes, 32);

  if (seqLen > BigInt(options.maxSequenceSize)) {
    throw new Error(
      `Sequence length ${seqLen} exceeds maxSequenceSize ${options.maxSequenceSize}`,
    );
  }
  const value: MapSchema<CDRSchema>[] = [];
  for (let i = BigInt(0); i < seqLen; i++) {
    const item = parseSchema(bytes, itemSchema, options);
    value.push(item);
  }

  return value;
};

export function parseSchema<T extends CDRSchema>(
  bytes: CDRBuffer,
  schema: T,
  options: ParserOptions,
): MapSchema<T> {
  const payload = {} as MapSchema<CDRSchema>;
  const entries = Object.entries(schema);
  entries.sort((a, b) => a[1].index - b[1].index);

  for (const entry of entries) {
    const [fieldName, fieldType] = entry;
    const { value } = fieldType;
    switch (value.type) {
      case "int":
        payload[fieldName] = parseInt(bytes, value.len);
        break;
      case "uint":
        payload[fieldName] = parseUint(bytes, value.len);
        break;
      case "float":
        payload[fieldName] = parseFloat(bytes, value.len);
        // console.log(fieldName, payload[fieldName]);
        break;
      case "string":
        payload[fieldName] = parseString(bytes, options.maxStringSize);
        break;
      case "sequence":
        payload[fieldName] = parseSequence(bytes, value.itemSchema, options);
        break;
    }
  }
  return payload as MapSchema<T>;
}

export function parseCDR<T extends CDRSchema>(
  data: string,
  bodySchema: T,
  options: ParserOptions = { maxStringSize: 1024, maxSequenceSize: 1024 },
): {
  header: CDRHeader;
  payload: MapSchema<T>;
} {
  const bytes = arrayBufferFromBase64(data);
  const header = parseCDRHeader(bytes);
  const parsedPayload = parseSchema(bytes.restAsBuffer(), bodySchema, options);
  return { header, payload: parsedPayload };
}
