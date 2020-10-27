import React from "react";
import { Layout } from "antd";

import NavigationHeader from "./NavigationHeader";
import NavigationSidebar from "./NavigationSidebar";

import "./css/Navigation.scss";

const { Content } = Layout;

function Navigation(props) {
  return (
    <div>
      <Layout className="navigation-layout">
        <NavigationHeader />
        <Layout>
          <NavigationSidebar selectedPage={props.page} />
          <Content className="navigation-content">{props.content}</Content>
        </Layout>
      </Layout>
    </div>
  );
}

export default Navigation;
