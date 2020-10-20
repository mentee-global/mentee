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
  const getMenuItemStyle = (page) => {
    return props.selectedPage === page
      ? "navigation-menu-item-selected"
      : "navigation-menu-item";
  };

  return (
    <Sider
      theme="light"
      style={{ boxShadow: "0px 2px 5px rgba(0, 0, 0, 0.244974)" }}
    >
      <Menu theme="light" mode="inline" style={{ marginTop: "25%" }}>
        <Menu.Item
          key="home"
          className={getMenuItemStyle("home")}
          icon={<HomeOutlined />}
        >
          <NavLink to="/" style={{ color: "black" }}>
            Home
          </NavLink>
        </Menu.Item>
        <Menu.Item
          key="appointments"
          className={getMenuItemStyle("appointments")}
          icon={<CalendarOutlined />}
        >
          <NavLink to="/appointments" style={{ color: "black" }}>
            Appointments
          </NavLink>
        </Menu.Item>
        <Menu.Item
          key="videos"
          className={getMenuItemStyle("videos")}
          icon={<VideoCameraOutlined />}
        >
          <NavLink to="/videos" style={{ color: "black" }}>
            Your Videos
          </NavLink>
        </Menu.Item>
        <Menu.Item
          key="profile"
          className={getMenuItemStyle("profile")}
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
