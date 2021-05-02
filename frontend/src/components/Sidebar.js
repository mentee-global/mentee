import React, { useState } from "react";
import { useMediaQuery } from "react-responsive";
import { NavLink } from "react-router-dom";
import { Layout, Menu } from "antd";
import usePersistedState from "../utils/hooks/usePersistedState";
import "./css/Navigation.scss";

const { Sider } = Layout;
const { SubMenu } = Menu;

const menuItemMarginOverride = { marginTop: "0px", marginBottom: "0px" };

function Sidebar({ subMenus, pages, selectedPage }) {
  const isMobile = useMediaQuery({ query: `(max-width: 768px)` });
  const [collapsed, setCollapsed] = usePersistedState(
    "collapsedNavbar",
    isMobile
  );

  const getMenuItemStyle = (page) => {
    return selectedPage === page
      ? "navigation-menu-item-selected"
      : "navigation-menu-item";
  };

  return (
    <Sider
      collapsible
      theme="light"
      className="navigation-sidebar"
      collapsed={collapsed}
      onCollapse={() => setCollapsed(!collapsed)}
    >
      <Menu
        theme="light"
        mode="inline"
        style={{ marginTop: "25%" }}
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
                <NavLink
                  to={pages[page]["path"]}
                  style={collapsed ? { color: "white" } : { color: "black" }}
                >
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

export default Sidebar;
