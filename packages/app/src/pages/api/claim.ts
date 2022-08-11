import { z } from "zod";
import { Base64 } from "js-base64";
import * as uint8arrays from "uint8arrays";
import { TileLoader } from "@glazed/tile-loader";
import { aql } from "arangojs";
import { ShareableOwnerModel } from "@usher/ceramic";
import { TileDocument } from "@ceramicnetwork/stream-tile";
// import ono from "@jsdevtools/ono";
import uniq from "lodash/uniq";

import {
	AuthApiRequest,
	Partnership,
	PartnershipData,
	Chains,
	Claim,
	RewardTypes
} from "@/types";
import { useRouteHandler } from "@/server/middleware";
import { getAppDID } from "@/server/did";
import { ceramic } from "@/utils/ceramic-client";
import { getArangoClient } from "@/utils/arango-client";
import withAuth from "@/server/middleware/auth";
import { getArweaveClient, getWarp } from "@/utils/arweave-client";
import { FEE_MULTIPLIER, FEE_ARWEAVE_WALLET } from "@/constants";
import handleException from "@/utils/handle-exception";
import { appPackageName, appVersion } from "@/env-config";

const handler = useRouteHandler<AuthApiRequest>();

const schema = z.object({
	partnership: z.union([z.string(), z.string().array()]),
	to: z.string()
});

const loader = new TileLoader({ ceramic });

const arango = getArangoClient();

const arweave = getArweaveClient();
const warp = getWarp();

const isPartnershipStreamValid = (stream: TileDocument<PartnershipData>) => {
	return (
		stream.content.address &&
		stream.controllers.length > 0 &&
		stream.metadata.schema === ShareableOwnerModel.schemas.partnership
	);
};

/**
 * POST: Perform the Crypto Transfer based on the Campaign
 */
