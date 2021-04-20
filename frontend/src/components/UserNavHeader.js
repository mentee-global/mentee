import React, { useEffect, useState } from "react";
import { NavLink, useHistory } from "react-router-dom";
import { logout } from "utils/auth.service";
import { useMediaQuery } from "react-responsive";
import { fetchAccountById } from "utils/api";
import { Avatar, Layout, Dropdown, Menu } from "antd";
import { UserOutlined, CaretDownOutlined } from "@ant-design/icons";
import useAuth from "utils/hooks/useAuth";
import { ACCOUNT_TYPE } from "utils/consts";

import "./css/Navigation.scss";

import MenteeLogo from "../resources/mentee.png";
import MenteeLogoSmall from "../resources/menteeSmall.png";

const { Header } = Layout;

function UserNavHeader() {
  const isMobile = useMediaQuery({ query: `(max-width: 500px)` });
  const history = useHistory();
  const { onAuthStateChanged, resetRoleState, profileId, role } = useAuth();
  const [user, setUser] = useState();

  useEffect(() => {
    async function getUser() {
      const userData = await fetchAccountById(profileId, role);
      if (userData) {
        setUser(userData);
      }
    }

    // Don't fetch if guest
    if (role == ACCOUNT_TYPE.GUEST || user) return;
    onAuthStateChanged(getUser);
  }, [role]);

  const logoutUser = () => {
    logout().then(() => {
      resetRoleState();
      history.push("/");
    });
  };

  const dropdownMenu = (
    <Menu className="dropdown-menu">
      <Menu.Item key="edit-profile">
        <NavLink to="/profile">
          <b>Edit Profile</b>
        </NavLink>
      </Menu.Item>
      <Menu.Divider />
      <Menu.Item key="sign-out" onClick={logoutUser}>
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
        {user && (
          <>
            <div className="profile-name">
              <b>{user.name}</b>
              <br />
              {user.professional_title}
            </div>
            <div className="profile-picture">
              <Avatar
                size={40}
                src={user.image && user.image.url}
                icon={<UserOutlined />}
              />
            </div>
          </>
        )}
      </span>
    </Header>
  );
}

export default UserNavHeader;
