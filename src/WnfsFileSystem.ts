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
  Stats,
  SyntaxError,
  TypeMismatchError,
  URLOptions,
} from "univ-fs";
import { WnfsDirectory } from "./WnfsDirectory";
import { WnfsFile } from "./WnfsFile";

export class WnfsFileSystem extends AbstractFileSystem {
  private root?: FileSystemDirectoryHandle;

  constructor(options?: FileSystemOptions) {
    super("", options);
  }

  public async _doGetDirectory(path: string): Promise<Directory> {
    return Promise.resolve(new WnfsDirectory(this, path));
  }

  public async _doGetFile(path: string): Promise<File> {
    return Promise.resolve(new WnfsFile(this, path));
  }

  public async _doHead(path: string): Promise<Stats> {
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

  public _doPatch(
    path: string,
    _stats: Stats, // eslint-disable-line
    _props: Stats, // eslint-disable-line
    _options: PatchOptions // eslint-disable-line
  ): Promise<void> {
    throw createError({
      name: NotSupportedError.name,
      repository: this.repository,
      path,
      e: { message: "patch is not supported" },
    });
  }

  public async _doToURL(
    path: string,
    isDirectory: boolean,
    options?: URLOptions
  ): Promise<string> {
    options = { urlType: "GET", ...options };
    const repository = this.repository;
    if (options.urlType !== "GET") {
      throw createError({
        name: NotSupportedError.name,
        repository,
        path,
        e: { message: `"${options.urlType}" is not supported` }, // eslint-disable-line
      });
    }
    if (isDirectory) {
      throw createError({
        name: TypeMismatchError.name,
        repository,
        path,
        e: { message: `"${path}" is not a directory` },
      });
    }

    const file = await this.getFile(path);
    const blob = await file.read("blob");
    return URL.createObjectURL(blob);
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

  public canPatchAccessed(): boolean {
    return false;
  }

  public canPatchCreated(): boolean {
    return false;
  }

  public canPatchModified(): boolean {
    return false;
  }

  public supportDirectory(): boolean {
    return true;
  }
}
