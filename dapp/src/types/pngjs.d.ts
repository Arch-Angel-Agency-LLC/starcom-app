declare module 'pngjs' {
  export interface PNGOptions {
    width?: number;
    height?: number;
    checkCRC?: boolean;
    deflateChunkSize?: number;
    deflateLevel?: number;
    deflateStrategy?: number;
    filterType?: number;
  }

  export class PNG {
    constructor(options?: PNGOptions);
    width: number;
    height: number;
    data: Buffer;
    static sync: {
      read: (buffer: Buffer) => PNG;
      write: (png: PNG) => Buffer;
    };
    pack(): NodeJS.ReadableStream;
    parse(data: Buffer, callback?: (error: Error | null, png: PNG) => void): PNG;
  }
}
