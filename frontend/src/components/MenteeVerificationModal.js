import { Modal, Button } from "antd";
import { useHistory } from "react-router-dom";
import React, { useState } from "react";
import MenteeButton from "./MenteeButton";
import { isVerified } from "../utils/verifyMentee";
import { isLoggedIn } from "utils/auth.service";

function MenteeVerificationModal() {
  const history = useHistory();
  const [isVisible, setIsVisible] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  const handleViewPermission = () => {
    if (isLoggedIn() || isVerified()) {
      history.push("/gallery");
    }

    setIsVisible(true);
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
        onCancel={() => {
          setIsVisible(false);
        }}
        width="30%"
        style={{ overflow: "hidden" }}
        footer={
          <div
            style={{
              textAlign: "center",
            }}
          >
            <MenteeButton
              content="default"
              onClick={() => {}}
              loading={isVerifying}
              width="50%"
            >
              Check Registration
            </MenteeButton>
          </div>
        }
      ></Modal>
    </span>
  );
}

export default MenteeVerificationModal;
