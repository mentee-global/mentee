import React from "react";
import { NavLink } from "react-router-dom";
import { Layout, Button } from "antd";
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
            <Button
              className="navigation-header-button"
              style={{ background: "#FCF6E8", color: "#A58123" }}
            >
              <b>Find a Mentor</b>
            </Button>
          </NavLink>
          <Button
            className="navigation-header-button"
            style={{ background: "#FCF6E8", color: "#A58123" }}
          >
            <b>About Us</b>
          </Button>
          <Button
            className="navigation-header-button"
            style={{ background: "#FCF6E8", color: "#A58123" }}
          >
            <b>FAQ</b>
          </Button>
          <NavLink to="/profile">
            <Button
              className="navigation-header-button-dark"
              style={{ background: "#E4BB4F", color: "white" }}
            >
              <b>Mentor Log In</b>
            </Button>
          </NavLink>
        </div>
      </div>
    </Header>
  );
}

export default MenteeNavHeader;
