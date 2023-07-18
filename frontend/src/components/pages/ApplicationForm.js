import React, { useEffect, useState } from "react";
import "../../components/css/Apply.scss";
import { Input, Radio, Typography, message, theme } from "antd";
import { useLocation, useHistory, withRouter } from "react-router-dom";
import { useTranslation, Trans } from "react-i18next";
import { ACCOUNT_TYPE } from "utils/consts";
import ApplyStep from "../../resources/applystep.png";
import ApplyStep2 from "../../resources/applystep2.png";
import {
  getAppState,
  isHaveAccount,
  changeStateBuildProfile,
} from "../../utils/api";
import ProfileStep from "../../resources/profilestep.png";
import ProfileStep2 from "../../resources/profilestep2.png";
import TrianStep from "../../resources/trainstep.png";
import TrianStep2 from "../../resources/trainstep2.png";
import MentorApplication from "./MentorApplication";
import MenteeApplication from "./MenteeApplication";
import TrainingList from "components/TrainingList";
import MentorProfileForm from "./MentorProfileForm";
import MenteeProfileForm from "./MenteeProfileForm";
import PartnerProfileForm from "components/PartnerProfileForm";
import { validateEmail } from "utils/misc";
import { css } from "@emotion/css";

const { Title, Paragraph } = Typography;

