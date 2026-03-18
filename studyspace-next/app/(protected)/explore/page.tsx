import type { Metadata } from "next";
import { ExploreClient } from "@/components/ExploreClient";

export const metadata: Metadata = {
  title: "Explore",
};

export default function ExplorePage() {
  return <ExploreClient />;
}
