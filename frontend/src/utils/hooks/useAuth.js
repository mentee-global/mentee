import React, { useCallback, useState, useEffect } from "react";
import firebase from "firebase";
import { getIdTokenResult, logout } from "utils/auth.service";
import { ACCOUNT_TYPE } from "utils/consts";
import { useHistory } from "react-router-dom";

const onAuthStateChanged = (f) => {
	const unsubscribe = firebase.auth().onAuthStateChanged((user) => {
		if (user === null) {
			logout();
			unsubscribe();
			return;
		}

		f(user);
		unsubscribe();
	});
};

const useAuth = () => {
	const history = useHistory();
	const [roleState, setRoleState] = useState({
		role: ACCOUNT_TYPE.GUEST,
		isAdmin: false,
		isMentor: false,
		isMentee: false,
		isPartner: false,
	});

	const [profileId, setProfileId] = useState();
	const [onAuthUpdate, setOnAuthUpdate] = useState(
		new Promise((resolve) => resolve)
	);

	const resetRoleState = () => {
		setRoleState({
			role: ACCOUNT_TYPE.GUEST,
			isAdmin: false,
			isMentor: false,
			isMentee: false,
			isPartner: false,
		});
	};

	// setup listener
	useEffect(() => {
		firebase.auth().onAuthStateChanged(async (user) => {
			if (!user) return;

			await getIdTokenResult(true)
				.then((idTokenResult) => {
					const { role, profileId } = idTokenResult.claims;
					console.log(`${role}` === `${ACCOUNT_TYPE.PARTNER}`);
					setProfileId(profileId);
					setRoleState({
						role: role,
						isAdmin: `${role}` === `${ACCOUNT_TYPE.ADMIN}`,
						isMentor: `${role}` === `${ACCOUNT_TYPE.MENTOR}`,
						isMentee: `${role}` === `${ACCOUNT_TYPE.MENTEE}`,
						isPartner: `${role}` === `${ACCOUNT_TYPE.PARTNER}`,
					});

					Promise.resolve(idTokenResult).then(onAuthUpdate);
				})
				.catch(() => Promise.resolve(null).then(onAuthUpdate));
		});
	}, []);

	return {
		role: roleState.role,
		isAdmin: roleState.isAdmin,
		isMentor: roleState.isMentor,
		isMentee: roleState.isMentee,
		isPartner: roleState.isPartner,
		profileId: profileId,
		resetRoleState,
		onAuthUpdate,
		onAuthStateChanged,
	};
};

export default useAuth;
