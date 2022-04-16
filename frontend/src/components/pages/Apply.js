import React, { useEffect, useState } from "react";
import "../../components/css/Apply.scss";
import { Steps, Form, Input, Radio, Checkbox, LeftOutlined } from "antd";
import { ACCOUNT_TYPE } from "utils/consts";
import ApplyStep from "../../resources/applystep.png";
import ApplyStep2 from "../../resources/applystep2.png";
import { getAppState, fetchApplications, isHaveAccount } from "../../utils/api";
import ProfileStep from "../../resources/profilestep.png";
import ProfileStep2 from "../../resources/profilestep2.png";
import TrianStep from "../../resources/trainstep.png";
import TrianStep2 from "../../resources/trainstep2.png";
import MentorApplication from "./MentorApplication";
import MenteeApplication from "./MenteeApplication";
import PartnerApplication from "./PartnerApplication";
import TrainingList from "components/TrainingList";
import BuildProfile from "components/BuildProfile";
import { useHistory } from "react-router";
const Apply = () => {
	const [email, setEmail] = useState("");
	const [role, setRole] = useState(null);
	const [isapply, setIsApply] = useState(true);
	const [confirmApply, setConfirmApply] = useState(false);
	const [approveApply, setApproveApply] = useState(false);
	const [approveTrainning, setApproveTrainning] = useState(false);
	const [istrain, setIstrain] = useState(false);
	const [isbuild, setIsBuild] = useState(false);
	const [err, seterr] = useState(false);
	const [ishavee, setishavee] = useState(false);
	const history = useHistory();

	const submitHandler = () => {
		setConfirmApply(true);
	};

	useEffect(() => {
		async function checkConfirmation() {
			if (role) {
				if (email.length > 7) {
					const isHave = await isHaveAccount(email);
					if (isHave == true) {
						setishavee(true);
						setTimeout(() => {
							history.push("/login");
						}, 2000);
						return;
					}
					const state = await getAppState(email, role);
					console.log(state, "here");
					console.log(state === "APPROVED");
					if (state === "PENDING") {
						setConfirmApply(true);
						setApproveApply(false);
					} else if (state == "APPROVED") {
						console.log("wal3");
						setApproveApply(true);
						setConfirmApply(false);
						setIsApply(false);
						setIstrain(true);
					} else {
						console.log("here");
						setConfirmApply(false);
						setApproveApply(false);
						setIsApply(true);
						setIsBuild(false);
						setIstrain(false);
					}

					return state;
				}
			}
		}
		//check this email already send application and pending
		checkConfirmation();
	}, [role, email]);

	return (
		<div className="container">
			<h1 className="home-header">
				Welcome to <span>MENTEE!</span>
			</h1>
			<p className="home-text">
				Please enter your email to start the application process.
			</p>
			<div className="emailPart">
				<p>Email:</p>
				<Input
					type="text"
					className="emailIn"
					placeholder="Email"
					onChange={(e) => {
						setEmail(e.target.value);
						seterr(false);
					}}
				/>
			</div>
			{ishavee && (
				<p className="error">
					You Already have account you will be redirect to login page
				</p>
			)}
			<Radio.Group
				className="roleGroup"
				onChange={(e) => setRole(e.target.value)}
				value={role}
			>
				<Radio value={ACCOUNT_TYPE.MENTEE}>Mentee</Radio>
				<Radio value={ACCOUNT_TYPE.MENTOR}>Mentor</Radio>
				<Radio value={ACCOUNT_TYPE.PARTNER}>Partner</Radio>
			</Radio.Group>
			<div className="steps">
				<img
					src={isapply ? ApplyStep : ApplyStep2}
					className="step"
					alt="apply"
					onClick={() => {
						setIsApply(true);
						setIsBuild(false);
						setIstrain(false);
					}}
				/>
				<img
					src={istrain ? TrianStep2 : TrianStep}
					className="step"
					alt="trainning"
					onClick={() => {
						if (approveApply) {
							setIsApply(false);
							setIsBuild(false);
							setIstrain(true);
						}
					}}
				/>
				<img
					src={isbuild ? ProfileStep2 : ProfileStep}
					className="step"
					alt="profile"
					onClick={() => {
						if (approveTrainning) {
							setIsApply(false);
							setIsBuild(true);
							setIstrain(false);
						}
					}}
				/>
			</div>
			{err ? <p className="error">Email Required</p> : ""}
			<div className="formsPart">
				{isapply ? (
					<div className="applypart">
						{!approveApply && confirmApply ? (
							<h1>
								Thank you for applying! Your application will be reviewed and
								you will be contacted shortly.
								<button
									onClick={(e) => {
										setApproveApply(true);
										setConfirmApply(false);
										setIsApply(false);
										setIstrain(true);
									}}
								>
									approve from here for test
								</button>
							</h1>
						) : (
							<>
								{approveApply ? (
									<h1>Your application approved continue training</h1>
								) : (
									""
								)}
								{!approveApply && role === ACCOUNT_TYPE.MENTOR ? (
									<MentorApplication
										submitHandler={submitHandler}
										role={ACCOUNT_TYPE.MENTOR}
										headEmail={email}
									></MentorApplication>
								) : (
									""
								)}
								{!approveApply && role === ACCOUNT_TYPE.MENTEE ? (
									<MenteeApplication
										submitHandler={submitHandler}
										role={ACCOUNT_TYPE.MENTEE}
										headEmail={email}
									></MenteeApplication>
								) : (
									""
								)}
								{!approveApply && role === ACCOUNT_TYPE.PARTNER ? (
									<PartnerApplication
										submitHandler={submitHandler}
										role={ACCOUNT_TYPE.PARTNER}
										headEmail={email}
									></PartnerApplication>
								) : (
									""
								)}
							</>
						)}
					</div>
				) : (
					""
				)}

				<div className="trainpart">{istrain ? <TrainingList /> : ""}</div>
				<div className="buildpart">
					{isbuild ? <BuildProfile role={role} headEmail={email} /> : ""}
				</div>
				{}
				<div className="btnContainer">
					<div
						className={`applySubmit ${istrain ? "" : " hide"}`}
						onClick={() => {
							setIsApply(false);
							setIsBuild(true);
							setIstrain(false);
						}}
					>
						I confirm I have completed all trainings
					</div>
				</div>
			</div>
		</div>
	);
};

export default Apply;
