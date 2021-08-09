import {
  AbstractDirectory,
  createError,
  NoModificationAllowedError,
} from "isomorphic-fs";
import { DIR_SEPARATOR, joinPaths } from "isomorphic-fs/lib/util";
import { WfsaFileSystem } from "./WfsaFileSystem";

export class WfsaDirectory extends AbstractDirectory {
  constructor(private wfs: WfsaFileSystem, path: string) {
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
    if (this.path === DIR_SEPARATOR) {
      return;
    }
    await this._getDirectoryHandle(true);
  }

  public async _rmdir(): Promise<void> {
    if (this.path === DIR_SEPARATOR) {
      throw createError({
        name: NoModificationAllowedError.name,
        repository: this.fs.repository,
        path: this.path,
        e: "Cannot delete root directory",
      });
    }
    const { parent, name } = await this.wfs._getParent(this.path);
    await parent.removeEntry(name);
  }

  public async _rmdirRecursively(): Promise<void> {
    if (this.path === DIR_SEPARATOR) {
      throw createError({
        name: NoModificationAllowedError.name,
        repository: this.fs.repository,
        path: this.path,
        e: "Cannot delete root directory",
      });
    }
    const { parent, name } = await this.wfs._getParent(this.path);
    await parent.removeEntry(name, { recursive: true });
  }

  private async _getDirectoryHandle(create: boolean) {
    if (this.path === DIR_SEPARATOR) {
      return this.wfs._getRoot();
    }
    const { parent, name } = await this.wfs._getParent(this.path);
    return parent.getDirectoryHandle(name, { create });
  }
}
