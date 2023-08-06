import React, { useEffect, useState } from "react";
import { withRouter } from "react-router-dom";
import { Button, Switch, Upload, Avatar, Form, Select, Input } from "antd";
import { useTranslation } from "react-i18next";
import { ACCOUNT_TYPE, getRegions, getSDGs } from "../utils/consts";
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
}) {
  const { t, i18n } = useTranslation();
  const [image, setImage] = useState(null);
  const [changedImage, setChangedImage] = useState(false);
  const [edited, setEdited] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    if (profileData) {
      form.setFieldsValue(profileData);
      form.setFieldValue("video", profileData.video?.url);
      setImage(profileData.image);
    }
  }, [profileData, form]);

  const onFinish = async (values) => {
    let newData = values;
    newData.email = email;
    newData.role = ACCOUNT_TYPE.PARTNER;
    newData.preferred_language = i18n.language;
    newData.image = image;
    newData.changedImage = changedImage;
    newData.edited = edited;
    onSubmit(newData);
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
        <ImgCrop rotate aspect={5 / 3}>
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
      </Form.Item>
      <Form.Item
        label={t("partnerProfile.organizationName")}
        name="organization"
        required
      >
        <Input />
      </Form.Item>
      {newProfile ? (
        <div className={styles.formGroup}>
          <Form.Item
            label={t("common.password")}
            name="password"
            hasFeedback
            required
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
        className={styles.formGroupItem}
      >
        <Input />
      </Form.Item>
      <Form.Item
        label={t("partnerProfile.contactFullName")}
        name="person_name"
        required
      >
        <Input />
      </Form.Item>
      <Form.Item
        label={t("partnerProfile.regionsWork")}
        name="regions"
        required
      >
        <Select mode="multiple" options={getRegions(t)} />
      </Form.Item>
      <Form.Item label={t("partnerProfile.briefIntro")} name="intro">
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

      <Form.Item label={t("partnerProfile.developmentGoals")} name="sdgs">
        <Select mode="multiple" options={getSDGs(t)} />
      </Form.Item>
      <Form.Item label={t("partnerProfile.projectNames")} name="intro">
        <Input.TextArea rows={3} />
      </Form.Item>
      <div className={styles.formGroup}>
        <Form.Item
          label={t("partnerProfile.collaborationGrants")}
          name="open_grants"
          required
          className={styles.formGroupItem}
        >
          <Switch />
        </Form.Item>
        <Form.Item
          label={t("partnerProfile.collaborationProjects")}
          name="open_projects"
          required
          className={styles.formGroupItem}
        >
          <Switch />
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
