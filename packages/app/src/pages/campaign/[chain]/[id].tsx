import { ApiResponse } from "@/types";

const LegacyCampaignPage = () => {
	return null;
};

export const getServerSideProps = async ({
	res,
	query: { id }
}: {
	res: ApiResponse;
	query: { id: string };
}) => {
	if (id) {
		res.writeHead(301, {
			Location: `/campaign/${id as string}`
		});
		return res.end();
	}

	res.writeHead(302, {
		// or 301
		Location: `/explore`
	});
	return res.end();
};

export default LegacyCampaignPage;
