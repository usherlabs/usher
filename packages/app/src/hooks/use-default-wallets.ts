/**
 * Affiliate can set a default wallet to view and join Campaigns with for a given chain
 */

import { useEffect } from "react";
import useLocalStorage from "use-local-storage";
import produce from "immer";

import { Chains } from "@/types";
import useUser from "./use-user";

type State = Record<Chains, string>;

function useDefaultWallets(): [State, (wallet: string, chain: Chains) => void] {
	const {
		user: { wallets }
	} = useUser();
	const [defaultWallets, setDefaultWalletsState] = useLocalStorage<State>(
		"usher:default-wallets",
		{
			[Chains.ARWEAVE]: "",
			[Chains.ETHEREUM]: ""
		}
	);

	const setDefaultWallet = (wallet: string, chain: Chains) => {
		setDefaultWalletsState(
			produce(defaultWallets, (draft: State) => {
				draft[chain] = wallet;
			})
		);
	};

	useEffect(() => {
		wallets.forEach((wallet) => {
			if (!defaultWallets[wallet.chain]) {
				setDefaultWallet(wallet.address, wallet.chain);
			}
		});
	}, [wallets]);

	return [defaultWallets, setDefaultWallet];
}

export default useDefaultWallets;
