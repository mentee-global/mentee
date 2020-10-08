import React from "react";
import { NavLink } from "react-router-dom";
import { Layout, Menu } from "antd";
import {
  UserOutlined,
  VideoCameraOutlined,
  CalendarOutlined,
  HomeOutlined,
} from "@ant-design/icons";

import "antd/dist/antd.css";
import "../css/Appointments.scss";

import mentee_logo from "../../resources/mentee.png";

const { Header, Sider, Content } = Layout;

function Appointments() {
  return (
    <div>
      <Layout>
        <Header className="appointments-header">
          <img src={mentee_logo} alt="Mentee" className="mentee-logo" />
        </Header>
        <Layout>
          <Sider theme="light">
            <Menu theme="light" mode="inline">
              <Menu.Item
                key="1"
                className="appointments-menu-item"
                icon={<HomeOutlined />}
              >
                <NavLink to="/" activeStyle={{ color: "black" }}>
                  Home
                </NavLink>
              </Menu.Item>
              <Menu.Item
                key="2"
                className="appointments-menu-item"
                icon={<CalendarOutlined />}
              >
                Appointments
              </Menu.Item>
              <Menu.Item
                key="3"
                className="appointments-menu-item"
                icon={<VideoCameraOutlined />}
              >
                Your Videos
              </Menu.Item>
              <Menu.Item
                key="4"
                className="appointments-menu-item"
                icon={<UserOutlined />}
              >
                Profile
              </Menu.Item>
            </Menu>
          </Sider>
          <Content className="appointments-content">
            Appointment page component goes here
          </Content>
        </Layout>
      </Layout>
    </div>
  );
}

export default Appointments;
