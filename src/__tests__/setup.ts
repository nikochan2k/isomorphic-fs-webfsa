import {
  ErrorLike,
  NotFoundError,
  OnExists,
  OnNoParent,
  OnNotExist,
} from "univ-fs";
import { WnfsFileSystem } from "../WnfsFileSystem";

export const fs = new WnfsFileSystem();
export const setup = async () => {
  try {
    const root = await fs.getDirectory("/");
    await root.rm({
      onNotExist: OnNotExist.Ignore,
      recursive: true,
      ignoreHook: true,
    });
    await root.mkdir({
      onExists: OnExists.Ignore,
      onNoParent: OnNoParent.Error,
      ignoreHook: true,
    });
  } catch (e) {
    if ((e as ErrorLike).name !== NotFoundError.name) {
      throw e;
    }
  }
};
