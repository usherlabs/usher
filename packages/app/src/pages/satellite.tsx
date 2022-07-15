import { useEffect } from "react";
import Framebus from "framebus";
import cuid from "cuid";
import { fromString } from "uint8arrays";
import { DID } from "dids";
import { getResolver as getKeyResolver } from "key-did-resolver";
import { Ed25519Provider } from "key-did-provider-ed25519";
import { Base64 } from "js-base64";
import { randomString } from "@stablelib/random";
import nookies, { parseCookies } from "nookies";
import { GetServerSideProps } from "next";

import { getAuthRequest } from "@/api";
import { ConversionTrack } from "@/types";
import handleException from "@/utils/handle-exception";
import ono from "@jsdevtools/ono";
import getReferralTokenKey from "@/utils/get-referral-token-key";
import { REFERRAL_COOKIE_OPTIONS } from "@/constants";

type Cookies = { [key: string]: string };

const bus = new Framebus({
	channel: "usher_sat"
});

const startSatellite = (cookies: Cookies) => {
	console.log("[SATELLITE]", cookies);

	bus.on("convert", async (busParams) => {
		try {
			const conversion = busParams as ConversionTrack;

			console.log("[SATELLITE]", conversion);

			const tokenKey = getReferralTokenKey(conversion.id, conversion.chain);

			const token = cookies[tokenKey];
			// let visitorId;

			if (!token) {
				console.error(`[USHER] No token received from a valid referral`);
				return;
			}
			if (
				!conversion.id ||
				!conversion.chain ||
				typeof conversion.eventId !== "number"
			) {
				console.error(
					`[USHER] Campaign 'id', 'chain' and 'eventId' must be specified to track a conversion`
				);
				return;
			}

			// Authenticate a DID
			// let entropy = new Uint8Array();
			// if (visitorId) {
			// 	const hash = new Sha256();
			// 	hash.update(visitorId);
			// 	entropy = await hash.digest();
			// } else {
			// }
			// TODO: Creating an ID for the browser at the point of conversion should be stored so that the same ID is used
			const entropy = fromString([cuid(), randomString(6)].join("_"));

			const did = new DID({
				// Get the DID provider from the 3ID Connect instance
				provider: new Ed25519Provider(entropy),
				resolver: getKeyResolver()
			});
			await did.authenticate();

			// Produce the DID Auth Token
			const nonce = randomString(32);
			const sig = await did.createJWS(nonce, { did: did.id });
			const raw = [[did.id, sig]];
			const authToken = Base64.encode(JSON.stringify(raw));

			const request = getAuthRequest(authToken);

			// Start the conversion using the referral token
			const response: { success: boolean; data: { code: string } } =
				await request
					.get(
						`conversions?id=${conversion.id}&chain=${conversion.chain}&token=${token}`
					)
					.json();
			if (!response.success) {
				console.error(
					`Failed to convert start conversion using referral token`
				);
				throw ono(
					"[SATELLITE] Failed to convert start conversion using referral token"
				);
			}

			const { code } = response.data;

			// This part will eventually be replaced with a syndication of data to the decentralised DPK network
			const saveResponse: {
				success: boolean;
				data: { conversion: string; partnership: string };
				message?: string;
			} = await request
				.post("conversions", {
					json: {
						code,
						...conversion
					}
				})
				.json();

			if (!saveResponse.success) {
				console.error(
					`[USHER] Could not save conversion: ${saveResponse.message || ""}`
				);
				throw ono(`[SATELLITE] Could not save conversion`, saveResponse);
			}

			// Destroy the key on success
			// lscache.remove(tokenKey);

			// Notify the host
			bus.emit("conversion", {
				conversion,
				did: did.id,
				response: saveResponse.data
			});
		} catch (e) {
			handleException(e);
		}
	});

	bus.emit("loaded");
};

type Props = {
	cookies: Cookies;
};

const Satellite: React.FC<Props> = ({ cookies }) => {
	useEffect(() => {
		startSatellite(cookies);
	}, []);

	return null;
};

export const getServerSideProps: GetServerSideProps = async (ctx) => {
	const cookies = nookies.get(ctx);

	const { res, query } = ctx;
	try {
		console.log(query);
		if (!(query && query.param)) {
			throw new Error("No param to continue Inviting");
		}

		console.log(Base64.decode(query.param as string));
		const dec = JSON.parse(Base64.decode(query.param as string));
		console.log(dec);
		const { key, value, url } = dec;

		nookies.set(ctx, key, value, REFERRAL_COOKIE_OPTIONS);

		res.writeHead(302, {
			Location: url
		});
		res.end();
	} catch (e) {
		// ...
	}

	console.log("cookies", cookies);
	console.log("cookies after", nookies.get(ctx));

	return {
		props: {
			noUser: true,
			cookies
		}
	};
};

export default Satellite;
