export type Enumerator = {
  [key: string]: string | number;
  [key: number]: string;
};

export type CDRSchema = CDRType;

export type CDRPrimitiveTypes =
  | CDRSchemaIntValue
  | CDRSchemaUintValue
  | CDRSchemaFloatValue
  | CDRSchemaStringValue
  | CDRSchemaStringBytesValue
  | CDRSchemaBooleanValue;

export type CDRType =
  | CDRPrimitiveTypes
  | CDRSchemaEnumValue<Enumerator>
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

export interface CDRSchemaBooleanValue {
  type: "boolean";
}

export interface CDRSchemaEnumValue<K extends Enumerator> {
  type: "enum";
  enum: K;
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
  boolean: boolean;
};

type MapEnum<T extends CDRSchemaEnumValue<Enumerator>> = T["enum"];
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
  : [T] extends [CDRSchemaEnumValue<Enumerator>]
    ? MapEnum<T>
    : [T] extends [CDRSchemaSequenceValue<CDRType>]
      ? MapSequence<T>
      : [T] extends [CDRPrimitiveTypes]
        ? MapPrimitiveTypes[T["type"]]
        : never;

export type MapSchema<T extends CDRSchema> = MapFieldType<T>;
