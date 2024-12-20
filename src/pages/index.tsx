import { useAppBridge } from "@saleor/app-sdk/app-bridge";
import { Box, Button, Select, Text } from "@saleor/macaw-ui";
import { GetServerSideProps, NextPage } from "next";
import { useEffect, useState } from "react";
import { AddProductModal } from "../components/AddProductModal/AddProductModal";
import {
  FoundProductFragment,
  GetProductsQuery,
  GetProductsQueryVariables,
  GetProductsDocument,
  ChannelsDocument,
  ChannelsQuery,
  ChannelsQueryVariables,
} from "../../generated/graphql";
import { getSaleorClient } from "../app/connections";
import { deletePrintProductQuery, getPrintProductsQuery } from "../app/print-products/queries";
import { GetPrintProductsResponse } from "../app/print-products/get-print-products.handler";

interface PageProps {
  products: FoundProductFragment[];
  channels: ChannelsQuery["channels"];
}

export const getServerSideProps = (async () => {
  const gqlClient = await getSaleorClient();

  const productsResponse = await gqlClient
    .query<GetProductsQuery, GetProductsQueryVariables>(GetProductsDocument, {
      first: 100, // NOTE: 100 is the maximum number of products that can be fetched
    }, { requestPolicy: 'network-only' })
    .toPromise();
  const products = productsResponse.data?.products?.edges?.map(({ node }) => node) || [];

  const channelsResponse = await gqlClient
    .query<ChannelsQuery, ChannelsQueryVariables>(ChannelsDocument, {}, { requestPolicy: 'network-only' })
    .toPromise();
  const channels = channelsResponse.data?.channels || [];

  return { props: { products, channels } };
}) satisfies GetServerSideProps<PageProps>;

const IndexPage: NextPage<PageProps> = ({ products, channels }) => {
  const { appBridgeState, appBridge } = useAppBridge();
  const [mounted, setMounted] = useState(false);
  const [printProducts, setPrintProducts] = useState<GetPrintProductsResponse>([]);
  const [channel, setChannel] = useState<{ value: string; label: string } | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!appBridge) return;
    refetchPrintProducts();
  }, [appBridge, channel]);

  function refetchPrintProducts() {
    if (!channel) return;
    getPrintProductsQuery(channel.value).then(setPrintProducts);
  }

  async function deletePrintProduct(slug: string) {
    if (!channel) return;
    await deletePrintProductQuery(slug);
    refetchPrintProducts();
  }

  if (!appBridgeState?.ready || !mounted) {
    return (
      <Box padding={8}>
        <Text size={11}>Saleor File Print App deployed successfully 🚀</Text>
        <Text marginBottom={4} as={"p"}>
          Install this app in your Dashboard and get extra powers!
        </Text>
      </Box>
    );
  }

  return (
    <Box padding={8} display={"flex"} flexDirection={"column"} gap={6}>
      <Select
        label="Select channel"
        size="medium"
        value={channel}
        onChange={setChannel}
        options={channels?.map(c => ({ value: c.slug, label: c.name })) || []}
        style={{ maxWidth: "300px" }}
      />
      <Text size={9}>Print Products:</Text>
      {printProducts.map((product: any) => (
        <Box
          display={"flex"}
          flexDirection={"column"}
          key={product.id}
          gap={2}
          borderWidth={1}
          borderStyle={"solid"}
          borderColor={"default2"}
          padding={4}
          style={{ width: "300px" }}
        >
          <Text as={"p"}>slug: {product?.slug}</Text>
          <Text as={"p"}>cover: {product?.coverProduct?.name}</Text>
          <Text as={"p"}>page: {product?.pageProduct?.name}</Text>
          <Button variant="secondary" onClick={() => deletePrintProduct(product.slug)}>Delete</Button>
        </Box>
      ))}
      <AddProductModal products={products} onSuccess={refetchPrintProducts} />
    </Box>
  );
};

export default IndexPage;
