import { NextApiRequest, NextApiResponse } from "next";
import { createCover } from "./process";
import { promises as fs } from "fs";
import path from "path";
import { getPrisma } from "../connections";
import { getFilesFromRequest, sendData, sendValidationError } from "../api.utils";
import _ from "lodash";
import { getPdfInfo } from "./converter";

const prisma = getPrisma();

type UploadPdfResponse = {
  coverUrl: string;
  hash: string;
};

/**
 * Uploads a PDF file to the server.
 * The file is stored in a directory named after the file's hash.
 * The file is then converted to images, and the cover image is sent as a response.
 * All images, including the cover, are then stored in the database.
 * @param req - The request object.
 * @param res - The response object.
 */
export default async function uploadPdfHandler(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<void> {
  const files = await getFilesFromRequest(req);

  // Validate
  if (!files || !files[0]) {
    return sendValidationError(res, "No files found");
  }
  if (!_.isString(process.env.NEXT_MEDIA_DIR)) {
    throw new Error("NEXT_MEDIA_DIR is not defined");
  }

  const file = files[0];
  const outputDir = path.join(process.env.NEXT_MEDIA_DIR, file.hash);

  // Make dir
  await fs.mkdir(outputDir, { recursive: true });

  // Upload file
  const fileData = await fs.readFile(file.filepath);
  await fs.writeFile(`${outputDir}/${file.originalFilename}`, fileData as any); // TODO: fix type

  // Check if file exists
  const uploadedFile = await prisma.uploadedFile.findUnique({
    where: {
      hash: file.hash,
    },
  });
  if (uploadedFile) {
    const coverUrl = `${process.env.NEXT_PUBLIC_URL}media/${file.hash}/cover.png`;
    return sendData<UploadPdfResponse>(res, {
      coverUrl: coverUrl,
      hash: file.hash,
    });
  }

  // Convert cover and send response
  const { totalPages } = await getPdfInfo(file.filepath);
  const fileName = await createCover({ filePath: file.filepath, outputDir });
  const coverUrl = `${process.env.NEXT_PUBLIC_URL}media/${file.hash}/${fileName}`;

  // Add file to DB
  await prisma.uploadedFile.create({
    data: {
      hash: file.hash as string,
      name: file.originalFilename as string,
      extension: path.extname(file.originalFilename as string),
      description: "",
      baseUrl: `${file.hash}/${file.originalFilename}`,
      pageCount: totalPages,
      created: new Date(),
      coloredPages: JSON.stringify([]),
    },
  });

  // Send response
  return sendData<UploadPdfResponse>(res, { coverUrl, hash: file.hash });
}
