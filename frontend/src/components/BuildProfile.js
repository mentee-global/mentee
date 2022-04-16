import React, { useState } from "react";
import { Form, Input, Radio, Checkbox } from "antd";
import MenteeButton from "./MenteeButton";
import "./css/MentorApplicationPage.scss";
import { newRegister } from "utils/auth.service";
import { useHistory } from "react-router-dom";

function BuildProfile(props) {
	const history = useHistory();
	const [submitError, setSubmitError] = useState();
	const [showMissingFieldErrors, setShowMissingFieldErrors] = useState(false);
	const [passError, setPassError] = useState(false);
	// sets text fields
	const [name, setname] = useState(null);
	const [password, setpassword] = useState(null);
	const [email, setEmail] = useState(null);
	const [confirmPassword, setconfirmPassword] = useState(null);
	const [video_url, setvideo_url] = useState(null);
	const [phone_number, setphone_number] = useState(null);

	const shouldShowErrors = () => (v) =>
		(!v || (typeof v === "object" && v.length === 0)) && showMissingFieldErrors;

	// creates steps layout

	const verifyRequiredFieldsAreFilled = () => {
		const requiredQuestions = [
			name,
			password,
			email,
			confirmPassword,
			video_url,
			phone_number,
		];

		if (
			requiredQuestions.some(
				(x) => !x || (typeof x === "object" && x.length === 0)
			)
		) {
			setShowMissingFieldErrors(true);
			return false;
		}

		if (showMissingFieldErrors) setShowMissingFieldErrors(false);

		return true;
	};

	function pageOne() {
		const isMissingError = shouldShowErrors();
		return (
			<div className="page-one-column-container">
				<Form>
					<div> {"*Name"}</div>
					<Form.Item
						className="input-form"
						rules={[
							{
								required: true,
							},
						]}
					>
						{isMissingError(name) && (
							<p style={{ color: "red" }}>Please input first name.</p>
						)}
						<Input
							type="text"
							placeholder="*Name"
							value={name}
							onChange={(e) => setname(e.target.value)}
						/>
					</Form.Item>
					<div>{"*Email"}</div>

					<Form.Item
						className="input-form"
						rules={[
							{
								required: true,
							},
						]}
					>
						{isMissingError(email) && (
							<p style={{ color: "red" }}>Please input email.</p>
						)}
						<Input
							type="text"
							placeholder="*Email"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
						/>
					</Form.Item>
					<div> {"*Password"}</div>
					<Form.Item
						className="input-form"
						rules={[
							{
								required: true,
							},
						]}
					>
						{isMissingError(password) && (
							<p style={{ color: "red" }}>Please input last name.</p>
						)}
						<Input
							type="password"
							placeholder="*"
							value={password}
							onChange={(e) => setpassword(e.target.value)}
						/>
					</Form.Item>
					<div> {"*Confirm Password"}</div>
					<Form.Item
						className="input-form"
						rules={[
							{
								required: true,
							},
						]}
					>
						{isMissingError(confirmPassword) && (
							<p style={{ color: "red" }}>Please input last name.</p>
						)}
						<Input
							type="password"
							placeholder="*"
							value={confirmPassword}
							onChange={(e) => setconfirmPassword(e.target.value)}
						/>
					</Form.Item>

					<div>{"*Video Url"}</div>
					<Form.Item
						className="input-form"
						rules={[
							{
								required: true,
							},
						]}
					>
						{isMissingError(video_url) && (
							<p style={{ color: "red" }}>Please input cell.</p>
						)}
						<Input
							type="text"
							placeholder="*video_url"
							value={video_url}
							onChange={(e) => setvideo_url(e.target.value)}
						/>
					</Form.Item>
					<div>{"*Phone Number"}</div>
					<Form.Item
						className="input-form"
						rules={[
							{
								required: true,
							},
						]}
					>
						{isMissingError(phone_number) && (
							<p style={{ color: "red" }}>Please input cell.</p>
						)}
						<Input
							type="text"
							placeholder="*phone_number"
							value={phone_number}
							onChange={(e) => setphone_number(e.target.value)}
						/>
					</Form.Item>
				</Form>
			</div>
		);
	}

	const [isSubmitted, setIsSubmitted] = useState(false);
	function handleSubmit(event) {
		event.preventDefault();
		if (!verifyRequiredFieldsAreFilled()) return;
		if (password !== confirmPassword) {
			setPassError(true);
			return;
		} else {
			setPassError(false);
		}

		async function submitApplication() {
			// onOk send the put request
			const data = {
				email: props.headEmail,
				name: name,
				password: password,
				video_url: video_url,
				phone_number: phone_number,
				date_submitted: new Date(),
				role: props.role,
			};

			const res = await newRegister(data);

			if (res) {
				setIsSubmitted(true);
				console.log(res);
				history.push("/");
			} else {
				setSubmitError(true);
			}
		}

		submitApplication();
	}

	return (
		<div className="background">
			<div className="instructions">
				<h1 className="welcome-page">Welcome to MENTEE!</h1>
				<p className="para-2">Create profile to complete apply process</p>
				<br></br>
				<p className="welcome-page">*Required</p>
			</div>

			<div className="container">
				{pageOne()}
				<div className="submit-button">
					<MenteeButton
						width="150px"
						content={<b className="submit_profile"> Submit my profile</b>}
						onClick={handleSubmit}
					/>
				</div>
				{passError ? (
					<h1 className="error">
						password and confirm password must be identical
					</h1>
				) : (
					""
				)}

				{submitError ? (
					<h1 className="error">Some thing went wrong check you data again</h1>
				) : (
					""
				)}
			</div>
		</div>
	);
}
export default BuildProfile;
