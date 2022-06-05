import { NextPageContext, NextApiRequest, NextApiResponse } from "next";
// import { BaseLogger } from "pino";
import { DataModel } from "@glazed/datamodel";
import { DIDDataStore } from "@glazed/did-datastore";
import { ModelTypeAliases } from "@glazed/types";

/**
 * ###### ENUMS ######
 */

export enum Breakpoints {
	xSmall = 480,
	small = 600,
	medium = 768,
	large = 889,
	xLarge = 120
}

export enum Chains {
	ARWEAVE = "arweave",
	ETHEREUM = "ethereum"
	// POLYGON = "polygon"
}

export enum Connections {
	MAGIC = "magic",
	ARCONNECT = "ar_connect"
}

export enum CampaignConflictStrategy {
	OVERWRITE = "OVERWRITE",
	PASSTHROUGH = "PASSTHROUGH"
}

export enum CampaignStrategies {
	FLAT = "flat",
	PERCENTAGE = "percentage"
}

export enum RewardTypes {
	TOKEN = "token",
	NFT = "nft",
	PST = "pst"
}

/**
 * ###### TYPES ######
 */

export type RawCampaign = {
	events: {
		strategy: CampaignStrategies;
		rate: number;
		limit: number;
	}[];
	reward: {
		address?: string;
		limit: number;
	};
	conflictStrategy: CampaignConflictStrategy;
	details: string;
	advertiser?: string;
};

export type Advertiser = {
	name?: string;
	icon?: string;
	description?: string;
	externalLink?: string;
	twitter?: string;
};

export type CampaignDetails = {
	destinationUrl: string;
	name: string;
	description?: string;
	image?: string;
	externalLink?: string;
};

export type CampaignReward = {
	name: string;
	ticker: string;
	type: RewardTypes;
	limit: number;
};

export type Campaign = {
	id: string;
	owner: string;
	events: {
		strategy: CampaignStrategies;
		rate: number;
		limit: number;
	}[];
	reward: CampaignReward;
	conflictStrategy: CampaignConflictStrategy;
	details: CampaignDetails;
	advertiser: Advertiser;
};

export type Wallet = {
	chain: Chains;
	connection: Connections;
	address: string;
	partnerships: Partnership[];
};

export type CampaignReference = {
	chain: Chains;
	address: string;
};

export type Partnership = {
	id: string;
	campaign: CampaignReference;
};

export type Profile = {
	email: string;
};

export type User = {
	wallets: Wallet[];
	verifications: {
		personhood: number | null; // here we store the timestamp that the user was verified.
		captcha: boolean;
	};
	profile: Profile;
};

export type Exception = Error & {
	statusCode?: number;
};

export type ExceptionContext =
	| (NextPageContext & {
			req: NextApiRequest;
			res: NextApiResponse;
			errorInfo?: Record<string, any> | null;
	  })
	| null;

export type Token = {
	name: string;
	ticker: string;
	type: string;
};

export type Contract = {
	strategy: string;
	rate: number;
	token: Token;
	limit: number;
	conflictStrategy: string;
};

// Server Types

export interface ApiRequest extends NextApiRequest {
	// log: BaseLogger;
}

export interface AuthApiRequest extends ApiRequest {
	token: string;
	user: User;
}

export interface ApiResponse extends NextApiResponse {}

/**
 * ###### INTERFACES ######
 */

export interface IDIDDataStore
	extends DIDDataStore<
		ModelTypeAliases<
			Record<string, any>,
			Record<string, string>,
			Record<string, string>
		>,
		string
	> {}
export interface IDataModel
	extends DataModel<
		ModelTypeAliases<
			Record<string, any>,
			Record<string, string>,
			Record<string, string>
		>,
		any
	> {}

export interface IUserActions {
	connect: (type: Connections) => Promise<void>;
	disconnect: (type: Connections) => Promise<void>;
	setCaptcha: (value: boolean) => void;
	setProfile: (value: Profile) => void;
	addPartnership: (
		walletData: string | Wallet,
		partnership: CampaignReference
	) => Promise<void>;
}

export interface IUserContext extends IUserActions {
	user: User;
	loading: boolean;
}
