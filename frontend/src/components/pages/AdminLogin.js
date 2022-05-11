import React, { useState, useEffect } from "react";
import { useHistory, useLocation, NavLink } from "react-router-dom";
import { Input } from "antd";
import firebase from "firebase";
import { useDispatch } from "react-redux";
import { EyeInvisibleOutlined, EyeTwoTone } from "@ant-design/icons";
import { LOGIN_ERROR_MSGS, ACCOUNT_TYPE } from "utils/consts";
import { isLoggedIn, login, sendVerificationEmail } from "utils/auth.service";
import { fetchUser } from "features/userSlice";
import usePersistedState from "utils/hooks/usePersistedState";
import SelectLogin from "./SelectLogin";
import "../css/Login.scss";
import { isHaveProfilee, isHaveAccount } from "../../utils/api";
const Logins = Object.freeze({
	mentee: {
		title: "Mentee",
		type: ACCOUNT_TYPE.MENTEE,
		redirect: "/mentee-appointments",
	},
	mentor: {
		title: "Mentor",
		type: ACCOUNT_TYPE.MENTOR,
		redirect: "/appointments",
	},
	partner: {
		title: "Partner",
		type: ACCOUNT_TYPE.PARTNER,
		redirect: "/partner-page",
	},
	admin: {
		title: "Admin",
		type: ACCOUNT_TYPE.ADMIN,
		redirect: "/account-data",
	},
});
const getRoleObject = (key) => {
	return { ...Logins[key] };
};
function AdminLogin() {
	const history = useHistory();
	const location = useLocation();
	const dispatch = useDispatch();
	const [loading, setLoading] = useState(false);
	const [email, setEmail] = useState();
	const [password, setPassword] = useState();
	const [inputFocus, setInputFocus] = useState([false, false]);
	const [error, setError] = useState(false);
	const [displaySelect, setDisplaySelect] = useState(false);
	const [roleObject, setroleObject] = useState({});
	const [errorMessage, setErrorMessage] = useState(
		LOGIN_ERROR_MSGS.INCORRECT_NAME_PASSWORD_ERROR_MSG
	);
	const [loggingIn, setLoggingIn] = useState(false);
	const [permissions, setPermissions] = usePersistedState(
		"permissions",
		ACCOUNT_TYPE.ADMIN
	);

	const handleDisplayImages = () => {
		setDisplaySelect(true);
	};
	const handleSelect = async (key) => {
		console.log(key);
		let RoleObj = getRoleObject(key);
		if (RoleObj) {
			console.log(RoleObj);
			setLoggingIn(true);
			setLoading(true);
			setError(false);
			const res = await login(email, password, RoleObj.type);
			console.log(res?.result);
			setLoading(false);

			if (!res || !res.success) {
				if (res?.data?.result?.existingEmail) {
					setErrorMessage(LOGIN_ERROR_MSGS.EXISTING_EMAIL);
				} else {
					setErrorMessage(LOGIN_ERROR_MSGS.INCORRECT_NAME_PASSWORD_ERROR_MSG);
				}
				setError(true);
			} else if (res.result.passwordReset) {
				setErrorMessage(LOGIN_ERROR_MSGS.RESET_PASSWORD_ERROR_MSG);
				setError(true);
			} else if (res.result.recreateAccount) {
				setErrorMessage(LOGIN_ERROR_MSGS.RECREATE_ACCOUNT_ERROR_MSG);
				setError(true);
			}
			setPermissions(RoleObj.type);
			const unsubscribe = firebase.auth().onAuthStateChanged(async (user) => {
				unsubscribe();
				if (!user) return;

				if (res.result.redirectToVerify) {
					await sendVerificationEmail(email);
					history.push("/verify");
				} else {
					dispatch(
						fetchUser({
							id: res.result.profileId,
							role: Number(res.result.role),
						})
					);
					history.push(RoleObj.redirect);
				}
			});

			setLoggingIn(false);
			setroleObject(RoleObj);
		}
	};
	function handleInputFocus(index) {
		let newClickedInput = [false, false];
		newClickedInput[index] = true;
		setInputFocus(newClickedInput);
	}
	return (
		<div className="containerr">
			<h1 className="home-header3">
				Welcome to <span>MENTEE!</span>
			</h1>
			<div className="page-background">
				<div className="login-content">
					<h1 className="login-text">
						Please Login {roleObject && roleObject.title}
					</h1>

					<div
						className={`login-input-container${
							inputFocus[0] ? "__clicked" : ""
						}`}
					>
						<Input
							className="login-input"
							onFocus={() => handleInputFocus(0)}
							disabled={loggingIn}
							onChange={(e) => setEmail(e.target.value)}
							bordered={false}
							placeholder="Email"
						/>
					</div>
					<div
						className={`login-input-container${
							inputFocus[1] ? "__clicked" : ""
						}`}
					>
						<Input.Password
							className="login-input_pass"
							disabled={loggingIn}
							iconRender={(visible) =>
								visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />
							}
							onFocus={() => handleInputFocus(1)}
							onChange={(e) => setPassword(e.target.value)}
							bordered={false}
							placeholder="Password"
						/>
					</div>
				</div>
			</div>
			{error && <h1 className="login-error">{errorMessage}</h1>}
			{loading ? <h1 className="loadingg">Loading ..</h1> : ""}

			{!isLoggedIn() && (
				<SelectLogin
					displaySelect={displaySelect}
					handleDisplayImages={handleDisplayImages}
					handleSelect={handleSelect}
					isAdmin={true}
				></SelectLogin>
			)}
			{isLoggedIn() && <h1>Logout First </h1>}
		</div>
	);
}

export default AdminLogin;
