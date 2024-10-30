import sharp from "sharp";
import { File } from "formidable";
import { convertPdf } from "./converter";
import _ from "lodash";
import path from "path";

interface ProcessPdfParams {
  filePath: string;
  outputDir: string;
  pages?: string;
  transparent?: boolean;
}

export type ProcessedPdf = {
  pages: { isColor: boolean; number: number, name: string }[];
  coloredPages: number[];
};

/**
 * Processes a PDF file by converting its pages to images and determining whether each page is color or grayscale.
 * @param filePath - The path to the PDF file.
 * @param outputDir - The directory where the converted images will be saved.
 * @param pages - Optional. A string specifying which pages to convert. Defaults to "1-N" for all pages.
 * @returns A Promise that resolves to an object containing:
 * - `pages`: An array of objects, each representing a page with its number, name, and whether it is in color.
 * - `coloredPages`: An array of page numbers that are in color.
 */
export async function processPdf({
  filePath,
  outputDir,
  pages = "1-N",
}: ProcessPdfParams): Promise<ProcessedPdf> {
  // Convert pdf to images
  const convertedFiles = await convertPdf({
    filePath,
    outputDir,
    pages,
  });

  // Check if images are color
  const result: ProcessedPdf = {
    pages: [],
    coloredPages: [],
  };

  for (const f of convertedFiles) {
    const isColor = await checkColor(f.path);
    if (isColor) result.coloredPages.push(f.number);
    result.pages.push({
      name: f.name,
      number: f.number,
      isColor,
    });
  }

  // Return results
  return result;
}

/**
 * Checks if an image is color or grayscale.
 * @param imagePath - The path to the image file.
 * @param threshold - Optional. The threshold to determine if a pixel is significantly different in any color channel. Defaults to 15.
 * @returns true if the image has color, false if it is grayscale.
 */
async function checkColor(imagePath: string, threshold: number = 15) {
  const image = sharp(imagePath);
  const { channels } = await image.metadata();
  if (!channels || channels < 3) return false; // Not enough channels for color

  // Read a small portion of the image to check color variation
  const { data } = await image.raw().toBuffer({ resolveWithObject: true });
  const pixelCount = data.length / channels;

  // Use a more efficient way to loop through the data
  for (let i = 0, r, g, b; i < pixelCount; i++) {
    r = data[i * channels];
    g = data[i * channels + 1];
    b = data[i * channels + 2];

    // Check if this pixel is significantly different in any color channel
    if (Math.abs(r - g) > threshold && Math.abs(r - b) > threshold && Math.abs(g - b) > threshold) {
      return true;
    }
  }

  return false;
}


interface CreateCoverParams {
  filePath: string;
  outputDir: string;
  fileName?: string;
}

/**
 * Creates a cover image for a PDF file by converting the first page to grayscale, setting white pixels to transparent, and saving it to a file.
 * @param params - Parameters for the function.
 * @param params.filePath - The path to the PDF file.
 * @param params.outputDir - The directory to which the cover image will be saved.
 * @param params.fileName - Optional. The name of the cover image. Defaults to "cover.png".
 * @returns The name of the saved image.
 */
export async function createCover({
  filePath,
  outputDir,
  fileName = "cover.png",
}: CreateCoverParams): Promise<string> {
  const outputPath = path.join(outputDir, fileName);

  // Get cover from pdf
  const convertedImages = await convertPdf({
    filePath,
    outputDir,
    pages: "1",
  });
  const imagePath = convertedImages[0].path;

  // Process the image
  const image = sharp(imagePath);

  // Create a temporary buffer to manipulate
  const data = await image.grayscale().threshold(215).toBuffer();

  const transparentChannal = await sharp(data)
    .extractChannel("red") // Use red channel for alpha
    .threshold(254) // Make white pixels transparent
    .negate()
    .toBuffer();

  // Replace white pixels with transparency
  const transparentImage = await sharp(data)
    .joinChannel(transparentChannal)
    .toFormat("png")
    .toBuffer();

  // Save the final image with transparency
  await sharp(transparentImage).toFile(outputPath);

  return fileName;
}
