import { NextApiRequest, NextApiResponse } from "next";
import {
  CheckoutLinesAddMutation,
  CheckoutLinesAddMutationVariables,
  GetProductsDocument,
  GetProductsQuery,
  GetProductsQueryVariables,
  UntypedCheckoutLinesAddDocument,
} from "../../../generated/graphql";
import { getPrisma, getSaleorClient } from "../connections";
import { sendData, sendInternalError, sendNotFound, sendValidationError } from "../api.utils";
import _ from "lodash";

interface AddPdfToCheckoutBody {
  // The channel to use for the checkout
  channel: string; 
  // The ID of the checkout to add the PDF to
  checkoutId: string; 
  // The slug of the PrintProduct to use
  slug: string; 
  // The hash of the uploaded PDF file
  hash: string; 
  // The variants of the printed PDF to add
  variants: { 
    // The ID of the product variant to use for the cover
    coverVariantId: string; 
    // The color of the cover text
    coverTextColor: string; 
    // The pages of the PDF that should be printed in color
    coloredPages: number[]; 
    // The quantity of the printed PDF to add
    quantity: number; 
  }[];
}

/**
 * POST /api/pdf/add-to-checkout
 *
 * Adds a printed PDF to a checkout.
 * @param req.body - The request body of type AddPdfToCheckoutBody containing the checkout ID, the hash of the PDF file, and the variants to add.
 * @returns Nothing if successful.
 */
export default async function AddPdfToCheckoutHandler(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<void> {
  if (req.method === 'OPTIONS') return res.status(200).send("");
  if (req.method !== "POST") return sendNotFound(res, "Method Not Allowed");

  // Validate
  const body = req.body as AddPdfToCheckoutBody;
  if (!validate(res, body)) return;

  // Get args
  const { channel, checkoutId, slug, hash, variants } = body;

  // Fetch the uploaded file from the database
  const prisma = getPrisma();
  const uploadedFile = await prisma.uploadedFile.findUnique({ where: { hash } });
  if (!uploadedFile?.pageCount) return sendNotFound(res, "File not found");
  if (uploadedFile.pageCount < 1) return sendInternalError(res, "Invalid page count");

  // Fetch print product
  const printProduct = await prisma.printProducts.findUnique({ where: { slug } });
  if (!printProduct) return sendNotFound(res, "Product not found");
  if (!printProduct.coverProductId) return sendNotFound(res, "Cover product not found");

  // Fetch cover and print products
  const gqlClient = await getSaleorClient();
  const productsResponse = await gqlClient
    .query<GetProductsQuery, GetProductsQueryVariables>(GetProductsDocument, {
      first: 2,
      filter: {
        ids: [printProduct.pageProductId, printProduct.coverProductId],
      },
      channel,
    })
    .toPromise();
  const products = productsResponse.data?.products?.edges?.map(({ node }) => node) || [];
  if (products?.length !== 2) return sendNotFound(res, "Product not found");
  
  // Find cover and page products
  const coverProduct = products.find((product) => product.id === printProduct.coverProductId);
  if (!coverProduct) return sendNotFound(res, "Cover product not found");
  const pageProduct = products.find((product) => product.id === printProduct.pageProductId);
  if (!pageProduct) return sendNotFound(res, "Page product not found");
  const colorPageVariant = pageProduct.variants?.find((variant) => variant.id === printProduct.coloredPageVariantId);
  if (!colorPageVariant) return sendNotFound(res, "Colored page variant not found");
  const grayscalePageVariant = pageProduct.variants?.find((variant) => variant.id === printProduct.grayscalePageVariantId);
  if (!grayscalePageVariant) return sendNotFound(res, "Grayscale page variant not found"); 

  // Get colored and grayscale page prices
  const coloredPagePrice = colorPageVariant.pricing?.price?.gross.amount || 0;
  const grayscalePagePrice = grayscalePageVariant.pricing?.price?.gross.amount || 0;

  // Find and calculate checkout lines
  const checkoutLines = [];
  for (const variant of variants) {
    const coverVariant = coverProduct.variants?.find((v) => v.id === variant.coverVariantId);
    if (!coverVariant) return sendNotFound(res, `Cover variant with id: ${variant.coverVariantId} variant not found`);

    const coverPrice = coverVariant.pricing?.price?.gross?.amount || 0;
    const coloredPagesCount = variant.coloredPages.length;
    const grayscalePagesCount = uploadedFile.pageCount - coloredPagesCount;

    if (grayscalePagesCount < 0) return sendInternalError(res, "Invalid colored page count");
    const coloredPrice = coloredPagesCount * coloredPagePrice;
    const grayscalePrice = grayscalePagesCount * grayscalePagePrice;
    const totalPrice = coverPrice + coloredPrice + grayscalePrice;

    checkoutLines.push({
      quantity: variant.quantity,
      variantId: variant.coverVariantId,
      forceNewLine: true,
      price: totalPrice,
      metadata: [
        {
          key: "hash",
          value: uploadedFile.hash,
        },
        {
          key: "extension",
          value: uploadedFile.extension || "",
        },
        {
          key: "coloredPages",
          value: variant.coloredPages.join(","),
        },
        {
          key: "coverTextColor",
          value: variant.coverTextColor,
        },
      ],
    });
  } 

  // Add to checkout
  const checkoutResponse = await gqlClient
    .mutation<CheckoutLinesAddMutation, CheckoutLinesAddMutationVariables>(
      UntypedCheckoutLinesAddDocument,
      {
        id: checkoutId,
        lines: checkoutLines,
      }
    )
    .toPromise();

  if (!checkoutResponse?.data?.checkoutLinesAdd)
    return sendInternalError(res, "Failed to add to checkout");

  return sendData(res, null);
}

function validate(res: NextApiResponse, body: AddPdfToCheckoutBody): boolean {
  if (!_.isString(body?.channel)) {
    sendValidationError(res, "Invalid channel");
    return false;
  }
  if (!_.isString(body?.checkoutId)) {
    sendValidationError(res, "Invalid checkoutId");
    return false;
  }
  if (!_.isString(body?.slug)) {
    sendValidationError(res, "Invalid slug");
    return false;
  }
  if (!_.isString(body?.hash)) {
    sendValidationError(res, "Invalid hash");
    return false;
  }
  if (!_.isArray(body?.variants) || !body.variants.every(_.isObject) || _.isEmpty(body.variants)) {
    sendValidationError(res, "Invalid variants, must be an array of objects (not empty)");
    return false;
  }
  for (const variant of body?.variants) {
    if (!_.isString(variant?.coverVariantId)) {
      sendValidationError(res, "Invalid coverVariantId");
      return false;
    }
    if (!_.isString(variant?.coverTextColor)) {
      sendValidationError(res, "Invalid coverTextColor");
      return false;
    }
    if (!_.isArray(variant?.coloredPages) || !variant.coloredPages.every(_.isNumber)) {
      sendValidationError(res, "Invalid coloredPages, must be an array of numbers");
      return false;
    }
    if (!_.isNumber(variant?.quantity)) {
      sendValidationError(res, "Invalid quantity, must be a number");
      return false;
    }
  }

  return true;
}
