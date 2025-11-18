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
  Switch,
  DatePicker,
} from "antd";
import { useSelector } from "react-redux";
import {
  ACCOUNT_TYPE,
  MENTEE_DEFAULT_VIDEO_NAME,
  getAgeRanges,
  TIMEZONE_OPTIONS,
} from "utils/consts";
import moment from "moment";
import ImgCrop from "antd-img-crop";
import { UserOutlined, EditFilled } from "@ant-design/icons";
import { css } from "@emotion/css";
import { phoneRegex, urlRegex } from "utils/misc";
import { fetchPartners, getAllcountries } from "utils/api";

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
    min-width: 0; // Prevents flex items from overflowing

    @media (max-width: 768px) {
      width: 100%;
    }
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
  n50_flag,
}) {
  const { t, i18n } = useTranslation();
  const options = useSelector((state) => state.options);
  const [image, setImage] = useState(null);
  const [changedImage, setChangedImage] = useState(false);
  const [edited, setEdited] = useState(false);
  const [form] = Form.useForm();
  const [partnerOptions, setPartnerOptions] = useState([]);
  const [countryOptions, setCountryOptions] = useState([]);
  const [flag, setFlag] = useState(false);
  const [finishFlag, setFinishFlag] = useState(false);
  var n50_user = localStorage.getItem("n50_user");


  const immigrantOptions = [
    {
      value: "I am a refugee",
      label: t("menteeApplication.immigrantOption1"),
    },
    {
      value:
        "I am an immigrant (I am newly arrived or my parents are newly arrived in the country I am in)",
      label: t("menteeApplication.immigrantOption2"),
    },
    {
      value: "I am black.",
      label: t("menteeApplication.immigrantOption3"),
    },
    {
      value: "I am Hispanic/Latino.",
      label: t("menteeApplication.immigrantOption4"),
    },
    {
      value: "I am of native/ aboriginal/indigenous origins.",
      label: t("menteeApplication.immigrantOption5"),
    },
    {
      value: "I identify as LGTBQ.",
      label: t("menteeApplication.immigrantOption6"),
    },
    {
      value: "I have economic hardship.",
      label: t("menteeApplication.immigrantOption7"),
    },
    {
      value: "I come from a country at war.",
      label: t("menteeApplication.immigrantOption8"),
    },
    {
      value:
        "In a crisis situation within my country due to my gender, race, religion, sexuality, political affiliation or something else.",
      label: t("menteeApplication.immigrantOption9"),
    },
    {
      value: "other",
      label: t("common.other"),
    },
  ];

  const workOptions = [
    {
      value: "I work part-time.",
      label: t("menteeApplication.workOption1"),
    },
    {
      value: "I work full-time.",
      label: t("menteeApplication.workOption2"),
    },
    {
      value: "I attend technical school.",
      label: t("menteeApplication.workOption3"),
    },
    {
      value: "I am a college/university student attaining my first degree.",
      label: t("menteeApplication.workOption4"),
    },
    {
      value:
        "I am a college/university students attaining my second or third degree.",
      label: t("menteeApplication.workOption5"),
    },
    {
      value: "other",
      label: t("common.other"),
    },
  ];

  useEffect(() => {
    if (profileData) {
      form.setFieldsValue(profileData);
      form.setFieldValue("video", profileData.video?.url);
      if (profileData.organization == 0) {
        form.setFieldValue("organization", null);
      }
      setImage(profileData.image);
      if (profileData.birthday) {
        form.setFieldValue("birthday", moment(profileData.birthday.$date));
      }
    }
    if (applicationData) {
      form.setFieldValue(
        "organization",
        applicationData.partner ? applicationData.partner : null
      );
      form.setFieldValue("name", applicationData.name);
      form.setFieldValue("location", applicationData.Country);
      form.setFieldValue("gender", applicationData.identify);
      form.setFieldValue("immigrant_status", applicationData.immigrant_status);
      form.setFieldValue("workstate", applicationData.workstate);
      if (applicationData.language) {
        if (typeof applicationData.language === "string") {
          form.setFieldValue("languages", [applicationData.language]);
        } else {
          form.setFieldValue("languages", applicationData.language);
        }
      }
      form.setFieldValue("specializations", applicationData.topics);
    }
  }, [profileData, form, resetFields, applicationData]);

  useEffect(() => {
    async function getPartners() {
      const partenr_data = await fetchPartners(undefined, null);
      if (!(partnerOptions.length > 0)) {
        partenr_data.map((item) => {
          partnerOptions.push({
            value: item._id.$oid,
            label: item.organization,
          });
          return true;
        });
        partnerOptions.push({
          value: null,
          label: t("commonApplication.no-affiliation"),
        });
        setPartnerOptions(partnerOptions);
        setFlag(!flag);
      }
    }

    async function getAllCountries() {
      const all_countries = await getAllcountries();
      var temp_countires = [];
      if (all_countries && all_countries.countries) {
        // Extract country names
        const countryNames = all_countries.countries.map(
          (country) => country.country_name
        );
        // Sort country names in ascending order
        const sortedCountryNames = countryNames.sort();
        sortedCountryNames.map((country_name) => {
          temp_countires.push({
            label: country_name,
            value: country_name,
          });
        });
      }
      setCountryOptions(temp_countires);
    }
    getAllCountries();
    getPartners();
  }, []);

  const onFinish = async (values) => {
    setFinishFlag(true);
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
    onSubmit(newData);
  };

  function getAgeRange(birthday) {
    let res = "";
    if (birthday) {
      birthday = birthday.format("YYYY");
      let age = new Date().getFullYear() - birthday;
      if (age >= 18 && age <= 22) {
        res = "18-22";
      } else if (age >= 23 && age <= 25) {
        res = "23-25";
      } else if (age >= 26 && age <= 30) {
        res = "26-30";
      } else if (age >= 31 && age < 40) {
        res = "30s";
      } else if (age >= 41 && age < 50) {
        res = "40s";
      } else if (age >= 51 && age < 60) {
        res = "50s";
      } else if (age >= 61 && age < 70) {
        res = "60s";
      } else if (age >= 70) {
        res = "70s";
      }
    }
    return res;
  }

  const changeBirthday = () => {
    let birthday = form.getFieldValue("birthday");
    let age_range = getAgeRange(birthday);
    form.setFieldValue("age", age_range);
  };

  const validateBirthday = (_, value) => {
    if (!value) {
      return Promise.resolve();
    }
    // Calculate age from birth date
    const birthYear = value.format("YYYY");
    const age = new Date().getFullYear() - birthYear;
    if (age < 18) {
      return Promise.reject(new Error(t("common.mustBeAtLeast18")));
    }
    return Promise.resolve();
  };

  return (
    <Form
      form={form}
      onFinish={onFinish}
      layout="vertical"
      style={{ width: "100%", marginTop: "1em" }}
      onValuesChange={() => setEdited(true)}
    >
      <Form.Item
        className={css`
          display: flex;
          justify-content: center;
        `}
      >
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
            <div
              className={css`
                position: relative;
                display: inline-block;
              `}
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
            </div>
          </Upload>
        </ImgCrop>
      </Form.Item>
      {!image && finishFlag && (
        <div
          className={css`
            text-align: center;
            color: #ff4d4f;
            margin-top: -1em;
            margin-bottom: 1em;
          `}
        >
          {t("common.requiredAvatar")}
        </div>
      )}
      <Form.Item label={"Email"}>
        <Input value={email} readOnly />
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
        <Input readOnly={profileData ? false : true} />
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

      <div className={styles.formGroup}>
        <Form.Item
          name="birthday"
          label={t("common.birthday")}
          rules={[
            {
              required: true,
              message: t("common.requiredBirthday"),
            },
            {
              validator: validateBirthday,
            },
          ]}
          className={styles.formGroupItem}
          extra={t("common.birthdayHelp")}
        >
        <DatePicker
          placeholder={t("common.birthday")}
          onChange={() => changeBirthday()}
          style={{ width: '100%' }}
        />
        </Form.Item>
        <Form.Item
          noStyle
          shouldUpdate={(prevValues, currentValues) => prevValues.birthday !== currentValues.birthday}
        >
          {({ getFieldValue }) => {
            const hasBirthday = getFieldValue("birthday");
            return (
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
                extra={hasBirthday ? t("common.ageAutoCalculated") : t("common.ageValidRange")}
              >
                <Select
                  options={getAgeRanges(t)}
                  disabled={hasBirthday ? true : false}
                  placeholder={hasBirthday ? t("common.autoCalculated") : t("common.pleaseSelect")}
                />
              </Form.Item>
            );
          }}
        </Form.Item>
      </div>

      <Form.Item label={t("commonProfile.biography")} name="biography">
        <Input.TextArea rows={3} />
      </Form.Item>
      <div className={styles.formGroup}>
        <Form.Item
          label={t("menteeApplication.countryPlaceholder")}
          name="location"
          className={styles.formGroupItem}
          style={{ display: profileData ? "block" : "none" }}
        >
          <Select showSearch options={countryOptions} mode="single" />
        </Form.Item>
        <Form.Item
          label={t("commonApplication.genderIdentification")}
          name="gender"
          rules={[
            {
              required: true,
              message: t("common.requiredGender"),
            },
          ]}
          className={styles.formGroupItem}
          style={{ display: profileData ? "block" : "none" }}
        >
          <Input />
        </Form.Item>
      </div>
      <div className={styles.formGroup}>
        <Form.Item
          label={t("menteeApplication.preferredLanguage")}
          name="languages"
          rules={[
            {
              required: true,
              message: t("common.requiredLanguage"),
            },
          ]}
          className={styles.formGroupItem}
          style={{ display: profileData ? "block" : "none" }}
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
              required: false,
              message: t("common.requiredOrganizationAffiliation"),
            },
          ]}
          className={styles.formGroupItem}
        >
          <Select
            options={[...partnerOptions]}
            disabled={n50_flag || n50_user}
          />
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
        label={t("menteeProfile.areasOfInterest")}
        name="specializations"
        style={{ display: profileData ? "block" : "none" }}
      >
        <Select
          options={options.specializations}
          mode="tags"
          tokenSeparators={[","]}
          placeholder={t("common.pleaseSelect")}
        />
      </Form.Item>
      <Form.Item
        label={t("menteeApplication.immigrationStatus")}
        name="immigrant_status"
        rules={[
          {
            required: true,
            message: t("common.requiredImmigrationStatus"),
          },
        ]}
        style={{ display: profileData ? "block" : "none" }}
      >
        <Select options={immigrantOptions} mode="multiple" />
      </Form.Item>
      <Form.Item
        label={t("menteeApplication.workOptions")}
        name="workstate"
        rules={[
          {
            required: true,
            message: t("common.requiredWorkOptions"),
          },
        ]}
        style={{ display: profileData ? "block" : "none" }}
      >
        <Select mode="multiple" options={workOptions} />
      </Form.Item>
      <Typography.Title level={4}>
        {t("commonProfile.education")}
      </Typography.Title>
      <div className={styles.formGroup}>
        <Form.Item
          label={t("menteeProfile.is_student")}
          name="isStudent"
          className={styles.formGroupItem}
          rules={[
            {
              required: true,
              message: t("common.requiredReferral"),
            },
          ]}
        >
          <Select
            options={[
              {
                label: t("common.yes"),
                value: "Yes",
              },
              {
                label: t("common.no"),
                value: "No",
              },
            ]}
            placeholder={t("common.pleaseSelect")}
          />
        </Form.Item>
        <Form.Item
          label={t("menteeProfile.edu_level")}
          name="education_level"
          rules={[
            {
              required: true,
              message: t("common.requiredReferral"),
            },
          ]}
          className={styles.formGroupItem}
        >
          <Select
            options={[
              {
                label: t("common.elementary"),
                value: "elementary",
              },
              {
                label: t("common.high"),
                value: "high",
              },
              {
                label: t("common.technical"),
                value: "technical",
              },
              {
                label: t("common.bachelor"),
                value: "bachelor",
              },
              {
                label: t("common.masters"),
                value: "masters",
              },
              {
                label: t("common.doctorate"),
                value: "doctorate",
              },
            ]}
            placeholder={t("common.pleaseSelect")}
          />
        </Form.Item>
      </div>
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
