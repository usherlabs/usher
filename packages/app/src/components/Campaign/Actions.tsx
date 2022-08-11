import React from "react";
import { Button, Pane, Tooltip } from "evergreen-ui";
import Image from "next/image";

import { Campaign } from "@/types";
import Anchor from "@/components/Anchor";
import { UilTwitter, UilFileShieldAlt } from "@iconscout/react-unicons";

export type Props = {
	campaign: Campaign;
};

const CampaignActions: React.FC<Props> = ({ campaign }) => {
	return (
		<>
			<Pane marginX={6}>
				<Tooltip content="View Metadata">
					<Pane>
						<Anchor href={`https://arweave.net/${campaign.id}`} external>
							<Button borderRadius={100} height={50} width={50} padding={0}>
								<UilFileShieldAlt size="28" />
							</Button>
						</Anchor>
					</Pane>
				</Tooltip>
			</Pane>
			{campaign.advertiser.twitter && (
				<Pane marginX={6}>
					<Tooltip content="Twitter">
						<Pane>
							<Anchor href={campaign.advertiser.twitter} external>
								<Button borderRadius={100} height={50} width={50} padding={0}>
									<UilTwitter size="28" />
								</Button>
							</Anchor>
						</Pane>
					</Tooltip>
				</Pane>
			)}
		</>
	);
};

export default CampaignActions;
