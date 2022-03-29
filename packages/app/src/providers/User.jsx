import React, {
	createContext,
	useEffect,
	useState,
	useMemo,
	useCallback
} from "react";
import isEmpty from "lodash/isEmpty";

import { ChildrenProps } from "@/utils/common-prop-types";
import { supabase } from "@/utils/supabase-client";
import { identifyUser } from "@/utils/signals";
import { setUser as setErrorTrackingUser } from "@/utils/handle-exception";
import useAuthStateChange from "@/hooks/use-auth-state-change";
import { checkCaptcha, checkTypingBioId } from "@/actions/user";

export const UserContext = createContext();

const UserContextProvider = ({ children }) => {
	const [user, setUser] = useState({});
	const [loading, setLoading] = useState(true);

	const removeUser = useCallback(() => setUser({}), []);

	const getUser = useCallback(async () => {
		setLoading(true);
		// Fetch Currently authenticated Discord User from Supabase
		const u = supabase.auth.user();
		console.log("getUser: ", u);
		if (!isEmpty(u)) {
			if (u.role === "authenticated") {
				// Here we fetch user verifications
				const captcha = await checkCaptcha(u);
				const bioId = await checkTypingBioId(u);
				const checkedUser = { ...u, verifications: { captcha, bioId } };
				setUser(checkedUser);
				setErrorTrackingUser(checkedUser);
				identifyUser(checkedUser);
				setLoading(false);
				return checkedUser;
			}
		}
		setLoading(false);
		return {};
	}, []);

	const signIn = useCallback(
		async (options = {}) => {
			setLoading(true);
			const r = await supabase.auth.signIn(options);
			setLoading(false);
			return r;
		},
		[user]
	);

	const signOut = useCallback(async () => {
		setLoading(true);
		const r = await supabase.auth.signOut();
		setLoading(false);
		return r;
	}, []);

	useAuthStateChange((event) => {
		switch (event) {
			case "SIGNED_IN": {
				// Re-fetch user on sign in
				getUser();
				break;
			}
			case "SIGNED_OUT": {
				window.location.reload();
				break;
			}
			default: {
				break;
			}
		}
	});

	// On render, fetch user from session
	useEffect(() => {
		//* Because the system uses OTP -- this is the only point where the User State is set.
		getUser();
	}, []);

	const value = useMemo(
		() => ({
			user,
			loading,
			setUser,
			removeUser,
			getUser,
			signIn,
			signOut
		}),
		[user, loading]
	);

	return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

UserContextProvider.propTypes = {
	children: ChildrenProps.isRequired
};

export default UserContextProvider;
