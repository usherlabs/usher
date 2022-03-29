/**
 * POST: Receives a Captcha Token and verifies against the hcaptcha service
 */

import got from "got";
import FormData from "form-data";

import getHandler from "@/server/middleware";
import auth from "@/server/middleware/auth";
import { supabase } from "@/utils/supabase-client";
import { hcaptchaSecretKey } from "@/server/env-config";

const handler = getHandler();

handler.use(auth).post(async (req, res) => {
	const { id: userId } = req.user; // invitee user
	const { token } = req.body;

	req.log.info({ params: { userId, token } }, "Captcha verification");

	if (!token) {
		return res.status(400).json({
			success: false
		});
	}

	const formData = new FormData();
	formData.append("secret", hcaptchaSecretKey);
	formData.append("response", token);
	const response = await got
		.post("https://hcaptcha.com/siteverify", {
			body: formData
		})
		.json();

	req.log.info({ captcha: { response } }, "Captcha repsonse");

	const sIns = await supabase.from("user_captcha_log_entries").insert({
		token,
		is_success: response.success,
		response,
		user_id: userId
	});
	if (sIns.error && sIns.status !== 406) {
		throw sIns.error;
	}
	req.log.info({ db: sIns, userId }, "Insert User Captcha Log Entry");

	return res.json({
		success: response.success
	});
});

export default handler;
