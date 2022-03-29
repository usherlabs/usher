import React, { useState, useCallback, useEffect } from "react";
import { Pane } from "evergreen-ui";
import isEmpty from "lodash/isEmpty";

import { useWallet, useUser } from "@/hooks/";
import Header from "@/components/Header";
import WalletConnectScreen from "@/screens/WalletConnect";
import EmailConnectScreen from "@/screens/EmailConnect";
import CaptchaScreen from "@/screens/Captcha";
import TypingBioId from "@/screens/TypingBioId";
import Preloader from "@/components/Preloader";
import handleException from "@/utils/handle-exception";
import * as alerts from "@/utils/alerts";
import { hcaptchaSiteKey } from "@/env-config";
import { ChildrenProps } from "@/utils/common-prop-types";

const DashboardContainer = ({ children }) => {
	const [{ address }, isWalletLoading, , { removeAddress }] = useWallet();
	const [user, isUserLoading, { signOut }] = useUser();
	const [isPreloading, setPreloading] = useState(true);
	const [isMounted, setMounted] = useState(false);
	const isLoading = isWalletLoading || isUserLoading;
	const isCaptchaVerified = isEmpty(hcaptchaSiteKey)
		? true
		: user?.verifications?.captcha === true;
	const isBioIdVerified = user?.verifications?.bioId === true;

	useEffect(() => {
		// Cancel preloader
		if (isLoading && !isMounted) {
			return () => {};
		}
		setMounted(true);
		const timeout = setTimeout(() => {
			setPreloading(false);
		}, 500);
		return () => {
			clearTimeout(timeout);
		};
	}, [isLoading]);

	const signOutHandler = useCallback(async () => {
		const { error } = await signOut();
		if (error) {
			handleException(error);
			alerts.error();
		}
	}, []);

	return (
		<Pane
			display="flex"
			flexDirection="column"
			marginY="0"
			marginX="auto"
			minHeight="100vh"
			position="relative"
		>
			{(isPreloading || (isLoading && !isMounted)) && <Preloader />}
			<Header
				walletAddress={address}
				userProvider={user?.app_metadata?.provider}
				username={
					user?.app_metadata?.provider === "email"
						? user?.email
						: user?.user_metadata?.full_name
				}
				avatarUrl={user?.user_metadata?.avatar_url}
				signOut={signOutHandler}
				disconnect={removeAddress}
			/>
			{isEmpty(address) && <WalletConnectScreen />}
			{isEmpty(user) && !isEmpty(address) && <EmailConnectScreen />}
			{!isEmpty(user) && !isEmpty(address) && !isCaptchaVerified && (
				<CaptchaScreen />
			)}
			{!isEmpty(user) &&
				!isEmpty(address) &&
				isCaptchaVerified &&
				!isBioIdVerified && <TypingBioId />}
			{!isEmpty(user) &&
				!isEmpty(address) &&
				isCaptchaVerified &&
				isBioIdVerified &&
				children}
		</Pane>
	);
};

DashboardContainer.propTypes = {
	children: ChildrenProps.isRequired
};

export default DashboardContainer;
