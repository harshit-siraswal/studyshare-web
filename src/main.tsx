import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { GoogleReCaptchaProvider } from "react-google-recaptcha-v3";
import App from "./App";
import "./index.css";
import { AuthProvider } from "./context/AuthContext";
import { CollegeProvider } from "./context/CollegeContext";

const recaptchaSiteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY || '';

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <GoogleReCaptchaProvider
        reCaptchaKey={recaptchaSiteKey}
        scriptProps={{
          async: true,
          defer: true,
        }}
      >
        <AuthProvider>
          <CollegeProvider>
            <App />
          </CollegeProvider>
        </AuthProvider>
      </GoogleReCaptchaProvider>
    </BrowserRouter>
  </React.StrictMode>
);
