/* eslint-disable no-underscore-dangle */

/**
 * A class representing a single authentication (wallet connection)
 */
import { WalletModel } from "@usher.so/datamodels";

import { Wallet } from "@/types";
import Auth from "./auth";

type MagicWallet = {
	arweave?: {
		address: string;
		data: string;
	};
};

const CERAMIC_MAGIC_WALLETS_KEY = "magicWallets";
const CERAMIC_SHAREABLE_OWNER_KEY = "shareableOwner";

class WalletAuth extends Auth {
	constructor(protected _wallet: Wallet) {
		super(WalletModel);
	}

	public get wallet() {
		return this._wallet;
	}

	public get address() {
		return this._wallet.address;
	}

	public get id() {
		const wallet = this._wallet;
		const id = [wallet.chain, wallet.address].join(":");
		return id;
	}

	public async connect(sig: Uint8Array) {
		await this.authenticate(this.id, sig);
	}

	/**
	 * Fetch the ShareableOwner ID
	 */
	public async getShareableOwnerId(): Promise<string | null> {
		const content = await this.store.get(CERAMIC_SHAREABLE_OWNER_KEY);
		if (content) {
			return content.id;
		}
		return null;
	}

	/**
	 * Set the ShareableOwner ID
	 *
	 * Ensure that the owner can be accessed by the Auth when it's ownerId is set.
	 */
	public async setShareableOwnerId(id: string): Promise<void> {
		await this.store.set(CERAMIC_SHAREABLE_OWNER_KEY, { id }, { pin: true });
	}

	public getMagicWallets() {
		return this.store.get(CERAMIC_MAGIC_WALLETS_KEY);
	}

	public addMagicWallet(wallet: MagicWallet) {
		return this.store.merge(CERAMIC_MAGIC_WALLETS_KEY, wallet);
	}
}

export default WalletAuth;
