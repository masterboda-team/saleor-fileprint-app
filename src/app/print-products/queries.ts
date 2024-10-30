
import { AddProductBody } from "./add-print-poduct.handler";
import { GetPrintProductsResponse } from "./get-print-products.handler";

export async function addPrintProductQuery(data: AddProductBody): Promise<void> {
  try {
    await fetch("/api/print-products", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
  } catch (error) {
    console.error(error);
  }
}

export async function getPrintProductsQuery(channel: string): Promise<GetPrintProductsResponse> {
  try {
    const response = await fetch(`/api/print-products?channel=${channel}`);
    const data = await response.json();
    return data.data;
  } catch (error) {
    return [];
  }  
}

export async function deletePrintProductQuery(slug: string): Promise<void> {
  try {
    await fetch(`/api/print-products?slug=${slug}`, {
      method: "DELETE",
    });
  } catch (error) {
    console.error(error);
  }  
}
