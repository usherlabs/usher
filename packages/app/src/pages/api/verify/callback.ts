/**
 * Reserved callback URL for use with Humanode OAuth2
 */
import { aql } from "arangojs";
import { setCookie, parseCookies } from "nookies";
import { Base64 } from "js-base64";

import { AuthUser, AuthApiRequest, ApiResponse } from "@/types";
import getHandler from "@/server/middleware";
import { getArangoClient } from "@/utils/arango-client";
import {
	getHumanodeOpenIdClient,
	getRedirectUri
} from "@/utils/humanode-client";

const handler = getHandler();

const arango = getArangoClient();

handler.get(async (req: AuthApiRequest, res: ApiResponse) => {
	const client = await getHumanodeOpenIdClient();
	const cookies = parseCookies({ req });

	req.log.debug({ cookies }, "Cookies");

	const { hn_code_verifier: codeVerifier } = cookies;

	// Get callback params with auth code.
	const params = client.callbackParams(req);
	let redir = "/verify/complete";
	let user = null;
	try {
		const state = JSON.parse(params.state ? Base64.decode(params.state) : "{}");
		if (state.redir) {
			redir += `?redir=${state.redir}`;
		}
		user = state.user as AuthUser;
	} catch (e) {
		// ...
	}

	const failureRedir = `/verify/failure`;
	if (user === null) {
		req.log.error("No user for personhood authentication");
		return res.redirect(302, failureRedir);
	}

	// If callback params have an error instead of auth code
	// render error page with description.
	if ("error" in params) {
		req.log.error(params, "Failed to process the Humanode PoP Verification");
		return res.redirect(302, failureRedir);
	}

	req.log.info("Processed the Humanode PoP Verification");

	// Exchange auth code for JWT token.
	const tokenSet = await client.callback(getRedirectUri(), params, {
		state: params.state,
		code_verifier: codeVerifier
	});
	// Save JWT.
	setCookie(
		{ res },
		"hn_access_token",
		Base64.encode(JSON.stringify(tokenSet)),
		{
			maxAge: 30 * 24 * 60 * 60 // 30 days
		}
	);

	const idToken = tokenSet.id_token || "";
	const [id] = idToken.split(".");

	req.log.info({ id }, "Personhood verification completed!");

	// Search for personhood entry already associated to this user
	// If it the same id -- pass the check
	// If it is a different id -- return error

	// Search for this personhood verify id not associated to this user
	// If this person has already verified for another account -- return error

	// Save Captcha result to the DB
	const cursor = await arango.query(aql`
		LET user = ${user}
		LET dids = (
			FOR u IN user
				UPSERT { _key: u.did }
				INSERT { _key: u.did, wallet: u.wallet }
				UPDATE { wallet: u.wallet }
				IN Dids OPTIONS { waitForSync: true }
				RETURN u.did
		)
		INSERT {
			"success": true,
			"created_at": ${Date.now()},
			"id": ${id},
			"response": ${tokenSet}
		}
		INTO PersonhoodEntries OPTIONS { waitForSync: true }
		LET inserted = NEW
		LET edges = (
			FOR d IN dids
				INSERT {
					_from: CONCAT("Dids/", d),
					_to: CONCAT("PersonhoodEntries/", inserted._key)
				} INTO Verifications
				RETURN NEW
		)
		RETURN {
			inserted: inserted,
			edges: edges
		}
	`);

	const results = await cursor.all();
	req.log.info({ results }, "Personhood entry saved");

	// Redirect end-user to root route.
	return res.redirect(302, redir);
});

export default handler;
