import React, { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { useMediaQuery } from "react-responsive";
import { logout } from "utils/auth.service";
import { Avatar, Layout, Drawer, Button, Menu, Dropdown } from "antd";
import { withRouter } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { resetUser, fetchUser } from "features/userSlice";
import { isLoggedIn } from "utils/auth.service";
import MenteeButton from "./MenteeButton";
import LoginVerificationModal from "./LoginVerificationModal";
import { fetchAccountById, getAdmin } from "utils/api";
import useAuth from "../utils/hooks/useAuth";
import { ACCOUNT_TYPE } from "utils/consts";
import "./css/Navigation.scss";
import { getAdminID } from "utils/auth.service";
import MenteeLogo from "../resources/mentee.png";
import MenteeLogoSmall from "../resources/menteeSmall.png";
import Icon, {
  UserOutlined,
  MenuOutlined,
  CaretDownOutlined,
} from "@ant-design/icons";
import NotificationBell from "./NotificationBell";

const { Header } = Layout;

function NavHeader({ history }) {
  const isMobile = useMediaQuery({ query: `(max-width: 500px)` });
  const {
    onAuthStateChanged,
    resetRoleState,
    isAdmin,
    isMentor,
    isMentee,
    profileId,
    role,
  } = useAuth();
  const [drawerVisible, setDrawerVisible] = useState(false);

  const user = useSelector((state) => state.user.user);
  const dispatch = useDispatch();

  useEffect(() => {
    if (profileId) {
      dispatch(fetchUser({ id: profileId, role }));
    }
  }, [role]);

  const getUserType = () => {
    if (role === ACCOUNT_TYPE.MENTOR) {
      return user ? user.professional_title : "Mentor";
    }
    if (role === ACCOUNT_TYPE.MENTEE) {
      return "Mentee";
    }
    if (role === ACCOUNT_TYPE.ADMIN) {
      return "Admin";
    }
  };

  const logoutUser = () => {
    logout().then(() => {
      resetRoleState();
      dispatch(resetUser());
      history.push("/");
    });
  };

  const dropdownMenu = (
    <Menu className="dropdown-menu">
      <Menu.Item key="edit-profile">
        <NavLink to="/profile">
          <b>Edit Profile</b>
        </NavLink>
      </Menu.Item>
      <Menu.Divider />
      {
        <Menu.Item key="sign-out" onClick={logoutUser}>
          <b>Sign Out</b>
        </Menu.Item>
      }
    </Menu>
  );

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
        </div>
        {!isMobile ? (
          <div style={{ display: "flex" }}>
            {!isMobile && (
              <>
                {isMentee || isMentor ? (
                  <></>
                ) : (
                  <span className="navigation-header-button">
                    <MenteeButton
                      width="9em"
                      theme="light"
                      content={<b>{"Apply"}</b>}
                      onClick={() => {
                        history.push({
                          pathname: "/application-page",
                        });
                      }}
                    />
                  </span>
                )}
              </>
            )}
            {/* TODO: Update this since verification modal will not longer be needed anymore! */}
            {(isMentee || isAdmin) && (
              <span className="navigation-header-button">
                <LoginVerificationModal
                  content={<b>Find a Mentor</b>}
                  theme="light"
                  width="9em"
                  onVerified={() => {
                    history.push({
                      pathname: "/gallery",
                      state: { verified: true },
                    });
                  }}
                />
              </span>
            )}
            
            {isLoggedIn() &&  <span className="navigation-header-button">
                <LoginVerificationModal
                  content={<b>Find a Mentee</b>}
                  theme="light"
                  width="9em"
                  onVerified={() => {
                    history.push({
                      pathname: "/mentee-gallery",
                      state: { verified: true },
                    });
                  }}
                />
              </span>
            }
            
            <span className="navigation-header-button">
              <MenteeButton
                loginButton
                content={<b>{isLoggedIn() ? "Your Portal" : "Log In"}</b>}
                width="9em"
                onClick={async () => {
                  let redirect = "/select-login";
                  if (isMentor) {
                    redirect = "/appointments";
                  } else if (isMentee) {
                    redirect = "/mentee-appointments";
                  } else if (isAdmin) {
                    redirect = "/account-data";
                  }
                  history.push({
                    pathname: redirect,
                  });
                }}
              />
            </span>
            {isLoggedIn() && !isAdmin && (
              <span className="navigation-header-button">
                <MenteeButton
                  loginButton
                  content={<b>{"Messages"}</b>}
                  width="9em"
                  onClick={() => {
                    history.push({
                      pathname: "/messages/1",
                    });
                  }}
                />
              </span>
            )}

            {user ? (
              <>
                <NotificationBell />
                <div className="profile-name">
                  <b>
                    {user.name}
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
                <div className="profile-caret">
                  <Dropdown overlay={dropdownMenu} trigger={["click"]}>
                    <CaretDownOutlined />
                  </Dropdown>
                </div>
              </>
            ) : (
              <></>
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

function MobileGuestNavHeader({ setDrawerVisible, drawerVisible, history }) {
  const { isAdmin, isMentor, isMentee } = useAuth();
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
          <MenteeButton
            className="mobile-nav-btn"
            width="9em"
            theme="light"
            content={<b>{"Apply"}</b>}
            onClick={() => {
              history.push({
                pathname: "/application-page",
              });
            }}
          />
        </div>
        {isMentee && (
          <LoginVerificationModal
            className="mobile-nav-btn-login-modal"
            content={<b>Find a Mentor</b>}
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
        {isMentor && (
          <LoginVerificationModal
            className="mobile-nav-btn-login-modal"
            content={<b>Find a Mentee</b>}
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
        <MenteeButton
          className="mobile-nav-btn"
          content={<b>{isLoggedIn() ? "Your Portal" : "Log In"}</b>}
          width="9em"
          onClick={async () => {
            let redirect = "/select-login";
            if (isMentor) {
              redirect = "/appointments";
            } else if (isMentee) {
              redirect = "/mentee-appointments";
            } else if (isAdmin) {
              redirect = "/account-data";
            }
            history.push({
              pathname: isLoggedIn() ? redirect : "/select-login",
            });
          }}
        />
      </Drawer>
    </div>
  );
}

export default withRouter(NavHeader);
