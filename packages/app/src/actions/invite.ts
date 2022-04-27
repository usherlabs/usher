import isEmpty from "lodash/isEmpty";
import ono from "@jsdevtools/ono";

import { supabase } from "@/utils/supabase-client";
import { advertiser } from "@/env-config";
import { request } from "@/utils/browser-request";

export const saveInviteLink = async (walletId: string) => {
	// Check if there is a wallet associated to this user.
	// If not, insert it, otherwise check if user_id has been updated (ie. new Discord user)
	const sSel = await supabase
		.from("invite_links")
		.select(`id`)
		.match({ wallet_id: walletId, active: true })
		.order("created_at", { ascending: false });
	if (sSel.error && sSel.status !== 406) {
		throw ono(sSel.error, "invite_links");
	}
	console.log("invite_links: select", sSel);

	let [data] = sSel.data || [];

	if (isEmpty(data)) {
		const sIns = await supabase.from("invite_links").insert({
			wallet_id: walletId,
			destination_url: advertiser.destinationUrl
		});
		console.log("invite_links: insert", sIns);
		if (sIns.error && sIns.status !== 406) {
			throw ono(sIns.error, "invite_links");
		}
		[data] = sIns.data || [];
	}

	const convOverview = { total: 0, pending: 0, success: 0 };
	if (!isEmpty(data)) {
		// This isn't returning anything... but also not throwing...
		const sConvCountSel = await supabase
			.from("conversions")
			.select("id", { count: "exact", head: true })
			.eq("invite_link_id", data.id);
		console.log("conversions total: select|count", sConvCountSel, data.id);
		if (sConvCountSel.error && sConvCountSel.status !== 406) {
			throw ono(sConvCountSel.error, "all conversions");
		}
		convOverview.total = sConvCountSel.count || 0;

		const sPendingConvCountSel = await supabase
			.from("conversions")
			.select("id", { count: "exact", head: true })
			.match({ invite_link_id: data.id, is_complete: true, is_bundled: false });
		console.log(
			"conversions pending: select|count",
			sPendingConvCountSel,
			data.id
		);
		if (sPendingConvCountSel.error && sPendingConvCountSel.status !== 406) {
			throw ono(sPendingConvCountSel.error, "pending conversions");
		}
		convOverview.pending = sPendingConvCountSel.count || 0;

		const sSuccessConvCountSel = await supabase
			.from("conversions")
			.select("id", { count: "exact", head: true })
			.match({ invite_link_id: data.id, is_complete: true, is_bundled: true });
		console.log(
			"conversions success: select|count",
			sSuccessConvCountSel,
			data.id
		);
		if (sSuccessConvCountSel.error && sSuccessConvCountSel.status !== 406) {
			throw ono(sSuccessConvCountSel.error, "successful conversions");
		}
		convOverview.success = sSuccessConvCountSel.count || 0;
	}

	return [data, convOverview];
};

export const getDestinationUrl = async (inviteLinkId: string, cid: string) => {
	const response = await request
		.get(`invite/${inviteLinkId}${cid ? `?cid=${cid}` : ""}`)
		.json();
	console.log("getDestinationUrl: ", response);

	return response;
};

export const createConversion = async (inviteLinkId: string) => {
	const response = await request.post(`invite/${inviteLinkId}`).json();
	console.log("createConversion: ", response);

	return response;
};
