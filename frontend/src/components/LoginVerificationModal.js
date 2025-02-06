import { Modal, Input } from "antd";
import React, { useState, useEffect } from "react";
import MenteeButton from "./MenteeButton";
import { verify } from "../utils/verifyMentee";
import { isLoggedIn, getRegistrationStage } from "utils/auth.service";
import { REGISTRATION_STAGE, ACCOUNT_TYPE } from "utils/consts";
import { useAuth } from "../utils/hooks/useAuth";
import usePersistedState from "utils/hooks/usePersistedState";

import "./css/VerificationModal.scss";
import { CheckCircleTwoTone, CloseCircleTwoTone } from "@ant-design/icons";
import { useHistory } from "react-router-dom";

/**
 * NOTE:
 * Every modal that is open is its own instance
 * so all the props and email/password
 * are not connected between modals
 */
function LoginVerificationModal(props) {
  const history = useHistory();
  const [isVisible, setIsVisible] = useState(false);
  const [permissions, setPermissions] = usePersistedState(
    "permissions",
    ACCOUNT_TYPE.MENTEE
  );
  const { onAuthStateChanged } = useAuth();

  /**
   * This is the entry point for whether one
   * is allowed to view a page or modal.
   */
  const handleViewPermission = async () => {
    if (props.loginButton) {
      history.push("/login");
    }

    const registrationStage = await getRegistrationStage();
    if (isLoggedIn() && registrationStage === null) {
      setIsVisible(false);
      props.onVerified();
      return;
    }

    if (registrationStage === REGISTRATION_STAGE.VERIFY_EMAIL) {
      history.push("/verify");
    } else {
      setIsVisible(true);
    }
  };

  return (
    <span className={props.className}>
      <MenteeButton
        theme={props.theme}
        content={props.content}
        onClick={handleViewPermission}
        width={props.width}
        height={props.height}
        style={props.style}
        loading={props.loading}
        border={props.border}
      />
      <Modal
        title="Access Denied"
        open={isVisible}
        className="verification-modal"
        onCancel={() => {
          setIsVisible(false);
        }}
        footer={
          <div className="footer-container">
            <MenteeButton
              content="Login"
              onClick={() => {
                setIsVisible(false);
                history.push({ pathname: "/login" });
              }}
            />
          </div>
        }
      >
        <div className="verification-body">
          <div className="verification-header">You must login to continue.</div>
        </div>
      </Modal>
    </span>
  );
}

export default LoginVerificationModal;
