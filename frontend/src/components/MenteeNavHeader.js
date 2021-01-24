import React from "react";
import { NavLink } from "react-router-dom";
import { useMediaQuery } from "react-responsive";
import { Layout } from "antd";
import { withRouter } from "react-router-dom";
import { isLoggedIn } from "utils/auth.service";
import MenteeButton from "./MenteeButton";
import MenteeVerificationModal from "./MenteeVerificationModal";

import "./css/Navigation.scss";

import MenteeLogo from "../resources/mentee.png";
import MenteeLogoSmall from "../resources/menteeSmall.png";

const { Header } = Layout;

function MenteeNavHeader({ history }) {
  const isMobile = useMediaQuery({ query: `(max-width: 500px)` });

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
        <div>
          <span className="navigation-header-button">
            <MenteeVerificationModal
              content={<b>Find a Mentor</b>}
              theme="light"
              width="45%"
              onVerified={() => {
                history.push({
                  pathname: "/gallery",
                  state: { verified: true },
                });
              }}
            />
          </span>
          <NavLink to="/login">
            <span className="navigation-header-button">
              <MenteeButton
                width="45%"
                content={
                  <b>{isLoggedIn() ? "Your Profile" : "Mentor Log In"}</b>
                }
              />
            </span>
          </NavLink>
        </div>
      </div>
    </Header>
  );
}

export default withRouter(MenteeNavHeader);
