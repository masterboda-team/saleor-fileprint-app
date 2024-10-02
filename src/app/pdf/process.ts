import sharp from "sharp";
import { File } from "formidable";
import { convertPdf } from "./converter";
import _ from "lodash";
import path from "path";

/**
 * Converts a PDF file to images and checks if the images are color.
 * @param file - The file to process. Must have a `hash` property.
 * @param pages - Optional. The pages to convert. If not specified, converts all pages.
 * @returns An array of objects with `name` and `isColor` properties.
 * @throws Error if NEXT_MEDIA_DIR is not defined or if file hash is not defined.
 */
export async function processPdf(
  file: File,
  pages?: string
): Promise<{ name: string; isColor: boolean }[]> {
  // Validation
  if (!_.isString(process.env.NEXT_MEDIA_DIR)) {
    throw new Error("NEXT_MEDIA_DIR is not defined");
  }
  if (!_.isString(file.hash)) {
    throw new Error("File hash is not defined");
  }

  // Convert pdf to images
  const convertedFiles = await convertPdf({
    filePath: file.filepath,
    outputDir: path.join(process.env.NEXT_MEDIA_DIR, file.hash),
    pages,
  });

  // Check if images are color
  const images = convertedFiles.filter((f) => f.path);
  const isColorPromises = images.map(async (f) => checkColor(f.path));
  const isColorImages = await Promise.all(isColorPromises);

  // Return results
  return convertedFiles.map((f, i) => ({
    name: f.name,
    isColor: isColorImages[i],
  }));
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
    if (Math.abs(r - g) > threshold || Math.abs(r - b) > threshold || Math.abs(g - b) > threshold) {
      return true;
    }
  }

  return false;
}
