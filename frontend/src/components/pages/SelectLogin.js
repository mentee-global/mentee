import React from "react";
import MentorImage from "resources/MentorLogin.svg";
import MenteeLogin from "resources/MenteeLogin.svg";
import AdminImage from "resources/AdminLogin.svg";
import "components/css/SelectLogin.scss";

function SelectLogin() {
  return (
    <div className="select-login-page">
      <div className="select-login-header">
        Welcome! What kind of user are you?
      </div>
      <div className="select-login-container">
        <div className="select-login-elem">
          <img src={MenteeLogin} alt="Mentee Image" className="select-image" />
          <div className="select-text">Mentee</div>
        </div>
        <div className="select-login-elem">
          <img src={MentorImage} alt="Mentor Image" className="select-image" />
          <div className="select-text">Mentor</div>
        </div>
        <div className="select-login-elem">
          <img src={AdminImage} alt="Admin Image" className="select-image" />
          <div className="select-text">Admin</div>
        </div>
      </div>
    </div>
  );
}

export default SelectLogin;
