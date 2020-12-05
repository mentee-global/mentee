import React, { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { logout, getMentorID } from "utils/auth.service";
import { fetchMentorByID } from "utils/api";
import { Avatar, Layout, Dropdown, Menu } from "antd";
import {
  UserOutlined,
  BellOutlined,
  CaretDownOutlined,
} from "@ant-design/icons";

import "./css/Navigation.scss";

import MenteeLogo from "../resources/mentee.png";

const { Header } = Layout;

function MentorNavHeader() {
  const [mentor, setMentor] = useState();

  useEffect(() => {
    const mentorID = getMentorID();
    async function getMentor() {
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
      <Menu.Item key="settings">
        <NavLink to="/">
          <b>Settings</b>
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
      <NavLink to="/">
        <img src={MenteeLogo} alt="Mentee" className="mentee-logo" />
      </NavLink>
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
      <div className="notification-bell">
        <NavLink to="/" className="notification-bell">
          <BellOutlined />
        </NavLink>
      </div>
    </Header>
  );
}

export default MentorNavHeader;
