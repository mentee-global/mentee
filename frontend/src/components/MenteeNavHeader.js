import React from "react";
import { NavLink } from "react-router-dom";
import { Layout } from "antd";
import { isLoggedIn } from "utils/auth.service";
import MenteeButton from "./MenteeButton";

import "./css/Navigation.scss";

import MenteeLogo from "../resources/mentee.png";

const { Header } = Layout;

function MenteeNavHeader() {
  return (
    <Header className="navigation-header">
      <div className="navigation-mentee-flexbox">
        <div>
          <NavLink to="/">
            <img src={MenteeLogo} alt="Mentee" className="mentee-logo" />
          </NavLink>
        </div>
        <div>
          <NavLink to="/gallery">
            <span className="navigation-header-button">
              <MenteeButton
                theme="light"
                width="125px"
                content={<b>Find a Mentor</b>}
              />
            </span>
          </NavLink>
          <NavLink to="/login">
            <span className="navigation-header-button">
              <MenteeButton
                width="125px"
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

export default MenteeNavHeader;
