import {
  AbstractReadStream,
  OpenReadOptions,
  Source,
  SourceType,
} from "isomorphic-fs";
import { WfsaFile } from "./WfsaFile";

export class WfsaReadStream extends AbstractReadStream {
  private blob?: File;

  constructor(file: WfsaFile, options: OpenReadOptions) {
    super(file, options);
  }

  public async _close(): Promise<void> {}

  public async _read(size?: number): Promise<Source | null> {
    const blob = await this._getFile();
    if (blob.size <= this.position) {
      return null;
    }
    let end = this.position + (size == null ? this.bufferSize : size);
    if (blob.size < end) {
      end = blob.size;
    }
    return blob.slice(this.position, end);
  }

  protected async _seek(_start: number): Promise<void> {
    await this._getFile();
  }

  protected getDefaultSourceType(): SourceType {
    return "Blob";
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
