import React, { useCallback, useEffect, useState } from "react";
import { Modal, Form, Input, Button, message } from "antd";
import { adminUploadEmailsText } from "utils/api";
import { validateEmail } from "utils/misc";
import { EyeInvisibleOutlined, EyeTwoTone } from "@ant-design/icons";
import { ACCOUNT_TYPE } from "utils/consts";
import { useTranslation } from "react-i18next";

function AddGuestModal(props) {
  const { t } = useTranslation();
  const [password, setPassword] = useState(null);
  const [email, setEmail] = useState(null);
  const [name, setName] = useState(null);
  const [confirmPassword, setconfirmPassword] = useState(null);
  const [showMissingFieldErrors, setShowMissingFieldErrors] = useState(false);

  useEffect(() => {
    setShowMissingFieldErrors(false);
  }, []);

  const shouldShowErrors = () => (v) =>
    (!v || (typeof v === "object" && v.length === 0)) && showMissingFieldErrors;

  const onFinish = useCallback((name, email, password, confirmPassword) => {
    if (
      !name ||
      !email ||
      !password ||
      !confirmPassword ||
      password !== confirmPassword
    ) {
      setShowMissingFieldErrors(true);
      return;
    }

    if (!validateEmail(email.replace(/\s/g, ""))) {
      alert("Invalid email: " + email);
      return;
    }

    async function addGuestUser(name, email, password) {
      await adminUploadEmailsText(
        email,
        ACCOUNT_TYPE.GUEST,
        password,
        name
      ).then((res) => {
        if (res.data && res.data.result && res.data.result.status === "ok") {
          success();
        } else {
          if (
            res.data &&
            res.data.result &&
            res.data.result.status === "fail firebase"
          ) {
            alert("Failed create firebase account");
          } else {
            alert("Already registered Email: " + email);
          }
        }
      });
    }
    addGuestUser(name, email, password, confirmPassword);

    if (showMissingFieldErrors) setShowMissingFieldErrors(false);
  }, []);

  const success = () => {
    message.success("Successfully added user!");
    props.setGuestModalVisible(false);
  };

  const isMissingError = shouldShowErrors();
  return (
    <Modal
      open={props.guestModalVisible}
      setGuestModalVisible={props.setGuestModalVisible}
      footer={<div></div>}
      onCancel={() => props.setGuestModalVisible(false)}
    >
      {" "}
      <div className="dragdrops">
        <h1>Add Guest User</h1>
        <div>
          <Form
            onFinish={() => onFinish(name, email, password, confirmPassword)}
          >
            <Form.Item
              className=""
              rules={[
                {
                  required: true,
                },
              ]}
            >
              {isMissingError(name) && (
                <p style={{ color: "red" }}>Please input Name.</p>
              )}
              <Input
                type="text"
                className=""
                onChange={(e) => setName(e.target.value)}
                bordered={true}
                placeholder={t("common.name")}
              />
            </Form.Item>
            <Form.Item
              className=""
              rules={[
                {
                  required: true,
                },
              ]}
            >
              {isMissingError(email) && (
                <p style={{ color: "red" }}>Please input Email.</p>
              )}
              <Input
                type="text"
                className=""
                onChange={(e) => setEmail(e.target.value)}
                bordered={true}
                placeholder={t("common.email")}
              />
            </Form.Item>
            <Form.Item
              className=""
              rules={[
                {
                  required: true,
                },
              ]}
            >
              {isMissingError(password) && (
                <p style={{ color: "red" }}>Please input Password.</p>
              )}
              <Input.Password
                className=""
                iconRender={(visible) =>
                  visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />
                }
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                bordered={true}
                placeholder={t("common.password")}
              />
            </Form.Item>
            <Form.Item
              className=""
              rules={[
                {
                  required: true,
                },
              ]}
            >
              {isMissingError(confirmPassword) && (
                <p style={{ color: "red" }}>Please Confirm Password.</p>
              )}
              {confirmPassword && password && confirmPassword !== password && (
                <p style={{ color: "red" }}>Please Input Password Correctly.</p>
              )}
              <Input.Password
                className=""
                iconRender={(visible) =>
                  visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />
                }
                onChange={(e) => setconfirmPassword(e.target.value)}
                bordered={true}
                placeholder={t("commonProfile.confirmPassword")}
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

export default AddGuestModal;

//
