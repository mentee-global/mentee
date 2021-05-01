import React from "react";
import {
  UserOutlined,
  MessageOutlined,
  CalendarOutlined,
  HeartOutlined,
} from "@ant-design/icons";
import Sidebar from "./Sidebar";

const pages = {
  appointments: {
    name: "Appointments",
    path: "/mentee-appointments",
    icon: <CalendarOutlined />,
  },
  favorites: {
    name: "Favorites",
    path: "/favorites",
    icon: <HeartOutlined />,
  },
  messages: {
    name: "Messages",
    path: "/messages",
    icon: <MessageOutlined />,
  },
  profile: {
    name: "Profile",
    path: "/profile",
    icon: <UserOutlined />,
  },
};

function MenteeSidebar(props) {
  return <Sidebar pages={pages} selectedPage={props.selectedPage} />;
}

export default MenteeSidebar;
