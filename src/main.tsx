import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { GoogleReCaptchaProvider } from "react-google-recaptcha-v3";
import { HelmetProvider } from "react-helmet-async";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import App from "./App";
import "./index.css";
import { AuthProvider } from "./context/AuthContext";
import { CollegeProvider } from "./context/CollegeContext";
import { TimerProvider } from "./context/TimerContext";

const recaptchaSiteKey = (import.meta.env.VITE_RECAPTCHA_SITE_KEY || '').trim();

// Performance optimization: Configure React Query cache
// staleTime: Data considered fresh for 5 minutes (won't refetch)
// gcTime: Cache kept for 30 minutes before garbage collection
// refetchOnWindowFocus: Disabled to prevent unnecessary refetches
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,      // 5 minutes
      gcTime: 30 * 60 * 1000,        // 30 minutes (previously cacheTime)
      refetchOnWindowFocus: false,   // Don't refetch when tab regains focus
      refetchOnReconnect: true,      // Still refetch on network reconnect
      retry: 2,                      // Retry failed requests twice
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
  },
});

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <HelmetProvider>
        <BrowserRouter>
          {recaptchaSiteKey ? (
            <GoogleReCaptchaProvider
              reCaptchaKey={recaptchaSiteKey}
              scriptProps={{
                async: true,
                defer: true,
              }}
            >
              <AuthProvider>
                <CollegeProvider>
                  <TimerProvider>
                    <App />
                  </TimerProvider>
                </CollegeProvider>
              </AuthProvider>
            </GoogleReCaptchaProvider>
          ) : (
            <AuthProvider>
              <CollegeProvider>
                <TimerProvider>
                  <App />
                </TimerProvider>
              </CollegeProvider>
            </AuthProvider>
          )}
        </BrowserRouter>
      </HelmetProvider>
    </QueryClientProvider>
  </React.StrictMode>
);
