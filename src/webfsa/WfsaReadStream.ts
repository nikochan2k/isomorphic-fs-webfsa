import { AbstractReadStream, OpenOptions } from "isomorphic-fs";
import { toArrayBuffer } from "../util/buffer";
import { WfsaFile } from "./WfsaFile";

export class WfsaReadStream extends AbstractReadStream {
  constructor(wf: WfsaFile, private file: File, options: OpenOptions) {
    super(wf, options);
  }

  public async _close(): Promise<void> {}

  public async _read(size?: number): Promise<ArrayBuffer | null> {
    if (this.file.size <= this.position) {
      return null;
    }
    let end = this.position + (size == null ? this.bufferSize : size);
    if (this.file.size < end) {
      end = this.file.size;
    }
    const blob = this.file.slice(this.position, end);
    return toArrayBuffer(blob);
  }

  protected async _seek(start: number): Promise<void> {
    this.position = start;
  }
}
