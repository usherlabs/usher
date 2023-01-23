import cors from "cors";
import cuid from "cuid";

import { dummyData, LinkHit } from "@/programs/collections/types";
import { expressMiddleware, useRouteHandler } from "@/server/middleware";

const handler = useRouteHandler();

handler.router
	.use(
		expressMiddleware(
			cors({
				preflightContinue: true
			})
		)
	)
	.post(async (req, res) => {
		try {
			const { id: linkId } = req.query;
			if (typeof linkId !== "string") {
				throw new Error("id is not a string");
			}

			const hit: LinkHit = {
				id: cuid(),
				linkId,
				hitAt: new Date().getTime()
			};

			dummyData.hits.push(hit);

			return res.json({
				success: true,
				data: hit
			});
		} catch (e) {
			req.log.error(e);
			return res.status(400).json({
				success: false
			});
		}
	});

export default handler.cors().handle();
