/**
 * Here we implement https://github.com/magiclabs/magic-js/blob/master/packages/%40magic-sdk/pnp/src/context/callback.ts
 * We've modified the PNP logic to work with our local Magic SDK.
 */

import { useEffect } from "react";
// import { Magic } from "magic-sdk";

import UserProvider from "@/providers/User";
import Preloader from "@/components/Preloader";
// import { useUser } from "@/hooks";
// import { Connections } from "@/types";
import { magic } from "@/utils/magic-client";

// https://github.com/pubkey/broadcast-channel -- to prevent multiple tabs from processing the same connection.

type CallbackType = "oauth" | "magic_credential" | "settings";

class MagicPNP {
	private urlParams;

	constructor() {
		const queryString = window.location.search;
		this.urlParams = new URLSearchParams(queryString);
	}

	public async handleOAuthCallback() {
		if (!magic) {
			return {};
		}
		const res = await magic.oauth.getRedirectResult();
		return {
			idToken: res.magic.idToken,
			userMetadata: res.magic.userMetadata,
			oauth: res.oauth
		};
	}

	public async handleMagicLinkRedirectCallback() {
		if (!magic) {
			return {};
		}
		const idToken = await magic.auth.loginWithCredential();
		const userMetadata = await magic.user.getMetadata();
		return { idToken, userMetadata };
	}

	public async handleSettingsCallback() {
		if (!magic) {
			return {};
		}
		const idToken = await magic.user.getIdToken();
		const prevUserMetadata =
			magic.pnp.decodeUserMetadata(this.urlParams.get("prev_user_metadata")) ??
			undefined;
		const currUserMetadata =
			magic.pnp.decodeUserMetadata(this.urlParams.get("curr_user_metadata")) ??
			(await magic.user.getMetadata());
		this.clearURLQuery();
		return { idToken, userMetadata: currUserMetadata, prevUserMetadata };
	}

	/**
	 * Generically handles auth callback for methods where
	 * a redirect in not applicable. Examples include:
	 *
	 * - SMS login
	 * - Magic link login w/o `redirectURI`
	 * - WebAuthn login
	 * - Cases where the user has landed direclty
	 *   on the callback page without a redirect
	 */
	public async handleGenericCallback() {
		if (!magic) {
			return {};
		}
		const idToken =
			this.urlParams.get("didt") || (await magic.user.getIdToken());
		const userMetadata = await magic.user.getMetadata();
		this.clearURLQuery();
		return { idToken: decodeURIComponent(idToken), userMetadata };
	}

	public clearURLQuery() {
		const urlWithoutQuery = window.location.origin + window.location.pathname;
		window.history.replaceState(null, "", urlWithoutQuery);
	}

	public getCallbackType(): CallbackType | null {
		const { urlParams } = this;
		if (urlParams.get("state")) {
			return "oauth";
		}

		if (urlParams.get("magic_credential")) {
			return "magic_credential";
		}

		if (urlParams.get("prev_user_metadata")) {
			return "settings";
		}

		return null;
	}

	public async handle() {
		switch (this.getCallbackType()) {
			case "oauth":
				return this.handleOAuthCallback();
			case "magic_credential":
				return this.handleMagicLinkRedirectCallback();
			case "settings":
				return this.handleSettingsCallback();
			default:
				return this.handleGenericCallback();
		}
	}
}

const Screen = () => {
	// const {
	// 	actions: { connect }
	// } = useUser();

	useEffect(() => {
		if (typeof window !== "undefined") {
			(async () => {
				const magicPnp = new MagicPNP();
				const response = await magicPnp.handle();
				// Do something with the email -- response.userMetadata.email
				console.log(response);
				window.location.href = "/";
			})();
		}
	}, []);

	return <Preloader message="Connecting with Magic..." />;
};

const MagicCallback = () => {
	return (
		<UserProvider>
			<Screen />
		</UserProvider>
	);
};

export default MagicCallback;
