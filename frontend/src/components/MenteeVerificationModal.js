import { Modal, Input } from "antd";
import React, { useState } from "react";
import MenteeButton from "./MenteeButton";
import { verify } from "../utils/verifyMentee";
import { isLoggedIn } from "utils/auth.service";

import "./css/VerificationModal.scss";
import { CheckCircleTwoTone, CloseCircleTwoTone } from "@ant-design/icons";

/**
 * NOTE:
 * Every modal that is open is its own instance
 * so all the props and email/password
 * are not connected between modals
 */
function MenteeVerificationModal(props) {
  const [isVisible, setIsVisible] = useState(false);
  const [email, setEmail] = useState();
  const [password, setPassword] = useState();
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState(false);
  const [verified, setVerified] = useState(false);

  /**
   * This is the entry point for whether one
   * is allowed to view a page or modal.
   */
  const handleViewPermission = () => {
    if (isLoggedIn() || verified) {
      props.onVerified();
      setIsVisible(false);
      return;
    }

    setIsVisible(true);
  };

  /**
   * Async backend verification of credentials
   * Takes in the existing states of email and password
   */
  const handleVerifyInfo = async () => {
    setIsVerifying(true);
    const res = await verify(email, password, props.mentor);
    setIsVerifying(false);
    setVerified(res);
    if (!res) {
      setError(true);
    } else {
      setError(false);
    }
  };

  const getIsVerifiedIcon = () => {
    if (verified) {
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
    <span className={props.className}>
      {props.btn_title ? (
        <div className="link-book-availability" onClick={handleViewPermission}>
          {props.btn_title}
        </div>
      ) : (
        <MenteeButton
          theme={props.theme}
          content={props.content}
          onClick={handleViewPermission}
          width={props.width}
          height={props.height}
          style={props.style}
          loading={props.loading}
        />
      )}

      <Modal
        title="Verify your email"
        open={isVisible}
        className="verification-modal"
        onCancel={() => {
          setIsVisible(false);
          setError(false);
        }}
        footer={
          <div className="footer-container">
            {getIsVerifiedIcon()}
            <MenteeButton content="Continue" onClick={handleViewPermission} />
          </div>
        }
      >
        <div className="verification-body">
          <div className="verification-header">
            You must confirm your email is approved through <b>MENTEE</b> to
            continue.
          </div>
          <div className="verification-input-container">
            <Input
              placeholder="Email"
              onChange={(e) => setEmail(e.target.value)}
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
