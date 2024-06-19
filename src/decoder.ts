import { CDRBuffer, arrayBufferFromBase64 } from "./buffer";
import { CDRSchema, MapSchema } from "./schema";

export interface CDRHeader {
  representationIdentifier: bigint;
  representationOptions: bigint;
}

export interface DecoderOptions {
  maxSequenceSize: number;
  maxStringSize: number;
}

export const decodeInt = (bytes: CDRBuffer, intBitLen: number): bigint => {
  const byteLen = Math.floor(intBitLen / 8);
  bytes.align(byteLen);

  let value = BigInt(0);
  for (let i = 0; i < byteLen; i++) {
    const [byte] = bytes.shift(1);
    value = value | (BigInt(byte) << BigInt(i * 8));
  }

  return value;
};

export const decodeUint = (bytes: CDRBuffer, uintBitLen: number): bigint => {
  const byteLen = Math.floor(uintBitLen / 8);
  bytes.align(byteLen);

  let value = BigInt(0);
  for (let i = 0; i < byteLen; i++) {
    const [byte] = bytes.shift(1);
    value = value | (BigInt(byte) << BigInt(i * 8));
  }

  return value;
};

export const decodeString = (
  bytes: CDRBuffer,
  maxStringSize: number,
): string => {
  const stringLen = decodeUint(bytes, 32);

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

export const decodeCDRHeader = (bytes: CDRBuffer): CDRHeader => {
  const representationIdentifier = decodeUint(bytes, 16);
  const representationOptions = decodeUint(bytes, 16);

  return {
    representationIdentifier,
    representationOptions,
  };
};

const decodeSequence = (
  bytes: CDRBuffer,
  itemSchema: CDRSchema,
  options: DecoderOptions,
): MapSchema<CDRSchema>[] => {
  const seqLen = decodeUint(bytes, 32);

  if (seqLen > BigInt(options.maxSequenceSize)) {
    throw new Error(
      `Sequence length ${seqLen} exceeds maxSequenceSize ${options.maxSequenceSize}`,
    );
  }
  const value: MapSchema<CDRSchema>[] = [];
  for (let i = BigInt(0); i < seqLen; i++) {
    const item = decodeSchema(bytes, itemSchema, options);
    value.push(item);
  }

  return value;
};

export function decodeSchema<T extends CDRSchema>(
  bytes: CDRBuffer,
  schema: T,
  options: DecoderOptions,
): MapSchema<T> {
  const payload = {} as MapSchema<CDRSchema>;
  const entries = Object.entries(schema);
  entries.sort((a, b) => a[1].index - b[1].index);

  for (const entry of entries) {
    const [fieldName, fieldType] = entry;
    const { value } = fieldType;
    switch (value.type) {
      case "int":
        payload[fieldName] = decodeInt(bytes, value.len);
        break;
      case "uint":
        payload[fieldName] = decodeUint(bytes, value.len);
        break;
      case "string":
        payload[fieldName] = decodeString(bytes, options.maxStringSize);
        break;
      case "sequence":
        payload[fieldName] = decodeSequence(bytes, value.itemSchema, options);
        break;
    }
  }
  return payload as MapSchema<T>;
}

export function decodeCDR<T extends CDRSchema>(
  data: string,
  bodySchema: T,
  options: DecoderOptions = { maxStringSize: 1024, maxSequenceSize: 1024 },
): {
  header: CDRHeader;
  payload: MapSchema<T>;
} {
  const bytes = arrayBufferFromBase64(data);
  const header = decodeCDRHeader(bytes);
  const decodedPayload = decodeSchema(
    bytes.restAsBuffer(),
    bodySchema,
    options,
  );
  return { header, payload: decodedPayload };
}
