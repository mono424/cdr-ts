# 🧬 CDR Parser TS 🧬

[![NPM Version](https://img.shields.io/npm/v/@mono424/cdr-ts?style=flat-square)](https://www.npmjs.com/package/@mono424/cdr-ts)
[![Build Status](https://img.shields.io/github/actions/workflow/status/mono424/cdr-ts/.github/workflows/publish-package.yml?branch=main&style=flat-square)](https://github.com/mono424/cdr-ts/actions/workflows/publish-package.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](https://opensource.org/licenses/MIT) [![TypeScript](https://img.shields.io/badge/TypeScript-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![pnpm](https://img.shields.io/badge/pnpm-F69220?style=flat-square&logo=pnpm)](https://pnpm.io/)
[![Jest](https://img.shields.io/badge/Jest-C21325?style=flat-square&logo=jest)](https://jestjs.io/)

A robust TypeScript library for parsing data encoded in Custom Data Representation (CDR) format. This parser is schema-driven, allowing for precise and type-safe decoding of binary data, typically received as a base64 encoded string.

## 🚀 Features

* **Schema-Driven Parsing:** Define your data structure with a clear schema and let the parser handle the rest.
* **Type Safety:** Leverages TypeScript to provide strong typing for your parsed data.
* **Comprehensive Type Support:**
    * Signed Integers (`int8`, `int16`, `int32`, `int64`)
    * Unsigned Integers (`uint8`, `uint16`, `uint32`, `uint64` as `bigint`)
    * Floating Point Numbers (`float32`, `float64`)
    * Strings (UTF-8, null-terminated)
    * Sequences (Arrays of schema-defined items)
* **CDR Header Parsing:** Automatically parses the standard CDR header.
* **Buffer Utilities:** Includes helper functions for managing and aligning byte buffers.
* **Base64 Input:** Directly consumes base64 encoded strings.
* **Configurable Limits:** Set maximum sizes for strings and sequences to prevent excessive memory usage.

## 🛠️ Installation

This project uses [pnpm](https://pnpm.io/) as its package manager but you can use whatever package manager you like.

```bash
pnpm install @mono424/cdr-ts # Replace with your actual package name on npm
```

```bash
npm install @mono424/cdr-ts # Replace with your actual package name on npm
```

```bash
yarn install @mono424/cdr-ts # Replace with your actual package name on npm
```

Or, if you're working with the source code:

```bash
git clone [https://github.com/mono424/cdr-ts.git](https://github.com/mono424/cdr-ts.git)
cd your-repo
pnpm install
```

## 📖 Usage

To parse CDR data, you first need to define a schema that describes the structure of your data. Then, you can use the `parseCDR` function.

### 1. Define Your Schema

The schema defines the fields, their order (via `index`), and their types.

```typescript
import { CDRSchema, MapSchema } from '@mono424/cdr-ts'; // or './src/schema' if local

// Define the schema for your data structure
const myDataSchema: CDRSchema = {
  id: { index: 0, value: { type: "uint", len: 32 } },
  name: { index: 1, value: { type: "string" } },
  temperature: { index: 2, value: { type: "float", len: 32 } },
  tags: {
    index: 3,
    value: {
      type: "sequence",
      itemSchema: {
        tagValue: { index: 0, value: { type: "string" } },
      },
    },
  },
};

// Infer the type of your parsed data
type MyDataType = MapSchema<typeof myDataSchema>;
```

### 2. Parse the CDR Data

Provide the base64 encoded CDR string and your schema to `parseCDR`.

```typescript
import { parseCDR, ParserOptions } from '@mono424/cdr-ts'; // or './src/parser' if local

const base64Data = "AAEAAAABAAAAAQAAAAZm9vYmFyAAAAAAAAAAAAPkAAABAAAAABAAAADHRlc3RfdGFnXzAxAAAA"; // Example base64 string

const options: ParserOptions = {
  maxStringSize: 1024,    // Default: 1024
  maxSequenceSize: 512,   // Default: 1024
};

try {
  const { header, payload } = parseCDR(base64Data, myDataSchema, options);

  console.log("CDR Header:", header);
  // Example: CDR Header: { representationIdentifier: 1n, representationOptions: 0n }

  const typedPayload: MyDataType = payload;
  console.log("Parsed Payload:", typedPayload);
  // Example: Parsed Payload: { id: 1, name: 'foobar', temperature: 0.5, tags: [ { tagValue: 'test_tag_01' } ] }

  console.log("Device ID:", typedPayload.id);
  console.log("Device Name:", typedPayload.name);
  typedPayload.tags.forEach(tag => console.log("Tag:", tag.tagValue));

} catch (error) {
  console.error("Failed to parse CDR data:", error);
}
```

## ⚙️ Core Components

### `CDRSchema` (`src/schema.ts`)
Defines the structure for creating schemas that guide the parsing process.
Key types:
* `CDRSchema`: The main schema object.
* `CDRSchemaField`: Describes a single field in the schema, including its `index` and `value` (type definition).
* `CDRSchemaValue`: Union of possible field types (`CDRSchemaIntValue`, `CDRSchemaUintValue`, `CDRSchemaFloatValue`, `CDRSchemaStringValue`, `CDRSchemaSequenceValue`).
* `MapSchema<T extends CDRSchema>`: A utility type that infers the JavaScript/TypeScript object type based on a given `CDRSchema`.

### `CDRBuffer` (`src/buffer.ts`)
Provides an abstraction for reading and managing byte arrays.
Key functions:
* `createArrayBuffer(bytes: Uint8Array): CDRBuffer`: Creates a buffer from a `Uint8Array`.
* `arrayBufferFromBase64(base64: string): CDRBuffer`: Creates a buffer from a base64 string.
* `shift(n: number)`: Reads and consumes `n` bytes.
* `align(n: number)`: Aligns the buffer to an `n`-byte boundary.
* `peek(n: number)`: Reads `n` bytes without consuming them.

### Parser Logic (`src/parser.ts`)
Contains the core parsing functions.
Key functions:
* `parseInt(bytes: CDRBuffer, intBitLen: number): number`
* `parseUint(bytes: CDRBuffer, uintBitLen: number): bigint`
* `parseFloat(bytes: CDRBuffer, floatBitLen: number): number`
* `parseString(bytes: CDRBuffer, maxStringSize: number): string`
* `parseSequence(bytes: CDRBuffer, itemSchema: CDRSchema, options: ParserOptions): MapSchema<CDRSchema>[]`
* `parseCDRHeader(bytes: CDRBuffer): CDRHeader`
* `parseSchema<T extends CDRSchema>(bytes: CDRBuffer, schema: T, options: ParserOptions): MapSchema<T>`
* `parseCDR<T extends CDRSchema>(data: string, bodySchema: T, options?: ParserOptions)`: The main entry point for parsing CDR data.

## 🧪 Testing

The project uses Jest for testing. Test files are located alongside the source files (e.g., `parser.test.ts`).

To run tests:

```bash
pnpm test
```

## 🏗️ Building

To build the project (compile TypeScript to JavaScript):

```bash
pnpm build
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit issues and pull requests.
For major changes, please open an issue first to discuss what you would like to change.

Make sure to update tests as appropriate.

## 📜 License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details (if you have one, otherwise state it here).

---

Happy Parsing! 🎉