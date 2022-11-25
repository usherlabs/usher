import React, {
	// useEffect,
	// useState,
	useCallback
} from "react";
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
	CogIcon,
	// MenuIcon,
	Badge
} from "evergreen-ui";
import { UilUserCircle, UilWallet } from "@iconscout/react-unicons";
import { css } from "@linaria/core";
// import { useRouter } from "next/router";

import Anchor from "@/components/Anchor";
import { useUser } from "@/hooks";
import useRedir from "@/hooks/use-redir";
import * as mediaQueries from "@/utils/media-queries";
import UrlSubmit from "@/components/UrlSubmit";

import LogoImage from "@/assets/logo/Logo-Icon.svg";

type Props = {
	height: number;
	walletCount: number;
	onWalletClick: () => void;
	onSettingsClick: () => void;
	onLogoutClick: () => void;
	createURL: (targetUrl: string) => void;
};

const Header: React.FC<Props> = ({
	height,
	walletCount,
	onWalletClick,
	onSettingsClick,
	onLogoutClick,
	createURL,
	...props
}) => {
	const { colors } = useTheme();
	const {
		user: { wallets },
		isLoading: isWalletLoading
	} = useUser();
	// const [currentPathname, setCurrentPathname] = useState("");
	// const [showMobileMenu, setShowMobileMenu] = useState(false);
	const loginUrl = useRedir("/login");
	// const router = useRouter();

	const onUrlSubmit = useCallback((value: string) => {
		// Create new URL
	}, []);

	// Listen for route change and update the new url pathname
	// const onRouteChangeComplete = useCallback(
	// 	(url: string) => {
	// 		if (url !== currentPathname) {
	// 			setCurrentPathname(url);
	// 		}
	// 		// setShowMobileMenu(false);
	// 	},
	// 	[currentPathname]
	// );

	// useEffect(() => {
	// 	if (typeof window !== "undefined") {
	// 		setCurrentPathname(window.location.pathname);
	// 	}

	// 	router.events.on("routeChangeComplete", onRouteChangeComplete);
	// 	return () => {
	// 		router.events.off("routeChangeComplete", onRouteChangeComplete);
	// 	};
	// }, []);

	const menuButtonProps = {
		appearance: "minimal",
		paddingX: 0,
		width: height,
		height,
		boxShadow: "none !important",
		className: css`
			:hover svg {
				fill: #000 !important;
			}
			${mediaQueries.isLarge} {
				width: auto;
				padding-left: 10px;
				padding-right: 10px;
			}
		`
	};

	const ProfileButton = (
		<Button {...menuButtonProps}>
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
						paddingLeft={16}
						paddingY={8}
					>
						<Pane
							border
							backgroundColor="white"
							borderRadius={8}
							display="flex"
							alignItems="center"
						>
							<Image src={LogoImage} height={height - 16} width={height - 16} />
						</Pane>
						<Heading
							marginLeft={12}
							size={600}
							color={colors.gray900}
							className={css`
								${mediaQueries.isXSmall} {
									display: none !important;
								}
							`}
						>
							Usher
						</Heading>
						<Badge color="yellow" marginX={8}>
							ALPHA
						</Badge>
					</Pane>
				</Anchor>
				<Pane>
					<UrlSubmit onSubmit={onUrlSubmit} />
				</Pane>
				<Pane
					paddingX={16}
					className={css`
						${mediaQueries.isXSmall} {
							padding-left: 0px;
						}
					`}
				>
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
					<Button {...menuButtonProps} onClick={onWalletClick}>
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
