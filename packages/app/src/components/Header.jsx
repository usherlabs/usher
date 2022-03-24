import React, { useState } from "react";
import Image from "next/image";
import PropTypes from "prop-types";
import isEmpty from "lodash/isEmpty";
import {
	Pane,
	Heading,
	Button,
	majorScale,
	ChevronDownIcon,
	LogOutIcon,
	Popover,
	Position,
	Menu,
	Avatar
} from "evergreen-ui";

import flip from "@/utils/props-flip";

import LogoImage from "@/assets/logo/Logo-Icon.svg";
import DiscordIcon from "@/assets/icon/discord-icon.svg";
import ArConnectIcon from "@/assets/icon/arconnect.svg";

const Header = ({
	walletAddress,
	username,
	avatarUrl,
	disconnectService,
	disconnectWallet
}) => {
	const [isLoading, setLoading] = useState(false);

	return (
		<Pane
			display="flex"
			padding={16}
			borderRadius={8}
			width="100%"
			alignItems="center"
			background={isEmpty(walletAddress) ? "white" : "tint2"}
			{...flip(isEmpty(walletAddress) || isEmpty(username), {
				position: ["absolute", null],
				left: [0, null],
				right: [0, null]
			})}
		>
			<Pane
				flex={1}
				alignItems="center"
				display="flex"
				justifyContent={isEmpty(walletAddress) ? "center" : "flex-start"}
			>
				<Pane
					border
					marginRight={12}
					backgroundColor="white"
					borderRadius={8}
					display="flex"
					alignItems="center"
				>
					<Image src={LogoImage} width={56} height={56} />
				</Pane>
				<Heading size={600}>Usher</Heading>
			</Pane>
			{!isEmpty(walletAddress) && (
				<Pane>
					{!isEmpty(username) && (
						<Popover
							position={Position.BOTTOM_LEFT}
							content={
								<Menu>
									<Menu.Item
										icon={LogOutIcon}
										onClick={(e) => {
											setLoading(true);
											disconnectService(e).finally(() => setLoading(false));
										}}
									>
										Disconnect
									</Menu.Item>
								</Menu>
							}
						>
							<Button
								marginRight={16}
								height={majorScale(5)}
								borderRadius={40}
								iconBefore={<Image src={DiscordIcon} width={20} height={20} />}
								iconAfter={ChevronDownIcon}
								isLoading={isLoading}
							>
								{!isEmpty(avatarUrl) && (
									<Avatar
										src={avatarUrl}
										size={30}
										name={username}
										marginRight={8}
									/>
								)}
								<strong>{username}</strong>
							</Button>
						</Popover>
					)}
					<Popover
						position={Position.BOTTOM_LEFT}
						content={
							<Menu>
								<Menu.Item
									icon={LogOutIcon}
									onClick={(e) => {
										setLoading(true);
										disconnectWallet(e).finally(() => setLoading(false));
									}}
								>
									Disconnect
								</Menu.Item>
							</Menu>
						}
					>
						<Button
							appearance="primary"
							height={majorScale(5)}
							borderRadius={40}
							iconBefore={<Image src={ArConnectIcon} width={25} height={25} />}
							iconAfter={ChevronDownIcon}
							isLoading={isLoading}
						>
							<strong>
								Account{" "}
								{walletAddress.substring(
									walletAddress.length - 4,
									walletAddress.length
								)}
							</strong>
						</Button>
					</Popover>
				</Pane>
			)}
		</Pane>
	);
};

Header.propTypes = {
	walletAddress: PropTypes.string,
	username: PropTypes.string,
	avatarUrl: PropTypes.string,
	disconnectService: PropTypes.func,
	disconnectWallet: PropTypes.func
};

Header.defaultProps = {
	walletAddress: "",
	username: "",
	avatarUrl: "",
	disconnectService() {},
	disconnectWallet() {}
};

export default Header;
