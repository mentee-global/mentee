import { ArrowLeftOutlined, UserOutlined } from "@ant-design/icons";
import { css } from "@emotion/css";
import {
  Button,
  Form,
  Input,
  Select,
  Space,
  Steps,
  Typography,
  message,
} from "antd";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, withRouter } from "react-router-dom";
import { getApplicationStatus, checkStatusByEmail } from "utils/api";
import { ACCOUNT_TYPE, NEW_APPLICATION_STATUS } from "utils/consts";
import useQuery from "utils/hooks/useQuery";

const { Option } = Select;

function Apply({ history }) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [currentState, setCurrentState] = useState();
  const [hasApplied, setHasApplied] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();
  const [applicationData, setApplicationData] = useState(null);
  const query = useQuery();
  const [form] = Form.useForm();

  const stateItems = [
    {
      title: t("common.apply"),
      key: "apply",
      redirect: "/application-form",
    },
    {
      title: t("apply.training"),
      key: "training",
      redirect: "/application-training",
    },
    {
      title: t("apply.buildProfile"),
      key: "buildProfile",
      redirect: "/build-profile",
    },
  ];

  const stepNumeration = {
    apply: 0,
    training: 1,
    buildProfile: 2,
  };

  const onFinish = async ({ email, role }) => {
    // if currentState set then this is a confirm to redirect
    if (currentState !== undefined) {
      history.push({
        pathname: stateItems[currentState].redirect,
        state: { email, role, ignoreHomeLayout: true, applicationData },
      });
    }

    setLoading(true);
    email = email.toLowerCase();
    const { inFirebase, profileExists, isVerified } = await checkStatusByEmail(
      email,
      role
    ).catch((err) => {
      setLoading(false);
      messageApi.error({
        content: `${err}`,
        duration: 0,
        key: "error_msg",
        onClick: () => messageApi.destroy("error_msg"),
      });
    });

    if (inFirebase && profileExists) {
      // Redirect to login page
      messageApi.info({
        content: t("apply.message.haveAccount"),
        duration: 0,
        key: "haveAccount",
        onClick: () => messageApi.destroy("haveAccount"),
      });
      setTimeout(() => {
        history.push({
          pathname: "/login",
          state: { email, role },
        });
      }, 2000);
    } else if (
      (inFirebase && !profileExists) ||
      (role === ACCOUNT_TYPE.PARTNER && isVerified) ||
      (role !== ACCOUNT_TYPE.PARTNER && isVerified)
    ) {
      setCurrentState(stepNumeration.buildProfile);
    } else if (role === ACCOUNT_TYPE.PARTNER && !isVerified) {
      // Partner's email needs to be verified by admin first
      messageApi.error({
        content: t("apply.partnerVerify"),
        duration: 0,
        key: "partnerVerify",
        onClick: () => messageApi.destroy("partnerVerify"),
      });
    } else {
      const { state, application_data } = await getApplicationStatus(
        email,
        role
      );
      switch (state) {
        case NEW_APPLICATION_STATUS.PENDING:
          messageApi.info(t("apply.confirmation"));
          setHasApplied(true);
          setCurrentState(stepNumeration.apply);
          setApplicationData(application_data);
          break;
        case NEW_APPLICATION_STATUS.APPROVED:
          setCurrentState(stepNumeration.training);
          setApplicationData(application_data);
          break;
        case NEW_APPLICATION_STATUS.BUILDPROFILE:
          setCurrentState(stepNumeration.buildProfile);
          break;
        default:
          setCurrentState(stepNumeration.apply);
          setApplicationData(application_data);
          break;
      }
    }
    setLoading(false);
  };

  const onFinishFailed = (errorInfo) => {
    console.error("Failed:", errorInfo);
    messageApi.error({
      content: t("forgotPassword.error"),
      duration: 0,
      key: "forgotPassword",
      onClick: () => messageApi.destroy("forgotPassword"),
    });
  };

  return (
    <div
      className={css`
        display: flex;
        width: 100%;
        flex: 1;
        justify-content: center;
        flex-direction: column;

        @media (max-width: 991px) {
          flex: 0;
        }
      `}
    >
      {contextHolder}
      <Link to={"/"} id="back">
        <Space>
          <ArrowLeftOutlined />
          {t("common.back")}
        </Space>
      </Link>
      <Typography.Title level={2}>{t("common.apply")}</Typography.Title>
      <Form
        form={form}
        onFinish={onFinish}
        onFinishFailed={onFinishFailed}
        autoComplete="off"
        layout="vertical"
        style={{ width: "100%" }}
        size="large"
        onValuesChange={() => {
          setCurrentState(undefined);
          setHasApplied(false);
        }}
        initialValues={{
          email: query.get("email"),
          role: query.get("role") && parseInt(query.get("role")),
        }}
      >
        <Form.Item
          name="email"
          label={t("common.email")}
          rules={[
            {
              required: true,
              type: "email",
              message: t("loginErrors.emailError"),
            },
          ]}
        >
          <Input
            prefix={<UserOutlined />}
            autoFocus
            onChange={(e) => {
              form.setFieldsValue({ email: e.target.value.toLowerCase() });
            }}
          />
        </Form.Item>
        <Form.Item
          name="role"
          label={t("common.role")}
          rules={[
            {
              required: true,
              message: t("apply.error.role"),
            },
          ]}
        >
          <Select>
            <Option id="select_mentor" value={ACCOUNT_TYPE.MENTOR}>
              {t("common.mentor")}
            </Option>
            <Option id="select_mentee" value={ACCOUNT_TYPE.MENTEE}>
              {t("common.mentee")}
            </Option>
            <Option id="select_partner" value={ACCOUNT_TYPE.PARTNER}>
              {t("common.partner")}
            </Option>
          </Select>
        </Form.Item>
        {currentState !== undefined && (
          <Form.Item>
            <Steps
              current={currentState}
              responsive
              size="small"
              items={stateItems}
            />
          </Form.Item>
        )}
        <Form.Item>
          <Button
            type="primary"
            id="submit"
            htmlType="submit"
            style={{ width: "100%" }}
            loading={loading}
            disabled={hasApplied}
          >
            {currentState === undefined
              ? t("common.submit")
              : t("common.continue")}
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
}

export default withRouter(Apply);
