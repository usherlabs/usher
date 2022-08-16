/**
 * An Admin ONLY File used for managing Auth Instance from within the Browser.
 */

import * as uint8arrays from "uint8arrays";
import Authenticate from "@/modules/auth";
import getArConnect from "@/utils/arconnect";
import { Chains } from "./types";

const authInstance = Authenticate.getInstance();

export const UsherAdmin = {
	auth() {
		return authInstance;
	},
	async arSign(message: string) {
		const auths = authInstance.getAll();
		const arAuth = auths.find((auth) => auth.wallet.chain === Chains.ARWEAVE);
		if (!arAuth) {
			console.log("Arweave Wallet is not Connected");
			return;
		}
		const arconnect = getArConnect();
		const res = await arconnect.signature(uint8arrays.fromString(message), {
			name: "RSA-PSS",
			hash: {
				name: "SHA-256"
			}
		});
		console.log(res);
	},
	async destroyOwner() {
		const auths = authInstance.getAll();
		await Promise.all(auths.map((auth) => auth.setShareableOwnerId("")));
		console.log(
			"Auth Owner IDs have been Reset!",
			await Promise.all(auths.map((auth) => auth.getShareableOwnerId()))
		);
	}
};

if (typeof window !== "undefined") {
	// @ts-ignore
	window.UsherAdmin = UsherAdmin;
}
