import { NextApiRequest, NextApiResponse } from "next";
import {
  CheckoutLinesAddMutation,
  CheckoutLinesAddMutationVariables,
  ProductVariantQuery,
  ProductVariantQueryVariables,
  UntypedCheckoutLinesAddDocument,
  UntypedProductVariantDocument,
} from "../../../generated/graphql";
import { getPrisma, getSaleorClient } from "../connections";
import { sendData, sendInternalError, sendNotFound, sendValidationError } from "../api.utils";
import _ from "lodash";

const prisma = getPrisma();

const GRAYSCALE_PRISE = 2; // TODO: make configurable
const COLOR_PRISE = 4; // TODO: make configurable

/**
 * POST /api/pdf/add-to-checkout
 *
 * Adds a printed PDF to a checkout.
 * @param req.body.hash - The hash of the uploaded PDF file.
 * @param req.body.checkoutId - The ID of the checkout to add the PDF to.
 * @param req.body.coloredPages - The pages of the PDF that should be printed in color.
 * @param req.body.coverVariantId - The ID of the product variant to use for the cover.
 * @param req.body.channel - The channel to use for the checkout.
 * @param req.body.quantity - The quantity of the printed PDF to add.
 * @returns Nothing if successful.
 */
export default async function AddPdfToCheckoutHandler(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<void> {
  if (req.method === 'OPTIONS') return res.status(200).send("");
  if (req.method !== "POST") return sendNotFound(res, "Method Not Allowed");

  const body = req.body;
  if (!validate(res, body)) return;

  // Get args
  const hash: string = body.hash;
  const checkoutId: string = body.checkoutId;
  const coloredPages: number[] = body.coloredPages;
  const coverVariantId: string = body.coverVariantId;
  const channel: string = body.channel;
  const quantity: number = body.quantity;

  // Fetch the uploaded file from the database
  const uploadedFile = await prisma.uploadedFile.findUnique({ where: { hash } });
  if (!uploadedFile?.pageCount) return sendNotFound(res, "File not found");

  // Fetch product variant
  const gqlClient = await getSaleorClient();
  const variantResponse = await gqlClient
    .query<ProductVariantQuery, ProductVariantQueryVariables>(UntypedProductVariantDocument, {
      productVariantId: coverVariantId,
      channel: channel,
    })
    .toPromise();
  if (!variantResponse?.data?.productVariant) return sendNotFound(res, "Cover variant not found");
  const variant = variantResponse.data.productVariant;

  // Calculate
  if (uploadedFile.pageCount < 1) return sendInternalError(res, "Invalid page count");
  const coloredPagesCount = coloredPages.length;
  const grayscalePagesCount = uploadedFile.pageCount - coloredPages.length;
  if (grayscalePagesCount < 0) return sendInternalError(res, "Invalid colored page count");
  const coloredPrice = coloredPagesCount * COLOR_PRISE;
  const grayscalePrice = grayscalePagesCount * GRAYSCALE_PRISE;
  const coverPrise = variant.pricing?.price?.gross.amount || 0;
  const totalPrice = coverPrise + coloredPrice + grayscalePrice;

  // Add to checkout
  const checkoutResponse = await gqlClient
    .mutation<CheckoutLinesAddMutation, CheckoutLinesAddMutationVariables>(
      UntypedCheckoutLinesAddDocument,
      {
        id: checkoutId,
        lines: [
          {
            quantity,
            variantId: coverVariantId,
            forceNewLine: true,
            price: totalPrice,
            metadata: [
              {
                key: "filePrintHash",
                value: uploadedFile.hash,
              },
              {
                key: "coloredPages",
                value: coloredPages.join(","),
              },
            ],
          },
        ],
      }
    )
    .toPromise();

  if (!checkoutResponse?.data?.checkoutLinesAdd)
    return sendInternalError(res, "Failed to add to checkout");

  return sendData(res, null);
}

function validate(res: NextApiResponse, body: any): boolean {
  if (!_.isString(body?.hash)) {
    sendValidationError(res, "Invalid hash");
    return false;
  }
  if (!_.isString(body?.checkoutId)) {
    sendValidationError(res, "Invalid checkoutId");
    return false;
  }
  if (!_.isArray(body?.coloredPages)) {
    sendValidationError(res, "Invalid coloredPages");
    return false;
  }
  if (!_.isString(body?.coverVariantId)) {
    sendValidationError(res, "Invalid coverVariantId");
    return false;
  }
  if (!_.isString(body?.channel)) {
    sendValidationError(res, "Invalid channel");
    return false;
  }
  if (!_.isNumber(body?.quantity)) {
    sendValidationError(res, "Invalid quantity");
    return false;
  }
  if (!body.coloredPages.every((page: any) => _.isNumber(page))) {
    sendValidationError(res, "Invalid coloredPages");
    return false;
  }
  return true;
}
