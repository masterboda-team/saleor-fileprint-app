import handlerGet from "../../../app/print-products/get-print-products.handler";
import handlerPost from "../../../app/print-products/add-print-poduct.handler";
import handlerDelete from "../../../app/print-products/delete-print-product.handler";
import { sendValidationError } from "../../../app/api.utils";
import { NextApiRequest, NextApiResponse } from "next";


export default async function handler(req: NextApiRequest, res: NextApiResponse): Promise<void> {
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,DELETE");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    return res.status(200).send("");
  }

  if (req.method === "GET")
    return handlerGet(req, res);
  if (req.method === "POST")
    return handlerPost(req, res);
  if (req.method === "DELETE")
    return handlerDelete(req, res);

  return sendValidationError(res, "Method Not Allowed");
}
