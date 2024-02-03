import React, { useEffect, useState } from "react";
import { Avatar, Layout, theme, Dropdown, Space, Tooltip } from "antd";
import { withRouter, useHistory } from "react-router-dom";
import { useMediaQuery } from "react-responsive";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import NotificationBell from "components/NotificationBell";
import LanguageDropdown from "components/LanguageDropdown";
import { logout } from "utils/auth.service";
import { useAuth } from "utils/hooks/useAuth";
import { collapse, resetUser } from "features/userSlice";
import "components/css/Navigation.scss";
import { ACCOUNT_TYPE, ACCOUNT_TYPE_LABELS, REDIRECTS } from "utils/consts";
import {
  FormOutlined,
  MenuFoldOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { fetchUser } from "features/userSlice";

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
  const isMobile = useMediaQuery({ query: `(max-width: 761px)` });
  const [openDropdown, setOpenDropdown] = useState(false);
  const supportUserID = localStorage.getItem("support_user_id");

  const logoutUser = () => {
    logout().then(() => {
      resetRoleState();
      dispatch(resetUser());
      history.push("/");
    });
  };

  const goBackSupportDashbaord = (support_User_ID) => {
    localStorage.removeItem("support_user_id");
    localStorage.setItem("role", ACCOUNT_TYPE.SUPPORT);
    localStorage.setItem("profileId", support_User_ID);
    resetRoleState(support_User_ID, ACCOUNT_TYPE.SUPPORT);
    dispatch(
      fetchUser({
        id: support_User_ID,
        role: ACCOUNT_TYPE.SUPPORT,
      })
    );
    history.push(REDIRECTS[ACCOUNT_TYPE.SUPPORT]);
  };

  const getDropdownMenuItems = (support_User_ID) => {
    const renderEdit =
      role !== ACCOUNT_TYPE.ADMIN &&
      role !== ACCOUNT_TYPE.GUEST &&
      role !== ACCOUNT_TYPE.SUPPORT;
    const items = [];
    if (renderEdit) {
      items.push({
        key: "edit-profile",
        label: (
          <span onClick={() => history.push("/profile")}>
            {t("navHeader.editProfile")}
          </span>
        ),
      });
      items.push({
        type: "divider",
      });
    }
    if (!support_User_ID) {
      items.push({
        key: "sign-out",
        label: <span onClick={() => logoutUser()}>{t("common.logout")}</span>,
      });
    } else {
      items.push({
        key: "",
        label: (
          <span onClick={() => goBackSupportDashbaord(support_User_ID)}>
            {t("common.stopImpersonating")}
          </span>
        ),
      });
    }

    return items;
  };

  // TODO: Add a proper admin notifications dropdown
  return (
    <Header
      className="navigation-header"
      style={{ background: colorBgContainer, display: "flex" }}
      theme="light"
    >
      {isMobile && <MenuFoldOutlined onClick={() => dispatch(collapse())} />}
      <div style={{ flex: "1 1 0%" }} />
      {supportUserID && user && (
        <div style={{ marginRight: "15px" }}>
          The session is being impersonated as user {user.name} and role{" "}
          {ACCOUNT_TYPE_LABELS[role]}
        </div>
      )}
      <Space size="middle" style={{ lineHeight: "100%" }}>
        {role !== ACCOUNT_TYPE.GUEST && role !== ACCOUNT_TYPE.SUPPORT && (
          <NotificationBell />
        )}
        <Dropdown
          menu={{
            items: getDropdownMenuItems(supportUserID),
          }}
          onOpenChange={() => setOpenDropdown(!openDropdown)}
          open={openDropdown}
          placement="bottom"
        >
          <Space>
            <Avatar size={24} src={user?.image?.url} icon={<UserOutlined />} />
            {user?.name}
          </Space>
        </Dropdown>
        {role !== ACCOUNT_TYPE.ADMIN && <LanguageDropdown />}
        <Tooltip title={t("common.bug")}>
          <FormOutlined
            onClick={() => window.open("https://forms.gle/DCCFR6du9YckbnhY8")}
          />
        </Tooltip>
      </Space>
    </Header>
  );
}

export default withRouter(NavigationHeader);
