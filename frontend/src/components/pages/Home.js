import React from "react";
import { NavLink } from "react-router-dom";
import { Button } from "antd";
import MenteeButton from "../MenteeButton"

import "../css/Home.scss";
import Honeycomb from "../../resources/honeycomb.png";

function Home() {
  return (
    <div className="home-background">
      <div className="home-content">
        <div className="home-text-container">
          <h1 className="home-header">Welcome to Mentee</h1>
          <p className="home-text">
            Find a mentors from a diverse pool of backgrounds with experience in
            18+ specializations, 15 different languages at locations all across
            the country.
          </p>
          <br />
          <NavLink to="/gallery">
            <MenteeButton theme="dark" content={<b>Find a Mentor</b>} />
          </NavLink>
        </div>
        <img className="home-honeycomb" src={Honeycomb} alt="" />
      </div>
    </div>
  );
}

export default Home;
