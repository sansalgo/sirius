"use client";

import { AddCategoryModal } from "@/components/add-peer-recognition-category-modal";
import { Button } from "@/components/ui/button";

type Category = {
  id: string;
  name: string;
  description: string | null;
  points: number;
  status: "ACTIVE" | "INACTIVE";
};

type CategoryRowActionsProps = {
  category: Category;
  peerAllocationLimit: number;
};

export function CategoryRowActions({ category, peerAllocationLimit }: CategoryRowActionsProps) {
  return (
    <AddCategoryModal
      peerAllocationLimit={peerAllocationLimit}
      category={category}
      trigger={
        <Button variant="outline" size="sm">
          Edit
        </Button>
      }
    />
  );
}
