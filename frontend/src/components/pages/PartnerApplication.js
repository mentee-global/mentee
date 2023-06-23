import React, { useState } from "react";
import { Form, Input, Checkbox } from "antd";
import MenteeButton from "../MenteeButton";
import { createApplication } from "../../utils/api";
import "../../components/css/MentorApplicationPage.scss";
import { useTranslation, Trans } from "react-i18next";

// TODO: Remove this dead code

const relationOptions = [
  "MENTEE serves those you support as mentees",
  "You help bring on global mentors",
  "You partner with MENTEE over collaborative projects",
  "You support MENTEE with in-kind supports",
  "I am of native/ aboriginal/indigenous origins.",
  "You are a funding partner",
  "other",
];
const sdgsOptions = [
  "SDG 1: No poverty",
  "SDG 2: Zero Hunger",
  "SDG 3: Good Health & Well-being",
  "SDG 4: Quality Education",
  "SDG 5: Gender Equality",
  "SDG 6: Clean Water and Sanitation",
  "SDG 7: Affordable and Clean Energy",
  "SDG 8: Decent Work and Economic Growth",
  "SDG 9: Industry, Innovation and Infrastructures",
  "SDG 10: Reduced Inequality",
  "SDG 11: Sustainable Cities and Communities",
  "SDG 12: Responsible Consumption and Production",
  "SDG 13: Climate Action",
  "SDG 14: Life Below Water",
  "SDG 15: Life on Land",
  "SDG 16: Peace and Justice Strong Institutions",
  "SDG 17: Partnership to Achieve the Goals",
];
function PartnerApplication(props) {
  const { t } = useTranslation();
  const [submitError, setSubmitError] = useState();
  const [showMissingFieldErrors, setShowMissingFieldErrors] = useState(false);

  // sets text fields
  const [organization, setorganization] = useState(null);
  const [contactPerson, setContactPerson] = useState(null);
  const [personEmail, setpersonEmail] = useState(null);
  const [relationShip, setrelationShip] = useState([]);
  const [otherRelation, setOtherRelation] = useState(null);
  const [SDGS, setSDGS] = useState([]);
  const [howBuild, setHowBuild] = useState(null);

  function onChangeCheck5(checkedValues) {
    let optionsSelected = [];
    checkedValues.forEach((value) => {
      optionsSelected.push(value);
    });
    setSDGS(optionsSelected);
  }
  function onChangeCheck3(checkedValues) {
    let optionsSelected = [];
    checkedValues.forEach((value) => {
      optionsSelected.push(value);
    });
    setrelationShip(optionsSelected);
  }
  const shouldShowErrors = () => (v) =>
    (!v || (typeof v === "object" && v.length === 0)) && showMissingFieldErrors;

  // creates steps layout

  const verifyRequiredFieldsAreFilled = () => {
    const requiredQuestions = [
      organization,
      contactPerson,
      personEmail,
      relationShip,
      howBuild,
      SDGS,
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

  function pageOne() {
    const isMissingError = shouldShowErrors();
    return (
      <div className="page-one-column-container">
        <Form>
          <div>{t("partnerApplication.partnerName")}</div>
          <Form.Item
            className="input-form"
            rules={[
              {
                required: true,
              },
            ]}
          >
            {isMissingError(organization) && (
              <p style={{ color: "red" }}>{t("common.inputPrompt")}</p>
            )}
            <Input
              type="text"
              value={organization}
              onChange={(e) => setorganization(e.target.value)}
            />
          </Form.Item>
          <div> {t("partnerApplication.pointOfContact")}</div>
          <Form.Item
            className="input-form"
            rules={[
              {
                required: true,
              },
            ]}
          >
            {isMissingError(contactPerson) && (
              <p style={{ color: "red" }}>{t("common.inputPrompt")}</p>
            )}
            <Input
              value={contactPerson}
              onChange={(e) => setContactPerson(e.target.value)}
            />
          </Form.Item>
          <div>{t("partnerApplication.contactEmail")}</div>

          <Form.Item
            className="input-form"
            rules={[
              {
                required: true,
              },
            ]}
          >
            {isMissingError(personEmail) && (
              <p style={{ color: "red" }}>{t("common.inputPrompt")}</p>
            )}
            <Input
              type="text"
              value={personEmail}
              onChange={(e) => setpersonEmail(e.target.value)}
            />
            <div>{t("partnerApplication.partnershipRelation")}</div>
            <Form.Item className="input-form">
              {isMissingError(relationShip) && (
                <p style={{ color: "red" }}>{t("common.selectPrompt")}</p>
              )}
              <Checkbox.Group
                options={relationOptions}
                value={relationShip}
                onChange={onChangeCheck3}
              />
            </Form.Item>
            {relationShip.includes("other") ? (
              <Form.Item
                className="input-form"
                rules={[
                  {
                    required: true,
                  },
                ]}
              >
                {isMissingError(otherRelation) && (
                  <p style={{ color: "red" }}>{t("common.inputPrompt")}</p>
                )}
                <Input
                  type="text"
                  value={otherRelation}
                  onChange={(e) => setOtherRelation(e.target.value)}
                />
              </Form.Item>
            ) : (
              ""
            )}
          </Form.Item>
          <div>{t("partnerApplication.partnersConcerns")}</div>
          <Form.Item className="input-form">
            {isMissingError(SDGS) && (
              <p style={{ color: "red" }}>{t("common.selectPrompt")}</p>
            )}
            <Checkbox.Group
              options={sdgsOptions}
              value={SDGS}
              onChange={onChangeCheck5}
            />
          </Form.Item>

          <div>{t("partnerApplication.buildTogether")}</div>
          <Form.Item
            className="input-form"
            rules={[
              {
                required: true,
              },
            ]}
          >
            {isMissingError(howBuild) && (
              <p style={{ color: "red" }}>{t("common.inputPrompt")}</p>
            )}
            <Input
              type="text"
              value={howBuild}
              onChange={(e) => setHowBuild(e.target.value)}
            />
          </Form.Item>
        </Form>
      </div>
    );
  }

  function handleSubmit(event) {
    let relations = relationShip;
    event.preventDefault();
    if (relationShip.includes("other")) {
      if (otherRelation) {
        setShowMissingFieldErrors(false);
        relations = relations.filter(function (value, index, arr) {
          return value !== "other";
        });
        relations.push("Other: " + otherRelation);
      } else {
        setShowMissingFieldErrors(true);
        return false;
      }
    }
    if (!verifyRequiredFieldsAreFilled()) return;
    if (props.headEmail === "") {
      setSubmitError(true);
      return;
    }

    async function submitApplication() {
      // onOk send the put request
      const data = {
        email: props.headEmail,
        organization: organization,
        contactPerson: contactPerson,
        personEmail: personEmail,
        relationShip: relations,
        SDGS: SDGS,
        howBuild: howBuild,
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
    <div className="background2">
      <div className="instructions">
        <h1 className="welcome-page">
          <Trans i18nKey={"common.welcome"}>
            Welcome to <strong>MENTEE!</strong>
          </Trans>
        </h1>
        <p className="para-1">
          {t("partnerApplication.introduction")}
          <br></br>
        </p>
      </div>

      <div className="container">
        {pageOne()}
        <div className="submit-button sbtn">
          <MenteeButton
            width="150px"
            content={<b>{t("common.submit")}</b>}
            onClick={handleSubmit}
          />
        </div>
        {submitError ? (
          <h1 className="error">{t("partnerApplication.submitError")}</h1>
        ) : (
          ""
        )}
      </div>
    </div>
  );
}
export default PartnerApplication;
