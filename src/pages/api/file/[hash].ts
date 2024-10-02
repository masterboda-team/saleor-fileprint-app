import { NextApiRequest, NextApiResponse } from "next";
import { getPrisma } from "../../../app/connections";
import { sendData, sendNotFound } from "../../../app/api.utils";
import { JsonValue } from "@prisma/client/runtime/library";

const prisma = getPrisma();

type GetUploadedFileResponse = {
  hash: string;
  id: number;
  extension: string;
  name: string;
  pageCount: number | null;
  coloredPages: JsonValue | null;
  created: Date | null;
  description: string;
  textAttributeId: number | null;
  baseUrl: string;
};

/**
 * GET /api/file/:hash
 *
 * Returns information about the uploaded file.
 * @param req.query.hash - The hash of the uploaded file.
 * @returns {GetUploadedFileResponse} Information about the uploaded file.
 * @throws If the hash parameter is missing or invalid.
 * @throws If the file is not found in the database.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse): Promise<void> {
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    return res.status(200).send("");
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

  sendData<GetUploadedFileResponse>(res, uploadedFile);
}
