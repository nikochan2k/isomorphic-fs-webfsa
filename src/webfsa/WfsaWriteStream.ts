import { AbstractWriteStream, OpenWriteOptions } from "isomorphic-fs";
import { WfsaFile } from "./WfsaFile";

export class WfsaWriteStream extends AbstractWriteStream {
  constructor(
    wf: WfsaFile,
    private writable: FileSystemWritableFileStream,
    options: OpenWriteOptions
  ) {
    super(wf, options);
  }

  public async _close(): Promise<void> {
    await this.writable.close();
  }

  public async _truncate(size: number): Promise<void> {
    await this.writable.truncate(size);
  }

  public async _write(buffer: ArrayBuffer | Uint8Array): Promise<void> {
    await this.writable.write(buffer);
  }

  protected async _seek(start: number): Promise<void> {
    await this.writable.seek(start);
  }
}
