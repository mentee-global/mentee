import React, { useState, useEffect } from "react";
import { withRouter } from "react-router-dom";
import { Input, Button } from "antd";
import { sendPasswordResetEmail } from "utils/auth.service";
import MenteeButton from "../MenteeButton";
import { REGISTRATION_STAGE } from "utils/consts";

import "../css/Home.scss";
import "../css/Login.scss";
import "../css/Register.scss";

function ForgotPassword({ history }) {
	const [email, setEmail] = useState();
	const [error, setError] = useState(false);
	const [resent, setResent] = useState(false);
	const [inputFocus, setInputFocus] = useState(false);
	const [sendingLink, setSendingLink] = useState(false);
	const [sentLink, setSentLink] = useState(false);

	const handleInputFocus = () => setInputFocus(true);
	const handleInputBlur = () => setInputFocus(false);

	const sendEmail = async (onSuccess) => {
		setError(false);

		const res = await sendPasswordResetEmail(email);
		if (res && res.success) {
			onSuccess();
		} else {
			setError(true);
		}
	};

	return (
		<div className="home-background">
			<div className="login-content">
				<div className="verify-container">
					<div className="verify-header-container">
						<div className="verify-header-text">
							<h1 className="login-text">Forgot Password</h1>
							{error && (
								<div className="register-error">Error, please try again!</div>
							)}
							{resent && <div> Email resent! </div>}
							<br />
							<t className="verify-header-text-description">
								Please enter email for the password reset link to be sent to.
							</t>
						</div>
					</div>
					<div
						className={`login-input-container${inputFocus ? "__clicked" : ""}`}
					>
						<Input
							className="forgot_email"
							onFocus={() => handleInputFocus()}
							onBlur={() => handleInputBlur()}
							onChange={(e) => setEmail(e.target.value)}
							bordered={false}
							placeholder="Email"
						/>
					</div>
					<div className="login-button">
						<MenteeButton
							content={<b>{sentLink ? "Sent!" : "Send Link"}</b>}
							loading={sendingLink}
							disabled={sentLink}
							width={"50%"}
							height={"125%"}
							onClick={async () => {
								setSendingLink(true);
								sendEmail(() => setSentLink(true));
								setSendingLink(false);
							}}
						/>
					</div>
					<div className="login-register-container">
						Didn&#39;t receive an email?
						<Button
							type="link"
							className="verify-resend-link"
							onClick={async () => {
								// TODO: error handling for resend?
								sendEmail(() => setResent(true));
							}}
						>
							<u>Resend</u>
						</Button>
					</div>
				</div>
			</div>
		</div>
	);
}

export default withRouter(ForgotPassword);
