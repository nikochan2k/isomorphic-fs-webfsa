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
  constructor(public wfs: WfsaFileSystem, path: string) {
    super(wfs, path);
  }

  public async _createReadStream(
    options: OpenOptions
  ): Promise<AbstractReadStream> {
    const { parent, name } = await this.wfs._getParent(this.path);
    const fileHandle = await parent.getFileHandle(name);
    const file = await fileHandle.getFile();
    return new WfsaReadStream(this, file, options);
  }

  public async _createWriteStream(
    options: OpenWriteOptions
  ): Promise<AbstractWriteStream> {
    const { parent, name } = await this.wfs._getParent(this.path);
    const fileHandle = await parent.getFileHandle(name, { create: true });
    const writable = await fileHandle.createWritable();
    return new WfsaWriteStream(this, writable, options);
  }

  public async _rm(): Promise<void> {
    const { parent, name } = await this.wfs._getParent(this.path);
    await parent.removeEntry(name);
  }
}
