import {
  AbstractFile,
  AbstractReadStream,
  AbstractWriteStream,
  OpenOptions,
  OpenWriteOptions,
} from "isomorphic-fs";
import { WfsaFileSystem } from "./WfsaFileSystem";
import { WfsaReadStream } from "./WfsaReadStream";
import { WfsaWriteStream } from "./WfsaWriteStream";

export class WfsaFile extends AbstractFile {
  private writeStream?: WfsaWriteStream;

  constructor(public wfs: WfsaFileSystem, path: string) {
    super(wfs, path);
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
    return new WfsaReadStream(this, options);
  }

  public async _createWriteStream(
    options: OpenWriteOptions
  ): Promise<AbstractWriteStream> {
    await this._closeWriteStream();
    this.writeStream = new WfsaWriteStream(this, options);
    return this.writeStream;
  }

  public async _rm(): Promise<void> {
    const { parent, name } = await this.wfs._getParent(this.path);
    await parent.removeEntry(name);
  }
}
