-- CreateEnum
CREATE TYPE "ProcessStatus" AS ENUM ('DONE', 'ERROR', 'NOT_PROCESSED');

-- CreateTable
CREATE TABLE "print_products" (
    "id" SERIAL NOT NULL,
    "slug" TEXT NOT NULL,
    "cover_product_id" TEXT,
    "pages_product_id" TEXT NOT NULL,
    "grayscale_page_variant_id" TEXT NOT NULL,
    "colored_page_variant_id" TEXT NOT NULL,

    CONSTRAINT "print_products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "uploaded_file" (
    "id" SERIAL NOT NULL,
    "hash" VARCHAR(32) NOT NULL,
    "extension" VARCHAR(16) NOT NULL,
    "name" VARCHAR(127) NOT NULL,
    "page_count" INTEGER,
    "colored_pages" JSONB,
    "created" TIMESTAMPTZ(6),
    "description" TEXT NOT NULL,
    "text_attribute_id" INTEGER,
    "base_url" VARCHAR(127) NOT NULL,
    "process_status" "ProcessStatus" NOT NULL DEFAULT 'NOT_PROCESSED',

    CONSTRAINT "uploaded_file_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "uploaded_file_line" (
    "id" SERIAL NOT NULL,
    "choosed_colored_pages" JSONB,
    "duplex" BOOLEAN,
    "file_id" VARCHAR(32),
    "role" VARCHAR(16) NOT NULL,
    "created" TIMESTAMPTZ(6),
    "hash" VARCHAR(32),
    "copies" INTEGER NOT NULL,
    "name" VARCHAR(127),
    "checkout_id" UUID,
    "order_token" UUID,
    "pages_per_sheet" INTEGER,
    "cover_id" VARCHAR(32),

    CONSTRAINT "uploaded_file_line_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "print_products_slug_key" ON "print_products"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "uploaded_file_hash_key" ON "uploaded_file"("hash");
