import React from "react";
import { UserOutlined, CalendarOutlined } from "@ant-design/icons";
import Sidebar from "./Sidebar";
import { useTranslation } from "react-i18next";

function MenteeSidebar(props) {
  const { t } = useTranslation();

  const pages = {
    appointments: {
      name: t("sidebars.appointments"),
      path: "/mentee-appointments",
      icon: <CalendarOutlined />,
    },
    profile: {
      name: t("sidebars.profile"),
      path: "/profile",
      icon: <UserOutlined />,
    },
  };

  return <Sidebar pages={pages} selectedPage={props.selectedPage} />;
}

export default MenteeSidebar;
