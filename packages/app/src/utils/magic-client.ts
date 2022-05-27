// See for reference: https://github.com/magiclabs/magic-js/blob/master/packages/%40magic-sdk/pnp/src/types.ts

import type OAuthExtension from "@magic-ext/oauth/dist/types/index.cdn";
import type CDNMagic from "magic-sdk/dist/types/index.cdn";

declare global {
	interface Window {
		Magic: typeof CDNMagic;
		MagicOAuthExtension?: typeof OAuthExtension;
	}
}

export default () => {
	return window.Magic;
};