handler.router.use(withAuth).post(async (req, res) => {
	let body: z.infer<typeof schema>;
	try {
		body = await schema.parseAsync(req.body);
	} catch (e) {
		return res.status(400).json({
			success: false
		});
	}
	const { partnership: partnershipParam, to } = body;
	const partnershipIds = Array.isArray(partnershipParam)
		? uniq(partnershipParam)
		: [partnershipParam];

	// Get campaign from partnership
	const streams = await Promise.all(
		partnershipIds.map((id) => loader.load<PartnershipData>(id))
	);
	for (let i = 0; i < streams.length; i += 1) {
		const stream = streams[i];
		if (
			!isPartnershipStreamValid(
				// @ts-ignore
				stream
			)
		) {
			req.log.warn(
				{
					data: {
						to,
						partnershipParam,
						streamContent: stream.content,
						schema: stream.metadata.schema,
						modelSchema: ShareableOwnerModel.schemas.partnership
					}
				},
				"Partnership is invalid"
			);
			return res.status(400).json({
				success: false
			});
		}
	}

	const partnerships: Partnership[] = streams.map((stream) => ({
		id: stream.id.toString(),
		...stream.content
	}));
	for (let i = 0; i < partnerships.length - 1; i += 1) {
		if (partnerships[i].address !== partnerships[i + 1].address) {
			req.log.warn(
				{
					data: { to, partnershipParam, partnership: partnerships[i] }
				},
				"Partnership parameter is invalid. Partnerships are not for the same campaign."
			);
			return res.status(400).json({
				success: false
			});
		}
	}
	const campaignKey = partnerships[0].address;

	// Validate that the partnership(s) and campaign are associated to authed dids
	// This query will fetch all partnerships for their Ids and the Campaign
	const checkCursor = await arango.query(aql`
		FOR d IN ${req.user.map(({ did }) => did)}
			FOR rd IN 1..1 ANY CONCAT("Dids/", d) Related
				COLLECT _id = rd._id
				FOR e IN 1..2 OUTBOUND _id Engagements
					FILTER POSITION(${partnershipIds}, e._key) OR e._key == ${campaignKey}
					RETURN e
	`);
	const checkResults = (await checkCursor.all()).filter((result) => !!result);
	const partnershipsData = checkResults.filter((result) =>
		partnershipIds.includes(result._key)
	);
	const campaignData = checkResults.find(
		(result) => result._key === campaignKey
	);
	if (partnershipsData.length === 0 || !campaignData) {
		req.log.warn(
			{
				data: { to, partnerships, campaignKey, checkResults, user: req.user }
			},
			"Partnership and/or Campaign is not associated to User"
		);
		return res.status(400).json({
			success: false
		});
	}

	req.log.debug("Campaign and Partnership indexed data fetched");

	// Determine withdraw amount -- by calculating remaining rewards
	let rewardsToPay = 0;
	partnershipsData.forEach((p) => {
		rewardsToPay += p.rewards || 0;
	});
	if (
		typeof campaignData.reward.limit === "number" &&
		campaignData.reward.limit > 0
	) {
		// Get rewards from partnership and rewards claimed from campaign
		const pCursor = await arango.query(aql`
			LET rewards_claimed = (
				FOR p IN DOCUMENT("Partnerships", ${partnershipIds})
					FOR cl IN 1..1 OUTBOUND p Engagements
						FILTER STARTS_WITH(cl._id, "Claims")
						COLLECT AGGREGATE amount = SUM(cl.amount)
						RETURN amount
			)
			RETURN TO_NUMBER(rewards_claimed)
		`);
		const pResults = await pCursor.all();
		const [rewardsClaimed] = pResults; // will always return an array with a single integer result.

		req.log.debug(
			{ data: { rewardsClaimed } },
			"Previously Rewards Claims fetched"
		);

		// Check if the Campaign is limited at all
		const remainingRewards = campaignData.reward.limit - rewardsClaimed;
		if (rewardsToPay > remainingRewards) {
			rewardsToPay = remainingRewards;
		}
	}

	if (rewardsToPay === 0) {
		req.log.info("No rewards to pay");
		return res.status(200).json({
			success: true,
			data: {
				to,
				fee: 0,
				amount: 0
			}
		});
	}

	let fee = 0;

	// Ensure that amount to be paid is greater than amount in internal wallet -- otherwise send whatevers in the wallet and update partnership amount
	if (campaignData.reward.chain === Chains.ARWEAVE) {
		let rewardTxId = "";
		let feeTxId = "";
		const internalAddress = campaignData._internal.address;
		const txTags = [
			["Application", "Usher"],
			["UsherCampaign", campaignKey],
			["UsherPartnerships", partnershipIds.join(", ")]
		];
		if (appPackageName && appVersion) {
			txTags.push([appPackageName, appVersion]);
		}

		// Transfer fee amount minus gas x2 from previous transaction to platform wallet
		try {
			const did = await getAppDID();
			const jwe = JSON.parse(Base64.decode(campaignData._internal.key));
			const dec = await did.decryptJWE(jwe, { did: did.id });
			const raw = uint8arrays.toString(dec);
			const jwk = JSON.parse(raw);

			if (campaignData.reward.address) {
				const contract = warp
					.contract(campaignData.reward.address)
					.connect(jwk);
				const contractState = await contract.readState();
				if (campaignData.reward.type === RewardTypes.PST) {
					const state = contractState.state as {
						balances: Record<string, number>;
					};
					const balance = state.balances[internalAddress] || 0;
					if (balance === 0) {
						req.log.error("Insufficient funding for Campaign");
						return res.status(402).json({
							success: false,
							data: {
								to,
								fee: 0,
								amount: 0
							}
						});
					}

					if (rewardsToPay > balance) {
						rewardsToPay = balance;
					}

					// ? No fee for custom PSTs at the moment

					const interactionParams = {
						function: "transfer",
						qty: rewardsToPay,
						target: to
					};
					const interactionId = await contract.writeInteraction(
						interactionParams,
						txTags.map((tag) => ({ name: tag[0], value: tag[1] }))
					);

					if (!interactionId) {
						req.log.error(
							{ data: { rewardsToPay, interactionId, interactionParams } },
							"Failed to submit reward transaction"
						);
						return res.json({
							success: false,
							data: {
								to,
								fee,
								amount: rewardsToPay
							}
						});
					}

					req.log.info(
						{ data: { fee, rewardsToPay, interactionId } },
						"Fee and reward transfers complete"
					);

					rewardTxId = interactionId;
				} else {
					req.log.error(
						{ data: { reward: campaignData.reward } },
						"Unsupported Campaign Reward"
					);
					return res.status(402).json({
						success: false,
						data: {
							to,
							fee: 0,
							amount: 0
						}
					});
				}
			} else {
				fee = rewardsToPay * FEE_MULTIPLIER; // x * 0.1
				const totalToPay = fee + rewardsToPay;

				const balance = await arweave.wallets.getBalance(internalAddress);
				const arBalanceStr = arweave.ar.winstonToAr(balance);
				const winstonBalance = parseFloat(balance);
				let arBalance = parseFloat(arBalanceStr);
				if (Number.isNaN(arBalance) || Number.isNaN(winstonBalance)) {
					arBalance = 0;
				}

				if (arBalance === 0) {
					req.log.error("Insufficient funding for Campaign");
					return res.status(402).json({
						success: false,
						data: {
							to,
							fee: 0,
							amount: 0
						}
					});
				}

				if (totalToPay > arBalance) {
					fee = arBalance * FEE_MULTIPLIER;
					rewardsToPay = arBalance - fee;
				}

				const rewardTx = await arweave.createTransaction(
					{
						target: to,
						quantity: arweave.ar.arToWinston(`${rewardsToPay}`)
					},
					jwk
				);

				if (totalToPay > arBalance) {
					fee -= parseFloat(arweave.ar.winstonToAr(rewardTx.reward)) * 2; // ensure there's enough gas for the transfers.
				}
				const feeTx = await arweave.createTransaction({
					target: FEE_ARWEAVE_WALLET,
					quantity: arweave.ar.arToWinston(`${fee}`)
				});

				req.log.debug(
					{ data: { fee, rewardsToPay } },
					"Fee and reward calculated"
				);

				// Tags
				txTags.forEach(([tagName, tagVal]) => {
					rewardTx.addTag(tagName, tagVal);
					feeTx.addTag(tagName, tagVal);
				});
				rewardTx.addTag("UsherTransferType", "Reward");
				feeTx.addTag("UsherTransferType", "Fee");

				await arweave.transactions.sign(rewardTx, jwk);
				await arweave.transactions.sign(feeTx, jwk);

				const [rewardTxResponse, feeTxResponse] = await Promise.all([
					arweave.transactions.post(rewardTx),
					arweave.transactions.post(feeTx)
				]);

				if (rewardTxResponse.status !== 200) {
					req.log.error(
						{ data: { rewardTxResponse, rewardTx, rewardsToPay } },
						"Failed to submit reward transaction"
					);
					return res.json({
						success: false,
						data: {
							to,
							fee,
							amount: rewardsToPay
						}
					});
				}
				if (feeTxResponse.status !== 200) {
					req.log.warn(
						{ data: { feeTxResponse, feeTx, fee } },
						"Failed to submit fee transaction"
					);
					return res.json({
						success: false,
						data: {
							to,
							fee,
							amount: rewardsToPay
						}
					});
				}

				req.log.info(
					{
						data: { fee, rewardsToPay, rewardTx: rewardTx.id, feeTx: feeTx.id }
					},
					"Fee and reward transfers complete"
				);

				rewardTxId = rewardTx.id;
				feeTxId = feeTx.id;
			}

			// Index Claim, Reduce Remaining Rewards for Partnership
			let rewardsToDeductFrom = rewardsToPay;
			const rewardDeductions: [string, number][] = [];
			partnershipsData.forEach((p) => {
				if (rewardsToDeductFrom > 0) {
					let { rewards } = p;
					if (rewardsToDeductFrom < p.rewards) {
						rewards = p.rewards - rewardsToDeductFrom;
					}
					rewardsToDeductFrom -= rewards;
					const deduction = p.rewards - rewards; // The deduction is the difference between the rewards and the new reward
					rewardDeductions.push([p._key, deduction]);
				}
			});
			req.log.debug(
				{ data: { rewardDeductions } },
				"Reward deductions applied to Partnerships"
			);

			const indexCursor = await arango.query(aql`
				LET ps = (
					FOR deduction IN ${rewardDeductions}
						LET partnership = DOCUMENT("Partnerships", deduction[0])
						LET newRewards = MAX([partnership.rewards - deduction[1], 0])
						RETURN MERGE(
								partnership,
								{
										rewards: newRewards
								}
						)
				)
				INSERT {
					amount: ${rewardsToPay},
					to: ${to},
					fee: ${fee},
					feeWallet: ${FEE_ARWEAVE_WALLET},
					txs: {
						reward: ${rewardTxId},
						fee: ${feeTxId}
					},
					created_at: ${Date.now()}
				} INTO Claims
				LET c = NEW
				LET e = (
					FOR p IN ps
						UPDATE { _key: p._key } WITH { rewards: p.rewards } IN Partnerships
						INSERT {
							_from: p._id,
							_to: c._id
						} INTO Engagements
						RETURN NEW
				)
				RETURN {
					claim: c,
					partnerships: ps,
					edges: e
				}
			`);
			const indexResults = await indexCursor.all();

			req.log.info({ data: { indexResults } }, "Claim indexed");

			const claim: Claim = {
				to,
				fee,
				amount: rewardsToPay,
				tx: {
					id: rewardTxId,
					url: `https://viewblock.io/arweave/tx/${rewardTxId}`
				}
			};
			return res.json({
				success: true,
				data: claim
			});
		} catch (e) {
			handleException(e);
			req.log.error(
				{
					e,
					data: { partnershipIds, campaignKey }
				},
				"Cannot execute Arweave Rewards Transfer"
			);
			return res.status(400).json({
				success: false
			});
		}
	}

	req.log.warn("Unsupported partnership");

	return res.json({
		success: false,
		data: {
			to,
			fee: 0,
			amount: 0
		}
	});
});

export default handler.handle();
