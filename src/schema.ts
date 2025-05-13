export type CDRSchema = {
  [key: string]: CDRSchemaField;
};

export interface CDRSchemaField {
  index: number;
  value: CDRSchemaValue;
}

export type CDRSchemaValue =
  | CDRSchemaIntValue
  | CDRSchemaUintValue
  | CDRSchemaFloatValue
  | CDRSchemaStringValue
  | CDRSchemaSequenceValue;

export interface CDRSchemaIntValue {
  type: "int";
  len: number;
}

export interface CDRSchemaUintValue {
  type: "uint";
  len: number;
}

export interface CDRSchemaFloatValue {
  type: "float";
  len: number;
}

export interface CDRSchemaStringValue {
  type: "string";
}

export interface CDRSchemaSequenceValue {
  type: "sequence";
  itemSchema: CDRSchema;
}

type MapPrimitiveTypes = {
  int: number;
  uint: bigint;
  string: string;
  sequence: any[];
  float: number;
};

type FieldType<T extends CDRSchemaValue> = [T] extends [CDRSchemaSequenceValue]
  ? Array<MapSchema<T["itemSchema"]>>
  : MapPrimitiveTypes[T["type"]];

export type MapSchema<T extends CDRSchema> = {
  [P in keyof T]: FieldType<T[P]["value"]>;
};
