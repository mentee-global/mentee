import React, { useCallback, useState } from "react";
import { Modal, Form, Input, Button, message, Radio } from "antd";
import { useDropzone } from "react-dropzone";
import { adminUploadEmails, adminUploadEmailsText } from "utils/api";
import MenteeButton from "./MenteeButton";

import "./css/UploadEmails.scss";

function UploadEmails(props) {
  const { TextArea } = Input;
  const onChange5 = (e) => setCompanyTime(e.target.value);
  const [companyTime, setCompanyTime] = useState();
  const [messageText, setMessageText] = useState("");

  const onFinish = useCallback((messageText, companyTime) => {
    async function uploadEmailsText(messageText) {
      await adminUploadEmailsText(messageText, companyTime);
    }

    uploadEmailsText(messageText);

    setMessageText("");
    setCompanyTime("");
    success();
  }, []);

  const success = () => {
    message.success("This is a success message");
  };

  return (
    <Modal
      visible={props.uploadModalVisible}
      setUploadModalVisible={props.setUploadModalVisible}
      footer={
        <MenteeButton
          content="Done"
          onClick={() => {
            props.setUploadModalVisible(false);
          }}
        />
      }
      onCancel={() => props.setUploadModalVisible(false)}
    >
      {" "}
      <div className="dragdrops">
        <h1>Add Bulk Users</h1>
        <h2>
          Profiles to add : <span>&nbsp;&nbsp;</span>
          <Radio.Group onChange={onChange5} value={companyTime}>
            <Radio value={"true"}>Mentor</Radio>
            <Radio value={"false"}>Mentee</Radio>
          </Radio.Group>
        </h2>
        <h4>
          Enter multiple email addresses, seperated by semicolon ';' then submit
        </h4>
        <div>
          <Form onFinish={() => onFinish(messageText, companyTime)}>
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
              <Button type="primary" htmlType="submit">
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
