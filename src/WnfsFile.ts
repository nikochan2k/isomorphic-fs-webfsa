import {
  AbstractFile,
  AbstractReadStream,
  AbstractWriteStream,
  OpenOptions,
  OpenWriteOptions,
  SeekOrigin,
} from "univ-fs";
import { WnfsFileSystem } from "./WnfsFileSystem";
import { WnfsReadStream } from "./WnfsReadStream";
import { WnfsWriteStream } from "./WnfsWriteStream";

export class WnfsFile extends AbstractFile {
  private writeStream?: WnfsWriteStream;

  constructor(public wnfsFS: WnfsFileSystem, path: string) {
    super(wnfsFS, path);
  }

  public async _closeWriteStream() {
    if (!this.writeStream) {
      return false;
    }
    await this.writeStream.close();
    return true;
  }

  public async _createReadStream(
    options: OpenOptions
  ): Promise<AbstractReadStream> {
    return new WnfsReadStream(this, options);
  }

  public async _createWriteStream(
    options: OpenWriteOptions
  ): Promise<AbstractWriteStream> {
    await this._closeWriteStream();
    this.writeStream = new WnfsWriteStream(this, options);
    await this.writeStream._getWritable(options.append);
    if (!options.create && options.append) {
      await this.writeStream.seek(0, SeekOrigin.End);
    }
    return this.writeStream;
  }

  public async _rm(): Promise<void> {
    const { parent, name } = await this.wnfsFS._getParent(this.path);
    await parent.removeEntry(name);
  }
}
