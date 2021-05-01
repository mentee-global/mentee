import React from "react";
import {
  UserOutlined,
  VideoCameraOutlined,
  CalendarOutlined,
} from "@ant-design/icons";
import Sidebar from "./Sidebar";

const pages = {
  appointments: {
    name: "Appointments",
    path: "/appointments",
    icon: <CalendarOutlined />,
  },
  videos: {
    name: "Your Videos",
    path: "/videos",
    icon: <VideoCameraOutlined />,
  },
  profile: {
    name: "Profile",
    path: "/profile",
    icon: <UserOutlined />,
  },
};

function MentorSidebar(props) {
  return <Sidebar pages={pages} selectedPage={props.selectedPage} />;
}

export default MentorSidebar;
