import { IncomingForm, File } from "formidable";
import _ from "lodash";
import { NextApiRequest, NextApiResponse } from "next";

export function sendData<T = any>(res: NextApiResponse, data: T): void {
  res.status(200).json({ status: "OK", data });
}

export function sendValidationError(res: NextApiResponse, message: string): void {
  res.status(400).json({ status: "Validation Error", message });
}

export function sendNotFound(res: NextApiResponse, message: string): void {
  res.status(404).json({ status: "Not Found", message });
}

export function sendInternalError(res: NextApiResponse, message: string): void {
  res.status(500).json({ status: "Internal Error", message });
}

type FilesFromRequest = (File & { hash: string })[];

/**
 * Parse a Next.js API request and extract all files from it.
 * The files are returned as an array of objects with `hash` property.
 * The `hash` property is the MD5 hash of the file.
 * @param req - The Next.js API request.
 * @returns A Promise of an array of objects with `hash` property.
 */
export async function getFilesFromRequest(req: NextApiRequest): Promise<FilesFromRequest> {
  return new Promise<FilesFromRequest>((resolve, reject) => {
    const form = new IncomingForm({ hashAlgorithm: "md5" });
    const files: FilesFromRequest = [];

    form.on("file", (formName: string, file: File) => {
      if (!_.isString(file.hash)) throw new Error("File hash is not defined");
      files.push(file as File & { hash: string });
    });
    form.on("end", () => resolve(files));
    form.on("error", (err) => {
      console.warn("Processed failed", err);
      reject([]);
    });
    form.parse(req);
  });
}
