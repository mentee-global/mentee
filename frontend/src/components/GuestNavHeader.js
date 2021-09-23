import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import { useMediaQuery } from "react-responsive";
import { Layout, Drawer, Button } from "antd";
import { withRouter } from "react-router-dom";
import { isLoggedIn } from "utils/auth.service";
import MenteeButton from "./MenteeButton";
import LoginVerificationModal from "./LoginVerificationModal";
import useAuth from "../utils/hooks/useAuth";

import "./css/Navigation.scss";

import MenteeLogo from "../resources/mentee.png";
import MenteeLogoSmall from "../resources/menteeSmall.png";
import Icon, { MenuOutlined } from "@ant-design/icons";

const { Header } = Layout;

function GuestNavHeader({ history }) {
  const isMobile = useMediaQuery({ query: `(max-width: 500px)` });
  const { isAdmin, isMentor, isMentee } = useAuth();
  const [drawerVisible, setDrawerVisible] = useState(false);

  return (
    <Header className="navigation-header">
      <div className="navigation-mentee-flexbox">
        <div>
          <NavLink to="/">
            <img
              src={isMobile ? MenteeLogoSmall : MenteeLogo}
              alt="Mentee"
              className="mentee-logo"
            />
          </NavLink>
        </div>
        {!isMobile ? (
          <div style={{ display: "flex" }}>
            {!isMobile && (
              <>
                <span className="navigation-header-button">
                  <MenteeButton
                    width="9em"
                    theme="light"
                    content={<b>{"Apply"}</b>}
                    onClick={() => {
                      history.push({
                        pathname: "/application-page",
                      });
                    }}
                  />
                </span>
              </>
            )}
            {/* TODO: Update this since verification modal will not longer be needed anymore! */}
            <span className="navigation-header-button">
              <LoginVerificationModal
                content={<b>Find a Mentor</b>}
                theme="light"
                width="9em"
                onVerified={() => {
                  history.push({
                    pathname: "/gallery",
                    state: { verified: true },
                  });
                }}
              />
            </span>
            <span className="navigation-header-button">
              <LoginVerificationModal
                content={<b>Find a Mentee</b>}
                theme="light"
                width="9em"
                onVerified={() => {
                  history.push({
                    pathname: "/mentee-gallery",
                    state: { verified: true },
                  });
                }}
              />
            </span>
            <span className="navigation-header-button">
              <LoginVerificationModal
                loginButton
                content={<b>{isLoggedIn() ? "Your Portal" : "Log In"}</b>}
                width="9em"
                onVerified={async () => {
                  let redirect = "/select-login";
                  if (isMentor) {
                    redirect = "/appointments";
                  } else if (isMentee) {
                    redirect = "/mentee-appointments";
                  } else if (isAdmin) {
                    redirect = "/account-data";
                  }
                  history.push({
                    pathname: redirect,
                  });
                }}
              />
            </span>
          </div>
        ) : (
            <MobileGuestNavHeader
              setDrawerVisible={setDrawerVisible}
              drawerVisible={drawerVisible}
              history={history}
            />
          )}
      </div>
    </Header>
  );
}

function MobileGuestNavHeader({ setDrawerVisible, drawerVisible, history }) {
  const { isAdmin, isMentor, isMentee } = useAuth();
  return (
    <div>
      <button
        className="navigation-hamburger-btn"
        onClick={() => setDrawerVisible(true)}
      >
        <Icon component={MenuOutlined} style={{ fontSize: "30px" }} />
      </button>
      <Drawer
        placement="right"
        closable={true}
        onClose={() => setDrawerVisible(false)}
        visible={drawerVisible}
      >
        <div className="drawer-btn-container">
          <MenteeButton
            className="mobile-nav-btn"
            width="9em"
            theme="light"
            content={<b>{"Apply"}</b>}
            onClick={() => {
              history.push({
                pathname: "/application-page",
              });
            }}
          />
          <LoginVerificationModal
            className="mobile-nav-btn-login-modal"
            content={<b>Find a Mentor</b>}
            theme="light"
            width="9em"
            onVerified={() => {
              history.push({
                pathname: "/gallery",
                state: { verified: true },
              });
            }}
          />
          <LoginVerificationModal
            className="mobile-nav-btn-login-modal"
            content={<b>Find a Mentee</b>}
            theme="light"
            width="9em"
            onVerified={() => {
              history.push({
                pathname: "/mentee-gallery",
                state: { verified: true },
              });
            }}
          />
          <MenteeButton
            className="mobile-nav-btn"
            content={<b>{isLoggedIn() ? "Your Portal" : "Log In"}</b>}
            width="9em"
            onClick={async () => {
              let redirect = "/select-login";
              if (isMentor) {
                redirect = "/appointments";
              } else if (isMentee) {
                redirect = "/mentee-appointments";
              } else if (isAdmin) {
                redirect = "/account-data";
              }
              history.push({
                pathname: isLoggedIn() ? redirect : "/select-login",
              });
            }}
          />
        </div>
      </Drawer>
    </div>
  );
}

export default withRouter(GuestNavHeader);
