import type { Metadata } from "next";
import { DepartmentNoticesClient } from "@/components/DepartmentNoticesClient";

export const metadata: Metadata = {
  title: "Department Notices",
};

export default function DepartmentNoticesPage() {
  return <DepartmentNoticesClient />;
}

