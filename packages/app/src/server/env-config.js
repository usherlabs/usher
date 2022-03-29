export const isProd = process.env.NODE_ENV === "production";
export const logLevel = process.env.LOG_LEVEL || "info";
export const publicUrl = process.env.PUBLIC_URL || "";

export const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY || "";

export const discord = {
	// clientId: process.env.DISCORD_CLIENT_ID || "";
	// clientSecret: process.env.DISCORD_CLIENT_SECRET || "";
	guildId: process.env.DISCORD_GUILD_ID || "",
	inviteChannelId: process.env.DISCORD_INVITE_CHANNEL_ID || "",
	botToken: process.env.DISCORD_BOT_TOKEN || ""
};

export const hcaptchaSecretKey = process.env.HCAPTCHA_SECRET_KEY;

export const typingDnaApiKey = process.env.NEXT_PUBLIC_TYPINGDNA_API_KEY;
export const typingDnaSecretKey = process.env.TYPINGDNA_SECRET_KEY;
