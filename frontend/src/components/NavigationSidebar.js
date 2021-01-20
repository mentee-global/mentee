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
const pages = {
  appointments: {
    name: "Appointments",
    path: "/appointments",
    icon: <CalendarOutlined />,
  },
  videos: {
    name: "Your Videos",
    path: "/videos",
    icon: <VideoCameraOutlined />,
  },
  profile: {
    name: "Profile",
    path: "/profile",
    icon: <UserOutlined />,
  },
};

function NavigationSidebar(props) {
  const getMenuItemStyle = (page) => {
    return props.selectedPage === page
      ? "navigation-menu-item-selected"
      : "navigation-menu-item";
  };

  return (
    <Sider theme="light" className="navigation-sidebar">
      <Menu theme="light" mode="inline" style={{ marginTop: "25%" }}>
        {Object.keys(pages).map((page) => (
          <Menu.Item
            key={page}
            className={getMenuItemStyle(page)}
            style={menuItemMarginOverride}
            icon={pages[page]["icon"]}
          >
            <NavLink to={pages[page]["path"]} style={{ color: "black" }}>
              {pages[page]["name"]}
            </NavLink>
          </Menu.Item>
        ))}
      </Menu>
    </Sider>
  );
}

export default NavigationSidebar;
