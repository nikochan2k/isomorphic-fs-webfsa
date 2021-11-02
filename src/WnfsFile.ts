import { Data } from "univ-conv";
import { AbstractFile, OpenOptions, WriteOptions } from "univ-fs";
import { WnfsFileSystem } from "./WnfsFileSystem";

export class WnfsFile extends AbstractFile {
  constructor(public wfs: WnfsFileSystem, path: string) {
    super(wfs, path);
  }

  public async _rm(): Promise<void> {
    const { parent, name } = await this.wfs._getParent(this.path);
    await parent.removeEntry(name);
  }

  protected async _load(
    _options: OpenOptions // eslint-disable-line
  ): Promise<Data> {
    const { parent, name } = await this.wfs._getParent(this.path);
    const fileHandle = await parent.getFileHandle(name);
    return fileHandle.getFile();
  }

  protected async _save(data: Data, options: WriteOptions): Promise<void> {
    const { parent, name } = await this.wfs._getParent(this.path);
    const fileHandle = await parent.getFileHandle(name, {
      create: options.create,
    });
    const writable = await fileHandle.createWritable({
      keepExistingData: options.append,
    });
    if (options.append) {
      const stats = await this.head(options);
      await writable.seek(stats.size as number);
    }

    const converter = this._getConverter(options.bufferSize);
    const readable = await converter.toReadableStream(data);
    await converter.pipe(readable, writable);
  }
}
