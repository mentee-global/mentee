import React, { useEffect, useState } from "react";
import { useHistory } from "react-router-dom";
import { Layout } from "antd";
import { isLoggedIn } from "utils/auth.service";
import usePersistedState from "utils/hooks/usePersistedState";
import { ACCOUNT_TYPE } from "utils/consts";

import UserNavHeader from "./UserNavHeader";
import GuestNavHeader from "./GuestNavHeader";
import AdminNavHeader from "./AdminNavHeader";
import MentorSidebar from "./MentorSidebar";
import AdminSidebar from "./AdminSidebar";
import MenteeSideBar from "./MenteeSidebar";

import "./css/Navigation.scss";

const { Content } = Layout;

function Navigation(props) {
  const history = useHistory();
  const [permissions, setPermissions] = usePersistedState(
    "permissions",
    ACCOUNT_TYPE.MENTOR
  );

  useEffect(() => {
    if (props.needsAuth && !isLoggedIn()) {
      history.push("/login");
    }
  }, [history, props.needsAuth]);

  return (
    <div>
      <Layout className="navigation-layout">
        {props.needsAuth ? (
          permissions.isAdmin ? (
            <AdminNavHeader />
          ) : (
            <UserNavHeader />
          )
        ) : (
          <GuestNavHeader />
        )}
        {props.needsAuth ? (
          <Layout>
            {console.log(permissions)}
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
