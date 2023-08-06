import React, { useState } from "react";
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
import { ACCOUNT_TYPE } from "utils/consts";
import {
  FormOutlined,
  MenuFoldOutlined,
  UserOutlined,
} from "@ant-design/icons";

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

  const logoutUser = () => {
    logout().then(() => {
      resetRoleState();
      dispatch(resetUser());
      history.push("/");
    });
  };

  const getDropdownMenuItems = () => {
    const renderEdit =
      role !== ACCOUNT_TYPE.ADMIN && role !== ACCOUNT_TYPE.GUEST;
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
    items.push({
      key: "sign-out",
      label: <span onClick={() => logoutUser()}>{t("common.logout")}</span>,
    });
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
      <Space size="middle" style={{ lineHeight: "100%" }}>
        {role !== ACCOUNT_TYPE.GUEST && <NotificationBell />}
        <Dropdown
          menu={{
            items: getDropdownMenuItems(),
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
