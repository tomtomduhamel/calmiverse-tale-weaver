
declare module '@google-cloud/storage' {
  interface Storage {
    bucket(name: string): Bucket;
  }

  interface Bucket {
    file(path: string): File;
    upload(path: string, options?: {}): Promise<[File]>;
  }

  interface File {
    createWriteStream(options?: {}): NodeJS.WritableStream;
    delete(): Promise<void>;
    download(options?: {}): Promise<[Buffer]>;
    exists(): Promise<[boolean]>;
    getSignedUrl(config: {
      action: string;
      expires: string | number | Date;
    }): Promise<[string]>;
  }

  export class Storage {
    constructor(options?: {
      projectId?: string;
      keyFilename?: string;
    });
    bucket(name: string): Bucket;
  }
}

// Ajout des déclarations pour les types problématiques
interface Int32Array extends TypedArray {
  readonly BYTES_PER_ELEMENT: number;
  readonly buffer: ArrayBuffer;
  readonly byteLength: number;
  readonly byteOffset: number;
  readonly length: number;
}

interface TypedArray {
  readonly BYTES_PER_ELEMENT: number;
  readonly buffer: ArrayBuffer;
  readonly byteLength: number;
  readonly byteOffset: number;
  readonly length: number;
  [n: number]: number;
}
