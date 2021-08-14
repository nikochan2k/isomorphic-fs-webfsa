import { AbstractReadStream, OpenOptions, binary } from "isomorphic-fs";
import { WfsaFile } from "./WfsaFile";

const { toArrayBuffer } = binary;

export class WfsaReadStream extends AbstractReadStream {
  private file?: File;

  constructor(private wf: WfsaFile, options: OpenOptions) {
    super(wf, options);
  }

  public async _close(): Promise<void> {}

  public async _read(size?: number): Promise<ArrayBuffer | null> {
    const file = await this._getFile();
    if (file.size <= this.position) {
      return null;
    }
    let end = this.position + (size == null ? this.bufferSize : size);
    if (file.size < end) {
      end = file.size;
    }
    const blob = file.slice(this.position, end);
    return toArrayBuffer(blob);
  }

  protected async _seek(_start: number): Promise<void> {
    await this._getFile();
  }

  private async _getFile() {
    const closed = await this.wf._closeWriteStream();
    if (this.file && !closed) {
      return this.file;
    }

    const wf = this.wf;
    const { parent, name } = await wf.wfs._getParent(wf.path);
    const fileHandle = await parent.getFileHandle(name);
    this.file = await fileHandle.getFile();
    if (this.file.size <= this.position) {
      this.position = this.file.size;
    }
    return this.file;
  }
}