const ApplicationForm = () => {
  const {
    token: { colorPrimary },
  } = theme.useToken();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState(null);
  const [isapply, setIsApply] = useState(true);
  const [confirmApply, setConfirmApply] = useState(false);
  const [approveApply, setApproveApply] = useState(false);
  const [approveTrainning, setApproveTrainning] = useState(false);
  const [istrain, setIstrain] = useState(false);
  const [isbuild, setIsBuild] = useState(false);
  const [err2, seterr2] = useState(false);
  const [ishavee, setishavee] = useState(false);
  const [isProfile, setIsprofile] = useState(false);
  const [isVerify, setIsVerify] = useState(null);
  const history = useHistory();
  const location = useLocation();
  const { t, i18n } = useTranslation();
  const [messageApi, contextHolder] = message.useMessage();

  const submitHandler = () => {
    setConfirmApply(true);
  };
  useEffect(() => {
    var searchParams = new URLSearchParams(location.search);
    var email = searchParams.get("email");
    var role = searchParams.get("role");
    if (email !== undefined && email !== null && email !== "") {
      setEmail(email);
      if (role > 0) {
        setRole(parseInt(role));
      }
    }
    if (location.state) {
      if (location.state.email) {
        setEmail(location.state.email);
      }
      if (location.state.role) {
        setRole(location.state.role);
      }
    }
  }, []);

  useEffect(() => {
    async function checkConfirmation() {
      if (validateEmail(email)) {
        if (role) {
          const { isHave, isHaveProfile, isVerified } = await isHaveAccount(
            email,
            role
          );
          setIsVerify(isVerified);
          setishavee(isHave);
          if (isHave === true && isHaveProfile === true) {
            messageApi.info(t("apply.message.haveAccount"));
            setTimeout(() => {
              history.push(`/?step=2&role=${role}`);
            }, 2000);
            return;
          } else if (isHave === true && isHaveProfile === false) {
            if (location.state) {
              setIsprofile(false);
              setishavee(true);
              setIsApply(false);
              setIstrain(false);
              setIsBuild(true);
              setApproveTrainning(true);
              return;
            }
          }
          if (role === ACCOUNT_TYPE.PARTNER && isVerified) {
            setIsApply(false);
            setIstrain(false);
            setIsBuild(true);
            setApproveTrainning(true);
            return;
          } else if (role === ACCOUNT_TYPE.PARTNER && !isVerified) {
            setIsApply(false);
            setIstrain(false);
            setIsBuild(false);
            return;
          } else if (role !== ACCOUNT_TYPE.PARTNER && isVerified) {
            setIsApply(false);
            setIstrain(false);
            setIsBuild(true);
            return;
          } else {
            const state = await getAppState(email, role);
            if (state === "PENDING") {
              setConfirmApply(true);
              setApproveApply(false);
            } else if (state === "APPROVED") {
              setApproveApply(true);
              setConfirmApply(false);
              setIsApply(false);
              setIstrain(true);
            } else if (state === "BuildProfile") {
              setIsApply(false);
              setIstrain(false);
              setIsBuild(true);
              setApproveTrainning(true);
            } else {
              setConfirmApply(false);
              setApproveApply(false);
              setIsApply(true);
              setIsBuild(false);
              setIstrain(false);
            }

            return state;
          }
        }
      }
    }
    //check this email already send application and pending
    checkConfirmation();
  }, [role, email]);

  return (
    <div
      className={css`
        width: 100%;
        height: 100vh;
        overflow: auto;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
      `}
    >
      {contextHolder}
      <div
        className={css`
          min-width: 400px;
          width: 70%;
          background: #fff;
          border-radius: 2em;
          padding: 2em;
          box-shadow: 0 1px 4px rgba(5, 145, 255, 0.1);
        `}
      >
        <Typography>
          <Title
            level={2}
            className={css`
              span {
                // TODO: Change this span
                color: ${colorPrimary};
              }
            `}
          >
            <Trans i18nKey={"common.welcome"}>
              Welcome to <span>MENTEE!</span>
            </Trans>
          </Title>
          <Paragraph
            className={css`
              /* text-align: center; */
            `}
          >
            {t("apply.emailPrompt")}
          </Paragraph>
        </Typography>

        <div className="emailPart">
          <Input
            type="email"
            className="emailIn"
            placeholder={t("common.email")}
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
            }}
          />
        </div>
        {ishavee && isProfile === true && (
          <p className="error">{t("apply.existingAccount")}</p>
        )}
        <Radio.Group
          className="roleGroup"
          onChange={(e) => setRole(e.target.value)}
          value={role}
          disabled={!validateEmail(email)}
        >
          <Radio className="role" value={ACCOUNT_TYPE.MENTEE}>
            {t("common.mentee")}
          </Radio>
          <Radio className="role" value={ACCOUNT_TYPE.MENTOR}>
            {t("common.mentor")}
          </Radio>
          <Radio className="role" value={ACCOUNT_TYPE.PARTNER}>
            {t("common.partner")}
          </Radio>
        </Radio.Group>
        <div className="steps">
          <img
            src={isapply ? ApplyStep : ApplyStep2}
            className="step0"
            alt="apply"
            onClick={() => {
              if (!isbuild && istrain) {
                setIsApply(true);
                setIsBuild(false);
                setIstrain(false);
              }
            }}
          />
          <img
            src={istrain ? TrianStep2 : TrianStep}
            className="step1"
            alt="training"
            onClick={() => {
              if (approveApply) {
                setIsApply(false);
                setIsBuild(false);
                setIstrain(true);
              }
            }}
          />
          <img
            src={isbuild ? ProfileStep2 : ProfileStep}
            className="step2"
            alt="profile"
            onClick={() => {
              if (approveTrainning) {
                setIsApply(false);
                setIsBuild(true);
                setIstrain(false);
              }
            }}
          />
        </div>
        {role === ACCOUNT_TYPE.PARTNER && !isVerify ? (
          <h1 className="applymessage">{t("apply.partnerVerify")}</h1>
        ) : (
          ""
        )}

        <div
          className={
            (isapply && (confirmApply || approveApply)) ||
            !role ||
            (role === ACCOUNT_TYPE.PARTNER && !isVerify)
              ? ""
              : "formsPart"
          }
        >
          {isapply && role ? (
            <div className="applypart">
              {!approveApply && confirmApply ? (
                <h1 className="applymessage">{t("apply.confirmation")}</h1>
              ) : (
                <>
                  {approveApply ? (
                    <h1 className="applymessage">{t("apply.approved")}</h1>
                  ) : (
                    ""
                  )}
                  {!approveApply && role === ACCOUNT_TYPE.MENTOR ? (
                    <MentorApplication
                      submitHandler={submitHandler}
                      role={ACCOUNT_TYPE.MENTOR}
                      headEmail={email}
                    ></MentorApplication>
                  ) : (
                    ""
                  )}
                  {!approveApply && role === ACCOUNT_TYPE.MENTEE ? (
                    <MenteeApplication
                      submitHandler={submitHandler}
                      role={ACCOUNT_TYPE.MENTEE}
                      headEmail={email}
                    ></MenteeApplication>
                  ) : (
                    ""
                  )}
                </>
              )}
            </div>
          ) : (
            ""
          )}
          {istrain ? (
            <div className="trainpart">
              <TrainingList role={role} />
            </div>
          ) : (
            ""
          )}
          {isbuild ? (
            <div className="buildpart">
              {role === ACCOUNT_TYPE.PARTNER && isVerify ? (
                <PartnerProfileForm
                  role={role}
                  headEmail={email}
                  isHave={ishavee}
                />
              ) : (
                ""
              )}
              {role === ACCOUNT_TYPE.MENTOR ? (
                <MentorProfileForm
                  headEmail={email}
                  role={role}
                  isHave={ishavee}
                ></MentorProfileForm>
              ) : (
                ""
              )}
              {role === ACCOUNT_TYPE.MENTEE ? (
                <MenteeProfileForm
                  headEmail={email}
                  role={role}
                  isHave={ishavee}
                ></MenteeProfileForm>
              ) : (
                ""
              )}
            </div>
          ) : (
            ""
          )}

          <div className="btnContainer">
            <div
              className={`applySubmit2 ${istrain ? "" : " hide"}`}
              onClick={async () => {
                let state = await changeStateBuildProfile({
                  email,
                  role,
                  preferred_language: i18n.language,
                });
                if (state === "BuildProfile") {
                  setIsApply(false);
                  setIsBuild(true);
                  setIstrain(false);
                } else {
                  seterr2(true);
                }
              }}
            >
              {t("apply.completeTrainings")}
            </div>
            {err2 && <p>{t("apply.errorConnection")}</p>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default withRouter(ApplicationForm);
