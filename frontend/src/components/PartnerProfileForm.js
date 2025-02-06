import React, { useEffect, useState } from "react";
import { withRouter } from "react-router-dom";
import { Button, Upload, Avatar, Form, Select, Input, Radio } from "antd";
import { useTranslation } from "react-i18next";
import {
  ACCOUNT_TYPE,
  getRegions,
  getSDGs,
  TIMEZONE_OPTIONS,
} from "../utils/consts";
import { urlRegex } from "../utils/misc";
import ImgCrop from "antd-img-crop";
import { UserOutlined, EditFilled } from "@ant-design/icons";
import { css } from "@emotion/css";

const styles = {
  formGroup: css`
    display: flex;
    flex-direction: row;
    gap: 1em;
    width: 100%;

    @media (max-width: 768px) {
      flex-direction: column;
      gap: 0;
    }
  `,
  formGroupItem: css`
    flex: 1;
  `,
};

function PartnerProfileForm({
  email,
  newProfile,
  loading,
  onSubmit,
  profileData,
  resetFields,
  hub_user,
}) {
  const { t, i18n } = useTranslation();
  const [image, setImage] = useState(null);
  const [changedImage, setChangedImage] = useState(false);
  const [edited, setEdited] = useState(false);
  const [finishFlag, setFinishFlag] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    if (profileData) {
      form.setFieldsValue(profileData);
      form.setFieldValue("video", profileData.video?.url);
      setImage(profileData.image);
    }
  }, [profileData, form, resetFields]);

  const onFinish = async (values) => {
    setFinishFlag(true);
    let newData = values;
    if (email) {
      newData.email = email;
    }
    newData.role = ACCOUNT_TYPE.PARTNER;
    newData.preferred_language = i18n.language;
    newData.image = image;
    newData.changedImage = changedImage;
    newData.edited = edited;
    if (hub_user) {
      newData.hub_id = hub_user._id.$oid;
    }
    onSubmit(newData);
    setChangedImage(false);
    setEdited(false);
  };

  return (
    <Form
      form={form}
      onFinish={onFinish}
      layout="vertical"
      style={{ width: "100%", marginTop: "1em" }}
      onValuesChange={() => setEdited(true)}
    >
      <Form.Item>
        <ImgCrop rotate aspect={1} minZoom={0.2}>
          <Upload
            onChange={async (file) => {
              setImage(file.file.originFileObj);
              setChangedImage(true);
              setEdited(true);
            }}
            accept=".png,.jpg,.jpeg"
            showUploadList={false}
          >
            <Avatar
              size={120}
              icon={<UserOutlined />}
              src={
                changedImage
                  ? image && URL.createObjectURL(image)
                  : image && image.url
              }
            />
            <Button
              shape="circle"
              icon={<EditFilled />}
              className={css`
                position: absolute;
                top: 0;
                left: 0;
              `}
            />
          </Upload>
        </ImgCrop>
        {!image && finishFlag && (
          <div
            class="ant-form-item-explain ant-form-item-explain-connected css-dev-only-do-not-override-1klw9xr"
            role="alert"
          >
            <div class="ant-form-item-explain-error">
              {t("common.requiredAvatar")}
            </div>
          </div>
        )}
      </Form.Item>
      {hub_user && (
        <Form.Item
          label={"Email"}
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
          <Input />
        </Form.Item>
      )}
      <Form.Item
        label={t("partnerProfile.organizationName")}
        name="organization"
        rules={[
          {
            required: true,
            message: t("common.requiredFullName"),
          },
        ]}
      >
        <Input />
      </Form.Item>
      {newProfile ? (
        <div className={styles.formGroup}>
          <Form.Item
            label={t("common.password")}
            name="password"
            hasFeedback
            rules={[
              {
                required: true,
                message: t("common.requiredPassword"),
              },
            ]}
            className={styles.formGroupItem}
          >
            <Input.Password />
          </Form.Item>
          <Form.Item
            label={t("commonProfile.confirmPassword")}
            name="confirmPassword"
            dependencies={["password"]}
            hasFeedback
            required
            rules={[
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue("password") === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(
                    new Error(t("commonProfile.passwordMismatch"))
                  );
                },
              }),
            ]}
            className={styles.formGroupItem}
          >
            <Input.Password />
          </Form.Item>
        </div>
      ) : null}
      <Form.Item
        label={t("partnerProfile.location")}
        name="location"
        rules={[
          {
            required: true,
            message: t("common.requiredKnowledgeLocation"),
          },
        ]}
        className={styles.formGroupItem}
      >
        <Input />
      </Form.Item>
      <Form.Item
        label={t("partnerProfile.contactFullName")}
        name="person_name"
        rules={[
          {
            required: true,
            message: t("common.requiredFullName"),
          },
        ]}
      >
        <Input />
      </Form.Item>
      <Form.Item
        label={t("partnerProfile.regionsWork")}
        name="regions"
        rules={[
          {
            required: true,
            message: t("common.requiredRegion"),
          },
        ]}
      >
        <Select mode="multiple" options={getRegions(t)} />
      </Form.Item>
      <Form.Item
        label={t("partnerProfile.briefIntro")}
        name="intro"
        rules={[
          {
            required: true,
            message: t("common.requiredBriefIntro"),
          },
        ]}
      >
        <Input.TextArea rows={3} />
      </Form.Item>
      <div className={styles.formGroup}>
        <Form.Item
          className={styles.formGroupItem}
          label={t("commonProfile.website")}
          name="website"
          rules={[
            {
              pattern: new RegExp(urlRegex),
              message: t("common.invalidUrl"),
            },
          ]}
        >
          <Input />
        </Form.Item>
        <Form.Item
          className={styles.formGroupItem}
          label={t("commonProfile.linkedin")}
          name="linkedin"
          rules={[
            {
              pattern: new RegExp(urlRegex),
              message: t("common.invalidUrl"),
            },
          ]}
        >
          <Input />
        </Form.Item>
      </div>
      <Form.Item
        label={t("common.timezone")}
        name="timezone"
        rules={[
          {
            required: true,
            message: t("common.requiredTimezone"),
          },
        ]}
        className={styles.formGroupItem}
      >
        <Select options={[...TIMEZONE_OPTIONS]} />
      </Form.Item>
      <Form.Item
        label={t("partnerProfile.developmentGoals")}
        name="sdgs"
        rules={[
          {
            required: true,
            message: t("common.requiredDevelopmentGoals"),
          },
        ]}
      >
        <Select mode="multiple" options={getSDGs(t)} />
      </Form.Item>
      <Form.Item
        label={
          hub_user && hub_user.url === "GSRFoundation"
            ? t("partnerProfile.projectNames_GSR")
            : t("partnerProfile.projectNames")
        }
        name="topics"
      >
        <Input.TextArea rows={3} />
      </Form.Item>
      {hub_user && hub_user.url === "GSRFoundation" && (
        <Form.Item label={t("partnerProfile.success_GSR")} name="success">
          <Input.TextArea rows={3} />
        </Form.Item>
      )}
      <div className={styles.formGroup}>
        <Form.Item
          label={t("partnerProfile.collaborationGrants")}
          name="open_grants"
          rules={[
            {
              required: true,
              message: t("common.requiredCheckbox"),
            },
          ]}
          className={styles.formGroupItem}
        >
          <Radio.Group>
            <Radio value={true}>{t("common.yes")}</Radio>
            <Radio value={false}>{t("common.no")}</Radio>
          </Radio.Group>
        </Form.Item>
        <Form.Item
          label={t("partnerProfile.collaborationProjects")}
          name="open_projects"
          rules={[
            {
              required: true,
              message: t("common.requiredCheckbox"),
            },
          ]}
          className={styles.formGroupItem}
        >
          <Radio.Group>
            <Radio value={true}>{t("common.yes")}</Radio>
            <Radio value={false}>{t("common.no")}</Radio>
          </Radio.Group>
        </Form.Item>
      </div>
      <Form.Item>
        <Button type="primary" htmlType="submit" block loading={loading}>
          {t("common.save")}
        </Button>
      </Form.Item>
    </Form>
  );
}

export default withRouter(PartnerProfileForm);
