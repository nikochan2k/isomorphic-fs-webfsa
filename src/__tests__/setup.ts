import { NotFoundError } from "univ-fs";
import { WnfsFileSystem } from "../WnfsFileSystem";

export const fs = new WnfsFileSystem();
export const setup = async () => {
  try {
    const root = await fs._getDirectory("/");
    await root.rm({ force: true, recursive: true, ignoreHook: true });
    await root.mkdir({ force: true, recursive: false, ignoreHook: true });
  } catch (e) {
    if (e.name !== NotFoundError.name) {
      throw e;
    }
  }
};
