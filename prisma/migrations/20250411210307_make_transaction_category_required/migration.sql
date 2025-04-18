/*
  Warnings:

  - Made the column `category_id` on table `transactions` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "transactions" DROP CONSTRAINT "transactions_category_id_fkey";

-- AlterTable
ALTER TABLE "transactions" ALTER COLUMN "category_id" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
