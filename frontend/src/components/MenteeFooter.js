import React, { useEffect, useState } from "react";
import { NavLink, useHistory } from "react-router-dom";
import { logout, getMentorID, getAdminID } from "utils/auth.service";
import { Layout, Dropdown, Menu } from "antd";


const { Footer } = Layout;

function MenteeFooter() {
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

export default withRouter(MenteeFooter);
