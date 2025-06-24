export type CDRSchema = CDRType;

export type CDRPrimitiveTypes =
  | CDRSchemaIntValue
  | CDRSchemaUintValue
  | CDRSchemaFloatValue
  | CDRSchemaStringValue
  | CDRSchemaStringBytesValue;

export type CDRType =
  | CDRPrimitiveTypes
  | CDRSchemaSequenceValue<CDRType>
  | CDRSchemaDictionaryValue<CDRSchemaDictionaryItems>;

export type CDRLength = 8 | 16 | 32 | 64;

export interface CDRSchemaIntValue {
  type: "int";
  len: CDRLength;
}

export interface CDRSchemaUintValue {
  type: "uint";
  len: CDRLength;
  format: "bigint" | "number";
}

export interface CDRSchemaFloatValue {
  type: "float";
  len: CDRLength;
}

export interface CDRSchemaStringValue {
  type: "string";
}

export interface CDRSchemaStringBytesValue {
  type: "string_bytes";
}

export interface CDRSchemaSequenceValue<K extends CDRType> {
  type: "sequence";
  itemSchema: K;
  size?: number;
}

export interface CDRSchemaDictionaryField<T extends CDRType> {
  index: number;
  value: T;
}

export type CDRSchemaDictionaryItems = {
  [key: string]: CDRSchemaDictionaryField<CDRType>;
};

export interface CDRSchemaDictionaryValue<K extends CDRSchemaDictionaryItems> {
  type: "dictionary";
  items: K;
}

type MapPrimitiveTypes = {
  int: number;
  uint: bigint;
  string: string;
  float: number;
  string_bytes: Uint8Array;
};

type MapSequence<T extends CDRSchemaSequenceValue<CDRType>> = Array<
  MapSchema<T["itemSchema"]>
>;
type MapDictionary<
  T extends CDRSchemaDictionaryValue<CDRSchemaDictionaryItems>,
> = {
  [P in keyof T["items"]]: MapFieldType<T["items"][P]["value"]>;
};

export type MapFieldType<T extends CDRType> = [T] extends [
  CDRSchemaDictionaryValue<CDRSchemaDictionaryItems>,
]
  ? MapDictionary<T>
  : [T] extends [CDRSchemaSequenceValue<CDRType>]
    ? MapSequence<T>
    : [T] extends [CDRPrimitiveTypes]
      ? MapPrimitiveTypes[T["type"]]
      : never;

export type MapSchema<T extends CDRSchema> = MapFieldType<T>;
