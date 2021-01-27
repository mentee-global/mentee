import React from "react";
import { withRouter } from "react-router-dom";
import MenteeVerificationModal from "../MenteeVerificationModal";
import "../css/Home.scss";
import Logo from "../../resources/logo.png";
import Health from "../../resources/focus-for-health.svg";

function Home({ history }) {
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
          <MenteeVerificationModal
            content={<b>Find a Mentor</b>}
            theme="dark"
            onVerified={() => {
              history.push({
                pathname: "/gallery",
                state: { verified: true },
              });
            }}
          />
        </div>
        <img className="logo" src={Logo} alt="Adrinka Logo" />
      </div>
      <img
        className="focus-for-health"
        src={Health}
        alt="Focus for Health Logo"
      />
    </div>
  );
}

export default withRouter(Home);
