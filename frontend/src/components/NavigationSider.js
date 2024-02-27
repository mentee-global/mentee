import React from "react";
import { Menu, Layout, Drawer } from "antd";
import { NavLink, withRouter, useHistory } from "react-router-dom";
import { useMediaQuery } from "react-responsive";
import { useTranslation } from "react-i18next";
import { useSelector, useDispatch } from "react-redux";
import useSidebars from "utils/hooks/useSidebars";
import { collapse } from "features/userSlice";
import { ReactComponent as Logo } from "resources/mentee.svg";
import { ReactComponent as SmallLogo } from "resources/menteeSmall.svg";
import "components/css/Navigation.scss";
import { ACCOUNT_TYPE } from "utils/consts";
import { css } from "@emotion/css";
import { getRole } from "utils/auth.service";

const { Sider } = Layout;

function NavigationSider() {
  const { t } = useTranslation();
  const history = useHistory();
  const collapsed = useSelector((state) => state.user.collapsed);
  const { user } = useSelector((state) => state.user);
  const dispatch = useDispatch();
  const role = getRole();
  const sidebarItems = useSidebars(role, t);
  const isMobile = useMediaQuery({ query: `(max-width: 761px)` });
  const currentPage = [history.location.pathname.split("/")[1]];

  const onClick = ({ key }) => {
    isMobile && dispatch(collapse());
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
      case ACCOUNT_TYPE.GUEST:
        return "/gallery";
      default:
        return "/";
    }
  };

  return isMobile ? (
    <Drawer
      open={isMobile && !collapsed}
      onClose={() => dispatch(collapse())}
      placement="left"
      width={220}
      closable={false}
      title={
        <>
          {role == ACCOUNT_TYPE.HUB ? (
            <img
              src={user?.image?.url}
              alt="hub"
              className={css`
                height: 30px;
                width: 30px;
              `}
            />
          ) : (
            <SmallLogo
              className={css`
                height: 30px;
                width: 30px;
              `}
              alt="MENTEE"
            />
          )}
        </>
      }
      headerStyle={{
        padding: ".5em",
        paddingLeft: "1em",
      }}
      bodyStyle={{
        padding: 0,
      }}
      children={
        <Menu
          onClick={onClick}
          defaultOpenKeys={["galleries"]}
          selectedKeys={currentPage}
          mode="inline"
          items={sidebarItems}
          theme="light"
        />
      }
    />
  ) : (
    <Sider
      theme="light"
      className={css`
        box-shadow: 2px 0 8px 0 rgba(29, 35, 41, 0.05);
      `}
      style={{
        overflow: "auto",
        height: "100vh",
        position: "sticky",
        top: 0,
        left: 0,
      }}
      collapsed={isMobile || collapsed}
      breakpoint="lg"
      collapsedWidth={isMobile ? "0px" : "48px"}
      collapsible
      onCollapse={() => dispatch(collapse())}
    >
      <NavLink to={defaultRoute()}>
        {/* TODO: Add a smooth transition of logo change */}
        {!collapsed ? (
          <>
            {role == ACCOUNT_TYPE.HUB ? (
              <img
                src={user?.image?.url}
                alt="hub"
                className={css`
                  height: 90px;
                  width: 100%;
                  padding: 1em;
                `}
              />
            ) : (
              <Logo
                className={css`
                  height: 90px;
                  width: 100%;
                  padding: 1em;
                `}
                alt="MENTEE"
              />
            )}
          </>
        ) : (
          <>
            {role == ACCOUNT_TYPE.HUB ? (
              <img
                src={user?.image?.url}
                alt="hub"
                className={css`
                  height: 90px;
                  width: 100%;
                  padding: 1em;
                `}
              />
            ) : (
              <SmallLogo
                className={css`
                  height: 90px;
                  width: 100%;
                  padding: 1em;
                `}
                alt="MENTEE"
              />
            )}
          </>
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
