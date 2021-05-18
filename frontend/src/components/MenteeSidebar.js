import React from "react";
import { UserOutlined, CalendarOutlined } from "@ant-design/icons";
import Sidebar from "./Sidebar";

const pages = {
  appointments: {
    name: "Appointments",
    path: "/mentee-appointments",
    icon: <CalendarOutlined />,
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
