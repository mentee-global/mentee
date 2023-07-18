import React from "react";
import { Menu, Layout } from "antd";
import { NavLink, withRouter, useHistory } from "react-router-dom";
import { useMediaQuery } from "react-responsive";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import useSidebars from "utils/hooks/useSidebars";
import { ReactComponent as Logo } from "resources/mentee.svg";
import { ReactComponent as SmallLogo } from "resources/menteeSmall.svg";
import "components/css/Navigation.scss";
import { ACCOUNT_TYPE } from "utils/consts";
import usePersistedState from "utils/hooks/usePersistedState";

const { Sider } = Layout;

function NavigationSider() {
  const { t } = useTranslation();
  const history = useHistory();
  const [collapsed, setCollapsed] = usePersistedState("collapsed", false);
  const { role } = useSelector((state) => state.user);
  const sidebarItems = useSidebars(role, t);
  const isMobile = useMediaQuery({ query: `(max-width: 576px)` });
  const currentPage = [history.location.pathname.split("/")[1]];

  const onClick = ({ key }) => {
    history.push(`/${key}`);
  };

  const defaultRoute = () => {
    switch (parseInt(role)) {
      case ACCOUNT_TYPE.ADMIN:
        return "/account-data";
      case ACCOUNT_TYPE.MENTOR:
        return "/appointments";
      case ACCOUNT_TYPE.MENTEE:
        return "/mentee-appointments";
      case ACCOUNT_TYPE.PARTNER:
        return "/partner-gallery";
      default:
        return "/";
    }
  };

  return (
    <Sider
      theme="light"
      className="navigation-sidebar"
      style={{
        overflow: "auto",
        height: "100vh",
        position: "sticky",
        top: 0,
        left: 0,
      }}
      collapsed={collapsed}
      breakpoint="lg"
      collapsedWidth={isMobile ? "0" : "48"}
      collapsible
      // onBreakpoint={(broken) => {
      //   console.log(broken);
      // }}
      onCollapse={() => setCollapsed(!collapsed)}
    >
      <NavLink to={defaultRoute()}>
        {/* TODO: Add a smooth transition of logo change */}
        {!collapsed ? (
          <Logo className="mentee-logo" alt="MENTEE" />
        ) : (
          <SmallLogo className="mentee-logo" alt="MENTEE" />
        )}
      </NavLink>
      {/* {user && user.pair_partner && user.pair_partner.email && (
        <Avatar
          size={45}
          src={user.pair_partner.image && user.pair_partner.image.url}
          icon={<UserOutlined />}
        />
      )} */}
      <Menu
        onClick={onClick}
        defaultOpenKeys={["galleries"]}
        selectedKeys={currentPage}
        mode="inline"
        items={sidebarItems}
        theme="light"
      />
    </Sider>
  );
}

export default withRouter(NavigationSider);
