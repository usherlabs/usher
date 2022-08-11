/* eslint-disable no-underscore-dangle, no-await-in-loop */
/**
 * A class representing a single Shareable Owner authentication
 */

import { Base64 } from "js-base64";
import { TileDocument } from "@ceramicnetwork/stream-tile";
import { DID } from "dids";
import { TileLoader } from "@glazed/tile-loader";
import ono from "@jsdevtools/ono";
import { nanoid } from "nanoid/async";
import * as uint8arrays from "uint8arrays";
import uniq from "lodash/uniq";
import uniqWith from "lodash/uniqWith";
import isEqual from "lodash/isEqual";

import { ShareableOwnerModel } from "@usher/ceramic";

import { Partnership, PartnershipData, Chains } from "@/types";
import Auth from "./auth";
import WalletAuth from "./wallet";

type ShareableOwner = {
	owner?: {
		dids: string[];
		id: string;
		secret: string;
	};
	migrate_to?: string;
};

type SetObject = {
	set: string[];
};

const CERAMIC_PARTNERSHIPS_KEY = "partnerships";

class OwnerAuth extends Auth {
	protected _id: string = ""; // id of stream for content

	protected _partnerships: Partnership[] = [];

	protected loader: TileLoader;

	protected _authorities: string[] = [];

	constructor() {
		super(ShareableOwnerModel);
		this.loader = new TileLoader({ ceramic: this._ceramic });
	}

	public get id() {
		return this._id;
	}

	public get authorities() {
		return this._authorities;
	}

	public get partnerships() {
		return this._partnerships;
	}

	/**
	 * Iterates over ShareableOwner Streams until it reachs an owner
	 * Then authenticates
	 * Returns the Stream ID of the Document where Owner is used.
	 *
	 * @return  {string}  Stream ID that is considered the current owner
	 */
	public async connect(id: string, did: DID): Promise<string> {
		// Iterate over migrated owners
		let ownerDocId = id;
		let ownerDoc = null;
		while (ownerDoc === null) {
			const doc = await this.loadDoc<ShareableOwner>(ownerDocId);
			const migrateTo = doc.content.migrate_to;
			if (migrateTo && migrateTo.length > 0) {
				ownerDocId = migrateTo;
			} else {
				ownerDoc = doc;
			}
		}

		console.log(`Connected Owner Doc`, {
			id: ownerDocId,
			content: ownerDoc.content,
			auth: did.id
		});

		const { owner } = ownerDoc.content;
		if (!owner) {
			throw new Error("Connected Owner Doc is malformed");
		}

		const secret = await OwnerAuth.decodeSecret(did, owner.secret);

		await this.authenticate(owner.id, secret);

		this._id = ownerDocId;

		this._authorities = owner.dids;

		return ownerDocId;
	}

	// Load the Partnerships Stream
	public async loadPartnerships(): Promise<Partnership[]> {
		console.log("[Dev] load partnerships");
		const setObj = await this.store.get(CERAMIC_PARTNERSHIPS_KEY);
		if (!setObj) {
			return [];
		}
		const { set } = setObj as SetObject;
		const streams = await Promise.all(
			set.map((id) => this.loader.load<PartnershipData>(id))
		);
		console.log("[Dev] fetched partnerships", streams);

		const partnerships = streams.map((stream) => ({
			id: stream.id.toString(),
			...stream.content
		}));
		this._partnerships = partnerships;

		return this._partnerships;
	}

	/**
	 * Add Campaign to Partnerships and load new index
	 * 1. Creates a new partnership stream
	 * 2. Adds partnership stream to the ShareableOwner DID Data Store
	 *
	 * @param   {Partnership}  partnership  new partnership to add
	 *
	 * @return  {[type]}                    [return description]
	 */
	public async addPartnership(campaignAddress: string): Promise<Partnership[]> {
		// Check if Partnership already exists
		if (this.partnerships.find((p) => p.address === campaignAddress)) {
			throw ono("Partnership already exists", campaignAddress);
		}

		console.log(`Creating Partnership...`);
		const doc = await TileDocument.create(
			// @ts-ignore
			this._ceramic,
			{
				chain: Chains.ARWEAVE,
				address: campaignAddress
			},
			{
				schema: this.model.getSchemaURL("partnership"),
				family: "usher:partnerships"
			},
			{
				pin: true
			}
		);

		console.log(`Partership created with stream id`, doc.id.toString());

		let set: string[] = [];
		const setObj = await this.store.get(CERAMIC_PARTNERSHIPS_KEY);
		if (setObj) {
			set = (setObj as SetObject).set;
		}

		set.push(doc.id.toString());

		await this.store.set(CERAMIC_PARTNERSHIPS_KEY, { set });

		console.log(`Partership added to DID set`, { set });

		this._partnerships = [
			...this._partnerships,
			{
				id: doc.id.toString(),
				address: campaignAddress
			}
		];

		return this._partnerships;
	}

	public loadDoc<T>(streamId: string) {
		return this.loader.load<T>(streamId);
	}

	public loadOwnerDoc() {
		return this.loadDoc<ShareableOwner>(this.id);
	}

