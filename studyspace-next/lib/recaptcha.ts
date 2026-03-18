export async function getRecaptchaToken(
  executeRecaptcha?: (action: string) => Promise<string>,
  action = "follow_request"
): Promise<string | undefined> {
  if (executeRecaptcha) {
    try {
      const token = await executeRecaptcha(action);
      if (token) return token;
    } catch (error) {
      console.warn("reCAPTCHA execute failed:", error);
    }
  }

  if (typeof window !== "undefined" && (window as any).grecaptcha) {
    try {
      const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || "";
      if (!siteKey) return undefined;
      const token = await (window as any).grecaptcha.execute(siteKey, { action });
      if (token) return token;
    } catch (error) {
      console.warn("reCAPTCHA fallback failed:", error);
    }
  }

  return undefined;
}

