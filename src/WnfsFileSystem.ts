import {
  AbstractFileSystem,
  createError,
  Directory,
  ErrorLike,
  File,
  FileSystemOptions,
  NotFoundError,
  NotSupportedError,
  PatchOptions,
  Props,
  Stats,
  SyntaxError,
  URLOptions,
} from "univ-fs";
import { WnfsDirectory } from "./WnfsDirectory";
import { WnfsFile } from "./WnfsFile";

export class WnfsFileSystem extends AbstractFileSystem {
  private root?: FileSystemDirectoryHandle;

  constructor(options?: FileSystemOptions) {
    super("", options);
  }

  public async _getDirectory(path: string): Promise<Directory> {
    return Promise.resolve(new WnfsDirectory(this, path));
  }

  public async _getFile(path: string): Promise<File> {
    return Promise.resolve(new WnfsFile(this, path));
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
    const end = parts.length - 1;
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

  public async _head(path: string): Promise<Stats> {
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
    } catch (e: unknown) {
      if ((e as ErrorLike).code === NotFoundError.code) {
        throw e;
      }
    }
    await parent.getDirectoryHandle(name);
    return {};
  }

  public _patch(
    path: string,
    _props: Props, // eslint-disable-line
    _options: PatchOptions // eslint-disable-line
  ): Promise<void> {
    throw createError({
      name: NotSupportedError.name,
      repository: this.repository,
      path,
      e: { message: "patch is not supported" },
    });
  }

  public async _toURL(path: string, options?: URLOptions): Promise<string> {
    options = { urlType: "GET", ...options };
    if (options.urlType !== "GET") {
      throw createError({
        name: NotSupportedError.name,
        repository: this.repository,
        path,
        e: { message: `"${options.urlType}" is not supported` }, // eslint-disable-line
      });
    }
    const file = await this.getFile(path);
    const blob = await file.read({ type: "Blob" });
    return URL.createObjectURL(blob);
  }
}
