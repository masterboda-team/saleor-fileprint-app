import { exec } from "child_process";
import { promises as fs } from "fs";
import path from "path";
import _ from "lodash";

/* This script converts a PDF file to PNG images.
 * The output directory is created if it doesn't exist.
 * The script uses the `mutool` command line tool.
 * The script assumes that the `mutool` command line tool is installed.
 * The script assumes that the `mutool` command line tool is in the PATH.
 */
interface ConvertPdfParams {
  // The path to the PDF file.
  filePath: string;
  // The name of the output directory. The default is “converted”.
  outputDir?: string;
  // Comma separated list of page ranges.
  // The first page is “1”, and the last page is “N”. The default is “1-N”.
  pages?: string;
}

type ConvertedFiles = { name: string; path: string; number: number }[];

export async function convertPdf({
  filePath,
  outputDir = "converted",
  pages = "1-N",
}: ConvertPdfParams): Promise<ConvertedFiles> {
  const command = `mutool convert -O resolution=160 -o ${outputDir}/%d.png ${filePath} ${pages}`;
  console.log("EXEC: ", command);
  return new Promise((resolve, reject) => {
    exec(command, async (error) => {
      if (error) throw error;
      const files = await getConvertedFiles(outputDir);
      resolve(files);
    });
  });
}

/**
 * Returns the total number of pages in a PDF file.
 * @param filePath - The path to the PDF file.
 * @returns A Promise that resolves with an object with a single property: totalPages.
 * The totalPages property is a number that represents the total number of pages in the PDF file.
 * The Promise rejects with an Error if something goes wrong.
 */
export const getPdfInfo = (filePath: string): Promise<{ totalPages: number }> => {
  const regex = /pages:\s*(\d+)/i;
  return new Promise((resolve, reject) => {
    exec(`mutool info ${filePath}`, (error, stdout) => {
      if (error) {
        reject(error);
      } else {
        const matches = stdout.trim().match(regex);
        if (matches?.length === 2) {
          resolve({ totalPages: parseInt(matches[1]) });
        }
        reject(new Error("Something went wrong"));
      }
    });
  });
};

/**
 * Reads a directory and returns a list of converted image files.
 * The files are assumed to be PNG images with names representing their page numbers.
 * 
 * @param dir - The directory containing the converted image files.
 * @returns A Promise that resolves to an array of objects, each containing
 * the name, path, and page number of a converted file.
 */
async function getConvertedFiles(dir: string): Promise<ConvertedFiles> {
  const imageFiles = await fs.readdir(dir);
  const files = imageFiles
    .filter((file) => file.endsWith(".png"))
    .map((file) => ({
      name: file,
      path: path.join(dir, file),
      number: parseInt(file.split(".")[0]),
    }));

  return files;
}
