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

type ConvertedFiles = { name: string; path: string }[];

export function convertPdf({
  filePath,
  outputDir = "converted",
  pages = "1-N",
}: ConvertPdfParams): Promise<ConvertedFiles> {
  return new Promise((resolve, reject) => {
    exec(`mutool convert -o ${outputDir}/%d.png ${filePath} ${pages}`, async (error) => {
      if (error) throw error;
      const files = await getConvertedFiles(outputDir);
      resolve(files);
    });
  });
}

async function getConvertedFiles(dir: string): Promise<ConvertedFiles> {
  const imageFiles = await fs.readdir(dir);
  const files = imageFiles
    .filter((file) => file.endsWith(".png"))
    .map((file) => ({ name: file, path: path.join(dir, file) }));

  return files;
}
