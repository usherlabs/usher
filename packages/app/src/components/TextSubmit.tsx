import React, { useState, useCallback } from "react";
import {
	Pane,
	TextInput,
	Button,
	Spinner,
	ArrowRightIcon,
	toaster
} from "evergreen-ui";
// import PropTypes from "prop-types";

export type Props = {
	onSubmit: ((value: string) => Promise<void>) | ((value: string) => void);
	disabled?: boolean;
	loading?: boolean;
	submitOnBlur?: boolean;
	value?: string;
	onValidate?: (value: string) => void;
};

const TextSubmit: React.FC<Props> = ({
	onValidate,
	onSubmit,
	disabled: disabledProp,
	loading,
	value: valueProp,
	submitOnBlur,
	...props
}) => {
	const [disabledState, setDisabled] = useState(false);
	const [value, setValue] = useState(valueProp || "");
	const disabled = disabledProp || disabledState;

	const submit = useCallback(async () => {
		if (onValidate) {
			try {
				onValidate(value);
			} catch (e: any) {
				if (e.message) {
					toaster.warning(e.message);
				}
			}
		}
		setDisabled(true);
		await onSubmit(value);
		setDisabled(false);
	}, [value]);

	return (
		<Pane display="flex" alignItems="center" border borderRadius={5}>
			<TextInput
				name="email"
				placeholder="youremail@example.com"
				disabled={disabled}
				value={value}
				onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
					setValue(e.target.value);
				}}
				onKeyPress={(e: React.KeyboardEvent) => {
					if (e.key.toLowerCase() === "enter") {
						submit();
					}
				}}
				height={48}
				borderTopRightRadius={0}
				borderBottomRightRadius={0}
				borderWidth={0}
				minWidth={250}
				flex={1}
				onBlur={() => {
					if (submitOnBlur) {
						submit();
					}
				}}
				{...props}
			/>
			<Button
				onClick={submit}
				height={48}
				appearance="primary"
				disabled={disabled || loading || value.length === 0}
				borderTopLeftRadius={0}
				borderBottomLeftRadius={0}
				width={50}
				padding={0}
				display="flex"
				alignItems="center"
			>
				{loading ? <Spinner size={30} /> : <ArrowRightIcon />}
			</Button>
		</Pane>
	);
};

TextSubmit.defaultProps = {
	onSubmit: () => Promise.resolve(),
	disabled: false,
	loading: false,
	submitOnBlur: false
};

export default TextSubmit;
