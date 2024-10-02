-- CreateTable
CREATE TABLE "app_settings" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "media_url" TEXT NOT NULL,

    CONSTRAINT "app_settings_pkey" PRIMARY KEY ("id")
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
CREATE UNIQUE INDEX "app_settings_id_key" ON "app_settings"("id");

-- CreateIndex
CREATE UNIQUE INDEX "uploaded_file_hash_key" ON "uploaded_file"("hash");
