import ky from "ky";
import {
	Campaign,
	PartnershipMetrics,
	Referral,
	Profile,
	Claim
} from "@/types";

// const formatQs = (o: Record<string, string>) => {
// 	const searchParams = new URLSearchParams(o);
// 	return searchParams.toString();
// };

export const request = ky.create({
	prefixUrl: "/api"
});

export const getAuthRequest = (authToken: string) =>
	request.extend({
		headers: {
			Authorization: `Bearer ${authToken}`
		}
	});

export const captcha = (authToken?: string) => {
	let req = request;
	if (authToken) {
		req = getAuthRequest(authToken);
	}

	return {
		post: (token: string): Promise<{ success: boolean }> => {
			return req
				.post(`${authToken ? "verify/" : ""}captcha`, {
					json: {
						token
					},
					timeout: 60000
				})
				.json();
		},
		get: (): Promise<{ success: boolean }> =>
			req.get(`verify/captcha`, { timeout: 30000 }).json()
	};
};

export const personhood = (authToken: string) => {
	const req = getAuthRequest(authToken);

	return {
		post: (token: string): Promise<{ success: boolean }> => {
			return req
				.post("verify/personhood", {
					json: {
						token
					},
					timeout: 60000
				})
				.json();
		},
		get: (): Promise<{ success: boolean }> =>
			req.get(`verify/personhood`, { timeout: 30000 }).json()
	};
};

export const bot = () => ({
	post: (token: string): Promise<{ success: boolean }> =>
		request
			.post("bot", {
				json: {
					token
				}
			})
			.json()
});

export const campaigns = () => ({
	get: (
		addresses?: string | string[]
	): Promise<{ success: boolean; data: Campaign[] }> => {
		let qs = "";
		if (addresses) {
			if (!Array.isArray(addresses)) {
				addresses = [addresses];
			}
			if (addresses.length > 0) {
				const params = new URLSearchParams();
				const q = addresses.join(",");
				params.set("q", q);
				qs = `?${params.toString()}`;
			}
		}
		return request.get(`campaigns${qs}`).json();
	}
});

export const partnerships = () => ({
	get: (
		ids: string | string[]
	): Promise<{ success: boolean; data: PartnershipMetrics }> => {
		let qs = "";
		if (!Array.isArray(ids)) {
			ids = [ids];
		}
		if (ids.length > 0) {
			const params = new URLSearchParams();
			const q = ids.join(",");
			params.set("q", q);
			qs = `?${params.toString()}`;
		}
		return request.get(`partnerships${qs}`).json();
	}
});

export const referrals = () => ({
	post: (
		partnership: string
	): Promise<{ success: boolean; data?: Referral }> => {
		return request
			.post(`referrals`, {
				json: {
					partnership
				}
			})
			.json();
	}
});

export const claim = (authToken: string) => {
	const req = getAuthRequest(authToken);

	return {
		post(
			partnership: string | string[],
			to: string
		): Promise<{
			success: boolean;
			data?: Claim;
		}> {
			return req
				.post("claim", {
					json: {
						partnership,
						to
					}
				})
				.json();
		}
	};
};

export const profile = (authToken: string) => {
	const req = getAuthRequest(authToken);

	return {
		post(p: Profile): Promise<{ success: boolean; profile: Profile }> {
			return req
				.post("profile", {
					json: p
				})
				.json();
		},
		get(): Promise<{ success: boolean; profile: Profile }> {
			return req.get("profile", { timeout: 30000 }).json();
		}
	};
};
