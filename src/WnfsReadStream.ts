import {
  AbstractReadStream,
  OpenReadOptions,
  Source,
  SourceType,
} from "univ-fs";
import { WnfsFile } from "./WnfsFile";

export class WnfsReadStream extends AbstractReadStream {
  private blob?: File;

  constructor(private wnfsFile: WnfsFile, options: OpenReadOptions) {
    super(wnfsFile, options);
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
    const wnfsFile = this.wnfsFile;
    const closed = await wnfsFile._closeWriteStream();
    if (this.blob && !closed) {
      return this.blob;
    }

    const { parent, name } = await wnfsFile.wfsaFS._getParent(wnfsFile.path);
    const fileHandle = await parent.getFileHandle(name);
    this.blob = await fileHandle.getFile();
    if (this.blob.size <= this.position) {
      this.position = this.blob.size;
    }
    return this.blob;
  }
}
