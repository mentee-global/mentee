import React from "react";
import { NavLink } from "react-router-dom";
import { Layout, Menu } from "antd";
import {
  UserOutlined,
  VideoCameraOutlined,
  CalendarOutlined,
  HomeOutlined,
} from "@ant-design/icons";

import "./css/Navigation.scss";

const { Sider } = Layout;

function NavigationSidebar(props) {
  return (
    <Sider theme="light">
      <Menu theme="light" mode="inline" style={{ marginTop: "25%" }}>
        <Menu.Item
          key="home"
          className={
            props.selectedPage === "home"
              ? "navigation-menu-item-selected"
              : "navigation-menu-item"
          }
          icon={<HomeOutlined />}
        >
          <NavLink to="/" style={{ color: "black" }}>
            Home
          </NavLink>
        </Menu.Item>
        <Menu.Item
          key="appointments"
          className={
            props.selectedPage === "appointments"
              ? "navigation-menu-item-selected"
              : "navigation-menu-item"
          }
          icon={<CalendarOutlined />}
        >
          <NavLink to="/appointments" style={{ color: "black" }}>
            Appointments
          </NavLink>
        </Menu.Item>
        <Menu.Item
          key="videos"
          className={
            props.selectedPage === "videos"
              ? "navigation-menu-item-selected"
              : "navigation-menu-item"
          }
          icon={<VideoCameraOutlined />}
        >
          <NavLink to="/videos" style={{ color: "black" }}>
            Your Videos
          </NavLink>
        </Menu.Item>
        <Menu.Item
          key="profile"
          className={
            props.selectedPage === "profile"
              ? "navigation-menu-item-selected"
              : "navigation-menu-item"
          }
          icon={<UserOutlined />}
        >
          <NavLink to="/profile" style={{ color: "black" }}>
            Profile
          </NavLink>
        </Menu.Item>
      </Menu>
    </Sider>
  );
}

export default NavigationSidebar;
