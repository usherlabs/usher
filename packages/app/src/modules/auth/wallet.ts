/* eslint-disable no-underscore-dangle */

/**
 * A class representing a single authentication (wallet connection)
 */
import { WalletModel } from "@usher/ceramic";

import { Wallet, Chains, Connections } from "@/types";
import Auth from "./auth";

type MagicWallet = {
	arweave?: {
		address: string;
		data: string;
		created_at: number;
	};
};

const CERAMIC_MAGIC_WALLETS_KEY = "magicWallets";
const CERAMIC_SHAREABLE_OWNER_KEY = "shareableOwner";

class WalletAuth extends Auth {
	private _wallet!: Wallet;

	constructor() {
		super(WalletModel);
	}

	public get wallet() {
		return this._wallet;
	}

	public get address() {
		return this._wallet.address;
	}

	public async connect(
		address: string,
		secret: Uint8Array,
		chain: Chains,
		connection: Connections
	) {
		await this.authenticate([chain, address].join(":"), secret);

		this._wallet = {
			address,
			chain,
			connection
		};
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