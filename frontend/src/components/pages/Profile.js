import React from "react";
import { Link } from "react-router-dom";
import {
  UserOutlined,
  EnvironmentOutlined,
  CommentOutlined,
  LinkOutlined,
  LinkedinOutlined,
  MailOutlined,
  PhoneOutlined,
} from "@ant-design/icons";
import { Button } from "antd";

import "../css/Profile.scss";

function Profile() {
  // placeholder list data - will be populated later by querying DB
  const methods = ["Zoom", "Bluejeans"];
  const languages = ["English", "x86 ASM"];
  const specializations = ["Data", "Really angry commit messages"];
  const educations = [
    {
      education_level: "Bachelor's Degree",
      major: "Computer Engineering",
      school: "University of Illinois at Urbana-Champaign",
      year: 2021,
    },
    {
      education_level: "Bachelor's Degree",
      major: "Computer Engineering",
      school: "University of Illinois at Urbana-Champaign",
      year: 2021,
    },
  ];

  const getMeetingMethods = (methods) => {
    return methods.map((method, idx) => (idx === 0 ? method : " | " + method));
  };

  const getLanguages = (languages) => {
    return languages.map((language, idx) =>
      idx === 0 ? language : " • " + language
    );
  };

  const getSpecializationTags = (specializations) => {
    return specializations.map((specialization, idx) =>
      idx === 0 ? (
        <div className="mentor-specialization-tag-first">{specialization}</div>
      ) : (
        <div className="mentor-specialization-tag">{specialization}</div>
      )
    );
  };

  const getEducations = (educations) => {
    return educations.map((education) => (
      <div className="mentor-profile-education">
        <b>{education["school"]}</b>
        <br />
        {education["education_level"] + ", " + education["major"]}
        <br />
        {education["year"]}
      </div>
    ));
  };

  return (
    <div className="background-color-strip">
      <div className="mentor-profile-content">
        <UserOutlined style={{ fontSize: "100px" }} />
        <div className="mentor-profile-content-flexbox">
          <div className="mentor-profile-info">
            <div className="mentor-profile-name">
              Mentor Name
              <Button
                className="mentor-profile-edit-button"
                style={{ background: "#E4BB4F", color: "#FFFFFF" }}
              >
                <b>Edit Profile</b>
              </Button>
            </div>
            <div className="mentor-profile-heading">
              Title <t className="yellow-dot">•</t> {getMeetingMethods(methods)}
            </div>
            <div>
              <span>
                <EnvironmentOutlined className="mentor-profile-tag-first" />
                Location
              </span>
              <span>
                <CommentOutlined className="mentor-profile-tag" />
                {getLanguages(languages)}
              </span>
              <span>
                <LinkOutlined className="mentor-profile-tag" />
                website.com
              </span>
              <span>
                <LinkedinOutlined className="mentor-profile-tag" />
                LinkedIn
              </span>
            </div>
            <br />
            <div className="mentor-profile-heading">
              <b>About</b>
            </div>
            <div className="mentor-profile-about">
              About text About text About text About text About text About text
              About text About text About text About text About text About text
              About text About text About text About text About text About text
              About text About text About text About text About text About text
              About text About text About text About text About text About text
              About text About text About text About text About text About text
              About text About text About text About text About text About text
              About text About text About text About text About text About text
            </div>
            <br />
            <div className="mentor-profile-heading">
              <b>Specializations</b>
            </div>
            <div>{getSpecializationTags(specializations)}</div>
            <br />
            <div className="mentor-profile-heading">
              <b>Education</b>
            </div>
            <div>{getEducations(educations)}</div>
          </div>
          <fieldset className="mentor-profile-contact">
            <legend className="mentor-profile-contact-header">
              Contact Info
            </legend>
            <MailOutlined className="mentor-profile-contact-icon" />
            mentoremail@email.com
            <br />
            <PhoneOutlined className="mentor-profile-contact-icon" />
            1-234-567-8901
            <br />
            <br />
            <Link to="/" className="mentor-profile-contact-edit">
              Edit
            </Link>
          </fieldset>
        </div>
      </div>
    </div>
  );
}

export default Profile;
