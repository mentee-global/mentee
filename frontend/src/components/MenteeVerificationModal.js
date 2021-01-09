import { Modal, Input } from "antd";
import { useHistory } from "react-router-dom";
import React, { useState } from "react";
import MenteeButton from "./MenteeButton";
import { isVerified, verify } from "../utils/verifyMentee";
import { isLoggedIn } from "utils/auth.service";

import "./css/VerificationModal.scss";
import { CheckCircleTwoTone, CloseCircleTwoTone } from "@ant-design/icons";

function MenteeVerificationModal() {
  const history = useHistory();
  const [isVisible, setIsVisible] = useState(false);
  const [email, setEmail] = useState();
  const [password, setPassword] = useState();
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState(false);

  const handleViewPermission = () => {
    if (isLoggedIn() || isVerified()) {
      history.push("/gallery");
      return;
    }

    setIsVisible(true);
  };

  const handleVerifyInfo = async () => {
    setIsVerifying(true);
    await verify(email, password);
    setIsVerifying(false);

    if (!isVerified()) {
      setError(true);
    }
  };

  const getIsVerifiedIcon = () => {
    if (isVerified()) {
      return (
        <div className="verified-feedback">
          <div>Confirmed </div>
          <CheckCircleTwoTone
            className="feedback-icon"
            twoToneColor="#52c41a"
          />
        </div>
      );
    } else if (error) {
      return (
        <div className="verified-feedback">
          <div>Not Verified </div>
          <CloseCircleTwoTone className="feedback-icon" twoToneColor="red" />
        </div>
      );
    } else {
      return <div></div>;
    }
  };

  return (
    <span>
      <MenteeButton
        theme="dark"
        content={<b>Find a Mentor</b>}
        onClick={handleViewPermission}
      />
      <Modal
        title="Verify Mentee"
        visible={isVisible}
        className="verification-modal"
        onCancel={() => {
          setIsVisible(false);
          setError(false);
        }}
        footer={
          <div className="footer-container">
            {getIsVerifiedIcon()}
            <MenteeButton
              theme="light"
              content="Continue"
              onClick={handleViewPermission}
            />
          </div>
        }
      >
        <div className="verification-body">
          <div className="verification-header">
            You must confirm your email is approved through <b>MENTEE</b> to
            continue
          </div>
          <div className="verification-input-container">
            <Input
              placeholder="Email"
              onChange={(e) => setEmail(e.target.value)}
            />
            <Input.Password
              placeholder="Password"
              onChange={(e) => setPassword(e.target.value)}
            />
            <MenteeButton
              content="Check Registration"
              radius="4px"
              width="100%"
              onClick={handleVerifyInfo}
              loading={isVerifying}
            />
          </div>
        </div>
      </Modal>
    </span>
  );
}

export default MenteeVerificationModal;
