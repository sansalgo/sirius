import { requirePageAccess } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import { AddCategoryModal } from "@/components/add-peer-recognition-category-modal";
import { CategoryRowActions } from "@/components/peer-recognition-category-row-actions";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

async function getData() {
  const { user } = await requirePageAccess("categories.manage");

  const [categories, settings] = await Promise.all([
    prisma.peerRecognitionCategory.findMany({
      where: { tenantId: user.tenantId },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        name: true,
        description: true,
        points: true,
        status: true,
      },
    }),
    prisma.tenantSettings.upsert({
      where: { tenantId: user.tenantId },
      update: {},
      create: { tenantId: user.tenantId },
      select: { peerAllocationLimit: true },
    }),
  ]);

  return { categories, peerAllocationLimit: settings.peerAllocationLimit };
}

export default async function PeerRecognitionCategoriesPage() {
  const { categories, peerAllocationLimit } = await getData();

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-start justify-end gap-4">
        <AddCategoryModal peerAllocationLimit={peerAllocationLimit} />
      </div>

      <div className="rounded-md border bg-background">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Points</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories.length ? (
              categories.map((category) => (
                <TableRow key={category.id}>
                  <TableCell className="font-medium">{category.name}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {category.description ?? "-"}
                  </TableCell>
                  <TableCell>{category.points}</TableCell>
                  <TableCell>
                    <Badge variant={category.status === "ACTIVE" ? "default" : "secondary"}>
                      {category.status === "ACTIVE" ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <CategoryRowActions
                      category={category}
                      peerAllocationLimit={peerAllocationLimit}
                    />
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  No categories yet. Add one to get started.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
