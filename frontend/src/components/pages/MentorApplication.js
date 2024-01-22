import React, { useState } from "react";
import { Button, Form, Input, Radio, Typography, Select } from "antd";
import { useTranslation } from "react-i18next";
import { createApplication } from "utils/api";
import { phoneRegex, validatePhoneNumber } from "utils/misc";
import { useSelector } from "react-redux";

const { Paragraph } = Typography;

// constant declarations
const { TextArea } = Input;
function MentorApplication({ email, role, onSubmitFailure, onSubmitSuccess }) {
  const { t } = useTranslation();
  const [loading, setloading] = useState(false);
  const options = useSelector((state) => state.options);

  const onFinish = async (values) => {
    setloading(true);
    const data = {
      email,
      name: `${values.firstName} ${values.lastName}`,
      cell_number: values.phoneNumber,
      hear_about_us: values.hearAboutUs,
      // offer_donation: values.canDonate,
      employer_name: values.employerName,
      companyTime: values.jobDuration,
      role_description: values.jobDescription,
      immigrant_status: values.immigrationStatus,
      languages: values.languageBackground,
      specialistTime: values.commitDuration,
      referral: values.referral,
      knowledge_location: values.knowledgeLocation,
      isColorPerson: values.isPersonOfColor,
      isMarginalized: values.isMarginalized,
      isFamilyNative: values.communityStatus,
      isEconomically: values.economicBackground,
      identify: values.genderIdentification,
      pastLiveLocation: values.previousLocations,
      date_submitted: new Date(),
      specializations: values.specializations,
      role,
    };
    const res = await createApplication(data);
    setloading(false);
    if (res) {
      onSubmitSuccess();
    } else {
      onSubmitFailure();
    }
  };

  return (
    <div>
      <Form onFinish={onFinish} layout="vertical" style={{ width: "100%" }}>
        <Form.Item>
          <Typography>
            <Paragraph> {t("mentorApplication.introduction")}</Paragraph>
            <Paragraph> {t("mentorApplication.filloutPrompt")}</Paragraph>
          </Typography>
        </Form.Item>
        <Form.Item
          label={t("common.firstName")}
          name="firstName"
          rules={[
            {
              required: true,
            },
          ]}
        >
          <Input placeholder={t("common.firstName")} />
        </Form.Item>
        <Form.Item
          label={t("common.lastName")}
          name="lastName"
          rules={[
            {
              required: true,
            },
          ]}
        >
          <Input placeholder={t("common.lastName")} />
        </Form.Item>
        <Form.Item
          label={t("common.phoneNumber")}
          name="phoneNumber"
          required
          rules={[
            {
              pattern: new RegExp(phoneRegex),
              message: t("profile.validatePhone"),
            },
          ]}
        >
          <Input type="tel" placeholder={t("common.phoneNumber")} />
        </Form.Item>
        <Form.Item
          label={t("mentorApplication.hearAboutUs")}
          name="hearAboutUs"
          rules={[
            {
              required: true,
            },
          ]}
        >
          <Input placeholder={t("mentorApplication.hearAboutUs")} />
        </Form.Item>
        <Form.Item
          label={t("mentorApplication.knowledgeLocation")}
          name="knowledgeLocation"
          rules={[
            {
              required: true,
            },
          ]}
        >
          <TextArea
            rows={3}
            placeholder={t("mentorApplication.knowledgeLocation")}
          />
        </Form.Item>
        <Form.Item
          label={t("mentorApplication.previousLocations")}
          name="previousLocations"
          rules={[
            {
              required: true,
            },
          ]}
        >
          <TextArea
            rows={3}
            placeholder={t("mentorApplication.previousLocations")}
          />
        </Form.Item>
        <Form.Item
          label={t("mentorApplication.employerName")}
          name="employerName"
          rules={[
            {
              required: true,
            },
          ]}
        >
          <Input placeholder={t("mentorApplication.employerName")} />
        </Form.Item>
        <Form.Item
          label={t("mentorApplication.jobDescription")}
          name="jobDescription"
          rules={[
            {
              required: true,
            },
          ]}
        >
          <Input placeholder={t("mentorApplication.jobDescription")} />
        </Form.Item>
        <Form.Item
          label={t("mentorApplication.jobDuration")}
          name="jobDuration"
          rules={[
            {
              required: true,
            },
          ]}
        >
          <Select
            options={[
              {
                value: "Less than one year",
                label: t("mentorApplication.duration1"),
              },
              {
                value: "1-4 years",
                label: t("mentorApplication.duration2"),
              },
              {
                value: "5-10 years",
                label: t("mentorApplication.duration3"),
              },
              {
                value: "10-20 years",
                label: t("mentorApplication.duration4"),
              },
              {
                value: "21+ Years",
                label: t("mentorApplication.duration5"),
              },
            ]}
          />
        </Form.Item>
        <Form.Item
          label={t("mentorApplication.commitDuration")}
          name="commitDuration"
          rules={[
            {
              required: true,
            },
          ]}
        >
          <Select
            options={[
              {
                value: "One year with us",
                label: t("mentorApplication.commitDuration1"),
              },
              {
                value: "Two years with us",
                label: t("mentorApplication.commitDuration2"),
              },
              {
                value: "For as long as you'll have me!",
                label: t("mentorApplication.commitDuration3"),
              },
            ]}
          />
        </Form.Item>
        <Form.Item
          label={t("mentorApplication.immigrationStatus")}
          name="immigrationStatus"
          rules={[
            {
              required: true,
            },
          ]}
        >
          <Radio.Group>
            <Radio value={true}>{t("common.yes")}</Radio>
            <Radio value={false}>{t("common.no")}</Radio>
          </Radio.Group>
        </Form.Item>
        <Form.Item
          label={t("mentorApplication.communityStatus")}
          name="communityStatus"
          rules={[
            {
              required: true,
            },
          ]}
        >
          <Radio.Group>
            <Radio value={true}>{t("common.yes")}</Radio>
            <Radio value={false}>{t("common.no")}</Radio>
          </Radio.Group>
        </Form.Item>
        <Form.Item
          label={t("mentorApplication.economicBackground")}
          name="economicBackground"
          rules={[
            {
              required: true,
            },
          ]}
        >
          <Radio.Group>
            <Radio value={true}>{t("common.yes")}</Radio>
            <Radio value={false}>{t("common.no")}</Radio>
          </Radio.Group>
        </Form.Item>
        <Form.Item
          label={t("mentorApplication.isPersonOfColor")}
          name="isPersonOfColor"
          rules={[
            {
              required: true,
            },
          ]}
        >
          <Radio.Group>
            <Radio value={true}>{t("common.yes")}</Radio>
            <Radio value={false}>{t("common.no")}</Radio>
          </Radio.Group>
        </Form.Item>
        <Form.Item
          label={t("commonApplication.genderIdentification")}
          name="genderIdentification"
          rules={[
            {
              required: true,
            },
          ]}
        >
          <Select
            options={[
              {
                label: t("commonApplication.man"),
                value: "man",
              },
              {
                label: t("commonApplication.woman"),
                value: "woman",
              },
              {
                label: t("commonApplication.lgbtq"),
                value: "LGTBQ+",
              },
              {
                label: t("commonApplication.other"),
                value: "other",
              },
            ]}
          />
        </Form.Item>
        <Form.Item
          label={t("mentorApplication.isMarginalized")}
          name="isMarginalized"
          rules={[
            {
              required: true,
            },
          ]}
        >
          <Radio.Group>
            <Radio value={true}>{t("common.yes")}</Radio>
            <Radio value={false}>{t("common.no")}</Radio>
          </Radio.Group>
        </Form.Item>
        <Form.Item
          label={t("mentorApplication.languageBackground")}
          name="languageBackground"
          rules={[
            {
              required: true,
            },
          ]}
        >
          <Input placeholder={t("mentorApplication.languageBackground")} />
        </Form.Item>
        <Form.Item
          label={t("mentorApplication.referral")}
          name="referral"
          rules={[
            {
              required: true,
            },
          ]}
        >
          <Input placeholder={t("mentorApplication.referral")} />
        </Form.Item>
        <Form.Item
          label={t("mentorProfile.specializations")}
          name="specializations"
          rules={[
            {
              required: true,
            },
          ]}
        >
          <Select
            options={options.specializations}
            mode="tags"
            placeholder={t("common.pleaseSelect")}
            tokenSeparators={[","]}
          />
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit" block loading={loading}>
            {t("common.submit")}
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
}
export default MentorApplication;
