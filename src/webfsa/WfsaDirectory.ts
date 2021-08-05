import { AbstractDirectory } from "isomorphic-fs";
import { DIR_SEPARATOR, getName } from "isomorphic-fs/lib/util";
import { WfsaFileSystem } from "./WfsaFileSystem";

export class WfsaDirectory extends AbstractDirectory {
  constructor(
    private wfs: WfsaFileSystem,
    path: string,
    private parent: FileSystemDirectoryHandle,
    private directoryHandle: FileSystemDirectoryHandle
  ) {
    super(wfs, path);
  }

  public async _list(): Promise<string[]> {
    const paths: string[] = [];
    const entries = this.directoryHandle.entries();
    const result = await entries.next();
    while (!result.done) {
      const [, handle] = result.value;
      const parts = (await this.directoryHandle.resolve(handle)) as string[];
      const path = DIR_SEPARATOR + parts.join(DIR_SEPARATOR);
      paths.push(path);
    }
    return paths;
  }

  public async _mkcol(): Promise<void> {
    const name = getName(this.path);
    await this.parent.getDirectoryHandle(name, { create: true });
  }

  public async _rmdir(): Promise<void> {
    const name = getName(this.path);
    await this.parent.removeEntry(name);
  }

  public async _rmdirRecursively(): Promise<void> {
    const name = getName(this.path);
    await this.parent.removeEntry(name, { recursive: true });
  }
}
