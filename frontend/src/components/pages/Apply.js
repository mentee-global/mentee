import React, { useEffect, useState } from "react";
import "../../components/css/Apply.scss";
import { Steps, Form, Input, Radio, Checkbox, LeftOutlined } from "antd";
import { ACCOUNT_TYPE } from "utils/consts";
import ApplyStep from "../../resources/applystep.png";
import ApplyStep2 from "../../resources/applystep2.png";
import {
	getAppState,
	fetchApplications,
	isHaveAccount,
	changeStateBuildProfile,
	isHaveProfilee,
} from "../../utils/api";
import ProfileStep from "../../resources/profilestep.png";
import ProfileStep2 from "../../resources/profilestep2.png";
import TrianStep from "../../resources/trainstep.png";
import TrianStep2 from "../../resources/trainstep2.png";
import MentorApplication from "./MentorApplication";
import MenteeApplication from "./MenteeApplication";
import PartnerApplication from "./PartnerApplication";
import TrainingList from "components/TrainingList";
import MentorProfileForm from "./MentorProfileForm";
import MenteeProfileForm from "./MenteeProfileForm";
import { useHistory } from "react-router";
import { useLocation } from "react-router-dom";
import { AccountBookFilled } from "@ant-design/icons";
import PartnerProfileForm from "components/PartnerProfileForm";

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
	const [err2, seterr2] = useState(false);
	const [ishavee, setishavee] = useState(false);
	const [isProfile, setIsprofile] = useState(false);
	const [isVerify, setIsVerify] = useState(null);
	const history = useHistory();
	const location = useLocation();

	const submitHandler = () => {
		setConfirmApply(true);
	};
	useEffect(() => {
		if (location.state) {
			if (location.state.email) {
				setEmail(location.state.email);
			}
			if (location.state.role) {
				setRole(location.state.role);
			}
		}
	}, []);

	useEffect(() => {
		async function checkConfirmation() {
			if (role) {
				if (email.length > 12) {
					const { isHave, isHaveProfile, isVerified } = await isHaveAccount(
						email,
						role
					);
					setIsVerify(isVerified);
					setishavee(isHave);
					if (isHave == true && isHaveProfile == true) {
						setIsprofile(true);
						setishavee(true);
						setTimeout(() => {
							history.push("/login");
						}, 2000);
						return;
					} else if (isHave == true && isHaveProfile == false) {
						if (location.state) {
							setIsprofile(false);
							setishavee(true);
							setIsApply(false);
							setIstrain(false);
							setIsBuild(true);
							setApproveTrainning(true);
							return;
						}
					}
					if (role == ACCOUNT_TYPE.PARTNER && isVerified) {
						setIsApply(false);
						setIstrain(false);
						setIsBuild(true);
						setApproveTrainning(true);
						return;
					} else if (role == ACCOUNT_TYPE.PARTNER && !isVerified) {
						setIsApply(false);
						setIstrain(false);
						setIsBuild(false);
						return;
					} else if (role != ACCOUNT_TYPE.PARTNER && isVerified) {
						setIsApply(false);
						setIstrain(false);
						setIsBuild(true);
						return;
					} else {
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
						} else if (state == "BuildProfile") {
							setIsApply(false);
							setIstrain(false);
							setIsBuild(true);
							setApproveTrainning(true);
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
		}
		//check this email already send application and pending
		checkConfirmation();
	}, [role, email]);

	return (
		<div className="container2">
			<h1 className="home-header">
				Welcome to <span>MENTEE!</span>
			</h1>
			<p className="home-text">
				Please enter your email to start the application process.
			</p>
			<div className="emailPart">
				<p>Email:</p>
				<Input
					type="email"
					className="emailIn"
					placeholder="Email"
					value={email}
					onChange={(e) => {
						setEmail(e.target.value);
						seterr(false);
					}}
				/>
			</div>
			{ishavee && isProfile == true && (
				<p className="error">
					You Already have account you will be redirect to login page
				</p>
			)}
			<Radio.Group
				className="roleGroup"
				onChange={(e) => setRole(e.target.value)}
				value={role}
			>
				<Radio className="role" value={ACCOUNT_TYPE.MENTEE}>
					Mentee
				</Radio>
				<Radio className="role" value={ACCOUNT_TYPE.MENTOR}>
					Mentor
				</Radio>
				<Radio className="role" value={ACCOUNT_TYPE.PARTNER}>
					Partner
				</Radio>
			</Radio.Group>
			<div className="steps">
				<img
					src={isapply ? ApplyStep : ApplyStep2}
					className="step0"
					alt="apply"
					onClick={() => {
						setIsApply(true);
						setIsBuild(false);
						setIstrain(false);
					}}
				/>
				<img
					src={istrain ? TrianStep2 : TrianStep}
					className="step1"
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
					className="step2"
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

			<div
				className={isapply && (confirmApply || approveApply) ? "" : "formsPart"}
			>
				{isapply ? (
					<div className="applypart">
						{!approveApply && confirmApply ? (
							<h1 className="applymessage">
								Thank you for applying! Your application will be reviewed and
								you will be contacted shortly.
							</h1>
						) : (
							<>
								{approveApply ? (
									<h1 className="applymessage">
										Your application has been approved continue to training
									</h1>
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
							</>
						)}
					</div>
				) : (
					""
				)}
				{istrain ? (
					<div className="trainpart">
						{" "}
						<TrainingList />
					</div>
				) : (
					""
				)}
				{isbuild ? (
					<div className="buildpart">
						{role === ACCOUNT_TYPE.PARTNER && isVerify ? (
							<PartnerProfileForm
								role={role}
								headEmail={email}
								isHave={ishavee}
							/>
						) : (
							""
						)}
						{role === ACCOUNT_TYPE.MENTOR ? (
							<MentorProfileForm
								headEmail={email}
								role={role}
								isHave={ishavee}
							></MentorProfileForm>
						) : (
							""
						)}
						{role === ACCOUNT_TYPE.MENTEE ? (
							<MenteeProfileForm
								headEmail={email}
								role={role}
								isHave={ishavee}
							></MenteeProfileForm>
						) : (
							""
						)}
					</div>
				) : (
					""
				)}

				<div className="btnContainer">
					<div
						className={`applySubmit2 ${istrain ? "" : " hide"}`}
						onClick={async () => {
							let state = await changeStateBuildProfile(email, role);
							if (state == "BuildProfile") {
								setIsApply(false);
								setIsBuild(true);
								setIstrain(false);
							} else {
								seterr2(true);
							}
						}}
					>
						I confirm I have completed all trainings
					</div>
					{err2 && <p>Something went wrong check your internet connection</p>}
				</div>
			</div>
		</div>
	);
};

export default Apply;
