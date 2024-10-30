import { NextApiRequest, NextApiResponse } from "next";
import { getPrisma } from "../connections";
import { sendData, sendValidationError, sendInternalError } from "../api.utils";
import _ from "lodash";

/**
 * DELETE /api/print-products
 *
 * Deletes a print product from the database.
 *
 * @param req - The request object containing the query parameter 'slug'.
 * @param res - The response object to send the result of the operation.
 *
 * @returns A promise that resolves when the product has been deleted.
 *          Sends a validation error if 'slug' is not provided or is invalid.
 *          Sends an internal error if the deletion process fails.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse): Promise<void> {
  const { slug } = req.query;

  // Validate
  if (!_.isString(slug)) {
    return sendValidationError(res, "channel is required");
  }
  
  // Delete the print product
  const prisma = getPrisma();
  try {
    await prisma.printProducts.delete({
      where: { slug },
    });
  } catch (error) {
    sendInternalError(res, "Failed to delete print product");
  }

  sendData(res, null);
}
