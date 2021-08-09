import {
  AbstractFileSystem,
  createError,
  Directory,
  File,
  FileSystemOptions,
  HeadOptions,
  NotFoundError,
  PatchOptions,
  Props,
  Stats,
  SyntaxError,
  URLType,
} from "isomorphic-fs";
import { DIR_SEPARATOR } from "isomorphic-fs/lib/util";
import { WfsaDirectory } from "./WfsaDirectory";
import { WfsaFile } from "./WfsaFile";

export class WfsaFileSystem extends AbstractFileSystem {
  private root?: FileSystemDirectoryHandle;

  constructor(options?: FileSystemOptions) {
    super("", options);
  }

  public async _getParent(path: string) {
    const parts = path.split(DIR_SEPARATOR).filter((part) => !!part);
    if (parts.length === 0) {
      throw createError({
        name: SyntaxError.name,
        repository: this.repository,
        path,
      });
    }
    let parent = await this._getRoot();
    let end = parts.length - 1;
    for (let i = 0; i < end; i++) {
      const part = parts[i] as string;
      parent = await parent.getDirectoryHandle(part);
    }
    return { parent, name: parts[end] as string };
  }

  public async _getRoot() {
    if (this.root) {
      return this.root;
    }
    const root = await window.showDirectoryPicker();
    this.root = root;
    return root;
  }

  public async _head(path: string, _options: HeadOptions): Promise<Stats> {
    if (path === DIR_SEPARATOR) {
      return {};
    }
    const { parent, name } = await this._getParent(path);
    try {
      const fileHandle = await parent.getFileHandle(name);
      const file = await fileHandle.getFile();
      return {
        modified: file.lastModified,
        size: file.size,
      };
    } catch (e) {
      if (e.code === NotFoundError.code) {
        throw e;
      }
    }
    await parent.getDirectoryHandle(name);
    return {};
  }

  public _patch(
    _path: string,
    _props: Props,
    _options: PatchOptions
  ): Promise<void> {
    throw new Error("Method not implemented.");
  }

  public async getDirectory(path: string): Promise<Directory> {
    return new WfsaDirectory(this, path);
  }

  public async getFile(path: string): Promise<File> {
    return new WfsaFile(this, path);
  }

  public async toURL(
    _path: string,
    _urlType: URLType = "GET"
  ): Promise<string> {
    throw new Error("Method not implemented.");
  }
}
