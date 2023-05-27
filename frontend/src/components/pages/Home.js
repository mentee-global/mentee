import React from "react";
import { withRouter } from "react-router-dom";
import { useTranslation, Trans } from "react-i18next";
import LoginVerificationModal from "../LoginVerificationModal";
import "../css/Home.scss";
import loginimg from "resources/login.png";
import { isLoggedIn } from "utils/auth.service";

import Applyimg from "resources/apply.png";
import { useAuth } from "utils/hooks/useAuth";
import { MENTEE_GALLERY_PAGE, MENTOR_GALLERY_PAGE } from "utils/consts";
import { logout } from "utils/auth.service";
import { resetUser } from "features/userSlice";
import { useDispatch } from "react-redux";

function Home({ history }) {
  const { isMentor, isMentee, isPartner, resetRoleState, isAdmin } = useAuth();
  const dispatch = useDispatch();
  const { t } = useTranslation();

  const logoutUser = () => {
    logout().then(() => {
      resetRoleState();
      dispatch(resetUser());
      history.push("/");
    });
  };
  return (
    <div className="home-background">
      <div className="home-content">
        <div className="home-text-container">
          <h1 className="home-header2">
            <Trans i18nKey={"homepage.welcome"}>
              Welcome to <span>MENTEE</span>!
            </Trans>
          </h1>
          {isLoggedIn() ? (
            ""
          ) : (
            <p className="home-text2">
              {/** Homepage Tagline placeholder */}
              {t("homepage.isExistingUser")}
            </p>
          )}

          <br />
          <LoginVerificationModal
            content={
              (isMentor && <b>Find a Mentee</b>) ||
              (isMentee && <b>Find a Mentor</b>)
            }
            theme="dark"
            onVerified={() => {
              let redirect = MENTOR_GALLERY_PAGE;
              if (isMentor) {
                redirect = MENTEE_GALLERY_PAGE;
              }
              history.push({
                pathname: redirect,
                state: { verified: true },
              });
            }}
          />
        </div>
        <div className="buttons-container">
          {isMentee || isMentor || isPartner || isAdmin ? (
            <></>
          ) : (
            <div>
              <h1 className="home-header2" style={{ textAlign: "center" }}>
                <span>{t("homepage.newAccountTitle")}</span>
                <div
                  className="applyCon"
                  onClick={() => {
                    history.push({
                      pathname: "/application-page",
                    });
                  }}
                >
                  <img className="applyImage" src={Applyimg} alt="apply" />

                  <div className="loginText">
                    {t("homepage.newAccountDesc")}
                  </div>
                </div>
              </h1>
            </div>
          )}
          {!isLoggedIn() ? (
            <>
              <h1 className="home-header2" style={{ textAlign: "center" }}>
                <span>{t("homepage.existingAccountTitle")}</span>
                <div
                  className="loginCon"
                  onClick={() => {
                    let redirect = "/login";
                    history.push({
                      pathname: redirect,
                    });
                  }}
                >
                  <img className="applyImage" src={loginimg} alt="login" />
                  <div className="loginText">
                    {t("homepage.existingAccountDesc")}
                  </div>
                </div>
              </h1>
            </>
          ) : (
            <div className="loginCon" onClick={logoutUser}>
              <img className="applyImage" src={loginimg} alt="login" />

              <div className="loginText">{t("common.logout")}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default withRouter(Home);
