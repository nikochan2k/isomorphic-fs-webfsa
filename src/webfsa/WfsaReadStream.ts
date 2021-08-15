import { AbstractReadStream, OpenOptions } from "isomorphic-fs";
import { WfsaFile } from "./WfsaFile";

export class WfsaReadStream extends AbstractReadStream {
  private blob?: File;

  constructor(file: WfsaFile, options: OpenOptions) {
    super(file, options);
  }

  public async _close(): Promise<void> {}

  public async _read(size?: number): Promise<Uint8Array | null> {
    const file = await this._getFile();
    if (file.size <= this.position) {
      return null;
    }
    let end = this.position + (size == null ? this.bufferSize : size);
    if (file.size < end) {
      end = file.size;
    }
    const blob = file.slice(this.position, end);
    return this.converter.toUint8Array(blob);
  }

  protected async _seek(_start: number): Promise<void> {
    await this._getFile();
  }

  private async _getFile() {
    const wf = this.file as WfsaFile;
    const closed = await wf._closeWriteStream();
    if (this.blob && !closed) {
      return this.blob;
    }

    const { parent, name } = await wf.wfs._getParent(wf.path);
    const fileHandle = await parent.getFileHandle(name);
    this.blob = await fileHandle.getFile();
    if (this.blob.size <= this.position) {
      this.position = this.blob.size;
    }
    return this.blob;
  }
}
