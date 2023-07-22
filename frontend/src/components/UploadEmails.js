import React, { useCallback, useState } from "react";
import { Modal, Form, Input, Button, message, Radio } from "antd";
import { adminUploadEmailsText } from "utils/api";
import { validateEmail } from "utils/misc";

import "./css/UploadEmails.scss";
import { ACCOUNT_TYPE } from "utils/consts";

function UploadEmails(props) {
  const { TextArea } = Input;
  const onChangeRole = (e) => setRole(e.target.value);
  const [role, setRole] = useState(null);
  const [messageText, setMessageText] = useState("");
  const [isMissing, setIsMissing] = useState(false);

  const onFinish = useCallback((messageText, role) => {
    var emails = messageText.split(";");

    if (!role) {
      setIsMissing(true);
      return;
    }
    setIsMissing(false);

    for (var i = 0; i < emails.length; i++) {
      if (!validateEmail(emails[i].replace(/\s/g, ""))) {
        alert("Invalid email: " + emails[i]);
        return;
      }
    }
    async function uploadEmailsText(messageText) {
      await adminUploadEmailsText(messageText, role);
    }

    uploadEmailsText(messageText);

    setMessageText("");
    setRole(null);
    success();
  }, []);

  const success = () => {
    message.success("Successfully added users!");
    props.setUploadModalVisible(false);
  };

  return (
    <Modal
      open={props.uploadModalVisible}
      footer={<div></div>}
      onCancel={() => props.setUploadModalVisible(false)}
    >
      <div className="dragdrops">
        <h1>Add Bulk Users</h1>
        <h2>
          Profiles to add : <span>&nbsp;&nbsp;</span>
          <Radio.Group onChange={onChangeRole} value={role}>
            <Radio value={ACCOUNT_TYPE.MENTOR}>Mentor</Radio>
            <Radio value={ACCOUNT_TYPE.MENTEE}>Mentee</Radio>
            <Radio value={ACCOUNT_TYPE.PARTNER}>Partner</Radio>
          </Radio.Group>
          {isMissing && (
            <h5>
              {" "}
              <p style={{ color: "red" }}>Please select an option.</p>
            </h5>
          )}
        </h2>
        <h4>
          Enter multiple email addresses, seperated by semicolon ';' then submit
        </h4>
        <div>
          <Form onFinish={() => onFinish(messageText, role)}>
            <Form.Item>
              <TextArea
                className="message-input"
                placeholder="Enter email(s)"
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                autoSize={{ minRows: 4, maxRows: 10 }}
              />
            </Form.Item>

            <Form.Item>
              <Button className="regular-button" htmlType="submit">
                Submit
              </Button>
            </Form.Item>
          </Form>
        </div>
      </div>
    </Modal>
  );
}

export default UploadEmails;

//
