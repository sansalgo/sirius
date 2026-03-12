"use client";

import { usePathname } from "next/navigation";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";

const routeLabels: Record<string, string> = {
  dashboard: "Leaderboard",
  rewards: "Rewards",
  "my-rewards": "My Rewards",
  redemptions: "Redemptions",
  points: "Points",
  recognition: "Recognition",
  challenges: "Challenges",
  employees: "Employees",
  settings: "Settings",
};

function formatSegment(segment: string) {
  return segment
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function DashboardBreadcrumb() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);
  const currentSegment = segments[segments.length - 1] ?? "dashboard";
  const currentPage = routeLabels[currentSegment] ?? formatSegment(currentSegment);

  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbPage>{currentPage}</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
}
