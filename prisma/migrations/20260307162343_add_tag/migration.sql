-- CreateTable
CREATE TABLE "Content"."Tags" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "language" "Authentication"."Language" NOT NULL,

    CONSTRAINT "Tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Content"."ArticleTags" (
    "articleId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,

    CONSTRAINT "ArticleTags_pkey" PRIMARY KEY ("articleId","tagId")
);

-- CreateIndex
CREATE UNIQUE INDEX "Tags_slug_language_key" ON "Content"."Tags"("slug", "language");

-- CreateIndex
CREATE UNIQUE INDEX "Tags_name_language_key" ON "Content"."Tags"("name", "language");

-- AddForeignKey
ALTER TABLE "Content"."ArticleTags" ADD CONSTRAINT "ArticleTags_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Content"."Articles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Content"."ArticleTags" ADD CONSTRAINT "ArticleTags_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Content"."Tags"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
