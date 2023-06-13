import React from "react";
import {
  UserOutlined,
  VideoCameraOutlined,
  CalendarOutlined,
} from "@ant-design/icons";
import Sidebar from "./Sidebar";
import { useTranslation } from "react-i18next";

function MentorSidebar(props) {
  const { t } = useTranslation();

  const pages = {
    appointments: {
      name: t("sidebars.appointments"),
      path: "/appointments",
      icon: <CalendarOutlined />,
    },
    videos: {
      name: t("sidebars.videos"),
      path: "/videos",
      icon: <VideoCameraOutlined />,
    },
    profile: {
      name: t("sidebars.profile"),
      path: "/profile",
      icon: <UserOutlined />,
    },
  };

  return <Sidebar pages={pages} selectedPage={props.selectedPage} />;
}

export default MentorSidebar;
