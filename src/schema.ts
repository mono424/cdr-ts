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

export interface CDRSchemaStringValue {
  type: "string";
}

export interface CDRSchemaSequenceValue {
  type: "sequence";
  itemSchema: CDRSchema;
}

type MapPrimitiveTypes = {
  int: bigint;
  uint: bigint;
  string: string;
  sequence: unknown[];
};

type FieldType<T extends CDRSchemaValue> = [T] extends [CDRSchemaSequenceValue]
  ? Array<MapSchema<T["itemSchema"]>>
  : MapPrimitiveTypes[T["type"]];

export type MapSchema<T extends CDRSchema> = {
  [P in keyof T]: FieldType<T[P]["value"]>;
};
