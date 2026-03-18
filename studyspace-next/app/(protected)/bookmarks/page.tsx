import type { Metadata } from "next";
import { BookmarksClient } from "@/components/BookmarksClient";

export const metadata: Metadata = {
  title: "Bookmarks",
};

export default function BookmarksPage() {
  return <BookmarksClient />;
}
