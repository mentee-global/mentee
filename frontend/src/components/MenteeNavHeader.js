import React from "react";
import { NavLink } from "react-router-dom";
import { useMediaQuery } from "react-responsive";
import { Layout } from "antd";
import { withRouter } from "react-router-dom";
import {
  isLoggedIn,
  isUserMentee,
  isUserAdmin,
  isUserMentor,
} from "utils/auth.service";
import MenteeButton from "./MenteeButton";
import MenteeVerificationModal from "./MenteeVerificationModal";
import useAuth from "../utils/useAuth";

import "./css/Navigation.scss";

import MenteeLogo from "../resources/mentee.png";
import MenteeLogoSmall from "../resources/menteeSmall.png";

const { Header } = Layout;

function MenteeNavHeader({ history }) {
  const isMobile = useMediaQuery({ query: `(max-width: 500px)` });
  const { isAdmin, isMentor, isMentee } = useAuth();

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
                      pathname: "/not-found",
                    });
                  }}
                  // onClick={() => {
                  //   window.location.href="https://www.youtube.com/watch?v=dQw4w9WgXcQ&ab_channel=RickAstleyVEVO";
                  // }}
                />
              </span>
            </>
          )}
          <span className="navigation-header-button">
            <MenteeVerificationModal
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
            <MenteeButton
              width="9em"
              content={<b>{isLoggedIn() ? "Your Portal" : "Log In"}</b>}
              onClick={async () => {
                let redirect = "/select-login";
                if (await isUserMentor()) {
                  redirect = "/appointments";
                } else if (await isUserMentee()) {
                  redirect = "/messages";
                } else if (await isUserAdmin()) {
                  redirect = "/account-data";
                }
                history.push({
                  pathname: isLoggedIn() ? redirect : "/select-login",
                });
              }}
            />
          </span>
        </div>
      </div>
    </Header>
  );
}

export default withRouter(MenteeNavHeader);
