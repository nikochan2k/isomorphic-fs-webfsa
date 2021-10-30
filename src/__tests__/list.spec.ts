import { testAll } from "univ-fs/lib/__tests__/list";
import { WnfsFileSystem } from "../WnfsFileSystem";

const fs = new WnfsFileSystem();
testAll(fs, async () => {
  const dir = await fs.getDirectory("/");
  const paths = await dir.readdir({ ignoreHook: true });
  for (const path of paths) {
    await fs.rm(path, { recursive: true, force: true, ignoreHook: true });
  }
});
