import React from "react";
import PropTypes from "prop-types";
import { Pane, Strong, Paragraph, Spinner } from "evergreen-ui";

import { ElementProps, ChildrenProps } from "@/utils/common-prop-types";
import ErrorText from "./ErrorText";

const InputField = ({
	id,
	label,
	description,
	Description,
	placeholder,
	error,
	children,
	isRequired,
	labelSize,
	labelProps,
	descriptionProps,
	errorProps,
	inputContainerProps,
	iconRight: IconRight,
	iconLeft: IconLeft,
	iconSize,
	iconProps,
	isLoading,
	...props
}) => {
	const inputPropsSetup = {
		spellCheck: false,
		required: isRequired,
		id,
		background: "inherit"
	};
	if (error) {
		inputPropsSetup.isInvalid = true;
	}

	return (
		<Pane width="100%" {...props}>
			<Pane width="100%">
				{label && (
					<Pane
						is="label"
						display="block"
						htmlFor={id}
						marginBottom={6}
						{...labelProps}
					>
						{isRequired && (
							<Paragraph
								fontWeight={900}
								opacity="0.5"
								textTransform="uppercase"
								fontSize={10}
								letterSpacing={1}
							>
								Required
							</Paragraph>
						)}
						<Strong size={labelSize}>{label}</Strong>
					</Pane>
				)}
				{description && (
					<Paragraph marginBottom={12} width="100%" {...descriptionProps}>
						{description}
					</Paragraph>
				)}
				{Description && (
					<Pane marginBottom={12} width="100%" {...descriptionProps}>
						<Description />
					</Pane>
				)}
			</Pane>
			<Pane
				display="flex"
				width="100%"
				flexDirection="row"
				alignItems="center"
				background="#fff"
				border
				borderRadius={8}
				overflow="hidden"
				padding={2}
				{...inputContainerProps}
			>
				{(isLoading || IconLeft) && (
					<Pane padding={12} display="flex" alignItems="center" {...iconProps}>
						{isLoading ? <Spinner size={24} /> : <IconLeft size={iconSize} />}
					</Pane>
				)}
				<Pane flex={1} width="100%">
					{React.Children.map(children, (child) =>
						React.cloneElement(child, { ...inputPropsSetup })
					)}
				</Pane>
				{IconRight && (
					<Pane padding={12} display="flex" alignItems="center" {...iconProps}>
						<IconRight size={iconSize} />
					</Pane>
				)}
			</Pane>
			{!!error && <ErrorText {...errorProps} text={error} />}
		</Pane>
	);
};

InputField.propTypes = {
	id: PropTypes.string.isRequired,
	label: PropTypes.string,
	description: PropTypes.string,
	Description: ChildrenProps,
	placeholder: PropTypes.string,
	error: PropTypes.string,
	children: ChildrenProps,
	isRequired: PropTypes.bool,
	iconLeft: ElementProps,
	iconRight: ElementProps,
	iconSize: PropTypes.number,
	iconProps: PropTypes.object,
	labelSize: PropTypes.number,
	labelProps: PropTypes.object,
	descriptionProps: PropTypes.object,
	errorProps: PropTypes.object,
	inputContainerProps: PropTypes.object,
	isLoading: PropTypes.bool
};

InputField.defaultProps = {
	label: "",
	description: "",
	Description: undefined,
	placeholder: "",
	error: "",
	children: undefined,
	isRequired: false,
	iconLeft: null,
	iconRight: null,
	iconSize: 16,
	iconProps: {},
	labelSize: 400,
	labelProps: {},
	descriptionProps: {},
	errorProps: {},
	inputContainerProps: {},
	isLoading: false
};

export default InputField;
