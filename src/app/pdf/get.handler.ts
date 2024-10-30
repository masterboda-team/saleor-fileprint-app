import { NextApiRequest, NextApiResponse } from "next";
import { JsonValue } from "@prisma/client/runtime/library";
import { getPrisma } from "../connections";
import { sendNotFound, sendData } from "../api.utils";
import { $Enums } from "@prisma/client";
import { ProcessedPdf, processPdf } from "./process";
import path from "path";

const prisma = getPrisma();

type GetUploadedFileResponse = {
  id: number;
  hash: string;
  name: string;
  pageCount: number | null;
  coloredPages: JsonValue | null;
  pages: ProcessedPdf["pages"];
  processStatus: $Enums.ProcessStatus;
};

/**
 * GET /api/pdf/:hash
 *
 * Returns the uploaded PDF file data, including the number of pages and whether each page is color or not.
 * @param req.query.hash - The hash of the uploaded PDF file.
 * @returns A JSON response with the following fields:
 * - `id`: The ID of the uploaded file.
 * - `hash`: The hash of the uploaded PDF file.
 * - `name`: The name of the uploaded PDF file.
 * - `pageCount`: The number of pages in the uploaded PDF file.
 * - `coloredPages`: An array of page numbers that are color.
 * - `pages`: An array of objects with the following fields:
 *   - `name`: The name of the page.
 *   - `number`: The number of the page.
 *   - `isColor`: Whether the page is color or not.
 * - `processStatus`: The current status of the uploaded file.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse): Promise<void> {
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    return res.status(200).send("");
  }

  if (!process.env.NEXT_MEDIA_DIR) {
    throw new Error("NEXT_MEDIA_DIR is not defined");
  }

  // Ensure this is a GET request
  if (req.method !== "GET") return sendNotFound(res, "Method Not Allowed");

  const { hash } = req.query;

  // Validate the hash parameter
  if (!hash || Array.isArray(hash)) return sendNotFound(res, "Invalid hash");

  // Fetch the uploaded file from the database
  const uploadedFile = await prisma.uploadedFile.findUnique({
    where: {
      hash: hash as string,
    },
  });
  if (!uploadedFile) return sendNotFound(res, "File not found");

  // Return the uploaded file data if it's already processed
  const result: GetUploadedFileResponse = {
    id: uploadedFile.id,
    hash: uploadedFile.hash,
    name: uploadedFile.name,
    pageCount: uploadedFile.pageCount,
    coloredPages: uploadedFile.coloredPages
      ? JSON.parse(uploadedFile.coloredPages as string)
      : null,
    pages: [],
    processStatus: uploadedFile.processStatus,
  };
  if (uploadedFile.processStatus !== $Enums.ProcessStatus.NOT_PROCESSED) {
    return sendData<GetUploadedFileResponse>(res, result);
  }

  // Process the uploaded file
  const fileDir = path.join(process.env.NEXT_MEDIA_DIR, uploadedFile.hash);
  const filePath = path.join(process.env.NEXT_MEDIA_DIR, uploadedFile.baseUrl);

  const processedPdf = await processPdf({
    filePath: filePath,
    outputDir: fileDir,
    pages: "1-N",
  });

  // Update the database
  const updatedFile = await prisma.uploadedFile.update({
    where: {
      hash: hash as string,
    },
    data: {
      processStatus: $Enums.ProcessStatus.DONE,
      coloredPages: JSON.stringify(processedPdf.coloredPages),
    },
  });

  // Return the results
  result.processStatus = updatedFile.processStatus;
  result.coloredPages = JSON.parse(updatedFile.coloredPages as string);
  result.pages = processedPdf.pages;

  sendData<GetUploadedFileResponse>(res, result);
}
