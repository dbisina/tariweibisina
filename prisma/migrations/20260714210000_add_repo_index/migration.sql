-- CreateTable
CREATE TABLE "repo_index" (
    "id" TEXT NOT NULL,
    "repo_url" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "error" TEXT,
    "docs" JSONB NOT NULL,
    "updated_ts" BIGINT NOT NULL,

    CONSTRAINT "repo_index_pkey" PRIMARY KEY ("id")
);
