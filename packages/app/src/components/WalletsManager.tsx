import React, { useCallback, useEffect, useState } from "react";
import {
	Button,
	Tooltip,
	Strong,
	toaster,
	useTheme,
	Label,
	Heading,
	Pane,
	majorScale,
	ArrowLeftIcon,
	Spinner,
	SendMessageIcon,
	TextInput,
	Text,
	Paragraph
} from "evergreen-ui";
import { css } from "@linaria/core";
import CopyToClipboard from "react-copy-to-clipboard";
import Image from "next/image";
import { useQuery } from "react-query";
import allSettled from "promise.allsettled";
import isEmpty from "lodash/isEmpty";
import isNumber from "is-number";
import ono from "@jsdevtools/ono";

import pascalCase from "@/utils/pascal-case";
import { Wallet, Chains, Connections } from "@/types";
import truncate from "@/utils/truncate";
import { getArweaveClient } from "@/utils/arweave-client";
import WalletConnect from "@/components/WalletConnect";
import Anchor from "@/components/Anchor";
import InputField from "@/components/InputField";
import { useArConnect, useUser } from "@/hooks";
import { connectionImages } from "@/utils/images-map";
import handleException from "@/utils/handle-exception";
import Authenticate from "@/modules/auth";

const arweave = getArweaveClient();

export type Props = {
	onClose: () => void;
};

type WalletWithBalance = Wallet & {
	balance: string;
};

const getBalances = async (wallets: Wallet[]) => {
	const results = await allSettled<WalletWithBalance>(
		wallets.map(async (wallet) => {
			const w = {
				...wallet,
				balance: "0 AR"
			};
			if (wallet.chain === Chains.ARWEAVE) {
				const winston = await arweave.wallets.getBalance(wallet.address);
				const ar = arweave.ar.winstonToAr(winston);
				w.balance = `${parseFloat(ar).toFixed(4)} AR`;
			} else {
				// TODO: In the future, support balance fetching for wallets beyond Arweave
			}
			return w;
		})
	);

	const resp: WalletWithBalance[] = [];
	results.forEach((res) => {
		if (res.status === "fulfilled" && !!res.value) {
			resp.push(res.value);
		}
	});
	return resp;
};

