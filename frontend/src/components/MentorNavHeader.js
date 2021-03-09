import React, { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { useMediaQuery } from "react-responsive";
import { logout, getMentorID } from "utils/auth.service";
import { fetchMentorByID } from "utils/api";
import { Avatar, Layout, Dropdown, Menu } from "antd";
import { UserOutlined, CaretDownOutlined } from "@ant-design/icons";

import "./css/Navigation.scss";

import MenteeLogo from "../resources/mentee.png";
import MenteeLogoSmall from "../resources/menteeSmall.png";

const { Header } = Layout;

function MentorNavHeader() {
  const [mentor, setMentor] = useState();
  const isMobile = useMediaQuery({ query: `(max-width: 500px)` });
  useEffect(() => {
    async function getMentor() {
      const mentorID = await getMentorID();
      const mentorData = await fetchMentorByID(mentorID);
      if (mentorData) {
        setMentor(mentorData);
      }
    }
    getMentor();
  }, []);

  const dropdownMenu = (
    <Menu className="dropdown-menu">
      <Menu.Item key="edit-profile">
        <NavLink to="/profile">
          <b>Edit Profile</b>
        </NavLink>
      </Menu.Item>
      <Menu.Divider />
      <Menu.Item key="sign-out" onClick={logout}>
        <NavLink to="/">
          <b>Sign Out</b>
        </NavLink>
      </Menu.Item>
    </Menu>
  );

  return (
    <Header className="navigation-header">
      <div>
        <NavLink to="/">
          <img
            src={isMobile ? MenteeLogoSmall : MenteeLogo}
            alt="Mentee"
            className="mentee-logo"
          />
        </NavLink>
      </div>
      <span>
        <div className="profile-caret">
          <Dropdown overlay={dropdownMenu} trigger={["click"]}>
            <CaretDownOutlined />
          </Dropdown>
        </div>
        {mentor && (
          <>
            <div className="profile-name">
              <b>{mentor.name}</b>
              <br />
              {mentor.professional_title}
            </div>
            <div className="profile-picture">
              <Avatar
                size={40}
                src={mentor.image && mentor.image.url}
                icon={<UserOutlined />}
              />
            </div>
          </>
        )}
      </span>
    </Header>
  );
}

export default MentorNavHeader;
