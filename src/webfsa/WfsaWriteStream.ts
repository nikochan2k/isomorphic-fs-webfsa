import { AbstractWriteStream, OpenWriteOptions } from "isomorphic-fs";
import { WfsaFile } from "./WfsaFile";

export class WfsaWriteStream extends AbstractWriteStream {
  writable?: FileSystemWritableFileStream;

  constructor(private wf: WfsaFile, options: OpenWriteOptions) {
    super(wf, options);
  }

  public async _close(): Promise<void> {
    if (!this.writable) {
      return;
    }
    await this.writable.close();
    delete this.writable;
  }

  public async _truncate(size: number): Promise<void> {
    const writable = await this._getWritable();
    await writable.truncate(size);
  }

  public async _write(buffer: ArrayBuffer | Uint8Array): Promise<void> {
    const writable = await this._getWritable();
    await writable.write(buffer);
  }

  protected async _seek(start: number): Promise<void> {
    const writable = await this._getWritable();
    await writable.seek(start);
  }

  private async _getWritable() {
    if (this.writable) {
      return this.writable;
    }
    const wf = this.wf;
    const { parent, name } = await wf.wfs._getParent(wf.path);
    const fileHandle = await parent.getFileHandle(name, { create: true });
    this.writable = await fileHandle.createWritable({
      keepExistingData: true,
    });
    return this.writable;
  }
}
