import { CDRBuffer, arrayBufferFromBase64, createArrayBuffer } from "./buffer";
import { CDRSchema, CDRSchemaDictionaryItems, CDRSchemaDictionaryValue, CDRSchemaSequenceValue, CDRType, MapFieldType, MapSchema } from "./schema";

export interface CDRHeader {
  representationIdentifier: number;
  representationOptions: number;
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

export const parseUint = (bytes: CDRBuffer, uintBitLen: number): number => {
  const byteLen = Math.floor(uintBitLen / 8);
  bytes.align(byteLen);

  let value = 0;
  for (let i = 0; i < byteLen; i++) {
    const [byte] = bytes.shift(1);
    value = value | (byte << (i * 8));
  }

  return value;
};

export const parseUintToBigInt = (bytes: CDRBuffer, uintBitLen: number): bigint => {
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
  const stringLen = parseUintToBigInt(bytes, 32);

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

export const parseStringBytes = (
  bytes: CDRBuffer,
  maxStringSize: number,
): Uint8Array<ArrayBuffer> => {
  const stringLen = parseUint(bytes, 32);

  if (stringLen > BigInt(maxStringSize)) {
    throw new Error(
      `String length ${stringLen} exceeds maxStringSize ${maxStringSize}`,
    );
  }

  let value = bytes.shift(Number(stringLen) - 1);
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

const parseSequence = <K extends CDRType, T extends CDRSchemaSequenceValue<K>>(
  bytes: CDRBuffer,
  schema: T,
  options: ParserOptions,
): MapFieldType<K>[] => {
  const seqLen = parseUint(bytes, 32);

  if (seqLen > BigInt(options.maxSequenceSize)) {
    throw new Error(
      `Sequence length ${seqLen} exceeds maxSequenceSize ${options.maxSequenceSize}`,
    );
  }
  const value: MapFieldType<K>[] = [];
  for (let i = BigInt(0); i < seqLen; i++) {
    const item = parseField<K>(bytes, schema.itemSchema, options);
    value.push(item);
  }

  return value;
};

export const parseDictionary = <K extends CDRSchemaDictionaryItems, T extends CDRSchemaDictionaryValue<K>>(
  bytes: CDRBuffer,
  schema: T,
  options: ParserOptions,
): MapSchema<T> => {
  const payload = {} as MapFieldType<T>;
  const entries = Object.entries(schema.items);
  entries.sort((a, b) => a[1].index - b[1].index);

  for (const entry of entries) {
    const [fieldName, fieldType] = entry;
    const { value } = fieldType;
    payload[fieldName] = parseField(bytes, value, options);
  }

  return payload
}

export function parseField<T extends CDRType>(
  bytes: CDRBuffer,
  fieldType: T,
  options: ParserOptions,
): MapFieldType<T> {
  switch (fieldType.type) {
    case "int":
      return parseInt(bytes, fieldType.len) as MapFieldType<T>;

    case "uint":
      if (fieldType.format === "bigint") {
        return parseUintToBigInt(bytes, fieldType.len) as MapFieldType<T>;
      }
      return parseUint(bytes, fieldType.len) as MapFieldType<T>;

    case "float":
      return parseFloat(bytes, fieldType.len) as MapFieldType<T>;

    case "string":
      return parseString(bytes, options.maxStringSize) as MapFieldType<T>;

    case "string_bytes":
      return parseStringBytes(bytes, options.maxStringSize) as MapFieldType<T>;

    case "sequence":
      return parseSequence(bytes, fieldType, options) as MapFieldType<T>;

    case "dictionary":
      return parseDictionary(bytes, fieldType, options) as MapFieldType<T>;
  }
}

const defaultOptions: ParserOptions = { maxStringSize: 1024, maxSequenceSize: 1024 };

export function parseCDR<T extends CDRSchema>(
  data: string,
  bodySchema: T,
  options: Partial<ParserOptions> = {},
): {
  header: CDRHeader;
  payload: MapSchema<T>;
} {
  const bytes = arrayBufferFromBase64(data);
  const header = parseCDRHeader(bytes);
  const parsedPayload = parseField(bytes.restAsBuffer(), bodySchema, { ...defaultOptions, ...options });
  return { header, payload: parsedPayload };
}
