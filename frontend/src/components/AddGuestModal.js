import React, { useCallback, useState, useEffect } from "react";
import { Modal, Form, Input, Button, message, Typography } from "antd";
import { adminUploadEmailsText } from "utils/api";
import { validateEmail } from "utils/misc";
import { EyeInvisibleOutlined, EyeTwoTone } from "@ant-design/icons";
import { ACCOUNT_TYPE } from "utils/consts";
import { useTranslation } from "react-i18next";

const { Title } = Typography;
function AddGuestModal(props) {
  const [form] = Form.useForm();
  const { t } = useTranslation();
  const [valuesChanged, setValuesChanged] = useState(false);

  useEffect(() => {
    form.resetFields();
    setValuesChanged(false);
  }, [props.guestModalVisible]);
  

  const onFinish = useCallback((valuesChanged) => {
    async function addGuestUser(name, email, password) {
      await adminUploadEmailsText(
        email,
        ACCOUNT_TYPE.GUEST,
        password,
        name
      ).then(
        (res) => {
          if (res.status === 200) {
            success();
          } else {
            if (
              res.response &&
              res.response.status === 422
            ) {
              alert("Failed create firebase account");
            } else {
              alert("Already registered Email: " + email);
            }
          }
        }
      )
    }
    if (valuesChanged) {
      form
        .validateFields()
        .then(values => {
          addGuestUser(values.name, values.email, values.password);
        })
    } else {
      props.setGuestModalVisible(false)
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
    const passwordFieldValue = form.getFieldValue('password');
    if (value && passwordFieldValue !== value) {
      return Promise.reject(new Error('The passwords do not match'));
    }

    return Promise.resolve();
  };
  return (
    <Modal
      open={props.guestModalVisible}
      footer={<div></div>}
      onCancel={() => props.setGuestModalVisible(false)}
    >
      <div className="dragdrops">
        <Title>Add Guest User</Title>
        <div>
          <Form
            form={form}
            onValuesChange={handleValuesChange}
            onFinish={() => onFinish(valuesChanged)}
          >
            <Form.Item
              name="name"
              rules={[
                {
                  required: true,
                  message : "Please input Name."
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
                  message : "Please input Email."
                },
                {
                  type: 'email',
                  message: 'The input is not valid E-mail!',
                },
              ]}
            >
              <Input
                bordered={true}
                placeholder={t("common.email")}
              />
            </Form.Item>
            <Form.Item
              name="password"
              rules={[
                {
                  required: true,
                  message : "Please input Password."
                },
              ]}
            >
              <Input.Password
                iconRender={(visible) =>
                  visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />
                }
                bordered={true}
                placeholder={t("common.password")}
              />
            </Form.Item>
            <Form.Item
              name="confirm"
              rules={[
                {
                  required: true,
                  message: 'Please confirm password!',
                },
                { validator: validatePassword }
                ,
              ]}
            >
              <Input.Password
                iconRender={(visible) =>
                  visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />
                }
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
