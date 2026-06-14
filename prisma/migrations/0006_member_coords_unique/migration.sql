-- AlterTable: remember each member's coordinates from the autocomplete pick.
ALTER TABLE "group_members" ADD COLUMN "lat" DOUBLE PRECISION;
ALTER TABLE "group_members" ADD COLUMN "lon" DOUBLE PRECISION;

-- Drop any pre-existing duplicates (same person+address in a group) before the
-- unique index, keeping the earliest row.
DELETE FROM "group_members" a
  USING "group_members" b
  WHERE a.id > b.id
    AND a.group_id = b.group_id
    AND a.name = b.name
    AND a.address = b.address;

-- CreateIndex
CREATE UNIQUE INDEX "group_members_group_id_name_address_key" ON "group_members"("group_id", "name", "address");
