import React from "react";
import { Menu, Layout, Drawer } from "antd";
import { NavLink, withRouter, useHistory, useLocation } from "react-router-dom";
import { useMediaQuery } from "react-responsive";
import { useTranslation } from "react-i18next";
import { useSelector, useDispatch } from "react-redux";
import useSidebars from "utils/hooks/useSidebars";
import { collapse } from "features/userSlice";
// import { ReactComponent as Logo } from "resources/mentee.svg";
import BigLogoImage from "resources/Mentee_logo_letter.png";
import N50SmallLogoImage from "resources/N50 Logo_small.png";
// import { ReactComponent as SmallLogo } from "resources/menteeSmall.svg";
// import SmallLogoImage from "resources/Mentee_logo_small.png";
import "components/css/Navigation.scss";
import { ACCOUNT_TYPE } from "utils/consts";
import { css } from "@emotion/css";
import { getRole } from "utils/auth.service";

const { Sider } = Layout;

function NavigationSider() {
  const { t } = useTranslation();
  const history = useHistory();
  const location = useLocation();
  const collapsed = useSelector((state) => state.user.collapsed);
  const { user } = useSelector((state) => state.user);
  const dispatch = useDispatch();
  const role = getRole();
  const sidebarItems = useSidebars(role, user, t);
  const isMobile = useMediaQuery({ query: `(max-width: 761px)` });
  let main_domain_url = history.location.pathname.split("/")[0];
  const currentPage = [
    history.location.pathname.replace(main_domain_url + "/", ""),
  ];
  const n50_flag = localStorage.getItem("n50_user");

  // Check if we're on a messages route
  const isMessagesRoute =
    location.pathname.includes("/messages") ||
    location.pathname.includes("/group_messages") ||
    location.pathname.includes("/partner_group_messages") ||
    location.pathname.includes("/admin_group_messages");

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
          {role === ACCOUNT_TYPE.HUB ? (
            <img
              src={
                user
                  ? user.hub_user
                    ? user.hub_user.image?.url
                    : user.image?.url
                  : ""
              }
              alt="hub"
              className={css`
                height: auto;
                width: 100%;
              `}
            />
          ) : (
            // <SmallLogo
            //   className={css`
            //     height: 30px;
            //     width: 30px;
            //   `}
            //   alt="MENTEE"
            // />
            <img
              src={n50_flag ? N50SmallLogoImage : BigLogoImage}
              alt={""}
              className={css`
                height: 30px;
                width: 30px;
              `}
            />
          )}
        </>
      }
      styles={{
        header: {
          padding: ".5em",
          paddingLeft: "1em",
        },
        body: {
          padding: 0,
        },
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
        ${isMessagesRoute && !collapsed
          ? "display: flex; flex-direction: column;"
          : ""}
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
            {role === ACCOUNT_TYPE.HUB ? (
              <img
                src={
                  user
                    ? user.hub_user
                      ? user.hub_user.image?.url
                      : user.image?.url
                    : ""
                }
                alt="hub"
                className={css`
                  height: auto;
                  width: 100%;
                  padding: 1em;
                `}
              />
            ) : (
              // <Logo
              //   className={css`
              //     height: 90px;
              //     width: 100%;
              //     padding: 1em;
              //   `}
              //   alt="MENTEE"
              // />
              <img
                src={n50_flag ? N50SmallLogoImage : BigLogoImage}
                alt={""}
                className={css`
                  height: 50px;
                  padding-left: 2em;
                  padding-top: 0.5em;
                `}
              />
            )}
          </>
        ) : (
          <>
            {role === ACCOUNT_TYPE.HUB ? (
              <img
                src={
                  user
                    ? user.hub_user
                      ? user.hub_user.image?.url
                      : user.image?.url
                    : ""
                }
                alt="hub"
                className={css`
                  height: auto;
                  width: 100%;
                  padding: 1em;
                `}
              />
            ) : (
              // <SmallLogo
              //   className={css`
              //     height: 90px;
              //     width: 100%;
              //     padding: 1em;
              //   `}
              //   alt="MENTEE"
              // />
              <img
                src={BigLogoImage}
                alt={""}
                className={css`
                  height: 90px;
                  width: 100%;
                  padding: 1em;
                `}
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
      <div style={{ flex: isMessagesRoute && !collapsed ? "1" : "none" }}>
        <Menu
          onClick={onClick}
          defaultOpenKeys={["galleries"]}
          selectedKeys={currentPage}
          mode="inline"
          items={sidebarItems}
          theme="light"
        />
      </div>
      {/* Messages Footer Logo - Only show on desktop messages routes */}
      {isMessagesRoute && !collapsed && (
        <div
          className="sidebar-messages-footer"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "5px",
            fontSize: "13px",
            fontStyle: "italic",
            padding: "12px",
            borderTop: "1px solid #f0f0f0",
            marginTop: "auto",
          }}
        >
          <span>{t("common.powered_by")}</span>
          <img
            src={BigLogoImage}
            alt=""
            className={css`
              height: 35px;
              margin-left: 6px;
            `}
          />
        </div>
      )}
    </Sider>
  );
}

export default withRouter(NavigationSider);
