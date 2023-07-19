import React, { useState } from "react";
import { Button, Form, Input, Radio, Typography } from "antd";
import { useTranslation, Trans } from "react-i18next";
import { createApplication } from "utils/api";
import { css } from "@emotion/css";

const { Title, Paragraph } = Typography;

// constant declarations
const { TextArea } = Input;
function MentorApplication(props) {
  const { t } = useTranslation();
  const [submitError, setSubmitError] = useState();
  // on change for radiio buttons
  const [offerDonation, setOfferDonation] = useState();
  const [immigrantStatus, setImmigrantStatus] = useState();

  // sets text fields
  const [firstName, setFirstName] = useState(null);
  const [lastName, setLastName] = useState(null);
  const [cell, setCell] = useState(null);
  const [hearAbout, setHearAbout] = useState(null);
  const [pastLiveLocation, setpastLiveLocation] = useState(null);
  const [title, setTitle] = useState(null);
  const [employer, setEmployer] = useState(null);
  const [knowledgeLocation, setknowledgeLocation] = useState(null);
  const [referral, setReferral] = useState(null);
  const [languages, setLanguages] = useState(null);
  const [isFamilyNative, setisFamilyNative] = useState(null);
  const [isEconomically, setisEconomically] = useState(null);
  const [isColorPerson, setisColorPerson] = useState(null);
  const [identify, setidentify] = useState(null);
  const [isMarginalized, setisMarginalized] = useState(null);
  const [showMissingFieldErrors, setShowMissingFieldErrors] = useState(false);
  const [companyTime, setCompanyTime] = useState(null);
  const [specialistTime, setspecialistTime] = useState(null);
  const onChange1 = (e) => setOfferDonation(e.target.value);
  const onChange3 = (e) => setImmigrantStatus(e.target.value);
  const onChange5 = (e) => setCompanyTime(e.target.value);
  const onChange4 = (e) => setspecialistTime(e.target.value);
  const isMissingError = (test) => false;

  const shouldShowErrors = () => (v) =>
    (!v || (typeof v === "object" && v.length === 0)) && showMissingFieldErrors;

  // creates steps layout

  const verifyRequiredFieldsAreFilled = () => {
    const requiredQuestions = [
      firstName,
      lastName,
      cell,
      hearAbout,
      pastLiveLocation,
      offerDonation,
      immigrantStatus,
      title,
      employer,
      knowledgeLocation,
      companyTime,
      referral,
      languages,
      isFamilyNative,
      isEconomically,
      isColorPerson,
      identify,
      isMarginalized,
    ];

    if (
      requiredQuestions.some(
        (x) => !x || (typeof x === "object" && x.length === 0)
      )
    ) {
      setShowMissingFieldErrors(true);
      return false;
    }

    if (showMissingFieldErrors) setShowMissingFieldErrors(false);

    return true;
  };

  function handleSubmit(event) {
    event.preventDefault();

    if (!verifyRequiredFieldsAreFilled()) return;
    if (props.headEmail === "") {
      setSubmitError(true);
      return;
    }

    async function submitApplication() {
      // onOk send the put request
      const data = {
        email: props.headEmail,
        name: firstName + " " + lastName,
        cell_number: cell,
        hear_about_us: hearAbout,
        offer_donation: offerDonation,
        employer_name: employer,
        companyTime: companyTime,
        role_description: title,
        immigrant_status: immigrantStatus === "Yes" ? true : false,
        languages: languages,
        specialistTime: specialistTime,
        referral: referral,
        knowledge_location: knowledgeLocation,
        isColorPerson: isColorPerson === "Yes" ? true : false,
        isMarginalized: isMarginalized === "Yes" ? true : false,
        isFamilyNative: isFamilyNative === "Yes" ? true : false,
        isEconomically: isEconomically === "Yes" ? true : false,
        identify: identify,
        pastLiveLocation: pastLiveLocation,
        date_submitted: new Date(),
        role: props.role,
      };

      const res = await createApplication(data);

      if (res) {
        props.submitHandler();
      } else {
        setSubmitError(true);
      }
    }

    submitApplication();
  }

  return (
    <div>
      <Form
        // onFinish={onFinish}
        // onFinishFailed={onFinishFailed}
        autoComplete="off"
        layout="vertical"
        style={{ width: "100%" }}
      >
        <Form.Item>
          <Typography
            className={css`
              margin-bottom: 0px;
            `}
          >
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
              message: t("common.inputPrompt"),
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
              requird: true,
              message: t("common.inputPrompt"),
            },
          ]}
        >
          <Input placeholder={t("common.lastName")} />
        </Form.Item>
        <div>{t("common.phoneNumber")} *</div>
        <Form.Item
          className="input-form"
          rules={[
            {
              required: true,
            },
          ]}
        >
          {isMissingError(cell) && (
            <p style={{ color: "red" }}>{t("common.inputPrompt")}</p>
          )}

          <Input
            type="number"
            placeholder={t("common.phoneNumber")}
            value={cell}
            onChange={(e) => setCell(e.target.value)}
          />
        </Form.Item>
        <div>{t("mentorApplication.hearAboutUs")} *</div>

        <Form.Item
          className="input-form"
          rules={[
            {
              required: true,
            },
          ]}
        >
          {isMissingError(hearAbout) && (
            <p style={{ color: "red" }}>{t("common.inputPrompt")}</p>
          )}
          <Input
            type="text"
            placeholder={t("mentorApplication.hearAboutUs")}
            value={hearAbout}
            onChange={(e) => setHearAbout(e.target.value)}
          />
        </Form.Item>
        <div>{t("mentorApplication.knowledgeLocation")} *</div>
        <Form.Item
          className="input-form"
          rules={[
            {
              required: true,
            },
          ]}
        >
          {isMissingError(knowledgeLocation) && (
            <p style={{ color: "red" }}>{t("common.inputPrompt")}</p>
          )}
          <Input
            type="text"
            placeholder={t("mentorApplication.knowledgeLocation")}
            value={knowledgeLocation}
            onChange={(e) => setknowledgeLocation(e.target.value)}
          />
        </Form.Item>
        <div>{t("mentorApplication.previousLocations")} *</div>

        <Form.Item
          className="input-form"
          rules={[
            {
              required: true,
            },
          ]}
        >
          {isMissingError(pastLiveLocation) && (
            <p style={{ color: "red" }}>{t("common.inputPrompt")}</p>
          )}
          <TextArea
            autoSize
            placeholder={t("mentorApplication.previousLocations")}
            style={{ overflow: "hidden" }}
            value={pastLiveLocation}
            onChange={(e) => setpastLiveLocation(e.target.value)}
          />
        </Form.Item>
        <div>{t("mentorApplication.employerName")} *</div>

        <Form.Item
          className="input-form"
          rules={[
            {
              required: true,
            },
          ]}
        >
          {isMissingError(employer) && (
            <p style={{ color: "red" }}>{t("common.inputPrompt")}</p>
          )}
          <Input
            type="text"
            placeholder={t("mentorApplication.employerName")}
            value={employer}
            onChange={(e) => setEmployer(e.target.value)}
          />
        </Form.Item>
        <div>{t("mentorApplication.jobDescription")} *</div>

        <Form.Item
          className="input-form"
          rules={[
            {
              required: true,
            },
          ]}
        >
          {isMissingError(title) && (
            <p style={{ color: "red" }}>{t("common.inputPrompt")}</p>
          )}
          <Input
            type="text"
            placeholder={t("mentorApplication.jobDescription")}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </Form.Item>
        <div>{t("mentorApplication.jobDuration")} *</div>
        <div className="input-form">
          <div className="time-options-answers">
            {isMissingError(companyTime) && (
              <p style={{ color: "red" }}>{t("common.selectPrompt")}</p>
            )}
            <Radio.Group onChange={onChange5} value={companyTime}>
              <Radio value={"Less than one year"}>
                {t("mentorApplication.duration1")}
              </Radio>
              <Radio value={"1-4 years"}>
                {t("mentorApplication.duration2")}
              </Radio>
              <Radio value={"5-10 years"}>
                {t("mentorApplication.duration3")}
              </Radio>
              <Radio value={"10-20 years"}>
                {t("mentorApplication.duration4")}
              </Radio>
              <Radio value={"21+ Years"}>
                {t("mentorApplication.duration5")}
              </Radio>
            </Radio.Group>
          </div>
        </div>
        <div>{t("mentorApplication.commitDuration")} *</div>
        <div className="input-form">
          {isMissingError(specialistTime) && (
            <p style={{ color: "red" }}>{t("common.selectPrompt")}</p>
          )}
          <Radio.Group onChange={onChange4} value={specialistTime}>
            <Radio value={"One year with us"}>
              {t("mentorApplication.commitDuration1")}
            </Radio>
            <Radio value={"Two years with us"}>
              {t("mentorApplication.commitDuration2")}
            </Radio>
            <Radio value={"For as long as you'll have me!"}>
              {t("mentorApplication.commitDuration3")}
            </Radio>
          </Radio.Group>
        </div>
        <div>{t("mentorApplication.immigrationStatus")} *</div>

        <div className="input-form">
          {isMissingError(immigrantStatus) && (
            <p style={{ color: "red" }}>{t("common.selectPrompt")}</p>
          )}
          <Radio.Group onChange={onChange3} value={immigrantStatus}>
            <Radio value={"Yes"}>{t("common.yes")}</Radio>
            <Radio value={"No"}>{t("common.no")}</Radio>
          </Radio.Group>
        </div>
        <div>{t("mentorApplication.communityStatus")} *</div>
        <div className="input-form">
          {isMissingError(isFamilyNative) && (
            <p style={{ color: "red" }}>{t("common.selectPrompt")}</p>
          )}
          <Radio.Group
            onChange={(e) => setisFamilyNative(e.target.value)}
            value={isFamilyNative}
          >
            <Radio value={"Yes"}>{t("common.yes")}</Radio>
            <Radio value={"No"}>{t("common.no")}</Radio>
          </Radio.Group>
        </div>
        <div> {t("mentorApplication.economicBackground")} *</div>
        <div className="input-form">
          {isMissingError(isEconomically) && (
            <p style={{ color: "red" }}>{t("common.selectPrompt")}</p>
          )}
          <Radio.Group
            onChange={(e) => setisEconomically(e.target.value)}
            value={isEconomically}
          >
            <Radio value={"Yes"}>{t("common.yes")}</Radio>
            <Radio value={"No"}>{t("common.no")}</Radio>
          </Radio.Group>
        </div>
        <div> {t("mentorApplication.isPersonOfColor")} *</div>
        <div className="input-form">
          {isMissingError(isColorPerson) && (
            <p style={{ color: "red" }}>{t("common.selectPrompt")}</p>
          )}
          <Radio.Group
            onChange={(e) => setisColorPerson(e.target.value)}
            value={isColorPerson}
          >
            <Radio value={"Yes"}>{t("common.yes")}</Radio>
            <Radio value={"No"}>{t("common.no")}</Radio>
          </Radio.Group>
        </div>
        <div> {t("commonApplication.genderIdentification")} *</div>
        <div className="input-form">
          {isMissingError(identify) && (
            <p style={{ color: "red" }}>{t("common.selectPrompt")}</p>
          )}
          <Radio.Group
            onChange={(e) => setidentify(e.target.value)}
            value={identify}
          >
            <Radio value={"man"}>{t("commonApplication.man")}</Radio>
            <Radio value={"woman"}>{t("commonApplication.woman")}</Radio>
            <Radio value={"LGTBQ+"}>{t("commonApplication.lgbtq")}</Radio>
            <Radio value={"other"}>{t("commonApplication.other")}</Radio>
          </Radio.Group>
        </div>
        <div>{t("mentorApplication.isMarginalized")} *</div>
        <div className="input-form">
          {isMissingError(isMarginalized) && (
            <p style={{ color: "red" }}>{t("common.selectPrompt")}</p>
          )}
          <Radio.Group
            onChange={(e) => setisMarginalized(e.target.value)}
            value={isMarginalized}
          >
            <Radio value={"Yes"}>{t("common.yes")}</Radio>
            <Radio value={"No"}>{t("common.no")}</Radio>
          </Radio.Group>
        </div>
        <div>{t("mentorApplication.languageBackground")} *</div>

        <Form.Item
          className="input-form"
          rules={[
            {
              required: true,
            },
          ]}
        >
          {isMissingError(languages) && (
            <p style={{ color: "red" }}>{t("common.inputPrompt")}</p>
          )}
          <Input
            type="text"
            placeholder={t("mentorApplication.languageBackground")}
            value={languages}
            onChange={(e) => setLanguages(e.target.value)}
          />
        </Form.Item>
        <div>{t("mentorApplication.referral")} *</div>

        <Form.Item
          className="input-form"
          rules={[
            {
              required: true,
            },
          ]}
        >
          {isMissingError(referral) && (
            <p style={{ color: "red" }}>{t("common.inputPrompt")}</p>
          )}
          <Input
            type="text"
            placeholder={t("mentorApplication.referral")}
            value={referral}
            onChange={(e) => setReferral(e.target.value)}
          />
        </Form.Item>
        <div>{t("mentorApplication.canDonate")} *</div>
        <Form.Item className="input-form">
          {isMissingError(offerDonation) && (
            <p style={{ color: "red" }}>{t("common.selectPrompt")}</p>
          )}
          <Radio.Group
            className="donation"
            onChange={onChange1}
            value={offerDonation}
          >
            <Radio
              value={
                "Yes, I can offer a donation now to help suppourt this work!"
              }
            >
              {" "}
              {t("mentorApplication.yesDonate")}
              <br></br>(https://www.menteteglobal.org/donate)
            </Radio>
            <Radio
              value={
                "No, unfortunately I cannot offer a donation now but please ask me again."
              }
            >
              {t("mentorApplication.laterDonate")}
            </Radio>
            <Radio value={"I'm unable to offer a donation."}>
              {t("mentorApplication.noDonate")}
            </Radio>
          </Radio.Group>
        </Form.Item>
        <Form.Item>
          <Button>{t("common.submit")}</Button>
        </Form.Item>
      </Form>
      {submitError ? (
        <h1 className="error">{t("mentorApplication.submitError")}</h1>
      ) : (
        ""
      )}
    </div>
  );
}
export default MentorApplication;
