import { NextApiRequest, NextApiResponse } from "next";
import { processPdf } from "./process";
import { promises as fs } from "fs";
import path from "path";
import { getPrisma } from "../connections";
import { getFilesFromRequest, sendData, sendValidationError } from "../api.utils";

const prisma = getPrisma();

type UploadPdfResponse = {
  cover: { name: string; isColor: boolean };
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
export default async function uploadPdfHandler(req: NextApiRequest, res: NextApiResponse): Promise<void> {
  const files = await getFilesFromRequest(req);

  // Validate
  if (!files || !files[0]) {
    return sendValidationError(res, "No files found");
  }
  const file = files[0];

  // Make dir
  await fs.mkdir(`${process.env.NEXT_MEDIA_DIR}/${file.hash}`, { recursive: true });

  // Upload file
  await fs.writeFile(
    `${process.env.NEXT_MEDIA_DIR}/${file.hash}/${file.originalFilename}`,
    file.filepath
  );

  // First convert cover and send response
  const processedCover = await processPdf(file, "1");
  const cover = processedCover[0];
  sendData<UploadPdfResponse>(res, { cover, hash: file.hash });

  // Then convert all pdf in background
  const images = await processPdf(files[0]);
  const coloredPages = [] as number[];
  images.forEach((f, i) => {
    if (f.isColor) {
      coloredPages.push(i + 1);
    }
  });

  // Add file to DB
  try {
    await prisma.uploadedFile.create({
      data: {
        hash: file.hash as string,
        name: file.originalFilename as string,
        extension: path.extname(file.originalFilename as string),
        description: "",
        baseUrl: `media/${file.hash}/${file.originalFilename}`,
        pageCount: images.length,
        created: new Date(),
        coloredPages: JSON.stringify(coloredPages),
      },
    });
  } catch (error) {
    console.error(error);
  }
}
