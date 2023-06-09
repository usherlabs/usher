import "es6-shim";

import "ka-table/style.scss";
import React, { useEffect } from "react";
import { AppProps } from "next/app";
import { DefaultSeo, NextSeoProps } from "next-seo";
import { ThemeProvider } from "evergreen-ui";
import { QueryClient, QueryClientProvider } from "react-query";
import { useRouter } from "next/router";
import Script from "next/script";
import "modern-normalize";

import UserProvider from "@/providers/User";
import { setup as setupSignals } from "@/utils/signals";
import "@/styles/styles.scss";
import DashboardContainer from "@/containers/Dashboard";
import Preloader from "@/components/Preloader";
import "@/integrations";
import { isProd, mauticOrigin } from "@/env-config";
import { AppEvents, events } from "@/utils/events";

import { initOnboard } from "@/utils/onboard";
import { theme } from "@/themes/theme";

type Props = AppProps & {
	pageProps: {
		seo?: NextSeoProps;
		noUser?: boolean;
	};
};

initOnboard();

if (!isProd) {
	// @ts-ignore
	import("@/admin");
}

const queryClient = new QueryClient();

const dynamicStaticPathnames = ["/inv/[id]", "/link/[id]"];

const App = ({ Component, pageProps }: Props) => {
	const router = useRouter();

	useEffect(() => {
		events.emit("app"); // an event to indicate the app has loaded.

		if (typeof window !== "undefined") {
			setupSignals();
			events.emit(AppEvents.PAGE_LOAD, { url: window.location.href });
		}
		const routeChangeComplete = (url: string) => {
			events.emit(AppEvents.PAGE_CHANGE, { url });
		};
		router.events.on("routeChangeComplete", routeChangeComplete);
		return () => {
			router.events.off("routeChangeComplete", routeChangeComplete);
		};
	}, []);

	const { seo = {}, noUser = false } = pageProps;

	const AppMain = (
		<main id="usher-app">
			<DefaultSeo defaultTitle="Usher" titleTemplate="%s | Usher" {...seo} />
			<Component {...pageProps} />
			{mauticOrigin && (
				<Script
					id="mautic-tracking"
					strategy="afterInteractive"
					dangerouslySetInnerHTML={{
						__html: `
							(function(w,d,t,u,n,a,m){w['MauticTrackingObject']=n;
									w[n]=w[n]||function(){(w[n].q=w[n].q||[]).push(arguments)},a=d.createElement(t),
									m=d.getElementsByTagName(t)[0];a.async=1;a.src=u;m.parentNode.insertBefore(a,m)
							})(window,document,'script','${mauticOrigin}/mtc.js','mt');

							mt('send', 'pageview');
						`
					}}
				/>
			)}
		</main>
	);

	// Used for dynamic routes that use getStaticProps
	if (router.isFallback && dynamicStaticPathnames.includes(router.pathname)) {
		return (
			<ThemeProvider value={theme}>
				<Preloader />
			</ThemeProvider>
		);
	}

	return (
		<QueryClientProvider client={queryClient}>
			<ThemeProvider value={theme}>
				{noUser ? (
					AppMain
				) : (
					<UserProvider>
						<DashboardContainer>{AppMain}</DashboardContainer>
					</UserProvider>
				)}
			</ThemeProvider>
		</QueryClientProvider>
	);
};

export default App;
