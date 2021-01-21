import React from "react";
import { NavLink } from "react-router-dom";
import MenteeButton from "../MenteeButton";

import "../css/Home.scss";
import Logo from "../../resources/logo.svg";
import Health from "../../resources/focus-for-health.svg"

function Home() {
  return (
    <div className="home-background">
      <div className="home-content">
        <div className="home-text-container">
          <h1 className="home-header">Welcome to Mentee</h1>
          <p className="home-text">
            Find a mentors from a diverse pool of backgrounds with experience in
            23+ specializations, 15 different languages at locations all across
            the world.
          </p>
          <br />
          <NavLink to="/gallery">
            <MenteeButton theme="dark" content={<b>Find a Mentor</b>} />
          </NavLink>
        </div>
        <img className="home-honeycomb" src={Logo} alt="Adrinka Logo" />
      </div>
      <img className="focus-for-health" src={Health} alt="" />
    </div>
  );
}

export default Home;
