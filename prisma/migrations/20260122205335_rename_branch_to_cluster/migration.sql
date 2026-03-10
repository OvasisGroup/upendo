/*
  Warnings:

  - You are about to drop the column `branchId` on the `Member` table. All the data in the column will be lost.
  - You are about to drop the `Branch` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Branch" DROP CONSTRAINT "Branch_saccoId_fkey";

-- DropForeignKey
ALTER TABLE "Member" DROP CONSTRAINT "Member_branchId_fkey";

-- AlterTable
ALTER TABLE "Member" DROP COLUMN "branchId",
ADD COLUMN     "clusterId" TEXT,
ALTER COLUMN "status" SET DEFAULT 'PENDING';

-- DropTable
DROP TABLE "Branch";

-- CreateTable
CREATE TABLE "Cluster" (
    "id" TEXT NOT NULL,
    "saccoId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Cluster_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MemberApproval" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "approverId" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "status" "ApprovalStatus" NOT NULL DEFAULT 'PENDING',

    CONSTRAINT "MemberApproval_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MemberApproval_memberId_role_key" ON "MemberApproval"("memberId", "role");

-- AddForeignKey
ALTER TABLE "Cluster" ADD CONSTRAINT "Cluster_saccoId_fkey" FOREIGN KEY ("saccoId") REFERENCES "Sacco"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Member" ADD CONSTRAINT "Member_clusterId_fkey" FOREIGN KEY ("clusterId") REFERENCES "Cluster"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemberApproval" ADD CONSTRAINT "MemberApproval_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
