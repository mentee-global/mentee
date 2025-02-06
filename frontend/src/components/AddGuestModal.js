import React, { useCallback, useState, useEffect } from "react";
import { Modal, Form, Input, Button, message, Typography, Radio } from "antd";
import { adminUploadEmailsText, checkStatusByEmail } from "utils/api";
import { EyeInvisibleOutlined, EyeTwoTone } from "@ant-design/icons";
import { ACCOUNT_TYPE } from "utils/consts";
import { useTranslation } from "react-i18next";

const { Title } = Typography;
function AddGuestModal(props) {
  const [form] = Form.useForm();
  const { t } = useTranslation();
  const [valuesChanged, setValuesChanged] = useState(false);
  const [role, setRole] = useState(ACCOUNT_TYPE.GUEST);
  const [alreadyInFirebase, setAlreadyInFirebase] = useState(false);

  useEffect(() => {
    form.resetFields();
    setValuesChanged(false);
  }, [props.guestModalVisible]);

  const onFinish = useCallback((valuesChanged, user_role) => {
    async function addGuestUser(name, email, password, user_role) {
      await adminUploadEmailsText(email, user_role, password, name).then(
        (res) => {
          if (res.status === 200) {
            success();
          } else {
            if (res.response && res.response.status === 422) {
              alert("Failed create firebase account");
            } else {
              alert("Already registered Email: " + email);
            }
          }
        }
      );
    }
    if (valuesChanged) {
      form.validateFields().then((values) => {
        addGuestUser(values.name, values.email, values.password, user_role);
      });
    } else {
      props.setGuestModalVisible(false);
    }
  }, []);

  const success = () => {
    message.success("Successfully added user!");
    props.setGuestModalVisible(false);
  };

  const handleValuesChange = () => {
    setValuesChanged(true);
  };

  const validatePassword = (_, value) => {
    const passwordFieldValue = form.getFieldValue("password");
    if (value && passwordFieldValue !== value) {
      return Promise.reject(new Error("The passwords do not match"));
    }

    return Promise.resolve();
  };

  const onChangeRole = (e) => {
    setRole(e.target.value);
  };

  const checkEmailExsit = async (e) => {
    const { inFirebase } = await checkStatusByEmail(e.target.value, role);
    setAlreadyInFirebase(inFirebase);
  };

  return (
    <Modal
      open={props.guestModalVisible}
      footer={<div></div>}
      onCancel={() => props.setGuestModalVisible(false)}
    >
      <div className="dragdrops">
        <Title>Add Guest/Support User</Title>
        <Radio.Group
          style={{ marginBottom: "15px" }}
          onChange={onChangeRole}
          value={role}
        >
          <Radio value={ACCOUNT_TYPE.GUEST}>Guest</Radio>
          <Radio value={ACCOUNT_TYPE.SUPPORT}>Support</Radio>
        </Radio.Group>
        <div>
          <Form
            form={form}
            onValuesChange={handleValuesChange}
            onFinish={() => onFinish(valuesChanged, role)}
          >
            <Form.Item
              name="name"
              rules={[
                {
                  required: true,
                  message: "Please input Name.",
                },
              ]}
            >
              <Input
                type="text"
                className=""
                bordered={true}
                placeholder={t("common.name")}
              />
            </Form.Item>
            <Form.Item
              name="email"
              rules={[
                {
                  required: true,
                  message: "Please input Email.",
                },
                {
                  type: "email",
                  message: "The input is not valid E-mail!",
                },
              ]}
            >
              <Input
                bordered={true}
                placeholder={t("common.email")}
                onBlur={(e) => checkEmailExsit(e)}
              />
            </Form.Item>
            <Form.Item
              name="password"
              rules={[
                {
                  required: alreadyInFirebase ? false : true,
                  message: "Please input Password.",
                },
              ]}
            >
              <Input.Password
                iconRender={(visible) =>
                  visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />
                }
                bordered={true}
                placeholder={t("common.password")}
                disabled={alreadyInFirebase}
              />
            </Form.Item>
            <Form.Item
              name="confirm"
              rules={[
                {
                  required: alreadyInFirebase ? false : true,
                  message: "Please confirm password!",
                },
                { validator: validatePassword },
              ]}
            >
              <Input.Password
                iconRender={(visible) =>
                  visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />
                }
                bordered={true}
                placeholder={t("commonProfile.confirmPassword")}
                disabled={alreadyInFirebase}
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
