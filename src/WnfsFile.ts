import { ConvertOptions, Data } from "univ-conv";
import { AbstractFile, ReadOptions, Stats, WriteOptions } from "univ-fs";
import { WnfsFileSystem } from "./WnfsFileSystem";

export class WnfsFile extends AbstractFile {
  constructor(public wfs: WnfsFileSystem, path: string) {
    super(wfs, path);
  }

  public async _rm(): Promise<void> {
    const { parent, name } = await this.wfs._getParent(this.path);
    await parent.removeEntry(name);
  }

  public supportAppend(): boolean {
    return true;
  }

  public supportRangeRead(): boolean {
    return false;
  }

  public supportRangeWrite(): boolean {
    return true;
  }

  // eslint-disable-next-line
  protected async _load(_stats: Stats, _options: ReadOptions): Promise<Data> {
    const { parent, name } = await this.wfs._getParent(this.path);
    const fileHandle = await parent.getFileHandle(name);
    return fileHandle.getFile();
  }

  protected async _save(
    data: Data,
    _stats: Stats, // eslint-disable-line
    options: WriteOptions
  ): Promise<void> {
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

    const converter = this._getConverter();
    const co: Partial<ConvertOptions> = { ...options };
    delete co.start;
    const readable = await converter.toReadableStream(data, co);
    await converter.pipe(readable, writable);
  }
}
