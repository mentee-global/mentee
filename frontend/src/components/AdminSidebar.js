import React from "react";
import { NavLink } from "react-router-dom";
import { Layout, Menu } from "antd";
import {
  TeamOutlined,
  DatabaseOutlined,
  UsergroupAddOutlined,
} from "@ant-design/icons";

import "./css/Navigation.scss";

const { Sider } = Layout;
const { SubMenu } = Menu;

const menuItemMarginOverride = { marginTop: "0px", marginBottom: "0px" };
const pages = {
  manageUsers: {
    name: "Manage Users",
    path: "/manage-users",
    icon: <TeamOutlined />,
    isSubMenu: false,
  },
  applications: {
    name: "Applications",
    path: "/organizer",
    icon: <UsergroupAddOutlined />,
    isSubMenu: false,
  },
  reports: {
    name: "Reports",
    isSubMenu: true,
    icon: <DatabaseOutlined />,
    items: {
      accountData: {
        name: "Account Data",
        path: "/account-data",
      },
      allAppointments: {
        name: "All Appointments",
        path: "/all-appointments",
      },
    },
  },
};

const subMenus = ["reports"];

function AdminSidebar(props) {
  const getMenuItemStyle = (page) => {
    return props.selectedPage === page
      ? "navigation-menu-item-selected"
      : "navigation-menu-item";
  };

  return (
    <Sider theme="light" className="navigation-sidebar">
      <Menu
        theme="light"
        mode="inline"
        style={{ marginTop: "20%" }}
        defaultOpenKeys={subMenus}
      >
        {Object.keys(pages).map((page) => {
          if (pages[page]["isSubMenu"]) {
            const subItems = pages[page]["items"];
            return (
              <SubMenu
                className="navigation-submenu"
                key={page}
                theme="light"
                icon={pages[page]["icon"]}
                title={pages[page]["name"]}
              >
                {Object.keys(subItems).map((subPage) => (
                  <Menu.Item
                    key={subPage}
                    className={getMenuItemStyle(subPage)}
                    style={menuItemMarginOverride}
                    icon={subItems[subPage]["icon"]}
                  >
                    <NavLink
                      to={subItems[subPage]["path"]}
                      style={{ color: "black" }}
                    >
                      {subItems[subPage]["name"]}
                    </NavLink>
                  </Menu.Item>
                ))}
              </SubMenu>
            );
          } else {
            return (
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
            );
          }
        })}
      </Menu>
    </Sider>
  );
}

export default AdminSidebar;
