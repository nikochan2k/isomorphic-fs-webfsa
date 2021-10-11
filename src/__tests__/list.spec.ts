import { NotFoundError, TypeMismatchError } from "univ-fs";
import { WnfsFileSystem } from "../WnfsFileSystem";

const fs = new WnfsFileSystem();

describe("list", () => {
  beforeAll(async () => {
    const dir = await fs.getDirectory("/");
    const paths = await dir.readdir({ ignoreHook: true });
    for (const path of paths) {
      await fs.rm(path, { recursive: true, force: true, ignoreHook: true });
    }
  });

  it("rootdir", async () => {
    const list = await fs.list("/");
    expect(list.length).toBe(0);
  });

  it("nothing", async () => {
    try {
      await fs.list("/nothing");
      fail("/nothing exists");
    } catch (e) {
      expect(e.code).toBe(NotFoundError.code);
    }
  });

  it("file_list", async () => {
    await fs.writeAll("/file_list", new ArrayBuffer(1));
    try {
      await fs.list("/file_list");
      fail("/nothing exists");
    } catch (e) {
      expect(e.code).toBe(TypeMismatchError.code);
    }
  });
});
