/*
  Warnings:

  - A unique constraint covering the columns `[name,phoneNumber]` on the table `Guest` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Guest_name_phoneNumber_key" ON "Guest"("name", "phoneNumber");