const WalletsManager: React.FC<Props> = ({ onClose }) => {
	const {
		user: { wallets },
		isLoading: isUserLoading
	} = useUser();
	const { colors } = useTheme();
	const [showWalletConnect, setShowWalletConnect] = useState(false);
	const [showSendFunds, setShowSendFunds] = useState<{
		wallet: Wallet;
		amount: number;
	} | null>(null);
	const [isSendingFunds, setSendingFunds] = useState(false);
	const [isSendFundsLoading, setSendFundsLoading] = useState(false);
	const balances = useQuery(["balances", wallets], () => getBalances(wallets), {
		staleTime: 10000
	});
	const [getArConnect] = useArConnect();
	const [hiddenConnections, setHiddenConnections] = useState<Connections[]>([]);

	useEffect(() => {
		(async () => {
			const arconnect = getArConnect();
			if (arconnect) {
				try {
					const address = await arconnect.getActiveAddress();
					if (
						wallets.map((wallet) => wallet.address).includes(address) &&
						!hiddenConnections.includes(Connections.ARCONNECT)
					) {
						setHiddenConnections([...hiddenConnections, Connections.ARCONNECT]);
					}
				} catch (e) {
					// ...
				}
			}
			if (
				wallets
					.map((wallet) => wallet.connection)
					.includes(Connections.MAGIC) &&
				!hiddenConnections.includes(Connections.MAGIC)
			) {
				setHiddenConnections([...hiddenConnections, Connections.MAGIC]);
			}
		})();
	}, [wallets, hiddenConnections]);

	const onCopy = useCallback(() => {
		toaster.notify("Address copied", {
			id: "wallet-side-sheet--address-copy"
		});
	}, []);

	const onWalletConnectToggle = useCallback(() => {
		if (showWalletConnect) {
			setShowWalletConnect(false);
			return;
		}
		setShowWalletConnect(true);
	}, [showWalletConnect]);

	const onSendFundsShow = useCallback(async (wallet: Wallet) => {
		setSendFundsLoading(true);
		try {
			const winston = await arweave.wallets.getBalance(wallet.address);
			const ar = arweave.ar.winstonToAr(winston);
			const amount = parseFloat(ar);
			setShowSendFunds({ wallet, amount });
		} catch (e) {
			handleException(e);
		}
		setSendFundsLoading(false);
	}, []);

	/* TODO: Requires testing */
	const sendFunds = useCallback(async () => {
		// Send funds in amount to address
		// Get JWK for the wallet.
		// For all wallets, get the ethereum magic wallet -- this is the source wallet
		const magicEthWallet = wallets.find(
			(wallet) =>
				wallet.chain === Chains.ETHEREUM &&
				wallet.connection === Connections.MAGIC
		);
		if (!magicEthWallet) {
			return;
		}
		if (!showSendFunds) {
			return;
		}

		setSendingFunds(true);
		try {
			// Get the auth for this wallet
			const authInstance = Authenticate.getInstance();
			const jwk = await authInstance.getMagicArweaveJwk();
			const tx = await arweave.createTransaction(
				{
					target: showSendFunds.wallet.address,
					quantity: arweave.ar.arToWinston(`${showSendFunds.amount}`)
				},
				jwk
			);
			await arweave.transactions.sign(tx, jwk);
			const response = await arweave.transactions.post(tx);
			if (response.status === 200) {
				toaster.success(`Your funds have been sent!`, {
					description: (
						<Paragraph marginTop={8}>
							Confirmed transaction&nbsp;
							<Anchor
								href={`https://v2.viewblock.io/arweave/tx/${tx.id}`}
								external
							>
								<Strong color={colors.blue500} textDecoration="underline">
									{tx.id}
								</Strong>
							</Anchor>
						</Paragraph>
					),
					duration: 30,
					id: "success-send-funds"
				});
			} else {
				throw ono("Failed to post transcation to Arweave", showSendFunds);
			}
		} catch (e) {
			handleException(e);
			toaster.danger(
				"A problem has occurred sending your funds. The team has been notified. Please try again later or contact support",
				{
					duration: 10,
					id: "error-send-funds"
				}
			);
		} finally {
			setSendingFunds(false);
		}
	}, [showSendFunds, wallets]);

	if (showWalletConnect) {
		return (
			<Pane>
				<Pane padding={10}>
					<Button
						appearance="minimal"
						iconBefore={ArrowLeftIcon}
						onClick={onWalletConnectToggle}
						height={majorScale(5)}
					>
						<Label pointerEvents="none">Back to Wallet</Label>
					</Button>
				</Pane>
				<Pane
					marginBottom={24}
					paddingTop={10}
					paddingX={40}
					paddingBottom={20}
					borderBottomWidth="1px"
					borderBottomColor={colors.gray400}
					borderBottomStyle="solid"
				>
					<Heading size={700}>Connect a Wallet</Heading>
				</Pane>
				<Pane
					marginBottom={16}
					paddingX={40}
					display="flex"
					alignItems="center"
					justifyContent="center"
				>
					<WalletConnect hide={hiddenConnections} onConnect={onClose} />
				</Pane>
			</Pane>
		);
	}

	if (showSendFunds) {
		return (
			<Pane>
				<Pane padding={10}>
					<Button
						appearance="minimal"
						iconBefore={ArrowLeftIcon}
						onClick={() => setShowSendFunds(null)}
						height={majorScale(5)}
					>
						<Label pointerEvents="none">Back to Wallet</Label>
					</Button>
				</Pane>
				<Pane
					marginBottom={24}
					paddingTop={10}
					paddingX={40}
					paddingBottom={20}
					borderBottomWidth="1px"
					borderBottomColor={colors.gray400}
					borderBottomStyle="solid"
				>
					<Heading size={700}>
						Send funds from {truncate(showSendFunds.wallet.address, 6, 4)}
					</Heading>
				</Pane>
				<Pane marginBottom={16} paddingX={40}>
					<InputField
						id="send-funds"
						label="Enter the amount to send"
						background="none"
						isLoading={isSendFundsLoading}
					>
						<Pane
							width="100%"
							display="flex"
							flexDirection="row"
							height={42}
							alignItems="center"
							paddingX={8}
						>
							<TextInput
								display="block"
								flex={1}
								paddingX={6}
								onChange={(e: any) => {
									if (isNumber(e.target.value)) {
										setShowSendFunds({
											...showSendFunds,
											amount: e.target.value
										});
									} else if (!e.target.value) {
										setShowSendFunds({
											...showSendFunds,
											amount: 0
										});
									}
								}}
								borderWidth={0}
								marginRight={12}
								value={showSendFunds.amount}
								fontSize="1em"
							/>
							<Text
								textDecoration="underline"
								size={300}
								fontWeight={700}
								display="block"
								paddingX={6}
								onClick={() => onSendFundsShow(showSendFunds.wallet)}
								cursor="pointer"
								className={css`
									:active {
										opacity: 0.8;
									}
								`}
							>
								MAX
							</Text>
						</Pane>
					</InputField>
					<Pane display="flex" justifyContent="flex-end" width="100%">
						<Button
							onClick={sendFunds}
							isLoading={isSendingFunds}
							appearance="primary"
							iconBefore={SendMessageIcon}
							height={majorScale(5)}
							marginTop={12}
							minWidth={200}
						>
							<Strong color="#fff">Send Funds</Strong>
						</Button>
					</Pane>
				</Pane>
			</Pane>
		);
	}

	return (
		<Pane>
			<Pane
				marginBottom={24}
				paddingTop={40}
				paddingX={40}
				paddingBottom={20}
				borderBottomWidth="1px"
				borderBottomColor={colors.gray400}
				borderBottomStyle="solid"
			>
				<Heading size={700}>My Wallet</Heading>
			</Pane>
			<Pane marginBottom={16} paddingX={40}>
				{Object.values(Chains).map((chain) => {
					const walletsForChain = wallets.filter(
						(wallet) => wallet.chain === chain
					);

					if (walletsForChain.length === 0) {
						return null;
					}

					return (
						<Pane marginBottom={16} key={chain}>
							<Label
								display="block"
								marginBottom={4}
								size={300}
								fontWeight={900}
							>
								{chain.toUpperCase()}
							</Label>
							<Pane border={`1px solid ${colors.gray400}`} borderRadius={8}>
								{walletsForChain.map((wallet, i) => {
									let balance = "";
									if (
										!balances.isLoading &&
										balances.data &&
										!isEmpty(balances.data)
									) {
										const found = balances.data.find(
											(bal) => bal && bal.address === wallet.address
										);
										if (found) {
											balance = found.balance;
										}
									}

									return (
										<Pane
											key={wallet.address}
											borderBottom={
												i === walletsForChain.length - 1
													? ""
													: `1px solid ${colors.gray400}`
											}
										>
											<Pane
												display="flex"
												alignContent="center"
												flexDirection="row"
												justifyContent="space-between"
												padding={16}
											>
												<Pane
													display="flex"
													alignItems="center"
													justifyContent="center"
													flexDirection="row"
												>
													<Pane marginRight={8}>
														<Tooltip content={pascalCase(wallet.connection)}>
															<Pane
																display="flex"
																alignItems="center"
																justifyContent="center"
															>
																<Image
																	src={connectionImages[wallet.connection]}
																	width={20}
																	height={20}
																/>
															</Pane>
														</Tooltip>
													</Pane>
													<Pane>
														<Tooltip content="Copy Address">
															<Pane>
																<CopyToClipboard
																	text={wallet.address}
																	onCopy={onCopy}
																>
																	<Label
																		color={colors.gray800}
																		className={css`
																			cursor: pointer;
																			&:active {
																				opacity: 0.8;
																			}
																		`}
																	>
																		{truncate(wallet.address, 6, 4)}
																	</Label>
																</CopyToClipboard>
															</Pane>
														</Tooltip>
													</Pane>
												</Pane>
												<Pane
													display="flex"
													flexDirection="row"
													alignItems="center"
												>
													<Pane display="flex" alignItems="center">
														{balance ? (
															<Strong>{balance}</Strong>
														) : (
															<Spinner size={16} />
														)}
													</Pane>
												</Pane>
											</Pane>
											<Pane>
												{wallet.connection === Connections.MAGIC &&
													wallet.chain === Chains.ARWEAVE && (
														<Button
															iconBefore={SendMessageIcon}
															onClick={() => onSendFundsShow(wallet)}
															height={majorScale(3)}
															appearance="minimal"
															borderTop={`1px solid ${colors.gray300}`}
															width="100%"
														>
															Send Funds
														</Button>
													)}
											</Pane>
										</Pane>
									);
								})}
							</Pane>
						</Pane>
					);
				})}
			</Pane>
			{[...hiddenConnections].sort().join(",") !==
				[...Object.values(Connections)].sort().join(",") &&
				!isUserLoading && (
					<Pane
						paddingTop={40}
						paddingX={40}
						paddingBottom={20}
						display="flex"
						width="100%"
						alignItems="center"
						justifyContent="center"
					>
						<Button
							height={majorScale(5)}
							minWidth={260}
							onClick={onWalletConnectToggle}
						>
							<Strong>Connect a Wallet</Strong>
						</Button>
					</Pane>
				)}
		</Pane>
	);
};

export default WalletsManager;
