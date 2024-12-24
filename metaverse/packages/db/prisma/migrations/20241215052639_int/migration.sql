/*
  Warnings:

  - You are about to drop the column `elementId` on the `Map` table. All the data in the column will be lost.
  - You are about to drop the column `x` on the `Map` table. All the data in the column will be lost.
  - You are about to drop the column `y` on the `Map` table. All the data in the column will be lost.
  - Added the required column `height` to the `Map` table without a default value. This is not possible if the table is not empty.
  - Added the required column `widhth` to the `Map` table without a default value. This is not possible if the table is not empty.
  - Added the required column `creatorId` to the `Space` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Map" DROP COLUMN "elementId",
DROP COLUMN "x",
DROP COLUMN "y",
ADD COLUMN     "height" INTEGER NOT NULL,
ADD COLUMN     "widhth" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "Space" ADD COLUMN     "creatorId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "MapElements" (
    "id" TEXT NOT NULL,
    "mapId" TEXT NOT NULL,

    CONSTRAINT "MapElements_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "MapElements" ADD CONSTRAINT "MapElements_mapId_fkey" FOREIGN KEY ("mapId") REFERENCES "Map"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
