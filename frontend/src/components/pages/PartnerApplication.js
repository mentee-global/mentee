import React, { useState } from "react";
import { Form, Input, Radio, Checkbox } from "antd";
import MenteeButton from "../MenteeButton";
import { createApplication } from "../../utils/api";
import "../../components/css/MentorApplicationPage.scss";
function PartnerApplication(props) {
	const [submitError, setSubmitError] = useState();
	const [showMissingFieldErrors, setShowMissingFieldErrors] = useState(false);

	// sets text fields
	const [firstName, setFirstName] = useState(null);
	const [lastName, setLastName] = useState(null);
	const [email, setEmail] = useState(null);
	const [Country, setCountry] = useState(null);

	const shouldShowErrors = () => (v) =>
		(!v || (typeof v === "object" && v.length === 0)) && showMissingFieldErrors;

	// creates steps layout

	const verifyRequiredFieldsAreFilled = () => {
		const requiredQuestions = [firstName, lastName, email, Country];

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
					<div> {"*First Name"}</div>
					<Form.Item
						className="input-form"
						rules={[
							{
								required: true,
							},
						]}
					>
						{isMissingError(firstName) && (
							<p style={{ color: "red" }}>Please input first name.</p>
						)}
						<Input
							type="text"
							placeholder="*First Name"
							value={firstName}
							onChange={(e) => setFirstName(e.target.value)}
						/>
					</Form.Item>
					<div> {"*Last Name"}</div>
					<Form.Item
						className="input-form"
						rules={[
							{
								required: true,
							},
						]}
					>
						{isMissingError(lastName) && (
							<p style={{ color: "red" }}>Please input last name.</p>
						)}
						<Input
							placeholder="*Last Name*"
							value={lastName}
							onChange={(e) => setLastName(e.target.value)}
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

					<div>
						{
							"*What country are you or your family originally from, if you are a refugee or immigrant?"
						}
					</div>
					<Form.Item
						className="input-form"
						rules={[
							{
								required: true,
							},
						]}
					>
						{isMissingError(Country) && (
							<p style={{ color: "red" }}>Please input cell.</p>
						)}
						<Input
							type="text"
							placeholder="*Country"
							value={Country}
							onChange={(e) => setCountry(e.target.value)}
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
		if (props.headEmail === "") {
			setSubmitError(true);
			return;
		}

		async function submitApplication() {
			// onOk send the put request
			const data = {
				email: email,
				name: firstName + " " + lastName,
				Country: Country,
				date_submitted: new Date(),
				role: props.role,
			};

			const res = await createApplication(data);

			if (res) {
				setIsSubmitted(true);
				console.log(res);
				props.submitHandler();
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
				<p>
					We appreciate your interest in becoming a volunteer Global Partner for
					MENTEE, a global nonprofit accelerating personal and Professional
					growth to make the world a better, healthier place.
				</p>
				<p className="para-2">
					Fill out the application below to join our team for 2021-2022 year.
				</p>
				<br></br>
				<p className="welcome-page">*Required</p>
			</div>

			<div className="container">
				{pageOne()}
				<div className="submit-button">
					<MenteeButton
						width="150px"
						content={<b> Submit</b>}
						onClick={handleSubmit}
					/>
				</div>
				{submitError ? (
					<h1 className="error">
						Some thing went wrong check you add your Email at Top
					</h1>
				) : (
					""
				)}
			</div>
		</div>
	);
}
export default PartnerApplication;
