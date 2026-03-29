-- CreateTable
CREATE TABLE "Content"."Tags" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Content"."TagTranslations" (
    "id" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,
    "language" "Authentication"."Language" NOT NULL,
    "label" TEXT NOT NULL,

    CONSTRAINT "TagTranslations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Content"."ArticleTags" (
    "articleId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,

    CONSTRAINT "ArticleTags_pkey" PRIMARY KEY ("articleId","tagId")
);

-- CreateIndex
CREATE UNIQUE INDEX "Tags_slug_key" ON "Content"."Tags"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "TagTranslations_tagId_language_key" ON "Content"."TagTranslations"("tagId", "language");

-- CreateIndex
CREATE UNIQUE INDEX "TagTranslations_label_language_key" ON "Content"."TagTranslations"("label", "language");

-- AddForeignKey
ALTER TABLE "Content"."TagTranslations" ADD CONSTRAINT "TagTranslations_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Content"."Tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Content"."ArticleTags" ADD CONSTRAINT "ArticleTags_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Content"."Articles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Content"."ArticleTags" ADD CONSTRAINT "ArticleTags_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Content"."Tags"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
