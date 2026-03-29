-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "Content";

-- CreateTable
CREATE TABLE "Content"."Categories" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "language" "Authentication"."Language" NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "image" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "parentGroupId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Categories_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Categories_slug_language_key" ON "Content"."Categories"("slug", "language");

-- CreateIndex
CREATE UNIQUE INDEX "Categories_groupId_language_key" ON "Content"."Categories"("groupId", "language");
