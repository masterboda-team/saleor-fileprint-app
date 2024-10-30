import { Modal, Button, Box, Select, Input } from "@saleor/macaw-ui";
import { FoundProductFragment } from "../../../generated/graphql";
import { useState } from "react";

interface AddProductModalProps {
  products?: FoundProductFragment[];
  onSuccess?: () => void;
}

/**
 * A modal component for adding a print product.
 *
 * @param products - List of products to select from.
 * @param onSuccess - Callback to call when the product is added.
 *
 * @returns A modal component.
 */
export function AddProductModal({ products = [], onSuccess }: AddProductModalProps) {
  const [slug, setSlug] = useState<string>("");
  const [coverProductId, setCoverProductId] = useState<{value: string, label: string} | null>(null);
  const [pageProductId, setpageProductId] = useState<{value: string, label: string} | null>(null);
  const [grayscalePageVariantId, setgrayscalePageVariantId] = useState<{value: string, label: string} | null>(null);
  const [colorVariantId, setColorVariantId] = useState<{value: string, label: string} | null>(null);

  const coverOprtions = products.map((product) => ({ value: product.id, label: product.name }));
  const printProduct = products.find((product) => product.id === pageProductId?.value) || null;
  const variantsOprtions = printProduct?.variants?.map((variant) => ({ value: variant.id, label: variant.name })) || [];

  const onSelectPrintProduct = (option: {value: string, label: string}) => {
    setpageProductId(option);
  };

  const onAddProduct = async () => {
    if (!slug || !pageProductId || !grayscalePageVariantId || !colorVariantId) {
      return // TODO: show error
    }
    await fetch('/api/print-products', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        slug,
        coverProductId: coverProductId?.value || null,
        pageProductId: pageProductId?.value,
        grayscalePageVariantId: grayscalePageVariantId?.value,
        coloredPageVariantId: colorVariantId?.value
      })
    });

    onSuccess?.();
  }

  return (
    <Modal>
      <Modal.Trigger>
        <Button variant="primary" width={52}>Add product</Button>
      </Modal.Trigger>
      <Modal.Content>
        <Box
          __left="50%"
          __maxWidth="400px"
          __top="50%"
          __transform="translate(-50%, -50%)"
          backgroundColor="default1"
          boxShadow="defaultModal"
          position="fixed"
        >
          <Box
            display="flex"
            gap={3}
            justifyContent="center"
            flexDirection="column"
            __gap={20}
            padding={10}
            width={"100%"}
          >
            <Input
              label="Slug"
              size="large"
              value={slug}
              onChange={(event) => setSlug(event.target.value)}
            />
            <Select
              label="Select cover product"
              size="large"
              value={coverProductId}
              onChange={setCoverProductId}
              options={coverOprtions}
            />
            <Select
              label="Select page product"
              size="large"
              value={pageProductId}
              onChange={onSelectPrintProduct}
              options={coverOprtions}
            />
            <Select
              label="Select grayscale page variant"
              size="large"
              value={grayscalePageVariantId}
              onChange={setgrayscalePageVariantId}
              options={variantsOprtions}
            />
            <Select
              label="Select color page variant"
              size="large"
              value={colorVariantId}
              onChange={setColorVariantId}
              options={variantsOprtions}
            />
            <Button onClick={onAddProduct} variant="primary">Add</Button>
          </Box>
        </Box>
      </Modal.Content>
      <Modal.Close>
        <Button size="small" variant="tertiary" />
      </Modal.Close>
    </Modal>
  );
}
