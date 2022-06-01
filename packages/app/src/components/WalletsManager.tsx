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
	Badge
} from "evergreen-ui";
import { css } from "@linaria/core";
import CopyToClipboard from "react-copy-to-clipboard";
import Image from "next/image";
import { useQuery } from "react-query";
import allSettled from "promise.allsettled";
import isEmpty from "lodash/isEmpty";

import pascalCase from "@/utils/pascal-case";
import { Wallet, Chains, Connections } from "@/types";
import truncate from "@/utils/truncate";
import getArweaveClient from "@/utils/arweave-client";
import WalletConnect from "@/components/WalletConnect";
import { useArConnect, useUser, useDefaultWallets } from "@/hooks";
import { connectionImages } from "@/utils/connections-map";

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
	const balances = useQuery(["balances", wallets], () => getBalances(wallets), {
		staleTime: 10000
	});
	const [getArConnect] = useArConnect();
	const [hiddenConnections, setHiddenConnections] = useState<Connections[]>([]);
	const [defaultWallets, setDefaultWallet] = useDefaultWallets();

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

	const onWalletConnect = useCallback(() => {
		if (showWalletConnect) {
			setShowWalletConnect(false);
			return;
		}
		setShowWalletConnect(true);
	}, [showWalletConnect]);

	return showWalletConnect ? (
		<Pane>
			<Pane padding={10}>
				<Button
					appearance="minimal"
					iconBefore={ArrowLeftIcon}
					onClick={onWalletConnect}
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
	) : (
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
											display="flex"
											alignContent="center"
											flexDirection="row"
											justifyContent="space-between"
											padding={16}
											borderBottom={
												i === walletsForChain.length - 1
													? ""
													: `1px solid ${colors.gray400}`
											}
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
														<Pane display="flex" alignItems="center">
															<Pane marginRight={8}>
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
															{wallet.address === defaultWallets[chain] && (
																<Badge color="purple">Default</Badge>
															)}
														</Pane>
													</Tooltip>
												</Pane>
											</Pane>
											<Pane display="flex" alignItems="center">
												{balance ? (
													<Strong>{balance}</Strong>
												) : (
													<Spinner size={16} />
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
							onClick={onWalletConnect}
						>
							<Strong>Connect a Wallet</Strong>
						</Button>
					</Pane>
				)}
		</Pane>
	);
};

export default WalletsManager;
