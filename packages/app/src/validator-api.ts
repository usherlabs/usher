import ky from "ky";
import { Claim } from "@/types";
import { validatorApiEndpoint } from "@/env-config";

export const request = ky.create({
	prefixUrl: validatorApiEndpoint
});

export const claim = () => {
	return {
		post(
			partnership: string | string[],
			sig: string,
			message: string,
			to: {
				chain: string;
				address: string;
				sig: string;
			}
		): Promise<{
			success: boolean;
			data?: Claim;
		}> {
			return request
				.post("claim", {
					json: {
						partnership,
						sig,
						message,
						to
					}
				})
				.json();
		}
	};
};

export const info = () => {
	return {
		get(): Promise<{
			version: string;
			addresses: Record<string, string>;
			feeMultiplier: number;
		}> {
			return request.get("info").json();
		}
	};
};
