import React, { useCallback, useEffect, useState } from "react";
import { Pane, Heading, Text, Button, majorScale, Link } from "evergreen-ui";
import Image from "next/image";
import Bowser from "bowser";

import { Connections } from "@/types";
import { useUser, useArConnect } from "@/hooks/";
import { ARCONNECT_CHROME_URL, ARCONNECT_FIREFOX_URL } from "@/constants";
import { UilLockOpenAlt } from "@iconscout/react-unicons";
import ArConnectIcon from "@/assets/icon/arconnect.svg";

export type Props = {
	onConnect: (type: Connections) => void;
};

const WalletConnectScreen: React.FC<Props> = ({ onConnect }) => {
	const {
		isLoading: isUserLoading,
		actions: { connect }
	} = useUser();
	const [, isArConnectLoading] = useArConnect();
	const [browserName, setBrowserName] = useState("");
	const [isConnecting, setConnecting] = useState(false);
	const isLoading = isUserLoading || isConnecting;

	const connectArConnect = useCallback(() => {
		setConnecting(true);
		connect(Connections.ARCONNECT)
			.then(() => {
				onConnect(Connections.ARCONNECT);
			})
			.finally(() => {
				setConnecting(false);
			});
	}, []);

	const connectMagic = useCallback(() => {
		setConnecting(true);
		connect(Connections.MAGIC)
			.then(() => {
				// TODO: This will trigger Email Capture if the connect function doesn't wait for authorisation...
				onConnect(Connections.MAGIC);
			})
			.finally(() => {
				setConnecting(false);
			});
	}, []);

	useEffect(() => {
		if (typeof window !== "undefined") {
			const name = Bowser.getParser(
				window.navigator.userAgent
			).getBrowserName();
			setBrowserName(name);
		}
		return () => {};
	}, []);

	return (
		<Pane
			display="flex"
			flexDirection="column"
			flex={1}
			alignItems="center"
			justifyContent="center"
			padding={32}
			marginBottom={32}
		>
			<Heading is="h1" size={800} marginBottom={12}>
				👋&nbsp;&nbsp;Welcome!
			</Heading>
			<Text size={500}>To get started, connect your wallet</Text>
			<Pane
				background="tint2"
				padding={16}
				margin={12}
				borderRadius={8}
				display="flex"
				flexDirection="column"
			>
				<Pane marginBottom={8}>
					{!isArConnectLoading ? (
						<Button
							height={majorScale(7)}
							iconBefore={<Image src={ArConnectIcon} width={30} height={30} />}
							onClick={connectArConnect}
							isLoading={isLoading}
							minWidth={300}
						>
							<strong>Connect with ArConnect</strong>
						</Button>
					) : (
						<Link
							href={
								browserName.toLowerCase().includes("firefox")
									? ARCONNECT_FIREFOX_URL
									: ARCONNECT_CHROME_URL
							}
							target="_blank"
							rel="nopenner noreferrer"
						>
							<Button
								height={majorScale(6)}
								iconBefore={
									<Image src={ArConnectIcon} width={30} height={30} />
								}
								minWidth={300}
							>
								<strong>Install ArConnect</strong>
							</Button>
						</Link>
					)}
				</Pane>
				<Pane>
					<Button
						height={majorScale(7)}
						iconBefore={() => <UilLockOpenAlt size="28" />}
						onClick={connectMagic}
						isLoading={isLoading}
						minWidth={300}
					>
						<strong>Email, SMS, and more</strong>
					</Button>
				</Pane>
			</Pane>
		</Pane>
	);
};

WalletConnectScreen.propTypes = {};

export default WalletConnectScreen;
