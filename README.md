# 🧬 CDR Parser TS 🧬

[![NPM Version](https://img.shields.io/npm/v/@mono424/cdr-ts?style=flat-square)](https://www.npmjs.com/package/@mono424/cdr-ts)
[![Build Status](https://img.shields.io/github/actions/workflow/status/mono424/cdr-ts/.github/workflows/publish-package.yml?branch=main&style=flat-square)](https://github.com/mono424/cdr-ts/actions/workflows/publish-package.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](https://opensource.org/licenses/MIT) [![TypeScript](https://img.shields.io/badge/TypeScript-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![pnpm](https://img.shields.io/badge/pnpm-F69220?style=flat-square&logo=pnpm)](https://pnpm.io/)
[![Jest](https://img.shields.io/badge/Jest-C21325?style=flat-square&logo=jest)](https://jestjs.io/)

A robust TypeScript library for parsing data encoded in Custom Data Representation (CDR) format. This parser is schema-driven, allowing for precise and type-safe decoding of binary data, typically received as a base64 encoded string.

## 🚀 Features

* Parses CDR (Common Data Representation) data streams.
* Supports a variety of primitive types:
    * Integers: `int8`, `int16`, `int32`, `int64` (parsed as `number`)
    * Unsigned Integers: `uint8`, `uint16`, `uint32` (parsed as `number`), `uint64` (parsed as `number` or `bigint`)
    * Floating-point numbers: `float32`, `float64` (currently `float32` is fully implemented and tested for parsing)
    * `string` (UTF-8, null-terminated)
    * `string_bytes` (sequence of bytes, null-terminated, parsed as `Uint8Array`)
* Supports composite types:
    * `sequence`: Ordered list of elements of the same type (parsed as an `Array`).
    * `dictionary`: A collection of key-value pairs, where keys are strings and values can be any CDR type (parsed as an `object`). Fields are parsed in the order of their `index` property.
* Type-safe parsing: The structure and types of the parsed payload are determined by the provided schema, leveraging TypeScript's type system (`MapSchema` utility type).
* Handles byte alignment as per CDR specification.
* Parses the standard CDR header (representation identifier and options).
* Configurable maximum sizes for sequences and strings to prevent excessive memory allocation.
* Accepts base64 encoded strings as input for CDR data.
* Includes utility for creating and managing byte buffers.

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
import { CDRSchema, MapSchema } from '@mono424/cdr-ts';

type MyDataType = CDRSchemaDictionaryValue<{
  stamp_s: CDRSchemaDictionaryField<CDRSchemaIntValue>,
  stamp_ns: CDRSchemaDictionaryField<CDRSchemaUintValue>,
  frame_id: CDRSchemaDictionaryField<CDRSchemaStringValue>,
  data: CDRSchemaDictionaryField<CDRSchemaSequenceValue<CDRSchemaUintValue>>,
}>

// Define the schema for your data structure
const myDataSchema: MyDataType = {
  type: "dictionary",
  items: {
    stamp_s: { index: 0, value: { type: "int", len: 32 } },
    stamp_ns: { index: 1, value: { type: "uint", len: 32, format: "number" } },
    frame_id: { index: 2, value: { type: "string" } },
    data: { index: 3, value: { type: "sequence", itemSchema: { type: "uint", len: 8, format: "number" } } },
  }
};
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
  const { header, payload } = parseCDR(base64Data, cameraPacketSchema, options);

  console.log("Parsed CDR Header:", header);
  console.log("Parsed Payload:", payload);

  // Accessing fields (types are inferred from the schema)
  console.log("Timestamp (seconds):", payload.stamp_s);        // number
  console.log("Timestamp (nanoseconds):", payload.stamp_ns);  // number
  console.log("Frame ID:", payload.frame_id);                  // string
  console.log("Data Length:", payload.data.length);            // number (length of Uint8Array sequence)
  // payload.data is Array<number>

  // Example specific assertions from tests:
  // expect(parsed.payload.stamp_s).toBe(1747238941)
  // expect(parsed.payload.stamp_ns).toBe(291125000)
  // expect(parsed.payload.frame_id).toBe("62")
  // expect(parsed.payload.data).toHaveLength(5456)

} catch (error) {
  console.error("Error parsing CDR data:", error);
}
```

Okay, here's the "Schema Definition" part, jazzed up with some emojis and a friendly vibe\! 🎉

## 📜✨ Schema Definition

Think of a schema as the magical map 🗺️ that tells our parser how to read your CDR data. It's like giving instructions to a super-smart robot 🤖: "This part is a number, that part is some text, and over here is a list of things\!"

By defining a schema, you make sure the parser understands your data perfectly and gives you back everything in a neat, typed, and predictable way. Let's dive into how you can create these blueprints\!

### 🧩 The Building Blocks

First, a few key terms you'll see:

  * `CDRSchema`: This is the big umbrella ☂️ for any type of CDR data structure you can define.
  * `CDRType`: Represents any specific CDR type – whether it's a simple number or a complex structure.
  * `CDRPrimitiveTypes`: These are your basic data types, like numbers 🔢 and text 文字列.
  * `CDRLength`: For our number-loving types, this specifies how big they are in bits (like `8`, `16`, `32`, or `64` bit).

### Primitive Types: The Simple Stuff 🍬

These are the fundamental data types:

  * **Integer (`CDRSchemaIntValue`)**: For whole numbers\! ℤ

      * `type: "int"`
      * `len: CDRLength` (e.g., 8, 16, 32, 64)
      * Example: `{ type: "int", len: 32 }` (a standard 32-bit integer)

  * **Unsigned Integer (`CDRSchemaUintValue`)**: For whole numbers that are always positive\! ➕

      * `type: "uint"`
      * `len: CDRLength`
      * `format: "bigint" | "number"` (Use `"bigint"` for those really huge `uint64` numbers that need extra space\!)
      * Example (regular number): `{ type: "uint", len: 32, format: "number" }`
      * Example (big boi number): `{ type: "uint", len: 64, format: "bigint" }`

  * **Float (`CDRSchemaFloatValue`)**: For numbers with decimal points.

      * `type: "float"`
      * `len: CDRLength` (Usually `32` for single-precision or `64` for double-precision. Our parser is currently best friends with `len: 32` for Float32\!)
      * Example: `{ type: "float", len: 32 }`

  * **String (`CDRSchemaStringValue`)**: For good old text\! 📝

      * `type: "string"` (Reads UTF-8 text that ends with a special 'null' character)
      * Example: `{ type: "string" }`

  * **String Bytes (`CDRSchemaStringBytesValue`)**: For when your "string" is more like a sequence of raw bytes.

      * `type: "string_bytes"` (Also ends with a 'null' character, gives you a `Uint8Array`)
      * Example: `{ type: "string_bytes" }`

### Composite Types: Building Cool Structures 🏗️

These types let you group primitive types (or even other composite types\!) together:

  * **Sequence (`CDRSchemaSequenceValue<K extends CDRType>`)**: An ordered list of items, all of the same type\! Think of it as an array. ➡️[📦, 📦, 📦]

      * `type: "sequence"`
      * `itemSchema: K` (This is where you define the schema for each item in the list)
      * Example (a list of tiny unsigned numbers):
        `{ type: "sequence", itemSchema: { type: "uint", len: 8, format: "number" } }`

  * **Dictionary (`CDRSchemaDictionaryValue<K extends CDRSchemaDictionaryItems>`)**: A collection of named fields, like a JavaScript object or a real dictionary\! 📖 {🔑:💎}

      * `type: "dictionary"`
      * `items: K` (An object where each key is a field name, and its value describes that field)
      * Inside `items`, each field is a `CDRSchemaDictionaryField`:
          * `index: number` (Super important\! Tells the parser the order to read fields, starting from 0 🥇🥈🥉)
          * `value: T` (The schema for this specific field's value)
      * Example (a little dictionary with an ID and a name):
        ```typescript
        {
          type: "dictionary",
          items: {
            id: { index: 0, value: { type: "int", len: 32 } }, // First field!
            name: { index: 1, value: { type: "string" } }      // Second field!
          }
        }
        ```

### ✨ Magical Type Inference with `MapSchema` ✨

Here's a really cool part\! When you give `parseCDR` your carefully crafted schema, it doesn't just parse the data; it also knows the *exact TypeScript type* of the payload you'll get back\! 🧙‍♂️

This is thanks to a helper type called `MapSchema<T extends CDRSchema>`.

For instance:

  * If your schema says `{ type: "int", len: 32 }`, `MapSchema` knows the output is a `number`.
  * If it's `{ type: "string" }`, you'll get a `string`.
  * A `{ type: "sequence", itemSchema: { type: "int", len: 16 } }` will give you a `number[]` (an array of numbers).
  * And a dictionary schema? You guessed it\! An object with perfectly typed properties.

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