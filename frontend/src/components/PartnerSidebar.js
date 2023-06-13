import React from "react";
import { UserOutlined, CalendarOutlined } from "@ant-design/icons";
import Sidebar from "./Sidebar";
import { useTranslation } from "react-i18next";

function PartnerSidebar(props) {
  const { t } = useTranslation();

  const pages = {
    profile: {
      name: t("sidebars.profile"),
      path: "/profile",
      icon: <UserOutlined />,
    },
  };

  return <Sidebar pages={pages} selectedPage={props.selectedPage} />;
}

export default PartnerSidebar;
