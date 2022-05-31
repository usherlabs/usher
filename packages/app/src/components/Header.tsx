import React, { useEffect, useState } from "react";
import Image from "next/image";
import {
	Pane,
	Heading,
	Button,
	useTheme,
	Label,
	Spinner,
	Popover,
	Menu,
	Position,
	LogOutIcon,
	CogIcon
} from "evergreen-ui";
import { UilUserCircle, UilWallet } from "@iconscout/react-unicons";
import { css, cx } from "@linaria/core";

import Anchor from "@/components/Anchor";
import { useUser } from "@/hooks";
import useRedir from "@/hooks/use-redir";

import LogoImage from "@/assets/logo/Logo-Icon.svg";

type Props = {
	height: number;
	walletCount: number;
	onWalletClick: () => void;
	onSettingsClick: () => void;
	onLogoutClick: () => void;
};

const menu = [
	{
		href: "/",
		text: "My Partnerships",
		auth: true
	},
	{
		href: "/explore",
		text: "Explore"
	},
	{
		href: "https://go.usher.so/register",
		text: "Start a Campaign",
		external: true
	}
];

const Header: React.FC<Props> = ({
	height,
	walletCount,
	onWalletClick,
	onSettingsClick,
	onLogoutClick,
	...props
}) => {
	const { colors } = useTheme();
	const {
		user: { wallets },
		isLoading: isWalletLoading
	} = useUser();
	const [currentPathname, setCurrentPathname] = useState("");
	const loginUrl = useRedir("/login");

	useEffect(() => {
		if (typeof window !== "undefined") {
			setCurrentPathname(window.location.pathname);
		}
	}, []);

	const ProfileButton = (
		<Button
			appearance="minimal"
			paddingX={0}
			width={height}
			height={height}
			boxShadow="none !important"
			className={css`
				:hover svg {
					fill: #000 !important;
				}
			`}
		>
			<UilUserCircle size="32" color={colors.gray700} />
		</Button>
	);

	return (
		<Pane width="100%" background="tint2" height={height} {...props}>
			<Pane
				marginX="auto"
				display="flex"
				alignItems="center"
				justifyContent="space-between"
			>
				<Anchor href="/">
					<Pane
						alignItems="center"
						display="flex"
						justifyContent="flex-start"
						paddingX={16}
						paddingY={8}
					>
						<Pane
							border
							marginRight={12}
							backgroundColor="white"
							borderRadius={8}
							display="flex"
							alignItems="center"
						>
							<Image src={LogoImage} height={height - 16} width={height - 16} />
						</Pane>
						<Heading size={600} color={colors.gray900}>
							Usher
						</Heading>
					</Pane>
				</Anchor>
				<Pane paddingX={16}>
					{menu
						.filter((item) => {
							if (item.auth && wallets.length === 0) {
								return false;
							}
							return true;
						})
						.map((item) => (
							<Anchor
								key={item.text}
								href={item.href}
								external={item.external || false}
							>
								<Button
									appearance="minimal"
									height={height}
									boxShadow="none !important"
									position="relative"
									className={cx(
										css`
											:hover label {
												color: #000 !important;
											}
										`,
										currentPathname === item.href
											? css`&:after {
											content: "";
											position: absolute;
											background-color: #3366FF
											left: 0;
											right: 0;
											bottom: 0;
											height: 3px;
										}`
											: ""
									)}
								>
									<Label size={500} color={colors.gray800} pointerEvents="none">
										{item.text}
									</Label>
								</Button>
							</Anchor>
						))}
					{wallets.length === 0 ? (
						<Anchor href={loginUrl}>{ProfileButton}</Anchor>
					) : (
						<Popover
							position={Position.BOTTOM_RIGHT}
							content={
								<Menu>
									<Menu.Group>
										<Menu.Item icon={CogIcon} onClick={onSettingsClick}>
											Settings
										</Menu.Item>
										<Menu.Item icon={LogOutIcon} onClick={onLogoutClick}>
											Log Out
										</Menu.Item>
									</Menu.Group>
								</Menu>
							}
						>
							{ProfileButton}
						</Popover>
					)}
					<Button
						appearance="minimal"
						paddingX={0}
						width={height}
						height={height}
						boxShadow="none !important"
						position="relative"
						className={css`
							:hover svg {
								fill: #000 !important;
							}
						`}
						onClick={onWalletClick}
					>
						<UilWallet size="32" color={colors.gray700} />
						{walletCount > 0 && (
							<Label
								position="absolute"
								top="5px"
								right="5px"
								width="20px"
								height="20px"
								fontWeight={900}
								backgroundColor={colors.blue500}
								color="#fff"
								borderRadius={100}
								display="flex"
								alignItems="center"
								justifyContent="center"
							>
								{walletCount}
							</Label>
						)}
						{isWalletLoading && (
							<Pane position="absolute" bottom="7.5px" right="7.5px">
								<Spinner size={16} />
							</Pane>
						)}
					</Button>
				</Pane>
			</Pane>
		</Pane>
	);
};

Header.defaultProps = {
	walletCount: 0
};

export default Header;
