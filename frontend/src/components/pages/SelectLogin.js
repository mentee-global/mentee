import React, { useEffect, useState } from "react";
import { useHistory } from "react-router-dom";
import { ACCOUNT_TYPE } from "utils/consts";
import MentorImage from "resources/MentorLogin.svg";
import MenteeLogin from "resources/MenteeLogin.svg";
import AdminImage from "resources/AdminLogin.svg";
import "components/css/SelectLogin.scss";

const Logins = Object.freeze({
  mentee: {
    title: "Mentee",
    type: ACCOUNT_TYPE.MENTEE,
    redirect: "/appointments",
  },
  mentor: {
    title: "Mentor",
    type: ACCOUNT_TYPE.MENTOR,
    redirect: "/appointments",
  },
  admin: {
    title: "Admin",
    type: ACCOUNT_TYPE.ADMIN,
    redirect: "/account-data",
  },
});

function SelectLogin() {
  const history = useHistory();
  const [displaySelect, setDisplaySelect] = useState(false);

  const handleDisplayImages = () => {
    setDisplaySelect(true);
  };

  const handleSelect = (key) => {
    history.push({
      pathname: "/login",
      state: { ...Logins[key] },
    });
  };

  return (
    <div className="select-login-page">
      <div
        className="select-login-header"
        style={{ visibility: displaySelect ? "visible" : "hidden" }}
      >
        Welcome! What kind of user are you?
      </div>
      <div
        className="select-login-container"
        style={{ visibility: displaySelect ? "visible" : "hidden" }}
      >
        <div
          className="select-login-elem"
          onClick={() => {
            handleSelect("mentee");
          }}
        >
          <img src={MenteeLogin} alt="Mentee Image" className="select-image" />
          <div className="select-text">Mentee</div>
        </div>
        <div
          className="select-login-elem"
          onClick={() => {
            handleSelect("mentor");
          }}
        >
          <img src={MentorImage} alt="Mentor Image" className="select-image" />
          <div className="select-text">Mentor</div>
        </div>
        <div
          className="select-login-elem"
          onClick={() => {
            handleSelect("admin");
          }}
        >
          <img
            src={AdminImage}
            alt="Admin Image"
            className="select-image"
            onLoad={handleDisplayImages}
          />
          <div className="select-text">Admin</div>
        </div>
      </div>
    </div>
  );
}

export default SelectLogin;
