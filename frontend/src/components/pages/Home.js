import React, { useState } from "react";
import { NavLink, withRouter } from "react-router-dom";
import MenteeVerificationModal from "../MenteeVerificationModal";
import "../css/Home.scss";
import Logo from "../../resources/logo.png";
import Health from "../../resources/focus-for-health.svg";
import UploadEmails from "../UploadEmails";
import MenteeButton from "../MenteeButton.js";

function Home({ history }) {
  const [modalVisible, setModalVisible] = useState(false);

  const OpenModal = () => {
    setModalVisible(true);
  };


  return (
    <div className="home-background">
      <div className="home-content">
        <div className="home-text-container">
          <h1 className="home-header">Welcome to MENTEE</h1>
          <p className="home-text">Find a global mentor now...</p>
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
          <MenteeButton
          content={<b>Open Modal</b>}
          onClick={() => OpenModal()}
          ></MenteeButton>
          <UploadEmails
            setModalVisible={setModalVisible}
            modalVisible={modalVisible}
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
