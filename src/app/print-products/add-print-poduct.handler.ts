import { NextApiRequest, NextApiResponse } from "next";
import { getPrisma } from "../connections";
import { sendData, sendInternalError, sendValidationError } from "../api.utils";
import _ from "lodash";

export interface AddProductBody {
  slug: string;
  coverProductId: string | null | undefined;
  pageProductId: string;
  grayscalePageVariantId: string;
  coloredPageVariantId: string;
}

/**
 * POST /api/print-products
 *
 * Adds a print product to the database.
 *
 * This endpoint is called when a new product is added from the admin panel.
 *
 * @param req - The request object.
 * @param res - The response object.
 *
 * @returns A promise that resolves when the product has been added.
 */
export default async function AddProductHandler(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<void> {
  const body = req.body;
  if (!validate(res, body)) return;

  // Get args
  const slug: string = body.slug;
  const coverProductId: string | null | undefined = body.coverProductId;
  const pageProductId: string = body.pageProductId;
  const grayscalePageVariantId: string = body.grayscalePageVariantId;
  const coloredPageVariantId: string = body.coloredPageVariantId;

  // Create product
  const prisma = getPrisma();
  try {
    await prisma.printProducts.create({
      data: {
        slug,
        coverProductId,
        pageProductId,
        grayscalePageVariantId,
        coloredPageVariantId,
      },
    });
  } catch (error) {
    sendInternalError(res, "Failed to add product");
  }

  return sendData(res, null);
}

function validate(res: NextApiResponse, body: any): boolean {
  if (!_.isString(body?.slug)) {
    sendValidationError(res, "Invalid slug");
    return false;
  }
  if (!_.isString(body?.coverProductId) && !_.isNil(body?.coverProductId)) {
    sendValidationError(res, "Invalid coverProductId");
    return false;
  }
  if (!_.isString(body?.pageProductId)) {
    sendValidationError(res, "Invalid pageProductId");
    return false;
  }
  if (!_.isString(body?.grayscalePageVariantId)) {
    sendValidationError(res, "Invalid grayscalePageVariantId");
    return false;
  }
  if (!_.isString(body?.coloredPageVariantId)) {
    sendValidationError(res, "Invalid coloredPageVariantId");
    return false;
  }
  return true;
}
