import React from "react";
import { useHistory } from "react-router-dom";
import MenteeVerificationModal from "../MenteeVerificationModal";
import "../css/Home.scss";
import Honeycomb from "../../resources/honeycomb.png";

function Home() {
  const history = useHistory();

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
        <img className="home-honeycomb" src={Honeycomb} alt="" />
      </div>
    </div>
  );
}

export default Home;
