/**
 * Component to show Value of a Commission or Reward with Icons or a Ticker
 */

import React from "react";
import { Text, Pane } from "evergreen-ui";

import InputField from "@/components/InputField";

type Props = {
	value: string | number;
	ticker: string;
};

const ValueCard: React.FC<Props> = ({ value, ticker, ...props }) => {
	return (
		<InputField
			id="affiliate-link"
			label="Affiliate Link"
			iconSize={18}
			background="tint2"
			{...props}
		>
			<Pane
				width="100%"
				display="flex"
				flexDirection="row"
				height={42}
				alignItems="center"
				paddingX={8}
			>
				<Text display="block" flex={1} paddingX={6} size={500}>
					{value}
				</Text>
				<Text display="block" paddingX={6} size={500} fontWeight={700}>
					{ticker}
				</Text>
			</Pane>
		</InputField>
	);
};

ValueCard.defaultProps = {
	value: "",
	ticker: ""
};

export default ValueCard;