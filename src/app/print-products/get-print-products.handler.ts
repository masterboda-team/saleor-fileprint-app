import { NextApiRequest, NextApiResponse } from "next";
import { getPrisma, getSaleorClient } from "../connections";
import { sendNotFound, sendData, sendValidationError } from "../api.utils";
import {
  GetProductsQuery,
  GetProductsQueryVariables,
  GetProductsDocument,
  FoundProductFragment,
  FoundVariantFragment,
} from "../../../generated/graphql";
import _ from "lodash";

export type GetPrintProductsResponse = {
  id: number;
  slug: string;
  coverProduct: FoundProductFragment | null;
  pageProduct: FoundProductFragment | null;
  coloredPageVariant: FoundVariantFragment | null;
  grayscalePageVariant: FoundVariantFragment | null;
}[];

/**
 * GET /api/print-products
 *
 * Returns the print products matching the given slug. If no slug is given, returns all products.
 *
 * @param req.query.slug - The slug of the print product to return.
 * @param req.query.channel - The channel in which the products should be fetched.
 * @returns A JSON response with the following fields:
 * - `id`: The ID of the print product.
 * - `slug`: The slug of the print product.
 * - `coverProduct`: The cover product of the print product.
 * - `pageProduct`: The page product of the print product.
 * - `coloredPageVariant`: The colored page variant of the print product.
 * - `grayscalePageVariant`: The grayscale page variant of the print product.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse): Promise<void> {
  const { slug, channel } = req.query;

  // Validate
  if (!_.isString(channel)) {
    return sendValidationError(res, "channel is required");
  }

  const prisma = getPrisma();
  const saleor = await getSaleorClient();

  // Fetch the uploaded file from the database
  const printProducts = await prisma.printProducts.findMany({
    where: { slug: _.isString(slug) ? slug : undefined },
  });
  if (!printProducts) {
    return sendNotFound(res, "Products not found");
  }

  // Fetch the products from Saleor
  const productIds = [
    printProducts.map((product) => product.pageProductId),
    printProducts.filter((product) => !_.isNil(product.coverProductId)).map((product) => product.coverProductId) || [],
  ].flat() as string[];
  const productsResponse = await saleor
    .query<GetProductsQuery, GetProductsQueryVariables>(GetProductsDocument, {
      first: 100, // NOTE: 100 is the maximum number of products that can be fetched
      filter: {
        ids: productIds,
      },
      channel: channel as string,
    })
    .toPromise();
  const products = productsResponse.data?.products?.edges?.map(({ node }) => node) || [];

  // Format the response
  const data = [] as GetPrintProductsResponse;
  printProducts.forEach((product) => {
    const pageProduct = products.find((p) => p.id === product.pageProductId) || null;
    const coverProduct = products.find((p) => p.id === product.coverProductId) || null;
    const coloredPageVarinat = pageProduct
      ? pageProduct.variants?.find((v) => v.id === product.coloredPageVariantId) || null
      : null;
    const grayscalePageVarinat = pageProduct
      ? pageProduct.variants?.find((v) => v.id === product.grayscalePageVariantId) || null
      : null;
    data.push({
      id: product.id,
      slug: product.slug,
      pageProduct: pageProduct,
      coverProduct: coverProduct,
      coloredPageVariant: coloredPageVarinat,
      grayscalePageVariant: grayscalePageVarinat,
    });
  });

  sendData<GetPrintProductsResponse>(res, data);
}
