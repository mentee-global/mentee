import React, { useEffect } from "react";
import { useHistory } from "react-router-dom";
import { Layout } from "antd";
import usePersistedState from "utils/hooks/usePersistedState";
import { ACCOUNT_TYPE } from "utils/consts";

import UserNavHeader from "./UserNavHeader";
import GuestNavHeader from "./GuestNavHeader";
import AdminNavHeader from "./AdminNavHeader";
import MentorSidebar from "./MentorSidebar";
import AdminSidebar from "./AdminSidebar";
import MenteeSideBar from "./MenteeSidebar";
import useAuth from "utils/hooks/useAuth";

import "./css/Navigation.scss";

const { Content } = Layout;

function Navigation(props) {
  const history = useHistory();
  const [permissions, setPermissions] = usePersistedState(
    "permissions",
    ACCOUNT_TYPE.MENTOR
  );
  const { isAdmin, onAuthUpdate, onAuthStateChanged } = useAuth();

  useEffect(() => {
    onAuthStateChanged((user) => {
      if (!user && props.needsAuth) {
        history.push("/login");
      }
    });
  }, [history, props.needsAuth]);

  return (
    <div>
      <Layout className="navigation-layout">
        {props.needsAuth ? (
          isAdmin ? (
            <AdminNavHeader />
          ) : (
            <UserNavHeader />
          )
        ) : (
          <GuestNavHeader />
        )}
        {props.needsAuth ? (
          <Layout>
            {permissions === ACCOUNT_TYPE.ADMIN ? (
              <AdminSidebar selectedPage={props.page} />
            ) : permissions === ACCOUNT_TYPE.MENTOR ? (
              <MentorSidebar selectedPage={props.page} />
            ) : (
              <MenteeSideBar selectedPage={props.page} />
            )}
            <Content className="navigation-content">{props.content}</Content>
          </Layout>
        ) : (
          <Content className="navigation-content">{props.content}</Content>
        )}
      </Layout>
    </div>
  );
}

export default Navigation;
