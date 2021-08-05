import {
  AbstractFileSystem,
  Directory,
  File,
  FileSystemOptions,
  HeadOptions,
  NotFoundError,
  PatchOptions,
  Props,
  Stats,
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

  public async _getFileSystemHandles(
    path: string,
    isFile?: boolean
  ): Promise<{
    parent: FileSystemDirectoryHandle;
    directoryHandle?: FileSystemDirectoryHandle;
    fileHandle?: FileSystemFileHandle;
  } | null> {
    const parts = path.split(DIR_SEPARATOR).filter((part) => !!part);
    if (parts.length === 0) {
      return null;
    }
    let parent = await this._getRoot();
    let i = 0;
    let part: string | undefined;
    for (let end = parts.length - 1; i <= end; i++) {
      part = parts[i] as string;
      parent = await parent.getDirectoryHandle(part);
    }
    part = parts[i] as string;
    if (isFile === true) {
      return { parent, fileHandle: await parent.getFileHandle(part) };
    } else if (isFile === false) {
      return { parent, directoryHandle: await parent.getDirectoryHandle(part) };
    } else {
      const file = await parent.getFileHandle(part);
      if (file.kind === "file") {
        return { parent, fileHandle: file };
      }
      return { parent, directoryHandle: await parent.getDirectoryHandle(part) };
    }
  }

  public async _getRoot() {
    if (this.root) {
      return this.root;
    }
    const fs = await window.showDirectoryPicker();
    this.root = fs;
    return fs;
  }

  public async _head(path: string, _options: HeadOptions): Promise<Stats> {
    const handles = await this._getFileSystemHandles(path);
    if (!handles) {
      throw new NotFoundError(this.repository, path);
    }
    const { fileHandle } = handles;
    if (fileHandle) {
      const file = await fileHandle.getFile();
      return {
        modified: file.lastModified,
        size: file.size,
      };
    } else {
      return {};
    }
  }

  public _patch(
    _path: string,
    _props: Props,
    _options: PatchOptions
  ): Promise<void> {
    throw new Error("Method not implemented.");
  }

  public async getDirectory(path: string): Promise<Directory> {
    const handles = await this._getFileSystemHandles(path, true);
    if (!handles || !handles.directoryHandle) {
      throw new NotFoundError(this.repository, path);
    }
    const { parent, directoryHandle } = handles;
    return new WfsaDirectory(this, path, parent, directoryHandle);
  }

  public async getFile(path: string): Promise<File> {
    const handles = await this._getFileSystemHandles(path, true);
    if (!handles || !handles.fileHandle) {
      throw new NotFoundError(this.repository, path);
    }
    const { parent, fileHandle } = handles;
    return new WfsaFile(this, path, parent, fileHandle);
  }

  public async toURL(
    _path: string,
    _urlType: URLType = "GET"
  ): Promise<string> {
    throw new Error("Method not implemented.");
  }
}
