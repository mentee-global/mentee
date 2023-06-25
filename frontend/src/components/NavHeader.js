import React, { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { useMediaQuery } from "react-responsive";
import {
  Avatar,
  Layout,
  Drawer,
  Menu,
  Dropdown,
  Badge,
  Space,
  Select,
} from "antd";
import { withRouter } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { resetUser, fetchUser } from "features/userSlice";
import { fetchOptions } from "features/optionsSlice";
import { isLoggedIn } from "utils/auth.service";
import MenteeButton from "./MenteeButton";
import LoginVerificationModal from "./LoginVerificationModal";
import { getNotifys, markNotifyReaded } from "utils/api";
import { useAuth } from "../utils/hooks/useAuth";
import { ACCOUNT_TYPE } from "utils/consts";
import "./css/Navigation.scss";
import MenteeLogo from "../resources/mentee.png";
import MenteeLogoSmall from "../resources/menteeSmall.png";
import Icon, {
  UserOutlined,
  MenuOutlined,
  CaretDownOutlined,
  MessageOutlined,
} from "@ant-design/icons";
import NotificationBell from "./NotificationBell";
import { logout } from "utils/auth.service";
import { useTranslation } from "react-i18next";
import moment from "moment";

const { Header } = Layout;

function NavHeader({ history }) {
  const { t, i18n } = useTranslation();
  const isMobile = useMediaQuery({ query: `(max-width: 500px)` });
  const {
    resetRoleState,
    isAdmin,
    isMentor,
    isMentee,
    isPartner,
    profileId,
    role,
  } = useAuth();
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [notifys, setNotifys] = useState([]);
  const [count, setCount] = useState(0);
  const [notifysViewed, setNoitfyViewed] = useState(false);
  const user = useSelector((state) => state.user.user);
  const dispatch = useDispatch();

  const [openDropdown, setOpenDropdown] = useState(false);

  const handleDropdownClick = (e) => {
    if (e.key !== "language-change") {
      setOpenDropdown(false);
    }
  };

  const handleOpenChange = (flag) => {
    setOpenDropdown(flag);
  };

  const languageOptions = [
    {
      value: "en-US",
      label: t("languages.en"),
    },
    {
      value: "es-US",
      label: t("languages.es"),
    },
    {
      value: "pt-BR",
      label: t("languages.pt"),
    },
    {
      value: "ar",
      label: t("languages.ar"),
    },
    {
      value: "fa-AF",
      label: t("languages.fa"),
    },
  ];

  const handleLanguageChange = (language) => {
    i18n.changeLanguage(language);
    moment.locale(language);
    if (user) setOpenDropdown(false);
  };

  const LanguageSelect = () => {
    return (
      <div>
        🌎
        <Select
          defaultValue={i18n.language}
          bordered={false}
          size="middle"
          className="language-select-style"
          options={languageOptions}
          dropdownMatchSelectWidth={110}
          onChange={handleLanguageChange}
        />
      </div>
    );
  };

  const logoutUser = () => {
    logout().then(() => {
      resetRoleState();
      dispatch(resetUser());
      history.push("/");
    });
  };

  useEffect(() => {
    if (profileId) {
      dispatch(fetchUser({ id: profileId, role }));
    }
  }, [role]);

  useEffect(() => {
    dispatch(fetchOptions());
  }, [i18n.language]);

  const getUserType = () => {
    if (role === ACCOUNT_TYPE.MENTOR) {
      return user ? user.professional_title : t("common.mentor");
    }
    if (role === ACCOUNT_TYPE.MENTEE) {
      return t("common.mentee");
    }
    if (role === ACCOUNT_TYPE.ADMIN) {
      return t("common.admin");
    }
    if (role === ACCOUNT_TYPE.PARTNER) {
      return t("common.partner");
    }
  };

  useEffect(() => {
    const getAdminNotifications = async () => {
      const newNotifys = await getNotifys();
      setNotifys(newNotifys);
      let unReadnotifys = newNotifys.filter(
        (notify) => notify.readed === false
      );
      setCount(unReadnotifys.length);
    };
    if (role === ACCOUNT_TYPE.ADMIN) getAdminNotifications();
  }, [role]);

  const dropdownMenu = (
    <Menu className="dropdown-menu" onClick={handleDropdownClick}>
      <Menu.Item key="edit-profile">
        <NavLink to="/profile">
          <b>{t("navHeader.editProfile")}</b>
        </NavLink>
      </Menu.Item>
      <Menu.Divider />
      <Menu.Item key="sign-out" onClick={logoutUser}>
        <b>{t("common.logout")}</b>
      </Menu.Item>
      <Menu.Divider />
      <Menu.Item key="language-change">
        <LanguageSelect />
      </Menu.Item>
    </Menu>
  );
  const lastNotifys = notifys.slice(0, 5);
  const menu = (
    <Menu style={{ borderRedius: "15px" }}>
      {lastNotifys.map((notify) => {
        return (
          <Menu.Item key={notify._id["$oid"]}>
            <a
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => {
                e.preventDefault();
                history.push(`/gallery/1/${notify.mentorId}`);
              }}
            >
              <p
                style={{
                  width: "250px",
                  backgroundColor: "#a58123",
                  color: "white",
                  padding: "5px",
                }}
              >
                {notify.message}
              </p>
            </a>
          </Menu.Item>
        );
      })}
    </Menu>
  );

  function MobileGuestNavHeader({ setDrawerVisible, drawerVisible, history }) {
    const { isAdmin, isMentor, isMentee, isPartner } = useAuth();
    return (
      <div>
        <button
          className="navigation-hamburger-btn"
          onClick={() => setDrawerVisible(true)}
        >
          <Icon component={MenuOutlined} style={{ fontSize: "30px" }} />
        </button>
        <Drawer
          placement="right"
          closable={true}
          onClose={() => setDrawerVisible(false)}
          visible={drawerVisible}
        >
          <div className="drawer-btn-container">
            {isMentee || isMentor || isPartner ? (
              <></>
            ) : (
              <MenteeButton
                className="mobile-nav-btn"
                width="9em"
                theme="light"
                content={<b>{t("common.apply")}</b>}
                onClick={() => {
                  history.push({
                    pathname: "/application-page",
                  });
                }}
              />
            )}
          </div>
          {(isMentee || isAdmin) && isLoggedIn() && (
            <LoginVerificationModal
              className="mobile-nav-btn-login-modal"
              content={<b>{t("navHeader.findMentor")}</b>}
              theme="light"
              width="9em"
              onVerified={() => {
                history.push({
                  pathname: "/gallery",
                  state: { verified: true },
                });
              }}
            />
          )}
          {!isPartner && isLoggedIn() && (
            <LoginVerificationModal
              className="mobile-nav-btn-login-modal"
              content={<b>{t("navHeader.findMentee")}</b>}
              theme="light"
              width="9em"
              onVerified={() => {
                history.push({
                  pathname: "/mentee-gallery",
                  state: { verified: true },
                });
              }}
            />
          )}
          {(isPartner || isAdmin) && isLoggedIn() && (
            <>
              <span className="navigation-header-button">
                <LoginVerificationModal
                  content={<b>{t("navHeader.findPartner")}</b>}
                  theme="light"
                  width="9em"
                  onVerified={() => {
                    history.push({
                      pathname: "/partner-gallery",
                      state: { verified: true },
                    });
                  }}
                />
              </span>
              <div style={{ marginTop: "20px" }} />
              <MenteeButton
                className="mobile-nav-btn"
                content={
                  <b>
                    {isLoggedIn()
                      ? t("navHeader.yourPortal")
                      : t("common.login")}
                  </b>
                }
                width="9em"
                onClick={async () => {
                  let redirect = "/login";
                  if (isMentor) {
                    redirect = "/appointments";
                  } else if (isMentee) {
                    redirect = "/mentee-appointments";
                  } else if (isAdmin) {
                    redirect = "/account-data";
                  } else if (isPartner) {
                    redirect = "/profile";
                  }
                  history.push({
                    pathname: isLoggedIn() ? redirect : "/login",
                  });
                }}
              />
            </>
          )}
          {!isPartner && isLoggedIn() && (
            <MenteeButton
              className="mobile-nav-btn"
              content={
                <b>
                  {isLoggedIn() ? t("navHeader.yourPortal") : t("common.login")}
                </b>
              }
              width="9em"
              onClick={async () => {
                let redirect = "/login";
                if (isMentor) {
                  redirect = "/appointments";
                } else if (isMentee) {
                  redirect = "/mentee-appointments";
                } else if (isAdmin) {
                  redirect = "/account-data";
                } else if (isPartner) {
                  redirect = "/profile";
                }
                history.push({
                  pathname: isLoggedIn() ? redirect : "/login",
                });
              }}
            />
          )}
          {isLoggedIn() && !isAdmin && (
            <MenteeButton
              className="mobile-nav-btn"
              loginButton
              content={<b>{t("common.messages")}</b>}
              width="9em"
              onClick={() => {
                history.push({
                  pathname: `/messages/${role}`,
                });
              }}
            />
          )}
        </Drawer>
      </div>
    );
  }

  var cur_url = window.location.href;
  var cur_url_arr = cur_url.split("/");
  cur_url = cur_url_arr[cur_url_arr.length - 1];
  return (
    <Header className="navigation-header">
      <div className="navigation-mentee-flexbox">
        <div>
          <NavLink to="/">
            <img
              src={isMobile ? MenteeLogoSmall : MenteeLogo}
              alt="Mentee"
              className="mentee-logo"
            />
          </NavLink>
          {user && user.pair_partner && user.pair_partner.email && (
            <Avatar
              size={45}
              src={user.pair_partner.image && user.pair_partner.image.url}
              icon={<UserOutlined />}
            />
          )}
        </div>
        {!isMobile ? (
          <div style={{ display: "flex" }}>
            {!isMobile && <></>}
            {/* TODO: Update this since verification modal will not longer be needed anymore! */}
            {(isMentee || isAdmin) && isLoggedIn() && (
              <span className="navigation-header-button">
                <LoginVerificationModal
                  content={<b>{t("navHeader.findMentor")}</b>}
                  theme="light"
                  border={
                    cur_url === "gallery" ? "1px solid lightseagreen" : "none"
                  }
                  onVerified={() => {
                    history.push({
                      pathname: "/gallery",
                      state: { verified: true },
                    });
                  }}
                />
              </span>
            )}

            {!isPartner && isLoggedIn() && (
              <span className="navigation-header-button">
                <LoginVerificationModal
                  content={<b>{t("navHeader.findMentee")}</b>}
                  theme="light"
                  border={
                    cur_url === "mentee-gallery"
                      ? "1px solid lightseagreen"
                      : "none"
                  }
                  onVerified={() => {
                    history.push({
                      pathname: "/mentee-gallery",
                      state: { verified: true },
                    });
                  }}
                />
              </span>
            )}
            {(isPartner || isAdmin) && isLoggedIn() && (
              <span className="navigation-header-button">
                <LoginVerificationModal
                  content={<b>{t("navHeader.findPartner")}</b>}
                  theme="light"
                  width="9em"
                  border={
                    cur_url === "partner-gallery"
                      ? "1px solid lightseagreen"
                      : "none"
                  }
                  onVerified={() => {
                    history.push({
                      pathname: "/partner-gallery",
                      state: { verified: true },
                    });
                  }}
                />
              </span>
            )}
            {isLoggedIn() ? (
              <span className="navigation-header-button">
                <MenteeButton
                  loginButton
                  content={<b>{t("navHeader.yourPortal")}</b>}
                  width="9em"
                  onClick={async () => {
                    let redirect = "/login";
                    if (isMentor) {
                      redirect = "/appointments";
                    } else if (isMentee) {
                      redirect = "/mentee-appointments";
                    } else if (isAdmin) {
                      redirect = "/account-data";
                    } else if (isPartner) {
                      redirect = "/profile";
                    }
                    history.push({
                      pathname: redirect,
                    });
                  }}
                />
              </span>
            ) : (
              ""
            )}

            {isLoggedIn() && !isAdmin && (
              <span className="navigation-header-button">
                <MenteeButton
                  loginButton
                  content={<b>{t("common.messages")}</b>}
                  width="9em"
                  onClick={() => {
                    history.push({
                      pathname: `/messages/${role}`,
                    });
                  }}
                />
              </span>
            )}

            {user ? (
              <>
                {isAdmin && (
                  <Dropdown
                    overlay={menu}
                    className="profile-name margin-bell"
                    trigger={["click"]}
                  >
                    <a
                      onClick={(e) => {
                        e.preventDefault();
                        if (!notifysViewed) {
                          setNoitfyViewed(true);
                          setCount(0);
                          Promise.all(
                            notifys.map(async (notify) => {
                              if (notify.readed == false) {
                                await markNotifyReaded(notify._id["$oid"]);
                              }
                            })
                          );
                        }
                      }}
                    >
                      <Space>
                        <Badge count={count}>
                          <MessageOutlined
                            style={{ fontSize: "150%" }}
                          ></MessageOutlined>
                        </Badge>
                      </Space>
                    </a>
                  </Dropdown>
                )}

                <NotificationBell />
                <div className="profile-name">
                  <b>
                    {isPartner ? user.organization : user.name}
                    <br />
                    {getUserType()}
                  </b>
                </div>
                <div className="profile-picture">
                  <Avatar
                    size={40}
                    src={user.image && user.image.url}
                    icon={<UserOutlined />}
                  />
                </div>
                <div className="profile-caret ">
                  <Dropdown
                    overlay={dropdownMenu}
                    onVisibleChange={handleOpenChange}
                    visible={openDropdown}
                  >
                    <CaretDownOutlined />
                  </Dropdown>
                </div>
              </>
            ) : (
              <LanguageSelect />
            )}
          </div>
        ) : (
          <MobileGuestNavHeader
            setDrawerVisible={setDrawerVisible}
            drawerVisible={drawerVisible}
            history={history}
          />
        )}
      </div>
    </Header>
  );
}

export default withRouter(NavHeader);
