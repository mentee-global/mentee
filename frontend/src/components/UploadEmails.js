import React, { useCallback, useState } from "react";
import { Modal, Form, Input, Button, message, Radio } from "antd";
import { useDropzone } from "react-dropzone";
import { adminUploadEmails, adminUploadEmailsText } from "utils/api";
import MenteeButton from "./MenteeButton";

import "./css/UploadEmails.scss";

function UploadEmails(props) {
  const { TextArea } = Input;
  const onChangeIsMentor = (e) => setIsMentor(e.target.value);
  const [isMentor, setIsMentor] = useState();
  const [messageText, setMessageText] = useState("");

  const onFinish = useCallback((messageText, isMentor) => {
    var emails = messageText.split(";");

    for (var i = 0; i < emails.length; i++) {
      if (!/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(emails[i])) {
        alert("Invalid email: " + emails[i]);
        return;
      }
    }
    async function uploadEmailsText(messageText) {
      await adminUploadEmailsText(messageText, isMentor);
    }

    uploadEmailsText(messageText);

    setMessageText("");
    setIsMentor("");
    success();
  }, []);

  const success = () => {
    message.success("This is a success message");
    props.setUploadModalVisible(false);
  };

  return (
    <Modal
      visible={props.uploadModalVisible}
      setUploadModalVisible={props.setUploadModalVisible}
      footer={<div></div>
      }
      onCancel={() => props.setUploadModalVisible(false)}
    >
      {" "}
      <div className="dragdrops">
        <h1>Add Bulk Users</h1>
        <h2>
          Profiles to add : <span>&nbsp;&nbsp;</span>
          <Radio.Group onChange={onChangeIsMentor} value={isMentor}>
            <Radio value={"true"}>Mentor</Radio>
            <Radio value={"false"}>Mentee</Radio>
          </Radio.Group>
        </h2>
        <h4>
          Enter multiple email addresses, seperated by semicolon ';' then submit
        </h4>
        <div>
          <Form onFinish={() => onFinish(messageText, isMentor)}>
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
