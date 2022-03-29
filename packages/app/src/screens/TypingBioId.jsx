import React, { createRef, useState, useCallback, useEffect } from "react";
import {
	Pane,
	Heading,
	Text,
	Paragraph,
	Textarea,
	Button,
	majorScale,
	Strong
} from "evergreen-ui";
import { Formik, Form, Field } from "formik";
import Script from "next/script";
import set from "lodash/set";

// import PropTypes from "prop-types";
import { submitTypingBioId } from "@/actions/user";
import { useUser } from "@/hooks/";
import InputField from "@/components/InputField";

let tdna;

const TypingBioIdScreen = () => {
	const [isMounted, setMounted] = useState(false);
	const [user, , { setUser }] = useUser();
	const textRef = createRef();
	const TypingDNA = typeof window !== "undefined" ? window.TypingDNA : null;

	useEffect(() => {
		if (textRef.current && TypingDNA && !isMounted) {
			setMounted(true);
			// Mount TypingDNA on the Textarea
			tdna = new window.TypingDNA();
			tdna.addTarget(textRef);
			return () => {
				tdna.removeTarget(textRef);
			};
		}
		return () => {
			setMounted(false);
		};
	}, [textRef, TypingDNA]);

	const submit = useCallback(
		async (values, { setSubmitting }) => {
			setSubmitting(true);
			const pattern = tdna.getTypingPattern({
				type: 2, // https://api.typingdna.com/#api-capture
				caseSensitive: true
			});
			const isSuccess = await submitTypingBioId(pattern, values);
			if (isSuccess) {
				const checkedUser = { ...user };
				set(checkedUser, "verifications.bioid", true);
				setSubmitting(false);
				setUser(checkedUser);
			} else {
				setSubmitting(false);
			}
		},
		[user]
	);

	const validate = useCallback((values) => {
		const errors = {};
		if (values.content.length < 140) {
			errors.content = "Must be at least 140 characters";
		}
		return errors;
	}, []);

	const preventPaste = useCallback((e) => {
		e.preventDefault();
		return false;
	}, []);

	return (
		<Pane
			display="flex"
			flexDirection="column"
			flex={1}
			alignItems="center"
			justifyContent="center"
			padding={32}
		>
			<Heading is="h1" size={800} marginBottom={12}>
				Last step!
			</Heading>
			<Text size={500}>How will you refer users?</Text>
			<Pane background="tint2" padding={16} margin={12} borderRadius={8}>
				<Pane width="100%">
					<Formik
						initialValues={{
							field: "How will you refer users?",
							content: ""
						}}
						validate={validate}
						onSubmit={submit}
					>
						{({ values, handleSubmit, isSubmitting }) => (
							<Form>
								<Pane textAlign="center">
									<Field name="content" type="text">
										{({
											field: { value, ...field },
											meta: { touched, error }
										}) => {
											return (
												<InputField
													id="question-refer-users"
													error={touched ? error : ""}
													inputContainerProps={{
														background: "none",
														border: "none"
													}}
													marginBottom={24}
												>
													<Textarea
														placeholder="How will you refer users?"
														value={value}
														width="100%"
														ref={textRef}
														onPaste={preventPaste}
														onDrop={preventPaste}
														autoComplete="off"
														minWidth={400}
														minHeight={200}
														fontSize="1em"
														lineHeight="1.5em"
														backgroundColor="#fff"
														{...field}
													/>
												</InputField>
											);
										}}
									</Field>
									<Button
										height={majorScale(6)}
										appearance="primary"
										disabled={values.content.length === 0}
										isLoading={isSubmitting}
										onClick={handleSubmit}
										minWidth={260}
										marginX="auto"
									>
										<Strong color="inherit">Submit</Strong>
									</Button>
								</Pane>
							</Form>
						)}
					</Formik>
				</Pane>
			</Pane>
			<Paragraph textAlign="center">
				Your submission is used for verification
			</Paragraph>
			<Script src="https://www.typingdna.com/scripts/typingdna.js?v3.1" />
		</Pane>
	);
};

TypingBioIdScreen.propTypes = {};

export default TypingBioIdScreen;
