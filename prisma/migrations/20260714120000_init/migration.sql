-- CreateTable
CREATE TABLE "leads" (
    "id" TEXT NOT NULL,
    "ts" BIGINT NOT NULL,
    "source" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "contact" TEXT NOT NULL,
    "budget" TEXT,
    "detail" TEXT NOT NULL,
    "brief" JSONB,
    "channels" JSONB,

    CONSTRAINT "leads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "visits" (
    "id" TEXT NOT NULL,
    "ts" BIGINT NOT NULL,
    "path" TEXT NOT NULL,
    "ref" TEXT,

    CONSTRAINT "visits_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "visits_ts_idx" ON "visits"("ts");

-- CreateTable
CREATE TABLE "ad_config" (
    "id" TEXT NOT NULL,
    "config" JSONB NOT NULL,
    "updated_ts" BIGINT NOT NULL,

    CONSTRAINT "ad_config_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "studio_config" (
    "id" TEXT NOT NULL,
    "config" JSONB NOT NULL,
    "updated_ts" BIGINT NOT NULL,

    CONSTRAINT "studio_config_pkey" PRIMARY KEY ("id")
);
