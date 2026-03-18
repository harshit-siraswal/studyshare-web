import type { Metadata } from "next";
import { DepartmentProfileClient } from "@/components/DepartmentProfileClient";

export const metadata: Metadata = {
  title: "Department",
};

export default function DepartmentPage() {
  return <DepartmentProfileClient />;
}