	/**
	 * Merge owner into this owner
	 *
	 * * Currently only supports merging Index Records that confirm to the Set.json schema
	 *
	 * @param   {DID}  authority  A (Wallet) DID (authority) that manages this owner
	 * @param   {OwnerAuth}  mergingOwner  Owner to be merged
	 * // @param   {DID}  mergingAuthority  A (Wallet) DID (authority) that manages the owner to be merged
	 *
	 * @return  {Promise<void>}
	 */
	public async merge(
		authority: DID,
		mergingOwnerAuth: OwnerAuth
		// mergingAuthority: DID
	): Promise<void> {
		const iterator = mergingOwnerAuth.iterateIndex();
		let isDone = false;
		const setIndex: Record<string, string[]> = {};

		console.log(
			"[Dev] start merge between owners",
			this.did.id,
			mergingOwnerAuth.did.id
		);

		while (!isDone) {
			const res = await iterator.next();
			console.log("[Dev] iterator next", res);
			if (res.done) {
				isDone = true;
			}
			if (res.value) {
				// If set, change all controllers to this.owner
				if (Array.isArray(res.value.record?.set)) {
					// We don't await here, because this ownership transfer can run async...
					const streamIds = res.value.record.set as string[];
					setIndex[res.value.key] = streamIds;
					Promise.all(
						streamIds.map(async (id) => {
							const doc = await mergingOwnerAuth.loadDoc(id);
							await doc.update(doc.content, {
								controllers: [this.did.id]
							});
						})
					);
				}
			}
		}

		console.log("[Dev] owners updates for merging set documents", setIndex);

		// Merge the sets into the owner sets
		// The keys between sets should be the same -- as they reference the same definition streams
		const ownerIndex = await this.getIndex();
		console.log("[Dev] this.owner index", ownerIndex);
		await Promise.all(
			Object.entries(setIndex).map(async ([key, set]) => {
				if (ownerIndex[key]) {
					const doc = await this.loadDoc<{ set: string[] }>(ownerIndex[key]);
					const { content } = doc;
					await doc.update({ set: uniq([...content.set, ...set]) });
				} else {
					// In the circumstance where the key doesn't exist in the owner -- ie. it needs to be created
					await this.store.setRecord(key, {
						set
					});
				}

				// Remove/Unpin all records on mergingOwnerAuth
				const removingRecordId = await mergingOwnerAuth.getRecordId(key);
				const doc = await mergingOwnerAuth.loadDoc<{ set: string[] }>(
					removingRecordId
				);
				await doc.update({ set: [] }, undefined, { pin: false });
				await mergingOwnerAuth.removeRecord(key);
			})
		);

		console.log("[Dev] document sets merged in and original docs unpinned");

		const shareableOwnerDoc = await mergingOwnerAuth.loadOwnerDoc();
		const { owner: mergingOwner } = shareableOwnerDoc.content;
		if (!mergingOwner) {
			throw new Error("Connected Merging Owner Doc is malformed");
		}

		await this.addAuthorities(authority, mergingOwner.dids);

		console.log("[Dev] authorities over this.owner updated");

		// Set the migrate_to value on mergingOwner ShareableOwner Stream
		await shareableOwnerDoc.update({ migrate_to: this.id });

		console.log("[Dev] legacy owner updated with migrate_to:", this.id);

		// Merge partnerships
		this._partnerships = uniqWith(
			[...this._partnerships, ...mergingOwnerAuth.partnerships],
			isEqual
		);
	}

	/**
	 * Add a new authority to the owner
	 */
	public async addAuthorities(
		authority: DID,
		newAuthorities: DID[] | string[]
	): Promise<void> {
		// Decrypt the secret and re-encrypt with new did recipients
		const ownerDoc = await this.loadOwnerDoc();
		const { owner } = ownerDoc.content;
		if (!owner) {
			throw new Error("Connected Owner Doc is malformed");
		}
		const secret = await OwnerAuth.decodeSecret(authority, owner.secret);
		const newOwnerDids = uniq([
			...owner.dids,
			...newAuthorities.map((did) => (typeof did === "string" ? did : did.id))
		]);
		const newSecret = await OwnerAuth.encodeSecret(
			authority,
			secret,
			newOwnerDids
		);
		await ownerDoc.update({
			owner: {
				dids: newOwnerDids,
				id: owner.id,
				secret: newSecret
			}
		});
	}

	/**
	 * Create a new Owner
	 *
	 * The Merge function is going to be responsible for aggregating wallets for a single owner
	 * This method is responsible for creating an owner for a single wallet connection
	 *
	 * @return  {string}  owner id
	 */
	public async create(auth: WalletAuth): Promise<string> {
		if (this.did) {
			throw ono("Owner already created");
		}
		// Produce keys and authenticate
		const sec = await nanoid(32);
		const id = await nanoid(64);

		const secret = uint8arrays.fromString(sec);

		await this.authenticate(id, secret);

		// Encrypt keys and store
		const enc = await OwnerAuth.encodeSecret(auth.did, secret);
		const doc = await TileDocument.create<ShareableOwner>(
			// @ts-ignore
			this._ceramic,
			{
				owner: {
					dids: [auth.did.id],
					id,
					secret: enc
				}
			},
			{
				schema: auth.getSchema("ShareableOwner")
			}
		);

		const { owner } = doc.content;
		if (!owner) {
			throw new Error("Created Owner Doc is malformed");
		}

		const ownerId = doc.id.toString();

		await auth.setShareableOwnerId(ownerId);

		this._id = ownerId;

		this._authorities = owner.dids;

		console.log(`Created Owner Doc`, ownerId, doc.content);

		return ownerId;
	}

	public static async decodeSecret(did: DID, data: string) {
		const decoded = Base64.decode(data);
		const jwe = JSON.parse(decoded);
		const secret = await did.decryptJWE(jwe);
		return secret;
	}

	public static async encodeSecret(
		did: DID,
		data: Uint8Array,
		recipients?: string[]
	) {
		const jwe = await did.createJWE(data, recipients || [did.id]);
		const str = JSON.stringify(jwe);
		const enc = Base64.encode(str);
		return enc;
	}

	public static encodeSecretFromString(
		did: DID,
		data: string,
		recipients?: string[]
	) {
		const buf = uint8arrays.fromString(data);
		return this.encodeSecret(did, buf, recipients);
	}
}

export default OwnerAuth;
