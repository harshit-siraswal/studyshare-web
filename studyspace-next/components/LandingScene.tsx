'use client';

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { MobileLandingFallback } from "@/features/landing3d/fallback/MobileLandingFallback";
import { openAndroidApkDownload } from "@/lib/apk";
import { toast } from "sonner";

export function LandingScene() {
  const router = useRouter();

  const handleContinue = () => {
    router.push("/select-college");
  };

  const handleDownload = async () => {
    const opened = await openAndroidApkDownload();
    if (!opened) {
      toast.error("APK download is temporarily unavailable. Please try again later.");
    }
  };

  const SpatialLanding = dynamic(() => import("@/features/landing3d/SpatialLanding"), {
    ssr: false,
    loading: () => (
      <MobileLandingFallback onContinue={handleContinue} onDownload={handleDownload} />
    ),
  });

  return <SpatialLanding />;
}
