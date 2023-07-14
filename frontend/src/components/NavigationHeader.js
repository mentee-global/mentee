import React, { useState } from "react";
import { Avatar, Layout, theme, Dropdown, Space } from "antd";
import { withRouter, useHistory } from "react-router-dom";
import { useMediaQuery } from "react-responsive";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import NotificationBell from "components/NotificationBell";
import LanguageDropdown from "components/LanguageDropdown";
import { logout } from "utils/auth.service";
import { useAuth } from "utils/hooks/useAuth";
import { resetUser } from "features/userSlice";
import "components/css/Navigation.scss";
import { ACCOUNT_TYPE } from "utils/consts";
import { MenuFoldOutlined, UserOutlined } from "@ant-design/icons";
import usePersistedState from "utils/hooks/usePersistedState";

const { Header } = Layout;

function NavigationHeader() {
  const {
    token: { colorBgContainer },
  } = theme.useToken();
  const { t } = useTranslation();
  const { resetRoleState } = useAuth();
  const history = useHistory();
  const dispatch = useDispatch();
  const { user, role } = useSelector((state) => state.user);
  const isMobile = useMediaQuery({ query: `(max-width: 500px)` });
  const [openDropdown, setOpenDropdown] = useState(false);
  const [collapsed, setCollapsed] = usePersistedState("collapsed", false);

  const logoutUser = () => {
    logout().then(() => {
      resetRoleState();
      dispatch(resetUser());
      history.push("/");
    });
  };

  // const getUserType = () => {
  //   switch (role) {
  //     case ACCOUNT_TYPE.MENTOR:
  //       return user ? user.professional_title : t("common.mentor");
  //     case ACCOUNT_TYPE.MENTEE:
  //       return t("common.mentee");
  //     case ACCOUNT_TYPE.ADMIN:
  //       return t("common.admin");
  //     case ACCOUNT_TYPE.PARTNER:
  //       return t("common.partner");
  //     default:
  //       return "";
  //   }
  // };

  // const dropdownMenu = (
  //   <Menu>
  //     <Menu.Item key="edit-profile">
  //       <NavLink to="/profile">{t("navHeader.editProfile")}</NavLink>
  //     </Menu.Item>
  //     <Menu.Divider />
  //     <Menu.Item key="sign-out" onClick={logoutUser}>
  //       {t("common.logout")}
  //     </Menu.Item>
  //   </Menu>
  // );

  const dropdownMenu = [
    {
      key: "edit-profile",
      label: (
        <span onClick={() => history.push("/profile")}>
          {t("navHeader.editProfile")}
        </span>
      ),
    },
    {
      type: "divider",
    },
    {
      key: "sign-out",
      label: <span onClick={() => logoutUser()}>{t("common.logout")}</span>,
    },
  ];

  return (
    <Header
      className="navigation-header"
      style={{ background: colorBgContainer, display: "flex" }}
      theme="light"
    >
      {isMobile && (
        <MenuFoldOutlined onClick={() => setCollapsed(!collapsed)} />
      )}
      <div style={{ flex: "1 1 0%" }} />
      <Space size="middle" style={{ lineHeight: "100%" }}>
        <NotificationBell />
        <Dropdown
          menu={{
            items: dropdownMenu,
          }}
          onOpenChange={() => setOpenDropdown(!openDropdown)}
          open={openDropdown}
          placement="bottom"
        >
          <Space>
            <Avatar
              size={24}
              src={user.image && user.image.url}
              icon={<UserOutlined />}
            />
            {user.name}
          </Space>
        </Dropdown>
        {role !== ACCOUNT_TYPE.ADMIN && <LanguageDropdown />}
      </Space>
    </Header>
  );
}

export default withRouter(NavigationHeader);
