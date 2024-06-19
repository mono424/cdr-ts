# CDR-TS

CDR-TS is a library to parse Common Data Representation (CDR) data in TypeScript objects. Compared to other libraries, CDR-TS uses schema-Definitions to define the structure of the data. This allows for a more type-safe and structured way to work with CDR data.

## Install

```bash
npm install mono424@cdr-ts
```

```bash
yarn install mono424@cdr-ts
```

```bash
pnpm install mono424@cdr-ts
```

## Usage

### 1. Define Schema

```typescript
import {
  CDRSchemaField,
  CDRSchemaIntValue,
  CDRSchemaSequenceValue,
  CDRSchemaStringValue,
  CDRSchemaUintValue,
} from "cdr-ts";

type TestMessageSchema = {
  send_at: CDRSchemaField & { value: CDRSchemaIntValue };
  barbershop_name: CDRSchemaField & { value: CDRSchemaStringValue };
  customers_count: CDRSchemaField & { value: CDRSchemaUintValue };
  customers: CDRSchemaField & {
    value: CDRSchemaSequenceValue & {
      itemSchema: {
        customer_name: CDRSchemaField & { value: CDRSchemaStringValue };
        customer_id: CDRSchemaField & { value: CDRSchemaStringValue };
      };
    };
  };
};

const testMessageSchema: TestMessageSchema = {
  send_at: { index: 0, value: { type: "int", len: 32 } },
  barbershop_name: { index: 1, value: { type: "uint", len: 32 } },
  customers_count: { index: 2, value: { type: "uint", len: 32 } },
  customers: {
    index: 3,
    value: {
      type: "sequence",
      itemSchema: {
        customer_name: { index: 0, value: { type: "string" } },
        customer_id: { index: 1, value: { type: "string" } },
      }
    },
  },
};
```

### 2. Decode Binary Data

```typescript
import {
  decodeCDR
} from "cdr-ts";

const testPayload = "<base64-data>";

const { header, payload } = decodeCDR(testPayload, testMessageSchema);
console.log(payload);
```
