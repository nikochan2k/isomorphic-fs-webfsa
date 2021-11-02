import {
  AbstractDirectory,
  createError,
  joinPaths,
  NoModificationAllowedError,
} from "univ-fs";
import { WnfsFileSystem } from "./WnfsFileSystem";

export class WnfsDirectory extends AbstractDirectory {
  constructor(private wfs: WnfsFileSystem, path: string) {
    super(wfs, path);
  }

  public async _list(): Promise<string[]> {
    const directoryHandle = await this._getDirectoryHandle(false);
    const paths: string[] = [];
    const entries = directoryHandle.entries();
    let result = await entries.next();
    while (!result.done) {
      const [name] = result.value;
      paths.push(joinPaths(this.path, name));
      result = await entries.next();
    }
    return paths;
  }

  public async _mkcol(): Promise<void> {
    if (this.path === "/") {
      return;
    }
    await this._getDirectoryHandle(true);
  }

  public async _rmdir(): Promise<void> {
    if (this.path === "/") {
      throw createError({
        name: NoModificationAllowedError.name,
        repository: this.fs.repository,
        path: this.path,
        e: { message: "Cannot delete root directory" },
      });
    }
    const { parent, name } = await this.wfs._getParent(this.path);
    await parent.removeEntry(name);
  }

  private async _getDirectoryHandle(create: boolean) {
    if (this.path === "/") {
      return this.wfs._getRoot();
    }
    const { parent, name } = await this.wfs._getParent(this.path);
    return parent.getDirectoryHandle(name, { create });
  }
}
