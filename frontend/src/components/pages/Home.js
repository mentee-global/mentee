import React, { useState } from "react";
import { withRouter } from "react-router-dom";
import LoginVerificationModal from "../LoginVerificationModal";
import "../css/Home.scss";
import loginimg from "../../resources/login.png";
import { isLoggedIn } from "../../utils/auth.service";

import Applyimg from "../../resources/apply.png";
import useAuth from "../../utils/hooks/useAuth";
import { MENTEE_GALLERY_PAGE, MENTOR_GALLERY_PAGE } from "../../utils/consts";
import { logout } from "utils/auth.service";
import { resetUser } from "features/userSlice";
import { useDispatch } from "react-redux";

function Home({ history }) {
	const { isMentor, isMentee, isPartner, resetRoleState } = useAuth();
	const dispatch = useDispatch();

	const logoutUser = () => {
		logout().then(() => {
			resetRoleState();
			dispatch(resetUser());
			history.push("/");
		});
	};
	return (
		<div className="home-background">
			<div className="home-content">
				<div className="home-text-container">
					<h1 className="home-header2">
						Welcome to <span>MENTEE!</span>
					</h1>
					{isLoggedIn() ? (
						""
					) : (
						<p className="home-text2">
							{/** Homepage Tagline placeholder */}
							Are you a new or existing user?
						</p>
					)}

					<br />
					<LoginVerificationModal
						content={
							(isMentor && <b>Find a Mentee</b>) ||
							(isMentee && <b>Find a Mentor</b>)
						}
						theme="dark"
						onVerified={() => {
							let redirect = MENTOR_GALLERY_PAGE;
							if (isMentor) {
								redirect = MENTEE_GALLERY_PAGE;
							}
							history.push({
								pathname: redirect,
								state: { verified: true },
							});
						}}
					/>
				</div>
				<div className="buttons-container">
					{isMentee || isMentor || isPartner ? (
						<></>
					) : (
						<div
							className="applyCon"
							onClick={() => {
								history.push({
									pathname: "/application-page",
								});
							}}
						>
							<img className="applyImage" src={Applyimg} alt="apply" />
							<div className="loginText">APPLY</div>
						</div>
					)}
					{!isLoggedIn() ? (
						<div
							className="loginCon"
							onClick={() => {
								let redirect = "/login";
								history.push({
									pathname: redirect,
								});
							}}
						>
							<img className="applyImage" src={loginimg} alt="login" />
							<div className="loginText">LOGIN</div>
						</div>
					) : (
						<div className="loginCon" onClick={logoutUser}>
							<img className="applyImage" src={loginimg} alt="login" />

							<div className="loginText">LOGOUT</div>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}

export default withRouter(Home);
