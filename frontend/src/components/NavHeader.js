import React, { useEffect, useState, useContext } from "react";
import { NavLink } from "react-router-dom";
import { useMediaQuery } from "react-responsive";
import { logout } from "utils/auth.service";
import { Avatar, Layout, Drawer, Button, Menu, Dropdown } from "antd";
import { withRouter } from "react-router-dom";
import { isLoggedIn } from "utils/auth.service";
import MenteeButton from "./MenteeButton";
import LoginVerificationModal from "./LoginVerificationModal";
import { fetchAccountById, getAdmin } from "utils/api";
import { useAuth, AuthContext } from "../utils/hooks/useAuth";
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

const { Header } = Layout;

function NavHeader({ history }) {
  const isMobile = useMediaQuery({ query: `(max-width: 500px)` });
  const {
    onAuthStateChanged,
    resetRoleState,
    profileId,
    role,
    isAdmin,
    isMentee,
    isMentor,
  } = useContext(AuthContext);
  const [drawerVisible, setDrawerVisible] = useState(false);

  const [user, setUser] = useState();

  useEffect(() => {
    async function getUser() {
      if (role == ACCOUNT_TYPE.ADMIN) {
        const adminId = await getAdminID();
        const admin = await getAdmin(adminId);
        if (admin) {
          setUser(admin);
        }
      } else {
        const userData = await fetchAccountById(profileId, role);
        if (userData) {
          setUser(userData);
        }
      }
    }
    // Don't fetch if guest
    if (role == ACCOUNT_TYPE.GUEST || user) return;
    onAuthStateChanged(getUser);
  }, [role]);

  const logoutUser = () => {
    logout().then(() => {
      resetRoleState();
      history.push("/");
    });
    setUser();
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
            {isMentor ? (
              <></>
            ) : (
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
            {isMentee ? (
              <></>
            ) : (
              <span className="navigation-header-button">
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
            )}
            <span className="navigation-header-button">
              <LoginVerificationModal
                loginButton
                content={<b>{isLoggedIn() ? "Your Portal" : "Log In"}</b>}
                width="9em"
                onVerified={async () => {
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
            {user ? (
              <>
                <div className="profile-name">
                  <b>{user.name}</b>
                  <br />
                  {user.professional_title}
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
        {isMentor ? (
          <></>
        ) : (
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
        {isMentee ? (
          <></>
        ) : (
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
