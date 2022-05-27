import "es6-shim";

import React, { useEffect } from "react";
import { AppProps } from "next/app";
import { DefaultSeo } from "next-seo";
import Script from "next/script";
import { ThemeProvider, mergeTheme, defaultTheme } from "evergreen-ui";
import kebabCase from "lodash/kebabCase";
import isEmpty from "lodash/isEmpty";
import "modern-normalize";
import { setup as setupSignals } from "@/utils/signals";
import "@/styles/styles.scss";
import { magicPublicKey } from "@/env-config";

const App = ({ Component, pageProps }: AppProps) => {
	const theme = mergeTheme(defaultTheme, {
		// See https://github.com/segmentio/evergreen/blob/master/src/themes/deprecated/foundational-styles/fontFamilies.js
		fontFamilies: {
			/**
			 * @property {string} display - Used for headings larger than 20px.
			 */
			display: `"DM Sans", "SF UI Display", -apple-system, BlinkMacSystemFont, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"`,

			/**
			 * @property {string} ui - Used for text and UI (which includes almost anything).
			 */
			ui: `"DM Sans", "SF UI Text", -apple-system, BlinkMacSystemFont, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"`,

			/**
			 * @property {string} mono - Used for code and sometimes numbers in tables.
			 */
			mono: `"DM Sans", "SF Mono", "Monaco", "Inconsolata", "Fira Mono", "Droid Sans Mono", "Source Code Pro", monospace`
		}
	});

	useEffect(() => {
		if (typeof window !== "undefined") {
			setupSignals();
		}
	}, []);

	console.log(pageProps);
	const { seo = {}, magic: magicPageProps } = pageProps;

	let magicProps = {};
	let magicAction = "";
	if (!isEmpty(magicPageProps)) {
		const { action, ...magicData } = magicPageProps;
		magicAction = action;
		magicProps = Object.keys(magicData).reduce(
			(acc: Record<string, string>, [key, val]) => {
				acc[`data-${kebabCase(key)}`] = val;
				return acc;
			},
			{}
		);
	}

	return (
		<ThemeProvider value={theme}>
			<main id="usher-app">
				<DefaultSeo title="Usher" {...seo} />
				<Component {...pageProps} />
			</main>
			<Script
				src={`https://auth.magic.link/pnp/${magicAction}`}
				data-magic-publishable-api-key={magicPublicKey}
				{...magicProps}
			/>
		</ThemeProvider>
	);
};

export default App;
