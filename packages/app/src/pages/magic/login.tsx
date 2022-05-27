import { useEffect } from "react";
// import Script from "next/script";
import { useRouter } from "next/router";

// import { magicPublicKey } from "@/env-config";
import Preloader from "@/components/Preloader";

const MagicLogin = () => {
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

	return (
		<>
			<Preloader message="Loading Magic..." />
		</>
	);
};

export async function getStaticProps() {
	return {
		props: {
			magic: {
				action: "login",
				redirectUri: "/magic/callback"
			}
		}
	};
}

export default MagicLogin;
