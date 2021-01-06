import { Modal, Button, Input } from "antd";
import { useHistory } from "react-router-dom";
import React, { useState } from "react";
import MenteeButton from "./MenteeButton";
import { isVerified, verify } from "../utils/verifyMentee";
import { isLoggedIn } from "utils/auth.service";

import "./css/Modal.scss";

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
    }

    setIsVisible(true);
  };

  const handleVerifyInfo = async () => {
    await verify(email, password);

    if (isVerified()) {
      setError(false);
      setIsVisible(false);
      history.push("/gallery");
    }
    setError(true);
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
        width="30%"
        onCancel={() => {
          setIsVisible(false);
          setError(false);
        }}
        footer={
          <div>
            {error && <b>Not Verified/Wrong Password</b>}
            <Button type="round" onClick={() => {}} loading={isVerifying}>
              Continue
            </Button>
          </div>
        }
      >
        <div className="modal-container" style={styles.modal}>
          <div className="modal-header">
            You must confirm your email is approved through <b>MENTEE</b> to
            continue
          </div>
          <div className="modal-inner-container">
            <div className="modal-input-container"></div>
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
              onClick={handleVerifyInfo}
            />
          </div>
        </div>
      </Modal>
    </span>
  );
}

const styles = {
  modal: {
    height: "30%",
    width: "60%",
    overflowY: "hidden",
  },
  input: {},
  button: {},
  footer: {
    borderRadius: 13,
    marginRight: 15,
    backgroundColor: "#E4BB4F",
  },
  alertToast: {
    color: "#FF0000",
    display: "inline-block",
    marginRight: 10,
  },
};

export default MenteeVerificationModal;
