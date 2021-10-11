import {
  AbstractFile,
  AbstractReadStream,
  AbstractWriteStream,
  OpenOptions,
  OpenWriteOptions,
} from "univ-fs";
import { WnfsFileSystem } from "./WnfsFileSystem";
import { WnfsReadStream } from "./WnfsReadStream";
import { WnfsWriteStream } from "./WnfsWriteStream";

export class WnfsFile extends AbstractFile {
  private writeStream?: WnfsWriteStream;

  constructor(public wfsaFS: WnfsFileSystem, path: string) {
    super(wfsaFS, path);
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
    _post: boolean,
    options: OpenWriteOptions
  ): Promise<AbstractWriteStream> {
    await this._closeWriteStream();
    this.writeStream = new WnfsWriteStream(this, options);
    return this.writeStream;
  }

  public async _rm(): Promise<void> {
    const { parent, name } = await this.wfsaFS._getParent(this.path);
    await parent.removeEntry(name);
  }
}
