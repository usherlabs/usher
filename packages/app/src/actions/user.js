import { supabase } from "@/utils/supabase-client";
import { getAuthRequest } from "@/utils/browser-request";

export const checkCaptcha = async (user) => {
	// Check if the user has completed a captcha previously
	//* This check subject to change depending on how rigorous bot prevention at auth becomes.
	const sSel = await supabase
		.from("user_captcha_log_entries")
		.select(`id`, { count: "exact", head: true })
		.match({ is_success: true, user_id: user.id })
		.order("created_at", { ascending: false })
		.limit(1);
	if (sSel.error && sSel.status !== 406) {
		throw sSel.error;
	}
	console.log("user_captcha_log_entries: select", sSel);

	if (sSel.count > 0) {
		return true;
	}

	return false;
};

export const submitCaptcha = async (token) => {
	// Submit token to endpoint that requires auth
	const request = await getAuthRequest();
	const response = await request
		.post("user/captcha", {
			json: {
				token
			}
		})
		.json();
	console.log("submit-captcha", response);

	return response.success;
};

export const checkTypingBioId = async (user) => {
	// Check if the user has a bioid entry previously
	const sSel = await supabase
		.from("user_typing_bioid_log_entries")
		.select(`id`, { count: "exact", head: true })
		.match({ is_success: true, user_id: user.id })
		.order("created_at", { ascending: false })
		.limit(1);
	if (sSel.error && sSel.status !== 406) {
		throw sSel.error;
	}
	console.log("user_typing_bioid_log_entries: select", sSel);

	if (sSel.count > 0) {
		return true;
	}

	return false;
};

export const submitTypingBioId = async (token, values) => {
	// Submit token to endpoint that requires auth
	const request = await getAuthRequest();
	const response = await request
		.post("user/bioid", {
			json: {
				values,
				token
			}
		})
		.json();
	console.log("submit-bioid: ", response);

	return response.success;
};
