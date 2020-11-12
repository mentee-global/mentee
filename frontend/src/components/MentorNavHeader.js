import React from "react";
import { NavLink } from "react-router-dom";
import { Layout, Dropdown, Menu } from "antd";
import {
  UserOutlined,
  BellOutlined,
  CaretDownOutlined,
} from "@ant-design/icons";

import "./css/Navigation.scss";

import MenteeLogo from "../resources/mentee.png";

const { Header } = Layout;

function MentorNavHeader() {
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
      <Menu.Item key="sign-out">
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
        <div className="profile-name">
          <b>Name Here</b>
          <br />
          Position Here
        </div>
        <div className="profile-picture">
          <UserOutlined />
        </div>
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
