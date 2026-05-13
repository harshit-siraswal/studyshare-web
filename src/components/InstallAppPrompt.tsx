import { useEffect, useMemo, useState } from "react";
import { Download, Smartphone, X } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ANDROID_APP_VERSION, openAndroidApkDownload } from "@/lib/apk";
import { usePWAInstall } from "@/hooks/usePWAInstall";

const INSTALL_PROMPT_DISMISSED_KEY = "studyshare-install-prompt-dismissed";
const INSTALL_PROMPT_DELAY_MS = 1600;

function readSessionFlag(key: string) {
  try {
    return window.sessionStorage.getItem(key) === "1";
  } catch {
    return false;
  }
}

function writeSessionFlag(key: string) {
  try {
    window.sessionStorage.setItem(key, "1");
  } catch {
    // Ignore blocked storage; dismissal is a convenience only.
  }
}

export default function InstallAppPrompt() {
  const location = useLocation();
  const navigate = useNavigate();
  const { canInstall, isInstalled, promptInstall } = usePWAInstall();
  const [visible, setVisible] = useState(false);
  const [installing, setInstalling] = useState(false);

  const isAndroid = useMemo(
    () => typeof navigator !== "undefined" && /Android/i.test(navigator.userAgent),
    [],
  );

  useEffect(() => {
    if (
      typeof window === "undefined" ||
      isInstalled ||
      location.pathname === "/mobile-app" ||
      readSessionFlag(INSTALL_PROMPT_DISMISSED_KEY)
    ) {
      return;
    }

    const timer = window.setTimeout(() => {
      setVisible(true);
    }, INSTALL_PROMPT_DELAY_MS);

    return () => window.clearTimeout(timer);
  }, [isInstalled, location.pathname]);

  const dismiss = () => {
    writeSessionFlag(INSTALL_PROMPT_DISMISSED_KEY);
    setVisible(false);
  };

  const handleInstall = async () => {
    setInstalling(true);
    try {
      if (isAndroid) {
        const opened = await openAndroidApkDownload();
        if (opened) {
          dismiss();
          return;
        }
      }

      if (canInstall) {
        const accepted = await promptInstall();
        if (accepted) {
          dismiss();
          return;
        }
      }

      navigate("/mobile-app");
      dismiss();
    } finally {
      setInstalling(false);
    }
  };

  if (!visible || isInstalled) {
    return null;
  }

  return (
    <div className="fixed inset-x-3 bottom-4 z-50 mx-auto max-w-md sm:inset-x-auto sm:right-4 sm:mx-0">
      <div className="rounded-lg border border-border bg-card/95 p-3 text-card-foreground shadow-2xl backdrop-blur">
        <div className="flex gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Smartphone className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold leading-tight">Install StudyShare</p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  Open notes, notices, AI tools, and campus updates faster from the app.
                </p>
              </div>
              <button
                type="button"
                onClick={dismiss}
                className="rounded-md p-1 text-muted-foreground transition hover:bg-muted hover:text-foreground"
                aria-label="Dismiss install prompt"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-3 flex items-center gap-2">
              <Button
                type="button"
                size="sm"
                onClick={handleInstall}
                disabled={installing}
                className="h-8 rounded-md px-3 text-xs"
              >
                <Download className="h-3.5 w-3.5" />
                <span className="ml-1.5">
                  {isAndroid ? `Install APK v${ANDROID_APP_VERSION}` : canInstall ? "Add to Home Screen" : "Get App"}
                </span>
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => {
                  navigate("/mobile-app");
                  dismiss();
                }}
                className="h-8 rounded-md px-3 text-xs"
              >
                Details
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
