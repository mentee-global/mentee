import React, { useState } from "react";
import { Form, Input, Radio } from "antd";
import MenteeButton from "../MenteeButton";
import { createApplication } from "../../utils/api";
import "../../components/css/MentorApplicationPage.scss";
// constant declarations
const { TextArea } = Input;
function MentorApplication(props) {
	const [submitError, setSubmitError] = useState();
	// on change for radiio buttons
	const [offerDonation, setOfferDonation] = useState();
	const [immigrantStatus, setImmigrantStatus] = useState();

	// sets text fields
	const [firstName, setFirstName] = useState(null);
	const [lastName, setLastName] = useState(null);
	const [cell, setCell] = useState(null);
	const [email, setEmail] = useState(null);
	const [hearAbout, setHearAbout] = useState(null);
	const [pastLiveLocation, setpastLiveLocation] = useState(null);
	const [title, setTitle] = useState(null);
	const [employer, setEmployer] = useState(null);
	const [knowledgeLocation, setknowledgeLocation] = useState(null);
	const [referral, setReferral] = useState(null);
	const [languages, setLanguages] = useState(null);
	const [isFamilyNative, setisFamilyNative] = useState(null);
	const [isEconomically, setisEconomically] = useState(null);
	const [isColorPerson, setisColorPerson] = useState(null);
	const [identify, setidentify] = useState(null);
	const [isMarginalized, setisMarginalized] = useState(null);
	const [showMissingFieldErrors, setShowMissingFieldErrors] = useState(false);
	const [companyTime, setCompanyTime] = useState(null);
	const [specialistTime, setspecialistTime] = useState(null);
	const onChange1 = (e) => setOfferDonation(e.target.value);
	const onChange3 = (e) => setImmigrantStatus(e.target.value);
	const onChange5 = (e) => setCompanyTime(e.target.value);
	const onChange4 = (e) => setspecialistTime(e.target.value);

	const shouldShowErrors = () => (v) =>
		(!v || (typeof v === "object" && v.length === 0)) && showMissingFieldErrors;

	// creates steps layout

	const verifyRequiredFieldsAreFilled = () => {
		const requiredQuestions = [
			firstName,
			lastName,
			cell,
			email,
			hearAbout,
			pastLiveLocation,
			offerDonation,
			immigrantStatus,
			title,
			employer,
			knowledgeLocation,
			referral,
			languages,
			isFamilyNative,
			isEconomically,
			isColorPerson,
			identify,
			isMarginalized,
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
					<div> {"*Cell Phone Number"}</div>
					<Form.Item
						className="input-form"
						rules={[
							{
								required: true,
							},
						]}
					>
						{isMissingError(cell) && (
							<p style={{ color: "red" }}>Please input cell.</p>
						)}
						<Input
							type="text"
							placeholder="*Cell Phone Number*"
							value={cell}
							onChange={(e) => setCell(e.target.value)}
						/>
					</Form.Item>
					<div>{"*From whom or where did you hear about us?"}</div>

					<Form.Item
						className="input-form"
						rules={[
							{
								required: true,
							},
						]}
					>
						{isMissingError(hearAbout) && (
							<p style={{ color: "red" }}>Please add input.</p>
						)}
						<Input
							type="text"
							placeholder="*From whom or where did you hear about us?"
							value={hearAbout}
							onChange={(e) => setHearAbout(e.target.value)}
						/>
					</Form.Item>
					<div>
						{
							"*Please share which region(s), country(s), state(s), cities your knowledge is based in"
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
						{isMissingError(knowledgeLocation) && (
							<p style={{ color: "red" }}>Please add input.</p>
						)}
						<Input
							type="text"
							placeholder="Please share which region(s), country(s), state(s), cities your 
                  knowledge is based in"
							value={knowledgeLocation}
							onChange={(e) => setknowledgeLocation(e.target.value)}
						/>
					</Form.Item>
					<div>
						{"Where have you lived in your life besides where you live now?"}
					</div>

					<Form.Item
						className="input-form"
						rules={[
							{
								required: true,
							},
						]}
					>
						{isMissingError(pastLiveLocation) && (
							<p style={{ color: "red" }}>Please add input.</p>
						)}
						<TextArea
							autoSize
							placeholder="Where have you lived in your life besides where you live now?"
							style={{ overflow: "hidden" }}
							value={pastLiveLocation}
							onChange={(e) => setpastLiveLocation(e.target.value)}
						/>
					</Form.Item>
					<div>{"*Full name of your company/employer"}</div>

					<Form.Item
						className="input-form"
						rules={[
							{
								required: true,
							},
						]}
					>
						{isMissingError(employer) && (
							<p style={{ color: "red" }}>Please add input.</p>
						)}
						<Input
							type="text"
							placeholder="*Full name of your company/employer"
							value={employer}
							onChange={(e) => setEmployer(e.target.value)}
						/>
					</Form.Item>
					<div>{"*Your full title and a brief description of your role."}</div>

					<Form.Item
						className="input-form"
						rules={[
							{
								required: true,
							},
						]}
					>
						{isMissingError(title) && (
							<p style={{ color: "red" }}>Please add title.</p>
						)}
						<Input
							type="text"
							placeholder="*Your full title and a brief description of your role."
							value={title}
							onChange={(e) => setTitle(e.target.value)}
						/>
					</Form.Item>
					<div className="input-form">
						*How long have you been with this company?
						<div className="time-options-answers">
							{isMissingError(companyTime) && (
								<p style={{ color: "red" }}>Please select an option.</p>
							)}
							<Radio.Group onChange={onChange5} value={companyTime}>
								<Radio value={"Less than one year."}>Less than one year.</Radio>
								<Radio value={"1-4 years"}>1-4 years</Radio>
								<Radio value={"5-10 years"}>5-10 years</Radio>
								<Radio value={"10-20 years"}>5-10 years</Radio>
								<Radio value={"21+ Years"}>10+ Years</Radio>
							</Radio.Group>
						</div>
					</div>
					<div className="input-form">
						<div>
							*If you are accepted as a Specialist, would you like to commit
							to...
						</div>
						{isMissingError(specialistTime) && (
							<p style={{ color: "red" }}>Please select an option.</p>
						)}
						<Radio.Group onChange={onChange4} value={specialistTime}>
							<Radio value={"One year with us"}>One year with us</Radio>
							<Radio value={"Two years with us"}>Two years with us</Radio>
						</Radio.Group>
					</div>
					<div className="input-form">
						<div>
							*Are you an immigrant or refugee or do you come from an immigrant
							family or refugee family?
						</div>
						{isMissingError(immigrantStatus) && (
							<p style={{ color: "red" }}>Please select an option.</p>
						)}
						<Radio.Group onChange={onChange3} value={immigrantStatus}>
							<Radio value={"Yes"}>Yes</Radio>
							<Radio value={"No"}>No</Radio>
						</Radio.Group>
					</div>
					<div className="input-form">
						<div>
							Are you or your family from a native or aboriginal community?
						</div>
						{isMissingError(isFamilyNative) && (
							<p style={{ color: "red" }}>Please select an option.</p>
						)}
						<Radio.Group
							onChange={(e) => setisFamilyNative(e.target.value)}
							value={isFamilyNative}
						>
							<Radio value={"Yes"}>Yes</Radio>
							<Radio value={"No"}>No</Radio>
						</Radio.Group>
					</div>
					<div className="input-form">
						<div>did you grow up economically challenged?</div>
						{isMissingError(isEconomically) && (
							<p style={{ color: "red" }}>Please select an option.</p>
						)}
						<Radio.Group
							onChange={(e) => setisEconomically(e.target.value)}
							value={isEconomically}
						>
							<Radio value={"Yes"}>Yes</Radio>
							<Radio value={"No"}>No</Radio>
						</Radio.Group>
					</div>
					<div className="input-form">
						<div>Would you consider yourself of person of color</div>
						{isMissingError(isColorPerson) && (
							<p style={{ color: "red" }}>Please select an option.</p>
						)}
						<Radio.Group
							onChange={(e) => setisColorPerson(e.target.value)}
							value={isColorPerson}
						>
							<Radio value={"Yes"}>Yes</Radio>
							<Radio value={"No"}>No</Radio>
						</Radio.Group>
					</div>
					<div className="input-form">
						<div>How do you identify?</div>
						{isMissingError(identify) && (
							<p style={{ color: "red" }}>Please select an option.</p>
						)}
						<Radio.Group
							onChange={(e) => setidentify(e.target.value)}
							value={identify}
						>
							<Radio value={"man"}>as a man</Radio>
							<Radio value={"woman"}>as a oman</Radio>
							<Radio value={"LGTBQ+"}>as LGTBQ+</Radio>
							<Radio value={"other"}>other</Radio>
						</Radio.Group>
					</div>
					<div className="input-form">
						<div>
							Would you define yourself as having been or currently marginalized
						</div>
						{isMissingError(isMarginalized) && (
							<p style={{ color: "red" }}>Please select an option.</p>
						)}
						<Radio.Group
							onChange={(e) => setisMarginalized(e.target.value)}
							value={isMarginalized}
						>
							<Radio value={"Yes"}>Yes</Radio>
							<Radio value={"No"}>No</Radio>
						</Radio.Group>
					</div>
					<div>
						{
							"*Do you speak a language(s) other than English? If yes, please write the language(s) below and include your fluency level(conversational, fluent, native)."
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
						{isMissingError(languages) && (
							<p style={{ color: "red" }}>Please add input.</p>
						)}
						<Input
							type="text"
							placeholder="*Do you speak a language(s) other than English? If yes, please
                  write the language(s) below and include your fluency level
                  (conversational, fluent, native)."
							value={languages}
							onChange={(e) => setLanguages(e.target.value)}
						/>
					</Form.Item>
					<div>
						{
							"*If you know someone who would be a great MENTEE Specialist, please share their name, email, and we'll contact them!"
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
						{isMissingError(referral) && (
							<p style={{ color: "red" }}>Please add input.</p>
						)}
						<Input
							type="text"
							placeholder="*If you know someone who would be a great MENTEE 
                  Specialist, please share their name, email, and we'll contact
                  them!"
							value={referral}
							onChange={(e) => setReferral(e.target.value)}
						/>
					</Form.Item>
					<div>
						{
							"MENTEE is a volunteer organization and we are sustained by donations. Are you able to offer a donation for one year?"
						}
					</div>
					<Form.Item className="input-form">
						{isMissingError(offerDonation) && (
							<p style={{ color: "red" }}>Please select an option.</p>
						)}
						<Radio.Group
							className="donation"
							onChange={onChange1}
							value={offerDonation}
						>
							<Radio
								value={
									"Yes, I can offer a donation now to help suppourt this work!"
								}
							>
								Yes, I can offer a donation now to help support this work!{" "}
								<br></br>(https://www.menteteglobal.org/donate)
							</Radio>
							<Radio
								value={
									"No, unfortunately I cannot offer a donation now but please ask me again."
								}
							>
								No, unfortunately I cannot offer a donation now but please ask
								me again.
							</Radio>
							<Radio value={"I'm unable to offer a donation."}>
								I'm unable to offer a donation.
							</Radio>
						</Radio.Group>
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
				cell_number: cell,
				hear_about_us: hearAbout,
				offer_donation: offerDonation,
				employer_name: employer,
				role_description: title,
				immigrant_status: immigrantStatus,
				languages: languages,
				referral: referral,
				knowledge_location: knowledgeLocation,
				isColorPerson: isColorPerson,
				isMarginalized: isMarginalized,
				isFamilyNative: isFamilyNative,
				isEconomically: isEconomically,
				identify: identify,
				pastLiveLocation: pastLiveLocation,
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
					We appreciate your interest in becoming a volunteer Global Mentor for
					MENTEE, a global nonprofit accelerating personal and Professional
					growth to make the world a better, healthier place.
				</p>
				<p className="para-2">
					Fill out the application below to join our Specialist team for
					2021-2022 year.
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
export default MentorApplication;
