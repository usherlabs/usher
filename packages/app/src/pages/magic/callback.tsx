/**
 * Here we implement https://github.com/magiclabs/magic-js/blob/master/packages/%40magic-sdk/pnp/src/context/callback.ts
 * We've modified the PNP logic to work with our local Magic SDK.
 */

import { useEffect } from "react";
import { useRouter } from "next/router";

import UserProvider from "@/providers/User";
import Preloader from "@/components/Preloader";
import { useUser } from "@/hooks";
import { Connections } from "@/types";
import getMagicClient from "@/utils/magic-client";

// https://github.com/pubkey/broadcast-channel -- to prevent multiple tabs from processing the same connection.

const Screen = () => {
	// const {
	// 	actions: { connect }
	// } = useUser();
	const router = useRouter();
	useEffect(() => {
		// Ensure that the page is refreshed when router completes a url change
		const handleRefresh = () => {
			window.location.reload();
		};
		router.events.on("routeChangeComplete", handleRefresh);
		return () => {
			router.events.off("routeChangeComplete", handleRefresh);
		};
	}, []);

	useEffect(() => {
		if (typeof window !== "undefined") {
			console.log(window.location.search);
			window.addEventListener("@magic/ready", (e) => {
				// connect(Connections.MAGIC);
				const magic = getMagicClient();
				console.log(e.magic);
				console.log(magic);
				// @ts-ignore
				const { idToken } = e.detail;
				console.log(e);
				(async () => {
					// await magic.auth
					// 	.loginWithCredential
					// 	// "0xbb44d366afd12baea0cdee0c806ec9f56f69fc58e365c40822cfeb71aa186b0e30f03cd5423c4ab6a699a049157bdc6aabfa897eaf6216473c9af60264acda2a1c" // -- Given DID token is invalid or malformed.
					// 	();
					const isLoggedIn = await magic.user.isLoggedIn();
					console.log(`logged in`, isLoggedIn);
					console.log(magic.pnp);
					console.log(magic);
				})();
			});
		}
	}, []);

	return <Preloader message="Connecting with Magic..." />;
};

const MagicCallback = () => {
	return (
		<UserProvider>
			<Screen />
		</UserProvider>
	);
};

export async function getStaticProps() {
	return {
		props: {
			magic: {
				action: "callback"
			}
		}
	};
}

export default MagicCallback;
