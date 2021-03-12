import React, { useState } from "react";
<<<<<<< HEAD
import { useMediaQuery } from "react-responsive";
=======
>>>>>>> 7d1f975954ec0206455f04cc5effb8a660328e79
import { NavLink } from "react-router-dom";
import { Layout, Menu } from "antd";
import { useMediaQuery } from "react-responsive";
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
<<<<<<< HEAD
  const isMobile = useMediaQuery({ query: `(max-width: 768px)` });
  const [collapsed, setCollapsed] = useState(isMobile);
=======
  const isMobile = useMediaQuery({ query: `(max-width: 500px)` });
  const [collapsed, setCollapsed] = useState(true);
>>>>>>> 7d1f975954ec0206455f04cc5effb8a660328e79
  const getMenuItemStyle = (page) => {
    return props.selectedPage === page
      ? "navigation-menu-item-selected"
      : "navigation-menu-item";
  };

  return (
    <Sider
      collapsible
<<<<<<< HEAD
      collapsed={collapsed}
      theme="light"
      className="navigation-sidebar"
      onCollapse={(collapsed) => setCollapsed(collapsed)}
=======
      theme="light"
      className="navigation-sidebar"
      collapsed={collapsed}
      onCollapse={(col) => setCollapsed(col)}
>>>>>>> 7d1f975954ec0206455f04cc5effb8a660328e79
    >
      <Menu theme="light" mode="inline" style={{ marginTop: "25%" }}>
        {Object.keys(pages).map((page) => (
          <Menu.Item
            key={page}
            className={getMenuItemStyle(page)}
            style={menuItemMarginOverride}
            icon={pages[page]["icon"]}
          >
            <NavLink
              to={pages[page]["path"]}
              style={collapsed ? { color: "white" } : { color: "black" }}
            >
              {pages[page]["name"]}
            </NavLink>
          </Menu.Item>
        ))}
      </Menu>
    </Sider>
  );
}

export default NavigationSidebar;
