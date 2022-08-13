/* ========== BASE ========== */

export const isProd = process.env.NODE_ENV === "production";
export const isTest = process.env.NODE_ENV === "test";
export const appPackageName = process.env.APP_NAME;
export const appVersion = process.env.APP_VERSION;
export const appName = `${appPackageName}@${appVersion}`;
export const useSeedData = process.env.NEXT_PUBLIC_USE_SEED_DATA === "true";
export const arweaveLocalPort = process.env.NEXT_PUBLIC_ARWEAVE_LOCAL_PORT;

export const ngrokUrl = process.env.NEXT_PUBLIC_NGROK_URL;

/* ========== TRACKING ========== */
export const sentry = {
	dsn: process.env.NEXT_PUBLIC_SENTRY_DSN || "",
	release: process.env.NEXT_PUBLIC_SENTRY_RELEASE || appName
};

export const gaTrackingId = process.env.NEXT_PUBLIC_GA_TRACKING_ID || "";
export const logrocketAppId = process.env.NEXT_PUBLIC_LOGROCKET_APP_ID || "";
export const mixpanelAppId = process.env.NEXT_PUBLIC_MIXPANEL_APP_ID || "";
export const mauticOrigin = process.env.NEXT_PUBLIC_MAUTIC_ORIGIN || "";
export const juneApiKey = process.env.NEXT_PUBLIC_JUNE_API_KEY || "";

/* ========== DATA/API ========== */
export const ceramicUrl =
	process.env.NEXT_PUBLIC_CERAMIC_URL || "https://ceramic-clay.3boxlabs.com";

export const hcaptchaSiteKey = process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY;

export const magicPublicKey = process.env.NEXT_PUBLIC_MAGIC_KEY;

export const validatorApiEndpoint =
	process.env.NEXT_PUBLIC_VALIDATOR_API_ENDPOINT;

/* ========== SECURITY ========== */
export const inviteOrigin = process.env.NEXT_PUBLIC_INVITE_ORIGIN;

export const botdPublicKey = process.env.NEXT_PUBLIC_BOTD_PUBLIC_KEY;
