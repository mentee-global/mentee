import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import { Input } from "antd";
import MenteeButton from "../MenteeButton";

import "../css/Home.scss";
import "../css/SignIn.scss"
import Honeycomb from "../../resources/honeycomb.png";

function Home() {
  const [authenticated, setAuth] = useState(true);
  const [email, setEmail] = useState();
  const [password, setPassword] = useState();
  const [inputClicked, setInputClicked] = useState(
    new Array(2).fill(false)
  ); // Sets one boolean for email and password

  function handleClick(index) {
    // Sets only the clicked input box to true to change color, else false
    let newClickedInput = new Array(2).fill(false);
    newClickedInput[index] = true;
    setInputClicked(newClickedInput);
  }

  function handleEmailChange(e) {
    setEmail(e.target.value);
  }

  function handlePasswordChange(e) {
    setPassword(e.target.value);
  }

  const HomePage = () => {
    if (authenticated) {
      return (<div className="signin-content">
        <div className="signin-container">
          <h1 className="signin-text">Sign In</h1>
          <div className={`signin-input-container${(inputClicked[0] ? "__clicked" : "")}`}>
            <Input
              className="signin-input"
              onClick={() => handleClick(0)}
              onChange={e => handleEmailChange(e)}
              bordered={false}
              placeholder="Email"
            />
          </div>
          <div className={`signin-input-container${(inputClicked[1] ? "__clicked" : "")}`}>
            <Input
              className="signin-input"
              onClick={() => handleClick(1)}
              onChange={e => handlePasswordChange(e)}
              bordered={false}
              placeholder="Password"
            />
          </div>
          <div className="signin-button">
            <MenteeButton content={<b>Login</b>} width={150} onClick={() => { }} />
          </div>
          <div className="signin-register-container">
            <div>Don't have an account?</div>
            <div className="signin-register-text">Register</div>
          </div>
        </div>
        <img className="home-honeycomb" src={Honeycomb} alt="" />
      </div>)
    } else {
      return (<div className="home-content">
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
      </div>)
    }
  }

  return (
    <div className="home-background">
      {HomePage()}
    </div>
  );
}

export default Home;
