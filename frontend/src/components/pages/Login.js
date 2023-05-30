import React, { useState } from "react";
import { useHistory, NavLink } from "react-router-dom";
import { Input, message } from "antd";
import fireauth from "utils/fireauth";
import { useDispatch } from "react-redux";
import { EyeInvisibleOutlined, EyeTwoTone } from "@ant-design/icons";
import { ACCOUNT_TYPE } from "utils/consts";
import { login, sendVerificationEmail } from "utils/auth.service";
import { fetchUser } from "features/userSlice";
import usePersistedState from "utils/hooks/usePersistedState";
import SelectLogin from "./SelectLogin";
import "../css/Login.scss";
import { getExistingProfile, isHaveAccount } from "../../utils/api";
import { Trans, useTranslation } from "react-i18next";
const Logins = Object.freeze({
  mentee: {
    title: "Mentee",
    type: ACCOUNT_TYPE.MENTEE,
    redirect: "/mentee-appointments",
  },
  mentor: {
    title: "Mentor",
    type: ACCOUNT_TYPE.MENTOR,
    redirect: "/appointments",
  },
  partner: {
    title: "Partner",
    type: ACCOUNT_TYPE.PARTNER,
    redirect: "/profile",
  },
});
const getRoleObject = (key) => {
  return { ...Logins[key] };
};
function Login() {
  const history = useHistory();
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState();
  const [password, setPassword] = useState();
  const [inputFocus, setInputFocus] = useState([false, false]);
  const [displaySelect, setDisplaySelect] = useState(false);
  const [loggingIn, setLoggingIn] = useState(false);
  const [roleObject, setRoleObject] = useState({});
  const [permissions, setPermissions] = usePersistedState(
    "permissions",
    ACCOUNT_TYPE.MENTEE
  );
  const [messageApi, contextHolder] = message.useMessage();

  const displayError = (errorMessage) => {
    messageApi.open({
      type: "error",
      content: `${errorMessage}`,
    });
  };

  const handleDisplayImages = () => {
    setDisplaySelect(true);
  };
  const handleSelect = async (key) => {
    let RoleObj = getRoleObject(key);
    if (RoleObj) {
      setLoggingIn(true);
      setLoading(true);
      const { isHaveProfile, rightRole } = await getExistingProfile(
        email,
        RoleObj.type
      );
      if (rightRole) {
        if (rightRole !== RoleObj.type) {
          displayError("wrong Role please choose account right Role");
          setLoading(false);
          setLoggingIn(false);
          setLoggingIn(false);

          return;
          //return wrong Role
        }
      } else {
        const { isHave } = await isHaveAccount(email, RoleObj.type);
        if (isHaveProfile === false && isHave === true) {
          //redirect to apply with role and email passed
          history.push({
            pathname: "/application-page",
            state: { email: email, role: RoleObj.type },
          });
          return;
        } else if (isHaveProfile === false && isHave === false) {
          displayError(t("loginErrors.incorrectCredentials"));
          setLoggingIn(false);
          setLoading(false);

          return;
        } else if (isHaveProfile === true) {
          const res = await login(email, password, RoleObj.type);
          setLoading(false);

          if (!res || !res.success) {
            if (res?.data?.result?.existingEmail) {
              displayError(t("loginErrors.existingEmail"));
              setLoading(false);
            } else {
              displayError(t("loginErrors.incorrectCredentials"));
              setLoading(false);
            }
          } else if (res.result.passwordReset) {
            displayError(t("loginErrors.resetPassword"));
            setLoading(false);
          } else if (res.result.recreateAccount) {
            displayError(t("loginErrors.reregisterAccount"));
            setLoading(false);
          }
          setPermissions(RoleObj.type);
          const unsubscribe = fireauth
            .auth()
            .onAuthStateChanged(async (user) => {
              unsubscribe();
              if (!user) return;

              if (res.result.redirectToVerify) {
                await sendVerificationEmail(email);
                history.push("/verify");
              } else {
                dispatch(
                  fetchUser({
                    id: res.result.profileId,
                    role: res.result.role,
                  })
                );
                history.push(RoleObj.redirect);
              }
            });

          setLoggingIn(false);
          setRoleObject(RoleObj);
        }
      }
    }
  };
  function handleInputFocus(index) {
    let newClickedInput = [false, false];
    newClickedInput[index] = true;
    setInputFocus(newClickedInput);
  }
  return (
    <div className="containerr">
      {contextHolder}
      <h1 className="home-header3">
        <Trans i18nKey={"common.welcome"}>
          Welcome to <span>MENTEE!</span>
        </Trans>
      </h1>
      <div className="page-background">
        <div className="login-content">
          <h1 className="login-text">{t("common.login")}</h1>

          <div
            className={`login-input-container${
              inputFocus[0] ? "__clicked" : ""
            }`}
          >
            <Input
              className="login-input"
              onFocus={() => handleInputFocus(0)}
              disabled={loggingIn}
              onChange={(e) => setEmail(e.target.value)}
              bordered={false}
              placeholder={t("common.email")}
            />
          </div>
          <div
            className={`login-input-container${
              inputFocus[1] ? "__clicked" : ""
            }`}
          >
            <Input.Password
              className="login-input_pass"
              disabled={loggingIn}
              iconRender={(visible) =>
                visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />
              }
              onFocus={() => handleInputFocus(1)}
              onChange={(e) => setPassword(e.target.value)}
              bordered={false}
              placeholder={t("common.password")}
            />
          </div>

          <div className="account-help-container">
            <div className="account-link">
              {t("login.noAccount")}{" "}
              <NavLink to={`/application-page`} className="login-register-link">
                {t("login.apply")}
              </NavLink>
            </div>
            <div className="account-link">
              <div>{t("login.forgotPassword")}</div>
              <NavLink to="/forgot-password" className="login-register-link">
                {t("login.resetPassword")}
              </NavLink>
            </div>
          </div>
        </div>
      </div>
      {loading ? <h1 className="loadingg">Loading ..</h1> : ""}
      <SelectLogin
        displaySelect={displaySelect}
        handleDisplayImages={handleDisplayImages}
        handleSelect={handleSelect}
      ></SelectLogin>
    </div>
  );
}

export default Login;
