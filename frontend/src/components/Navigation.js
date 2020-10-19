import React from "react";
import { Layout } from "antd";

import NavigationHeader from "./NavigationHeader";
import NavigationSidebar from "./NavigationSidebar";

import "./css/Navigation.scss";

const { Content } = Layout;

function Navigation(props) {
  return (
    <div>
      <Layout>
        <NavigationHeader />
        <Layout className="layout-body">
          <NavigationSidebar selectedPage={props.page} />
          <Content className="navigation-content">{props.content}</Content>
        </Layout>
      </Layout>
    </div>
  );
}

export default Navigation;
