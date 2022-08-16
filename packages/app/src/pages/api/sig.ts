import { TileDocument } from "@ceramicnetwork/stream-tile";
import { z } from "zod";
import { Base64 } from "js-base64";
import * as uint8arrays from "uint8arrays";
import { aql } from "arangojs";
import isEmpty from "lodash/isEmpty";
import { TileLoader } from "@glazed/tile-loader";
import { ShareableOwnerModel } from "@usher.so/datamodels";
import cors from "cors";

import { PartnershipData } from "@/types";
import { useRouteHandler, expressMiddleware } from "@/server/middleware";
import { getAppDID } from "@/server/did";
import { getArangoClient } from "@/utils/arango-client";
import { ceramic } from "@/utils/ceramic-client";
import { REFERRAL_TOKEN_DELIMITER } from "@/constants";

const handler = useRouteHandler();

const arango = getArangoClient();

const loader = new TileLoader({ ceramic });

const schema = z.object({
	id: z.string(),
	token: z.string()
});

const isPartnershipStreamValid = (stream: TileDocument<PartnershipData>) => {
	return (
		stream.content.address &&
		stream.controllers.length > 0 &&
		stream.metadata.schema === ShareableOwnerModel.schemas.partnership
	);
};

/**
 * GET: Accepts encypted token unique to the Referred User to fetch the Network DID Signature
 * POST: Uses the conversion code to submit conversion data and save a conversion
 */

// Initializing the cors middleware
handler.router
	.use(
		expressMiddleware(
			cors({
				preflightContinue: true
			})
		)
	)
	.get(async (req, res) => {
		let body: z.infer<typeof schema>;
		try {
			body = await schema.parseAsync(req.query);
		} catch (e) {
			return res.status(400).json({
				success: false
			});
		}
		const { token, id: campaignId } = body;

		if (!token) {
			return res.status(400).json({
				success: false
			});
		}

		const [campaignToken, referralToken] = token.split(".");

		const campaignIdFromToken = Base64.decode(campaignToken);

		if (campaignId !== campaignIdFromToken) {
			req.log.error({ token }, "Could match token to campaign params");
			return res.status(400).json({
				success: false
			});
		}

		const did = await getAppDID();

		let message;
		try {
			const jwe = JSON.parse(Base64.decode(referralToken as string));
			const raw = await did.decryptJWE(jwe);
			message = uint8arrays.toString(raw);
		} catch (e) {
			req.log.error({ token }, "Could not decrypt referral token");
			return res.status(400).json({
				success: false
			});
		}

		const sp = message.split(REFERRAL_TOKEN_DELIMITER);
		const conversionId = sp.shift(); // Conversion ID
		const partnershipId = sp.join(REFERRAL_TOKEN_DELIMITER); // Partnership ID

		req.log.debug({ token, partnershipId, conversionId }, "Token is valid");

		// Check conversion id of the token
		const checkCursor = await arango.query(aql`
			RETURN DOCUMENT("Conversions", ${conversionId})
		`);

		const checkResult = (await checkCursor.all()).filter(
			(result) => !isEmpty(result)
		);
		if (checkResult.length === 0) {
			req.log.error(
				{ token, conversionId, partnershipId, checkResult },
				"Conversion does not exist within index"
			);
			return res.status(400).json({
				success: false
			});
		}

		req.log.debug({ conversionId }, "Conversion exists");

		// Check if the result is already converted
		const [result] = checkResult;
		if (result.converted_at) {
			req.log.error(
				{ token, conversionId, partnershipId, checkResult },
				"Seed conversion already converted"
			);
			return res.status(400).json({
				success: false
			});
		}

		// Check the partnership id of the token
		const stream = await loader.load<PartnershipData>(partnershipId);
		// Validate that the provided partnership is valid
		if (
			!isPartnershipStreamValid(
				// @ts-ignore
				stream
			)
		) {
			req.log.info(
				{
					token,
					conversionId,
					partnershipId,
					streamContent: stream.content,
					schema: stream.metadata.schema,
					modelSchema: ShareableOwnerModel.schemas.partnership
				},
				"Partnership is invalid"
			);
			return res.status(400).json({
				success: false
			});
		}

		req.log.debug({ partnershipId }, "Partnership is valid");

		// Ensure the Advertiser provided id matches the token's data
		if (campaignId !== stream.content.address) {
			req.log.info(
				{
					body,
					streamContent: stream.content
				},
				"Payload does not match token"
			);
			return res.status(400).json({
				success: false
			});
		}

		// Once all is valid, sign the message
		const jws = await did.createJWS(message);
		const sig = Base64.encode(JSON.stringify(jws));

		return res.json({
			success: true,
			data: {
				sig
			}
		});
	});

export default handler.cors().handle();
