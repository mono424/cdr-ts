export type CDRBuffer = {
  shift: (n: number) => Uint8Array;
  shiftAsArrayBuffer: (n: number) => ArrayBuffer;
  shiftAsDataView: (n: number) => DataView;
  align: (n: number) => void;
  peek: (n: number) => Uint8Array;
  getOffset: () => number;
  getLength: () => number;
  restAsBuffer: () => CDRBuffer;
};

export const createArrayBuffer = (bytes: Uint8Array): CDRBuffer => {
  let b = bytes;
  let offset = 0;

  const shift = (n: number): Uint8Array => {
    const res = b.subarray(0, n);
    offset += n;
    b = b.subarray(n);
    return res;
  };

  const shiftAsArrayBuffer = (n: number): ArrayBuffer => {
    const res = b.subarray(0, n);
    offset += n;
    b = b.subarray(n);
    return res.buffer.slice(res.byteOffset, res.byteOffset + res.byteLength);
  };

  const shiftAsDataView = (n: number): DataView => {
    const res = b.subarray(0, n);
    offset += n;
    b = b.subarray(n);
    return new DataView(res.buffer, res.byteOffset, res.byteLength);
  };

  const restAsBuffer = (): CDRBuffer => {
    return createArrayBuffer(b);
  };

  const align = (n: number): void => {
    const a = offset % n;
    if (a === 0) return;
    shift(n - a);
  };

  const peek = (n: number): Uint8Array => {
    return b.subarray(0, n);
  };

  const getOffset = (): number => {
    return offset;
  };

  const getLength = (): number => {
    return b.length + offset;
  };

  return {
    shift,
    shiftAsArrayBuffer,
    shiftAsDataView,
    align,
    peek,
    getOffset,
    getLength,
    restAsBuffer,
  };
};

export const arrayBufferFromBase64 = (base64: string): CDRBuffer => {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return createArrayBuffer(bytes);
};
