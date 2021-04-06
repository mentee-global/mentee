import React, { useEffect, useState } from "react";
import { NavLink, useHistory } from "react-router-dom";
import { logout, getMentorID, getAdminID } from "utils/auth.service";
import { useMediaQuery } from "react-responsive";
import { getAdmin } from "utils/api";
import { Avatar, Layout, Dropdown, Menu } from "antd";
import { UserOutlined, CaretDownOutlined } from "@ant-design/icons";

import "./css/Navigation.scss";

import MenteeLogo from "../resources/mentee.png";
import MenteeLogoSmall from "../resources/menteeSmall.png";

const { Header } = Layout;

function AdminNavHeader() {
  const isMobile = useMediaQuery({ query: `(max-width: 500px)` });
  const history = useHistory();

  const [admin, setAdmin] = useState();

  useEffect(() => {
    async function fetchData() {
      const adminId = await getAdminID();
      const admin = await getAdmin(adminId);

      if (admin) {
        setAdmin(admin);
      }
    }
    fetchData();
  }, []);

  const dropdownMenu = (
    <Menu className="dropdown-menu">
      <Menu.Item
        key="sign-out"
        onClick={() => logout().then(() => history.push("/"))}
      >
        <b>Sign Out</b>
      </Menu.Item>
    </Menu>
  );

  return (
    <Header className="navigation-header">
      <div>
        <NavLink to="/">
          <img
            src={isMobile ? MenteeLogoSmall : MenteeLogo}
            alt="Mentee"
            className="mentee-logo"
          />
        </NavLink>
      </div>
      <span>
        <div className="profile-caret">
          <Dropdown overlay={dropdownMenu} trigger={["click"]}>
            <CaretDownOutlined />
          </Dropdown>
        </div>
        {admin && (
          <>
            <div className="profile-name">
              <b>{admin.name}</b>
            </div>
          </>
        )}
      </span>
    </Header>
  );
}

export default AdminNavHeader;
