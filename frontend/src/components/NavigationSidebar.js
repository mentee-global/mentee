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
const menuItemMarginOverride = { marginTop: "0px", marginBottom: "0px" };

function NavigationSidebar(props) {
  const getMenuItemStyle = (page) => {
    return props.selectedPage === page
      ? "navigation-menu-item-selected"
      : "navigation-menu-item";
  };

  return (
<<<<<<< HEAD
    <Sider
      theme="light"
      style={{ boxShadow: "0px 2px 5px rgba(0, 0, 0, 0.244974)" }}
    >
=======
    <Sider theme="light" className="sidebar">
>>>>>>> origin/master
      <Menu theme="light" mode="inline" style={{ marginTop: "25%" }}>
        <Menu.Item
          key="home"
          className={getMenuItemStyle("home")}
          style={menuItemMarginOverride}
          icon={<HomeOutlined />}
        >
          <NavLink to="/" style={{ color: "black" }}>
            Home
          </NavLink>
        </Menu.Item>
        <Menu.Item
          key="appointments"
          className={getMenuItemStyle("appointments")}
          style={menuItemMarginOverride}
          icon={<CalendarOutlined />}
        >
          <NavLink to="/appointments" style={{ color: "black" }}>
            Appointments
          </NavLink>
        </Menu.Item>
        <Menu.Item
          key="videos"
          className={getMenuItemStyle("videos")}
          style={menuItemMarginOverride}
          icon={<VideoCameraOutlined />}
        >
          <NavLink to="/videos" style={{ color: "black" }}>
            Your Videos
          </NavLink>
        </Menu.Item>
        <Menu.Item
          key="profile"
          className={getMenuItemStyle("profile")}
          style={menuItemMarginOverride}
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
