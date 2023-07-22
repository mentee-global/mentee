import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Button,
  Upload,
  Avatar,
  Form,
  Input,
  Select,
  Divider,
  Typography,
  Switch,
} from "antd";
import { useSelector } from "react-redux";
import { DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import { ACCOUNT_TYPE, MENTEE_DEFAULT_VIDEO_NAME } from "utils/consts";

import { urlRegex } from "utils/misc";
import moment from "moment";
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

function MentorProfileForm({
  newProfile,
  email,
  onSubmit,
  loading,
  profileData,
}) {
  const { t, i18n } = useTranslation();
  const options = useSelector((state) => state.options);
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

  const educationSubForm = () => (
    <Form.List name="education">
      {(fields, { add, remove }) => (
        <>
          {fields.map(({ key, name, ...restField }) => (
            <div
              key={key}
              className={css`
                margin-bottom: 2em;
              `}
            >
              <div className={styles.formGroup}>
                <Form.Item
                  className={styles.formGroupItem}
                  {...restField}
                  label={t("commonProfile.school")}
                  name={[name, "school"]}
                  required
                >
                  <Input />
                </Form.Item>
                <Form.Item
                  className={styles.formGroupItem}
                  {...restField}
                  name={[name, "graduation_year"]}
                  label={t("commonProfile.graduationYear")}
                  required
                >
                  <Input type="number" />
                </Form.Item>
              </div>
              <div className={styles.formGroup}>
                <Form.Item
                  {...restField}
                  className={styles.formGroupItem}
                  name={[name, "majors"]}
                  label={t("commonProfile.majors")}
                  required
                >
                  <Select
                    placeholder={t("commonProfile.majorsExamples")}
                    mode="tags"
                    allowClear
                    tokenSeparators={[","]}
                  />
                </Form.Item>
                <Form.Item
                  {...restField}
                  name={[name, "education_level"]}
                  className={styles.formGroupItem}
                  label={t("commonProfile.degree")}
                  required
                >
                  <Input placeholder={t("commonProfile.degreeExample")} />
                </Form.Item>
              </div>
              <DeleteOutlined
                onClick={() => remove(name)}
                className={css`
                  float: right;
                  color: #ff4d4f;
                `}
              />
              <Divider />
            </div>
          ))}
          <Form.Item>
            <Button
              type="dashed"
              onClick={() => add()}
              block
              icon={<PlusOutlined />}
            >
              {t("commonProfile.addMoreEducation")}
            </Button>
          </Form.Item>
        </>
      )}
    </Form.List>
  );

  const onFinish = async (values) => {
    let profileData = values;
    profileData.email = email;
    profileData.role = ACCOUNT_TYPE.MENTOR;
    profileData.video = values.video
      ? {
          title: MENTEE_DEFAULT_VIDEO_NAME,
          url: values.video,
          tag: MENTEE_DEFAULT_VIDEO_NAME,
          date_uploaded: moment().format(),
        }
      : undefined;
    if (!profileData.video) {
      delete profileData.video;
    }
    profileData.preferred_language = i18n.language;
    profileData.image = image;
    profileData.changedImage = changedImage;
    profileData.edited = edited;

    onSubmit(profileData);
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
      <div className={styles.formGroup}>
        <Form.Item
          label={t("commonProfile.fullName")}
          name="name"
          required
          className={styles.formGroupItem}
        >
          <Input />
        </Form.Item>
        <Form.Item
          label={t("mentorProfile.professionalTitle")}
          name="professional_title"
          required
          className={styles.formGroupItem}
        >
          <Input />
        </Form.Item>
      </div>
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
      <Form.Item required label={t("commonProfile.biography")} name="biography">
        <Input.TextArea rows={3} />
      </Form.Item>
      <div className={styles.formGroup}>
        <Form.Item
          label={t("mentorProfile.availableInPerson")}
          name="offers_in_person"
          required
          className={styles.formGroupItem}
          valuePropName="checked"
        >
          <Switch />
        </Form.Item>
        <Form.Item
          label={t("mentorProfile.availableGroupAppointments")}
          name="offers_group_appointments"
          required
          className={styles.formGroupItem}
          valuePropName="checked"
        >
          <Switch />
        </Form.Item>
      </div>
      <div className={styles.formGroup}>
        <Form.Item
          label={t("commonProfile.location")}
          name="location"
          className={styles.formGroupItem}
        >
          <Input />
        </Form.Item>
        <Form.Item
          label={t("commonProfile.website")}
          name="website"
          rules={[
            {
              pattern: new RegExp(urlRegex),
              message: t("common.invalidUrl"),
            },
          ]}
          className={styles.formGroupItem}
        >
          <Input addonBefore="URL" />
        </Form.Item>
      </div>
      <div className={styles.formGroup}>
        <Form.Item
          label={t("commonProfile.languages")}
          name="languages"
          required
          className={styles.formGroupItem}
        >
          <Select
            options={options.languages}
            mode="multiple"
            placeholder={t("commonProfile.languagesExample")}
          />
        </Form.Item>
        <Form.Item
          label={t("commonProfile.linkedin")}
          name="linkedin"
          rules={[
            {
              pattern: new RegExp(urlRegex),
              message: t("common.invalidUrl"),
            },
          ]}
          className={styles.formGroupItem}
        >
          <Input addonBefore="URL" />
        </Form.Item>
      </div>
      <Form.Item
        label={t("mentorProfile.specializations")}
        name="specializations"
        required
      >
        <Select
          options={options.specializations}
          mode="multiple"
          placeholder={t("common.pleaseSelect")}
        />
      </Form.Item>
      <Typography.Title level={4}>
        {t("commonProfile.education")}
      </Typography.Title>
      {educationSubForm()}
      <Typography.Title level={4}>
        {t("commonProfile.addVideos")}
      </Typography.Title>
      <Typography.Paragraph>
        {t("commonProfile.introductionVideo")}
      </Typography.Paragraph>
      <Form.Item
        label={t("commonProfile.pasteLink")}
        name="video"
        rules={[
          {
            pattern: new RegExp(urlRegex),
            message: t("common.invalidUrl"),
          },
        ]}
      >
        <Input addonBefore="URL" />
      </Form.Item>
      <Form.Item>
        <Button type="primary" htmlType="submit" block loading={loading}>
          {t("common.save")}
        </Button>
      </Form.Item>
    </Form>
  );
}

export default MentorProfileForm;
