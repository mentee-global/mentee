import React, { useState } from "react";
import "../../components/css/Apply.scss";
import { Steps, Form, Input, Radio, Checkbox, LeftOutlined } from "antd";
import { ACCOUNT_TYPE } from "utils/consts";
import ApplyStep from "../../resources/applystep.png";
import ApplyStep2 from "../../resources/applystep2.png";

import ProfileStep from "../../resources/profilestep.png";
import ProfileStep2 from "../../resources/profilestep2.png";
import TrianStep from "../../resources/trainstep.png";
import TrianStep2 from "../../resources/trainstep2.png";
import MentorApplication from "./MentorApplication";

const Apply = () => {
	const [email, setEmail] = useState("");
	const [role, setRole] = useState(1);
	const [isapply, setIsApply] = useState(true);
	const [confirmApply, setConfirmApply] = useState(false);
	const [approveApply, setApproveApply] = useState(false);
	const [approveTrainning, setApproveTrainning] = useState(false);
	const [istrain, setIstrain] = useState(false);
	const [isbuild, setIsBuild] = useState(false);
	const [err, seterr] = useState(false);

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
			<Radio.Group
				className="roleGroup"
				onChange={(e) => setRole(e.target.value)}
				value={role}
				defaultValue={ACCOUNT_TYPE.MENTOR}
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
							</h1>
						) : (
							<MentorApplication></MentorApplication>
						)}
					</div>
				) : (
					""
				)}

				<div className="trainpart">{istrain ? <h1>train list</h1> : ""}</div>
				<div className="buildpart">{isbuild ? <h1>Build form</h1> : ""}</div>
				{}
				<div
					className={`testbtn${isapply ? "" : " hide"}`}
					onClick={() => {
						setApproveApply(true);
						setIsApply(false);
						setIstrain(true);
					}}
				>
					approve from here for test
				</div>
				<div
					className={`applySubmit ${isapply ? "" : " hide"}`}
					onClick={() => {
						if (email == "") {
							seterr(true);
							return;
						}
						setConfirmApply(true);
					}}
				>
					Submit
				</div>

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
				<div className={`applySubmit ${isbuild ? "" : " hide"}`}>
					Submit my profile
				</div>
			</div>
		</div>
	);
};

export default Apply;
