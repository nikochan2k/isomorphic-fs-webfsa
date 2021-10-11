import { isBlob, isStringSource } from "univ-conv";
import { AbstractWriteStream, OpenWriteOptions, Source } from "univ-fs";
import { WnfsFile } from "./WnfsFile";

export class WnfsWriteStream extends AbstractWriteStream {
  writable?: FileSystemWritableFileStream;

  constructor(private wnfsFile: WnfsFile, options: OpenWriteOptions) {
    super(wnfsFile, options);
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

  public async _write(src: Source): Promise<number> {
    const writable = await this._getWritable();
    if (isStringSource(src)) {
      src = await this.converter.toArrayBuffer(src);
    }
    await writable.write(src);
    return isBlob(src) ? src.size : src.byteLength;
  }

  protected async _seek(start: number): Promise<void> {
    const writable = await this._getWritable();
    await writable.seek(start);
  }

  private async _getWritable() {
    if (this.writable) {
      return this.writable;
    }
    const wnfsFile = this.wnfsFile;
    const { parent, name } = await wnfsFile.wfsaFS._getParent(wnfsFile.path);
    const fileHandle = await parent.getFileHandle(name, { create: true });
    this.writable = await fileHandle.createWritable({
      keepExistingData: true,
    });
    return this.writable;
  }
}
