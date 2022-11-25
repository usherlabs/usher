import React, { useState, useCallback } from "react";
import isUrl from "is-url";
import TextSubmit from "./TextSubmit";

export type Props = {
	onSubmit: ((value: string) => Promise<void>) | ((value: string) => void);
};

const UrlSubmit: React.FC<Props> = ({ onSubmit }) => {
	const [isLoading, setLoading] = useState(false);

	const submit = useCallback(async (value: string) => {
		setLoading(true);
		try {
			await onSubmit(value);
		} finally {
			setLoading(false);
		}
	}, []);

	const validate = useCallback((value: string) => {
		if (!isUrl(value)) {
			throw new Error("Invalid URL provided. Please paste a valid URL 🙏");
		}
	}, []);

	return (
		<TextSubmit
			loading={isLoading}
			submitOnBlur
			onValidate={validate}
			onSubmit={submit}
		/>
	);
};

UrlSubmit.defaultProps = {
	onSubmit: () => Promise.resolve()
};

export default UrlSubmit;
