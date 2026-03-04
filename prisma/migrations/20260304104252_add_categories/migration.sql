-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "Content";

-- CreateTable
CREATE TABLE "Content"."Categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "image" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Content"."CategoryTranslations" (
    "id" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "language" "Authentication"."Language" NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "CategoryTranslations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Categories_slug_key" ON "Content"."Categories"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "CategoryTranslations_categoryId_language_key" ON "Content"."CategoryTranslations"("categoryId", "language");

-- AddForeignKey
ALTER TABLE "Content"."CategoryTranslations" ADD CONSTRAINT "CategoryTranslations_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Content"."Categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
