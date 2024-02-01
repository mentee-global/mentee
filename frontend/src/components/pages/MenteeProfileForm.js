import React, { useEffect, useState } from "react";
import { withRouter } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Button,
  Upload,
  Avatar,
  Typography,
  Form,
  Input,
  Select,
  Divider,
  Switch,
} from "antd";
import { useSelector } from "react-redux";
import { DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import {
  ACCOUNT_TYPE,
  MENTEE_DEFAULT_VIDEO_NAME,
  getAgeRanges,
} from "utils/consts";
import moment from "moment";
import ImgCrop from "antd-img-crop";
import { UserOutlined, EditFilled } from "@ant-design/icons";
import { css } from "@emotion/css";
import { phoneRegex, urlRegex } from "utils/misc";

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

function MenteeProfileForm({
  email,
  newProfile,
  loading,
  onSubmit,
  profileData,
  resetFields,
  applicationData,
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
  }, [profileData, form, resetFields]);

  const educationSubForm = () => (
    <Form.List
      name="education"
      initialValue={[
        {
          school: "",
          graduation_year: "",
          majors: undefined,
          education_level: "",
        },
      ]}
    >
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
                  rules={[
                    {
                      required: true,
                      message: t("common.requiredSchool"),
                    },
                  ]}
                >
                  <Input />
                </Form.Item>
                <Form.Item
                  className={styles.formGroupItem}
                  {...restField}
                  name={[name, "graduation_year"]}
                  label={t("commonProfile.graduationYear")}
                  rules={[
                    {
                      required: true,
                      message: t("common.requiredGraduationYear"),
                    },
                  ]}
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
                  rules={[
                    {
                      required: true,
                      message: t("common.requiredMajors"),
                    },
                  ]}
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
                  rules={[
                    {
                      required: true,
                      message: t("common.requiredDegree"),
                    },
                  ]}
                >
                  <Input placeholder={t("commonProfile.degreeExample")} />
                </Form.Item>
              </div>
              {key !== 0 && (
                <DeleteOutlined
                  onClick={() => remove(name)}
                  className={css`
                    float: right;
                    color: #ff4d4f;
                  `}
                />
              )}
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
    let newData = values;
    newData.email = email;
    newData.role = ACCOUNT_TYPE.MENTEE;
    newData.video =
      values.video && values.video !== ""
        ? {
            title: MENTEE_DEFAULT_VIDEO_NAME,
            url: values.video,
            tag: MENTEE_DEFAULT_VIDEO_NAME,
            date_uploaded: moment().format(),
          }
        : null;
    newData.preferred_language = i18n.language;
    newData.image = image;
    newData.changedImage = changedImage;
    newData.edited = edited;
    if (applicationData && applicationData.partner) {
      newData.partner = applicationData.partner;
    }
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
        <ImgCrop rotate aspect={1}>
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
        label={t("commonProfile.fullName")}
        name="name"
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
      <Form.Item label={t("commonProfile.biography")} name="biography">
        <Input.TextArea rows={3} />
      </Form.Item>
      <div className={styles.formGroup}>
        <Form.Item
          label={t("commonProfile.location")}
          name="location"
          className={styles.formGroupItem}
        >
          <Input />
        </Form.Item>
        <Form.Item
          label={t("menteeProfile.gender")}
          name="gender"
          rules={[
            {
              required: true,
              message: t("common.requiredGender"),
            },
          ]}
          className={styles.formGroupItem}
        >
          <Input />
        </Form.Item>
      </div>
      <div className={styles.formGroup}>
        <Form.Item
          label={t("menteeProfile.age")}
          name="age"
          rules={[
            {
              required: true,
              message: t("common.requiredAge"),
            },
          ]}
          className={styles.formGroupItem}
        >
          <Select options={getAgeRanges(t)} />
        </Form.Item>
        <Form.Item
          label={t("commonProfile.languages")}
          name="languages"
          rules={[
            {
              required: true,
              message: t("common.requiredLanguage"),
            },
          ]}
          className={styles.formGroupItem}
        >
          <Select
            options={options.languages}
            mode="multiple"
            placeholder={t("commonProfile.languagesExample")}
          />
        </Form.Item>
      </div>
      <div className={styles.formGroup}>
        <Form.Item
          label={t("commonProfile.phone")}
          name="phone_number"
          rules={[
            {
              pattern: new RegExp(phoneRegex),
              message: t("profile.validatePhone"),
            },
          ]}
          className={styles.formGroupItem}
        >
          <Input />
        </Form.Item>
        <Form.Item
          label={t("menteeProfile.organizationAffiliation")}
          name="organization"
          rules={[
            {
              required: true,
              message: t("common.requiredOrganizationAffiliation"),
            },
          ]}
          className={styles.formGroupItem}
        >
          <Input />
        </Form.Item>
      </div>
      <Form.Item
        label={t("menteeProfile.areasOfInterest")}
        name="specializations"
      >
        <Select
          options={options.specializations}
          mode="tags"
          tokenSeparators={[","]}
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
      <Typography.Title level={4}>
        {t("menteeProfile.accountPrivacy")}
      </Typography.Title>
      <Typography.Paragraph>
        {t("menteeProfile.privateAccountInfo")}
      </Typography.Paragraph>
      <Form.Item name="is_private" valuePropName="checked" required>
        <Switch>{t("menteeProfile.privateAccount")}</Switch>
      </Form.Item>
      <Form.Item>
        <Button
          id="submit"
          type="primary"
          htmlType="submit"
          block
          loading={loading}
        >
          {t("common.save")}
        </Button>
      </Form.Item>
    </Form>
  );
}

export default withRouter(MenteeProfileForm);
