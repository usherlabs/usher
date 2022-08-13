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
			to: string
		): Promise<{
			success: boolean;
			data?: Claim;
		}> {
			return request
				.post("claim", {
					json: {
						partnership,
						to
						// TODO: Add signature verification parameters -- ie. ensuring they own the wallet we're transferring to
					}
				})
				.json();
		}
	};
};
