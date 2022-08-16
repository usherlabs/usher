import React, { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/router";
import { Pane, toaster } from "evergreen-ui";
import camelcaseKeys from "camelcase-keys";
import { css } from "@linaria/core";
import { aql } from "arangojs";
import { useQuery } from "react-query";
import isEmpty from "lodash/isEmpty";
import ono from "@jsdevtools/ono";
import { randomString } from "@stablelib/random";
import * as uint8arrays from "uint8arrays";

import { useUser, useArConnect } from "@/hooks/";
import { MAX_SCREEN_WIDTH } from "@/constants";
import ClaimButton from "@/components/Campaign/ClaimButton";
import Funds from "@/components/Campaign/Funds";
import Rewards from "@/components/Campaign/Rewards";
import InfoAccordions from "@/components/Campaign/InfoAccordions";
import WhitelistAlert from "@/components/Campaign/WhitelistAlert";
import Progress from "@/components/Progress";
import {
	Chains,
	Campaign,
	CampaignReward,
	PartnershipMetrics,
	Wallet,
	Claim,
	Connections
} from "@/types";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import useRedir from "@/hooks/use-redir";
import Serve404 from "@/components/Serve404";
import handleException from "@/utils/handle-exception";
import Banner from "@/components/Campaign/Banner";
import Title from "@/components/Campaign/Title";
import Actions from "@/components/Campaign/Actions";
import PartnershipUI from "@/components/Campaign/Partnership";
import StartPartnership from "@/components/Campaign/StartPartnership";
import Anchor from "@/components/Anchor";
import VerifyPersonhoodAlert from "@/components/VerifyPersonhood/Alert";
import { useSeedData } from "@/env-config";
import * as mediaQueries from "@/utils/media-queries";
import { getArangoClient } from "@/utils/arango-client";
import * as api from "@/api";
import * as validatorApi from "@/validator-api";
import Authenticate from "@/modules/auth";
import { AppEvents, events } from "@/utils/events";
import { Base64 } from "js-base64";

type CampaignPageProps = {
	id: string;
	chain: Chains;
	campaign: Campaign;
};

const getPartnershipMetrics = async (
	ids: string[]
): Promise<PartnershipMetrics | null> => {
	if (ids.length === 0) {
		return null;
	}

	const response = await api.partnerships().get(ids);

	if (!response.success) {
		return null;
	}

	return response.data as PartnershipMetrics;
};

const CampaignPage: React.FC<CampaignPageProps> = ({ campaign }) => {
	const {
		user: { wallets, partnerships, verifications },
		isLoading: isUserLoading,
		actions: { addPartnership }
	} = useUser();
	const router = useRouter();
	const loginUrl = useRedir("/login");
	const [getArConnect] = useArConnect();
	const isLoggedIn = wallets.length > 0;

	const [isPartnering, setPartnering] = useState(false);
	const [isClaiming, setClaiming] = useState(false);
	const [claims, setClaims] = useState<Claim[]>([]);
	const [funds, setFunds] = useState(0);

	const walletsForChain = wallets.filter(
		(w) => w.chain === campaign.reward.chain
	);
	const viewingPartnerships = partnerships.filter(
		(p) => p.address === campaign.id
	);
	const partnership =
		viewingPartnerships.length > 0 ? viewingPartnerships[0] : null; // get the first partnership for link usage.

	const metrics = useQuery(
		["partnership-metrics", viewingPartnerships, claims],
		() => getPartnershipMetrics(viewingPartnerships.map((p) => p.id))
	);

	// Ensure that the user knows what they're being rewarded regardless of their internal rewards calculation.
	let claimableRewards = metrics.data ? metrics.data.rewards : 0;
	let excessRewards = 0;
	let rewardsClaimed = 0;
	if (campaign) {
		if (typeof campaign.rewardsClaimed === "number") {
			rewardsClaimed = campaign.rewardsClaimed;

			if (
				typeof campaign.reward.limit === "number" &&
				!!campaign.reward.limit
			) {
				let remainingRewards = campaign.reward.limit - campaign.rewardsClaimed;
				if (remainingRewards < 0) {
					remainingRewards = 0;
				}
				if (claimableRewards > remainingRewards) {
					excessRewards = parseFloat(
						(claimableRewards - remainingRewards).toFixed(2)
					);
					if (excessRewards <= 0) {
						excessRewards = 0;
					}
					claimableRewards = remainingRewards;
				}
			}
		}
	}
	// No need for the below as the campaign with re-request on new claim
	// claims.forEach((claim) => {
	// 	claimableRewards -= claim.amount;
	// 	if (claimableRewards < 0) {
	// 		claimableRewards = 0;
	// 	}
	// 	rewardsClaimed += claim.amount;
	// });

	const onStartPartnership = useCallback(async () => {
		if (!isLoggedIn) {
			router.push(loginUrl);
			return;
		}
		const errorMessage = () =>
			toaster.danger(
				"Oops! Something has gone wrong partnering with this campaign.",
				{
					id: "start-partnership"
				}
			);
		if (!campaign) {
			errorMessage();
			return;
		}
		setPartnering(true);
		try {
			await addPartnership(campaign.id);
			toaster.success(`🎉  You have engaged this partnership!`, {
				id: "start-partnership",
				description: `Complete any remaining verifications and reviews to start earning rewards when you share your invite link!.`
			});
		} catch (e) {
			handleException(e);
			errorMessage();
		} finally {
			setPartnering(false);
		}
	}, [loginUrl, isLoggedIn, campaign, addPartnership]);

	// Reward Claim callback -- receives the selected wallet as a parameter
	const onClaim = useCallback(
		async (wallet: Wallet) => {
			setClaiming(true);
			try {
				const authInstance = Authenticate.getInstance();
				let walletSig = "";
				const partnershipParam = viewingPartnerships.map((p) => p.id);
				const message = randomString(32);
				const owner = authInstance.getOwner();
				if (!owner) {
					throw new Error("No owner exists for user");
				}
				switch (wallet.chain) {
					case Chains.ARWEAVE: {
						if (wallet.connection === Connections.ARCONNECT) {
							const arconnect = getArConnect();
							const walletSigBuf = await arconnect.signature(
								uint8arrays.fromString(message),
								{
									name: "RSA-PSS",
									hash: {
										name: "SHA-256"
									}
								}
							);
							walletSig = Base64.encodeURI(uint8arrays.toString(walletSigBuf));
						} else if (wallet.connection === Connections.MAGIC) {
							// TODO
						} else {
							// TODO: Toast a message
						}
						break;
					}
					default: {
						toaster.warning(
							`No wallet connected capable of making claim. Please connect a wallet to receive rewards for this blockchain.`
						);
						return null;
					}
				}
				const sigRaw = await owner.did.createJWS(message, {
					did: owner.did.id
				});
				const sig = Base64.encodeURI(JSON.stringify(sigRaw));
				const response = await validatorApi
					.claim()
					.post(partnershipParam, sig, message, {
						chain: wallet.chain,
						address: wallet.address,
						sig: walletSig
					});
				if (response.success && response.data) {
					const claim = response.data;
					if (claim.tx) {
						toaster.success(`Rewards claimed successfully!`, {
							id: "reward-claim",
							duration: 30,
							description: claim.tx?.url ? (
								<Anchor href={claim.tx.url} external>
									{claim.tx.url}
								</Anchor>
							) : null
						});
						const newFunds = funds - claim.amount;
						setClaims([...claims, claim]);
						setFunds(newFunds);

						events.emit(AppEvents.REWARDS_CLAIM, {
							claim,
							newFunds
						});

						return claim;
					}
					toaster.notify(`No reward amount left to be paid!`, {
						id: "reward-claim",
						duration: 30
					});
				} else {
					throw ono("Failed to process claim", response);
				}
			} catch (e) {
				toaster.danger(
					`Rewards claim failed to be processed. Please refresh and try again.`,
					{ id: "reward-claim", duration: 30 }
				);
				handleException(e);
			} finally {
				setClaiming(false);
			}
			return null;
		},
		[viewingPartnerships, funds, claims]
	);

	useEffect(() => {
		if (!campaign) {
			return () => {};
		}

		(async () => {
			if (campaign.funds && campaign.funds > 0) {
				const res = await validatorApi.info().get();
				const loadedFunds = campaign.funds * (1 - res.feeMultiplier);
				setFunds(loadedFunds);
			}
		})();

		return () => {};
	}, [campaign]);

	if (!campaign) {
		return <Serve404 />;
	}

	return (
		<Pane
			display="flex"
			alignItems="center"
			flexDirection="column"
			maxWidth={MAX_SCREEN_WIDTH - 32}
			marginX="auto"
			width="100%"
		>
			{campaign && (campaign.details.image || campaign.advertiser.icon) ? (
				<Banner campaign={campaign} />
			) : (
				<Pane paddingY={16} />
			)}
			<Pane paddingTop={24} paddingBottom={0} paddingX={16} width="100%">
				{campaign ? (
					<Pane
						display="flex"
						flexDirection="row"
						alignItems="flex-start"
						justifyContent="space-between"
						width="100%"
						className={css`
							${mediaQueries.isLarge} {
								flex-direction: column !important;
							}
						`}
					>
						<Pane
							flex={1}
							className={css`
								${mediaQueries.isLarge} {
									width: 100%;
									text-align: center;
								}
							`}
						>
							<Title campaign={campaign as Campaign} />
						</Pane>
						<Pane
							width="40%"
							className={css`
								${mediaQueries.isLarge} {
									width: 100% !important;
								}
							`}
						>
							<Pane
								display="flex"
								flexDirection="row"
								alignItems="center"
								justifyContent="flex-end"
								flexWrap="wrap"
								className={css`
									${mediaQueries.isLarge} {
										justify-content: center !important;
										margin-top: 24px !important;
										margin-bottom: 24px !important;
									}
								`}
							>
								<Actions campaign={campaign as Campaign} />
							</Pane>
						</Pane>
					</Pane>
				) : (
					<Skeleton
						count={5}
						style={{
							maxWidth: 500
						}}
					/>
				)}
			</Pane>
			<Pane
				display="flex"
				flexDirection="row"
				width="100%"
				padding={16}
				className={css`
					${mediaQueries.isLarge} {
						flex-direction: column !important;
					}
				`}
			>
				<Pane flex={1} margin={6}>
					{campaign.disableVerification !== true && (
						<>
							{!isUserLoading ? (
								<>
									{!verifications.personhood && (
										<Pane marginBottom={12}>
											<VerifyPersonhoodAlert />
										</Pane>
									)}
								</>
							) : (
								<Pane marginBottom={12}>
									<Skeleton
										style={{
											borderRadius: 8,
											height: 100
										}}
									/>
								</Pane>
							)}
						</>
					)}
					{!isUserLoading ? (
						<>
							{typeof campaign.whitelist !== "undefined" && (
								<Pane marginBottom={12}>
									<WhitelistAlert
										partnership={partnership}
										whitelist={campaign.whitelist}
									/>
								</Pane>
							)}
							{partnership ? (
								<PartnershipUI
									partnership={partnership}
									metrics={{
										isLoading: metrics.isLoading,
										data: metrics.data || null
									}}
								/>
							) : (
								<StartPartnership
									onStart={onStartPartnership}
									chain={campaign.reward.chain}
									isLoading={isPartnering}
									hasWallets={walletsForChain.length > 0}
								/>
							)}
						</>
					) : (
						<Skeleton
							style={{
								height: 300,
								borderRadius: 8
							}}
						/>
					)}
				</Pane>
				<Pane
					width="40%"
					margin={6}
					className={css`
						${mediaQueries.isLarge} {
							width: 100% !important;
						}
					`}
				>
					{campaign ? (
						<>
							{campaign.reward.limit && campaign.reward.limit > 0 ? (
								<Pane
									background="tint2"
									borderRadius={8}
									padding={12}
									marginBottom={12}
								>
									<Progress
										value={(rewardsClaimed || 0) / campaign.reward.limit}
										label={`${parseFloat((rewardsClaimed || 0).toFixed(2))} / ${
											campaign.reward.limit
										} ${campaign.reward.ticker} Claimed`}
										showPercentage
									/>
								</Pane>
							) : null}
						</>
					) : (
						<Skeleton
							style={{
								height: 100,
								borderRadius: 8,
								marginBottom: 12
							}}
						/>
					)}
					{campaign ? (
						<>
							<Pane marginBottom={12}>
								<Funds balance={funds} ticker={campaign.reward.ticker} />
							</Pane>
						</>
					) : (
						<Skeleton
							style={{
								height: 100,
								borderRadius: 8,
								marginBottom: 12
							}}
						/>
					)}
					{partnership && (
						<>
							<Pane marginBottom={20}>
								<Pane display="flex" marginBottom={-6}>
									{campaign ? (
										<Rewards
											loading={metrics.isLoading}
											ticker={campaign.reward.ticker}
											value={claimableRewards}
											excess={excessRewards}
										/>
									) : (
										<Skeleton
											style={{
												borderRadius: 8,
												height: 150
											}}
										/>
									)}
								</Pane>
								<Pane display="flex">
									{campaign ? (
										<ClaimButton
											onClaim={onClaim}
											isClaiming={isClaiming}
											isComplete={
												typeof campaign.reward.limit === "number" &&
												campaign.reward.limit > 0
													? rewardsClaimed >= campaign.reward.limit
													: false
											}
											wallets={walletsForChain}
											amount={
												claimableRewards > funds ? funds : claimableRewards
											}
											reward={campaign.reward as CampaignReward}
											active={
												!!verifications.captcha &&
												(campaign.disableVerification !== true
													? !!verifications.personhood
													: true)
											}
										/>
									) : (
										<Skeleton
											style={{
												borderRadius: 8,
												height: 50
											}}
										/>
									)}
								</Pane>
							</Pane>
						</>
					)}
					<Pane marginBottom={12}>
						{campaign ? (
							<InfoAccordions campaign={campaign as Campaign} />
						) : (
							<Skeleton
								style={{
									borderRadius: 8,
									height: 100
								}}
							/>
						)}
					</Pane>
				</Pane>
			</Pane>
		</Pane>
	);
};

// Executes at build time
export async function getStaticPaths() {
	if (useSeedData) {
		const campaignsData = (await import("@/seed/campaigns.json")).default;
		const campaigns = camelcaseKeys(campaignsData, { deep: true });

		return {
			paths: campaigns.map((c) => ({
				params: {
					id: c.id
				}
			})),
			fallback: false
		};
	}

	const arango = getArangoClient();
	const cursor = await arango.query(aql`
		FOR c IN Campaigns
			RETURN {
				"id": c.id
			}
	`);

	const campaigns = await cursor.all();

	return {
		paths: campaigns.map((c) => ({
			params: {
				id: c.id as string
			}
		})),
		fallback: false
	};
}

export const getStaticProps = async ({
	params
}: {
	params: { id: string };
}) => {
	if (useSeedData) {
		const campaignsData = (await import("@/seed/campaigns.json")).default;
		const campaigns = camelcaseKeys(campaignsData, { deep: true });

		return {
			props: {
				campaign: campaigns[0] as Campaign
			}
		};
	}

	const { id } = params;

	const arango = getArangoClient();
	const cursor = await arango.query(aql`
		LET c = DOCUMENT("Campaigns", ${id})
		LET rewards_claimed = (
			FOR cl IN 1..2 ANY c Engagements
				FILTER STARTS_WITH(cl._id, "Claims")
				COLLECT AGGREGATE amount = SUM(cl.amount)
				RETURN amount
		)
		LET campaign = KEEP(c, ATTRIBUTES(c, true))
		RETURN MERGE(
				campaign,
				{
						rewards_claimed: TO_NUMBER(rewards_claimed[0])
				}
		)
	`);

	const results = (await cursor.all()).filter((result) => !isEmpty(result));

	if (results.length > 0) {
		const campaign = camelcaseKeys(results[0], { deep: true });

		return {
			props: {
				campaign,
				seo: {
					title: campaign.details.name,
					description:
						campaign.details.description ||
						`Learn and earn by partnering up with ${
							campaign.advertiser.name || campaign.details.name
						}`
				}
			},
			revalidate: 60
		};
	}

	return {
		props: {
			campaign: null
		},
		revalidate: 60
	};
};

export default CampaignPage;
