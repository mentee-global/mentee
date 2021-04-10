import React, { useEffect, useState } from "react";
import { NavLink, useHistory } from "react-router-dom";
import { logout, getMentorID } from "utils/auth.service";
import { useMediaQuery } from "react-responsive";
import { fetchMentorByID } from "utils/api";
import { Avatar, Layout, Dropdown, Menu } from "antd";
import { UserOutlined, CaretDownOutlined } from "@ant-design/icons";
import useAuth from "utils/hooks/useAuth";

import "./css/Navigation.scss";

import MenteeLogo from "../resources/mentee.png";
import MenteeLogoSmall from "../resources/menteeSmall.png";

const { Header } = Layout;

function MentorNavHeader() {
  const isMobile = useMediaQuery({ query: `(max-width: 500px)` });
  const history = useHistory();
  const {onAuthStateChanged} = useAuth();

  const [mentor, setMentor] = useState();

  useEffect(() => {
    async function getMentor() {
      const mentorID = await getMentorID();
      const mentorData = await fetchMentorByID(mentorID);
      if (mentorData) {
        setMentor(mentorData);
      }
    }
    
    onAuthStateChanged(getMentor);
  }, []);

  const dropdownMenu = (
    <Menu className="dropdown-menu">
      <Menu.Item key="edit-profile">
        <NavLink to="/profile">
          <b>Edit Profile</b>
        </NavLink>
      </Menu.Item>
      <Menu.Divider />
      <Menu.Item
        key="sign-out"
        onClick={() => logout().then(() => history.push("/"))}
      >
        <b>Sign Out</b>
      </Menu.Item>
    </Menu>
  );

  return (
    <Header className="navigation-header">
      <NavLink to="/">
        <img
          src={isMobile ? MenteeLogoSmall : MenteeLogo}
          alt="Mentee"
          className="mentee-logo"
        />
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
    </Header>
  );
}

export default MentorNavHeader;
