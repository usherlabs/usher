import React from "react";
import { Heading, Strong, useTheme, Text, Paragraph } from "evergreen-ui";

import { Campaign } from "@/types";
import Anchor from "@/components/Anchor";
import truncate from "@/utils/truncate";

export type Props = {
	campaign: Campaign;
};

const CampaignInfo: React.FC<Props> = ({ campaign }) => {
	const { colors } = useTheme();

	return (
		<>
			<Heading
				is="h1"
				size={900}
				textAlign="left"
				width="100%"
				marginBottom={8}
			>
				{campaign.details.name}
			</Heading>
			<Heading size={600} fontWeight={400} color={colors.gray900}>
				By{" "}
				<Anchor
					href={campaign.advertiser.externalLink || ""}
					external
					fontSize="inherit"
				>
					<Strong
						fontSize="inherit"
						textDecoration="underline"
						color={colors.blue500}
					>
						{campaign.advertiser.name
							? campaign.advertiser.name
							: truncate(campaign.owner, 6, 4)}
					</Strong>
				</Anchor>
				{campaign.advertiser.description && (
					<Text size={500} opacity="0.7" fontSize="inherit">
						&nbsp;&nbsp;&mdash;&nbsp;&nbsp;
						{campaign.advertiser.description}
					</Text>
				)}
			</Heading>
			{campaign.details.description && (
				<Paragraph size={500} marginTop={10} fontSize="1.2em">
					{campaign.details.description}
				</Paragraph>
			)}
		</>
	);
};

export default CampaignInfo;