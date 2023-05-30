import React, { useState } from "react";
import { Form, Input, Radio, Checkbox } from "antd";
import { useTranslation, Trans } from "react-i18next";
import MenteeButton from "../MenteeButton";
import { createApplication } from "../../utils/api";
import "../../components/css/MentorApplicationPage.scss";
// constant declarations
const immigrantOptions = [
  "I am a refugee",
  "I am an immigrant (I am newly arrived or my parents are newly arrived in the country I am in)",
  "I am black.",
  "I am Hispanic/Latino.",
  "I am of native/ aboriginal/indigenous origins.",
  "I identify as LGTBQ.",
  "I have economic hardship.",
  "I come from a country at war.",
  "other",
];
const topicOptions = [
  "Advocacy and Activism",
  "Architecture",
  "Arts:Dance/Design/Music and More",
  "Citizenship",
  "Computer Science",
  "Education, Personal Guidance On Next Steps",
  "Engineering",
  "Entrepreneurship",
  "Finance, Business",
  "Finance, Personal",
  "Health, Community, and Enviornment",
  "Health, Personal: Nutrition, Personal Life Coach, Yoga & Meditation",
  "Interview Skills & Practice",
  "Journalism",
  "Language Lessons",
  "Law",
  "Legal Issues, Business",
  "Legal Issues, Related to Personal Issues (Excluding Citizenship)",
  "Media/Public Relations",
  "Medicine",
  "Nonprofits/NGOs",
  "Political Science",
  "Professional Speaking",
  "Psychology: The Study of Clinical Practice (Not Personal Issues)",
  "Research",
  "Resume/CV Writing",
  "Self Confidence",
  "Small Business: Help With Setting Up, Consulting on Vision, Overall Guidance & More",
  "Teaching: Skills & Methods",
  "Technology Training",
  "Tourism: Field of",
  "Writing: Improving writing skills, writing books/articles, scholarly writing",
  "Other",
];
const workOptions = [
  "I work part-time.",
  "I work full-time.",
  "I attend technical school.",
  "I am a college/university student attaining my first degree.",
  "I am a college/university students attaining my second or third degree.",
  "Other",
];
function MenteeApplication(props) {
  const { t } = useTranslation();
  const [submitError, setSubmitError] = useState();
  const [showMissingFieldErrors, setShowMissingFieldErrors] = useState(false);

  // sets text fields
  const [firstName, setFirstName] = useState(null);
  const [lastName, setLastName] = useState(null);
  const [organization, setOrganization] = useState(null);
  const [age, setAge] = useState(null);
  const [immigrantStatus, setImmigrantStatus] = useState([]);
  const [otherImmigrantStatus, setotherImmigrantStatus] = useState("");
  const [Country, setCountry] = useState(null);
  const [identify, setidentify] = useState(null);
  const [otherIdentify, setOtherIdentify] = useState("");
  const [language, setLanguage] = useState(null);
  const [otherLanguage, setotherLanguage] = useState("");
  const [topics, setTopics] = useState([]);
  const [otherTopics, setOtherTopics] = useState("");
  const [workstate, setWorkstate] = useState([]);
  const [otherWorkState, setotherWorkState] = useState("");
  const [isSocial, setIsSocial] = useState(null);
  const [otherIsSocial, setOtherIsSocial] = useState("");
  const [questions, setQuestions] = useState(null);
  function onChangeCheck5(checkedValues) {
    let optionsSelected = [];
    checkedValues.forEach((value) => {
      optionsSelected.push(value);
    });
    setTopics(optionsSelected);
  }
  function onChangeCheck3(checkedValues) {
    let optionsSelected = [];
    checkedValues.forEach((value) => {
      optionsSelected.push(value);
    });
    setImmigrantStatus(optionsSelected);
  }
  function onChangeCheck7(checkedValues) {
    let optionsSelected = [];
    checkedValues.forEach((value) => {
      optionsSelected.push(value);
    });
    setWorkstate(optionsSelected);
  }

  const shouldShowErrors = () => (v) =>
    (!v || (typeof v === "object" && v.length === 0)) && showMissingFieldErrors;

  // creates steps layout

  const verifyRequiredFieldsAreFilled = () => {
    const requiredQuestions = [
      firstName,
      lastName,
      organization,
      age,
      immigrantStatus,
      identify,
      language,
      topics,
      workstate,
      isSocial,
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
          <div>{t("common.firstName")} *</div>
          <Form.Item
            className="input-form"
            rules={[
              {
                required: true,
              },
            ]}
          >
            {isMissingError(firstName) && (
              <p style={{ color: "red" }}>{t("common.inputPrompt")} *</p>
            )}
            <Input
              type="text"
              placeholder={t("common.firstName")}
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
            />
          </Form.Item>
          <div>{t("common.lastName")} *</div>
          <Form.Item
            className="input-form"
            rules={[
              {
                required: true,
              },
            ]}
          >
            {isMissingError(lastName) && (
              <p style={{ color: "red" }}>{t("common.inputPrompt")}</p>
            )}
            <Input
              placeholder={t("common.lastName")}
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
            />
          </Form.Item>

          <div>{t("menteeApplication.orgAffiliation")} *</div>
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
              placeholder={t("menteeApplication.orgAffiliation")}
              value={organization}
              onChange={(e) => setOrganization(e.target.value)}
            />
          </Form.Item>
          <div>{t("menteeApplication.agePrompt")} *</div>
          <div className="input-form">
            <div className="time-options-answers">
              {isMissingError(age) && (
                <p style={{ color: "red" }}>{t("common.selectPrompt")} *</p>
              )}
              <Radio.Group onChange={(e) => setAge(e.target.value)} value={age}>
                <Radio value={"I am 18-22 years old."}>
                  I am 18-22 years old.
                </Radio>
                <Radio value={"I am 24- 26 years old"}>
                  I am 24- 26 years old
                </Radio>
                <Radio value={"I am 27-30"}>I am 27-30</Radio>
                <Radio value={"I am 30-35"}>I am 30-35</Radio>
                <Radio value={"I am 36-40"}>I am 36-40</Radio>
                <Radio value={"I am 41-50"}>I am 41-50</Radio>
                <Radio value={"I am 51-60"}>I am 51-60</Radio>
                <Radio value={"I am 61 or older"}>I am 61 or older</Radio>
              </Radio.Group>
            </div>
          </div>
          <div>{t("menteeApplication.immigrationStatus")} *</div>

          <Form.Item className="input-form">
            {isMissingError(immigrantStatus) && (
              <p style={{ color: "red" }}>{t("common.selectPrompt")}</p>
            )}
            <Checkbox.Group
              options={immigrantOptions}
              value={immigrantStatus}
              onChange={onChangeCheck3}
            />
          </Form.Item>
          {immigrantStatus.includes("other") ? (
            <Form.Item
              className="input-form"
              rules={[
                {
                  required: true,
                },
              ]}
            >
              {isMissingError(otherImmigrantStatus) && (
                <p style={{ color: "red" }}>Please input cell.</p>
              )}
              <Input
                type="text"
                placeholder={t("menteeApplication.otherPlaceholder")}
                value={otherImmigrantStatus}
                onChange={(e) => setotherImmigrantStatus(e.target.value)}
              />
            </Form.Item>
          ) : (
            ""
          )}
          <div>{t("menteeApplication.countryOrigin")}</div>
          <Form.Item
            className="input-form"
            rules={[
              {
                required: false,
              },
            ]}
          >
            <Input
              type="text"
              placeholder={t("menteeApplication.countryPlaceholder")}
              value={Country}
              onChange={(e) => setCountry(e.target.value)}
            />
          </Form.Item>
          <div>{t("menteeApplication.genderIdentification")} *</div>

          <div className="input-form">
            <div className="time-options-answers">
              {isMissingError(identify) && (
                <p style={{ color: "red" }}>{t("common.selectPrompt")}</p>
              )}
              <Radio.Group
                onChange={(e) => setidentify(e.target.value)}
                value={identify}
              >
                <Radio value={"As a male"}>As a male</Radio>
                <Radio value={"As a female"}>As a female</Radio>
                <Radio value={"As LGBTQ+"}>As LGBTQ+</Radio>
                <Radio value={"other"}>Other</Radio>
              </Radio.Group>
            </div>
          </div>
          {identify === "other" ? (
            <Form.Item
              className="input-form"
              rules={[
                {
                  required: true,
                },
              ]}
            >
              {isMissingError(otherIdentify) && (
                <p style={{ color: "red" }}>Please input cell.</p>
              )}
              <Input
                type="text"
                placeholder={t("menteeApplication.otherPlaceholder")}
                value={otherIdentify}
                onChange={(e) => setOtherIdentify(e.target.value)}
              />
            </Form.Item>
          ) : (
            ""
          )}
          <div>{t("menteeApplication.languageBackground")}</div>
          <div className="input-form">
            <div className="time-options-answers">
              {isMissingError(language) && (
                <p style={{ color: "red" }}>{t("common.selectPrompt")}</p>
              )}
              <Radio.Group
                onChange={(e) => setLanguage(e.target.value)}
                value={language}
              >
                <Radio value={"Arabic"}>Arabic</Radio>
                <Radio value={"Bengali"}>Bengali</Radio>
                <Radio value={"Burmese"}>Burmese</Radio>
                <Radio value={"Cantonese"}>Cantonese</Radio>
                <Radio value={"Dari"}>Dari</Radio>
                <Radio value={"English"}>English</Radio>
                <Radio value={"French"}>French</Radio>
                <Radio value={"German"}>German</Radio>
                <Radio value={"Hebrew"}>Hebrew</Radio>
                <Radio value={"Hindu"}>Hindu</Radio>
                <Radio value={"italian"}>italian</Radio>
                <Radio value={"japanese"}>japanese</Radio>
                <Radio value={"Karen"}>Karen</Radio>
                <Radio value={"Mandarin"}>Mandarin</Radio>
                <Radio value={"Portuguese"}>Portuguese</Radio>
                <Radio value={"Russian"}>Russian</Radio>
                <Radio value={"Spanish"}>Spanish</Radio>
                <Radio value={"Swahili"}>Swahili</Radio>
                <Radio value={"Urdu"}>Urdu</Radio>
                <Radio value={"other"}>Other</Radio>
              </Radio.Group>
            </div>
          </div>
          {language === "other" ? (
            <Form.Item
              className="input-form"
              rules={[
                {
                  required: true,
                },
              ]}
            >
              {isMissingError(otherLanguage) && (
                <p style={{ color: "red" }}>Please input cell.</p>
              )}
              <Input
                type="text"
                placeholder={t("menteeApplication.otherPlaceholder")}
                value={otherLanguage}
                onChange={(e) => setotherLanguage(e.target.value)}
              />
            </Form.Item>
          ) : (
            ""
          )}
          <div>{t("menteeApplication.topicInterests")} *</div>
          <Form.Item className="input-form">
            {isMissingError(topics) && (
              <p style={{ color: "red" }}>{t("common.selectPrompt")}</p>
            )}
            <Checkbox.Group
              options={topicOptions}
              value={topics}
              onChange={onChangeCheck5}
            />
          </Form.Item>
          {topics.includes("Other") ? (
            <Form.Item
              className="input-form"
              rules={[
                {
                  required: true,
                },
              ]}
            >
              {isMissingError(otherTopics) && (
                <p style={{ color: "red" }}>Please input cell.</p>
              )}
              <Input
                type="text"
                placeholder={t("menteeApplication.otherPlaceholder")}
                value={otherTopics}
                onChange={(e) => setOtherTopics(e.target.value)}
              />
            </Form.Item>
          ) : (
            ""
          )}
          <div>{t("menteeApplication.workOptions")}</div>
          <Form.Item className="input-form">
            {isMissingError(workstate) && (
              <p style={{ color: "red" }}>{t("common.selectPrompt")}</p>
            )}
            <Checkbox.Group
              options={workOptions}
              value={workstate}
              onChange={onChangeCheck7}
            />
          </Form.Item>
          {workstate.includes("Other") ? (
            <Form.Item
              className="input-form"
              rules={[
                {
                  required: true,
                },
              ]}
            >
              {isMissingError(otherWorkState) && (
                <p style={{ color: "red" }}>Please input cell.</p>
              )}
              <Input
                type="text"
                placeholder={t("menteeApplication.otherPlaceholder")}
                value={otherWorkState}
                onChange={(e) => setotherWorkState(e.target.value)}
              />
            </Form.Item>
          ) : (
            ""
          )}
          <div>{t("menteeApplication.socialMedia")}</div>

          <div className="input-form">
            <div className="time-options-answers">
              {isMissingError(isSocial) && (
                <p style={{ color: "red" }}>{t("common.selectPrompt")}</p>
              )}
              <Radio.Group
                onChange={(e) => setIsSocial(e.target.value)}
                value={isSocial}
              >
                <Radio value={"yes"}>Yes!</Radio>
                <Radio value={"No"}>No, thank you.</Radio>
                <Radio value={"other"}>Other</Radio>
              </Radio.Group>
            </div>
          </div>
          {isSocial === "other" ? (
            <Form.Item
              className="input-form"
              rules={[
                {
                  required: true,
                },
              ]}
            >
              {isMissingError(otherIsSocial) && (
                <p style={{ color: "red" }}>Please input cell.</p>
              )}
              <Input
                type="text"
                placeholder={t("menteeApplication.otherPlaceholder")}
                value={otherIsSocial}
                onChange={(e) => setOtherIsSocial(e.target.value)}
              />
            </Form.Item>
          ) : (
            ""
          )}
          <div>{t("menteeApplication.otherQuestions")}</div>
          <Form.Item
            className="input-form"
            rules={[
              {
                required: true,
              },
            ]}
          >
            <Input
              type="text"
              placeholder={t("menteeApplication.questionsPlaceholder")}
              value={questions}
              onChange={(e) => setQuestions(e.target.value)}
            />
          </Form.Item>
        </Form>
      </div>
    );
  }

  function handleSubmit(event) {
    event.preventDefault();
    let imms = immigrantStatus;
    let topicss = topics;
    let states = workstate;
    if (immigrantStatus.includes("other")) {
      if (otherImmigrantStatus) {
        setShowMissingFieldErrors(false);
        imms = imms.filter(function (value, index, arr) {
          return value !== "other";
        });
        imms.push("Other: " + otherImmigrantStatus);
      } else {
        setShowMissingFieldErrors(true);
        return false;
      }
    }
    if (identify === "other") {
      setidentify(otherIdentify);
    }
    if (language === "other") {
      setLanguage(otherLanguage);
    }
    if (topics.includes("Other")) {
      if (otherTopics) {
        setShowMissingFieldErrors(false);
        topicss = topicss.filter(function (value, index, arr) {
          return value !== "Other";
        });
        topicss.push("Other: " + otherTopics);
      } else {
        setShowMissingFieldErrors(true);
        return false;
      }
    }
    if (workstate.includes("Other")) {
      if (otherWorkState) {
        setShowMissingFieldErrors(false);
        states = states.filter(function (value, index, arr) {
          return value !== "Other";
        });
        states.push("Other: " + otherWorkState);
      } else {
        setShowMissingFieldErrors(true);
        return false;
      }
    }
    if (isSocial === "other") {
      setIsSocial(otherIsSocial);
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
        name: firstName + " " + lastName,
        age: age,
        organization: organization,
        immigrant_status: imms,
        Country: Country,
        identify: identify,
        language: language,
        topics: topicss,
        workstate: states,
        isSocial: isSocial,
        questions: questions,
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
    <div className="background">
      <div className="instructions">
        <h1 className="welcome-page">
          <Trans i18nKey={"common.welcome"}>
            Welcome to <strong>MENTEE!</strong>
          </Trans>
        </h1>
        <p className="para-1">{t("menteeApplication.introduction")}</p>
        <br></br>
      </div>

      {pageOne()}
      <div className="submit-button">
        <MenteeButton
          width="205px"
          content={<b>{t("common.submit")}</b>}
          onClick={handleSubmit}
        />
      </div>
      {submitError ? (
        <h1 className="error">{t("menteeApplication.submitError")}</h1>
      ) : (
        ""
      )}
    </div>
  );
}
export default MenteeApplication;
