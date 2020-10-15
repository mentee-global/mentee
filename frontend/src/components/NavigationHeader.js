import React from "react";
import { NavLink } from "react-router-dom";
import { Layout, Button, Dropdown, Menu } from "antd";
import {
  UserOutlined,
  BellOutlined,
  CaretDownOutlined,
} from "@ant-design/icons";

import "./css/Navigation.scss";

import mentee_logo from "../resources/mentee.png";

const { Header } = Layout;

function NavigationHeader() {
  const dropdownMenu = (
    <Menu className="dropdown-menu">
      <Menu.Item key="edit-profile">
        <b>Edit Profile</b>
      </Menu.Item>
      <Menu.Divider />
      <Menu.Item key="settings">
        <b>Settings</b>
      </Menu.Item>
      <Menu.Divider />
      <Menu.Item key="sign-out">
        <b>Sign Out</b>
      </Menu.Item>
    </Menu>
  );

  return (
    <Header className="navigation-header">
      <img src={mentee_logo} alt="Mentee" className="mentee-logo" />
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

export default NavigationHeader;
