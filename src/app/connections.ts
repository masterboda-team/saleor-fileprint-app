import { PrismaClient } from "@prisma/client";
import { Client } from "urql";
import { saleorApp } from "../saleor-app";
import { createClient } from "../lib/create-graphq-client";

let _prisma: PrismaClient;
let _saleorClient: Client;

/**
 * Returns a PrismaClient singleton instance.
 *
 * @returns {PrismaClient}
 */
export const getPrisma = () => {
  if (!_prisma) {
    _prisma = new PrismaClient({ log: ["query", "info", "warn", "error"] });
  }
  return _prisma;
};

/**
 * Returns a Saleor GraphQL client instance.
 *
 * The client is created using the APL and SALEOR_API_URL environment variable.
 * The client is cached and reused for subsequent calls.
 *
 * @returns {Promise<Client>} A Promise that resolves with the Saleor GraphQL client instance.
 */
export const getSaleorClient = async (): Promise<Client> => {
  if (!_saleorClient) {
    const apiUrl = process.env.SALEOR_API_URL || "";
    const authData = await saleorApp.apl.get(apiUrl || "");
    _saleorClient = createClient(apiUrl, async () => ({ token: authData?.token || "" }));
  }
  return _saleorClient;
};
