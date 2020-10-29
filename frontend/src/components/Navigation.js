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
        {/* add prop to choose between mentor/mentee navbars */}
        <MentorNavHeader />
        <Layout className="layout-body">
          {/* <NavigationSidebar selectedPage={props.page} /> */}
          <NavigationSidebar
            className="navigation-sidebar"
            selectedPage={props.page}
          />
          <Content className="navigation-content">{props.content}</Content>
        </Layout>
      </Layout>
    </div>
  );
}

export default Navigation;
