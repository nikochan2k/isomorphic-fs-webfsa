import { NotFoundError } from "univ-fs";
import { WfsaFileSystem } from "../WfsaFileSystem";

const fs = new WfsaFileSystem();

describe("head", () => {
  beforeAll(async () => {
    const dir = await fs.getDirectory("/");
    const paths = await dir.readdir({ ignoreHook: true });
    for (const path of paths) {
      await fs.rm(path, { recursive: true, force: true, ignoreHook: true });
    }
  });

  it("rootdir", async () => {
    const stat = await fs.head("/");
    expect(stat.size).toBeUndefined();
  });

  it("nothing", async () => {
    try {
      await fs.stat("/nothing");
      fail("/nothing exists");
    } catch (e) {
      expect(e.code).toBe(NotFoundError.code);
    }
  });

  it("file_head", async () => {
    await fs.writeAll("/file_head", new ArrayBuffer(1));
    const stat = await fs.stat("/file_head");
    expect(stat.size).toBe(1);
  });
});
