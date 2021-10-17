import {
  AbstractFileSystem,
  createError,
  Directory,
  File,
  FileSystemOptions,
  HeadOptions,
  NotFoundError,
  NotSupportedError,
  PatchOptions,
  Props,
  Stats,
  SyntaxError,
  URLType,
} from "univ-fs";
import { WnfsDirectory } from "./WnfsDirectory";
import { WnfsFile } from "./WnfsFile";

export class WnfsFileSystem extends AbstractFileSystem {
  private root?: FileSystemDirectoryHandle;

  constructor(options?: FileSystemOptions) {
    super("", options);
  }

  public async _getParent(path: string) {
    const parts = path.split("/").filter((part) => !!part);
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
    if (path === "/") {
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
    path: string,
    _props: Props,
    _options: PatchOptions
  ): Promise<void> {
    throw createError({
      name: NotSupportedError.name,
      repository: this.repository,
      path,
      e: "patch is not supported",
    });
  }

  public async getDirectory(path: string): Promise<Directory> {
    return new WnfsDirectory(this, path);
  }

  public async getFile(path: string): Promise<File> {
    return new WnfsFile(this, path);
  }

  public async toURL(path: string, urlType: URLType = "GET"): Promise<string> {
    if (urlType !== "GET") {
      throw createError({
        name: NotSupportedError.name,
        repository: this.repository,
        path,
        e: `"${urlType}" is not supported`,
      });
    }
    const file = await this.getFile(path);
    const blob = await file.readAll({ sourceType: "Blob" });
    return URL.createObjectURL(blob);
  }
}
