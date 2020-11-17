import React from "react";
import { Layout } from "antd";

import MentorNavHeader from "./MentorNavHeader";
import MenteeNavHeader from "./MenteeNavHeader";
import NavigationSidebar from "./NavigationSidebar";

import "./css/Navigation.scss";

const { Content } = Layout;

function Navigation(props) {
  return (
    <div>
      <Layout className="navigation-layout">
        {props.needsAuth ? <MentorNavHeader /> : <MenteeNavHeader />}
        {props.needsAuth ? (
          <Layout>
            <NavigationSidebar selectedPage={props.page} />
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
