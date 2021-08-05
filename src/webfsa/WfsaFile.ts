import {
  AbstractFile,
  AbstractReadStream,
  AbstractWriteStream,
  OpenOptions,
  OpenWriteOptions,
} from "isomorphic-fs";
import { getName } from "isomorphic-fs/lib/util";
import { WfsaFileSystem } from "./WfsaFileSystem";
import { WfsaReadStream } from "./WfsaReadStream";
import { WfsaWriteStream } from "./WfsaWriteStream";

export class WfsaFile extends AbstractFile {
  constructor(
    public wfs: WfsaFileSystem,
    path: string,
    private parent: FileSystemDirectoryHandle,
    private fileHandle: FileSystemFileHandle
  ) {
    super(wfs, path);
  }

  public async _createReadStream(
    options: OpenOptions
  ): Promise<AbstractReadStream> {
    const file = await this.fileHandle.getFile();
    return new WfsaReadStream(this, file, options);
  }

  public async _createWriteStream(
    options: OpenWriteOptions
  ): Promise<AbstractWriteStream> {
    const writable = await this.fileHandle.createWritable();
    return new WfsaWriteStream(this, writable, options);
  }

  public async _rm(): Promise<void> {
    const name = getName(this.path);
    await this.parent.removeEntry(name);
  }
}
