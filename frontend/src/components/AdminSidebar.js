import React from "react";
import {
  DatabaseOutlined,
  UsergroupAddOutlined,
  SearchOutlined,
  LineHeightOutlined,
  MessageOutlined,
  ContainerOutlined,
} from "@ant-design/icons";
import Sidebar from "./Sidebar";

const pages = {
  applications: {
    name: "Applications",
    isSubMenu: true,
    icon: <UsergroupAddOutlined />,
    items: {
      MentorApplications: {
        name: "Mentor ",
        path: "/organizer",
      },
      MenteeApplications: {
        name: "Mentee ",
        path: "/menteeOrganizer",
      },
    },
  },

  verifiedEmails: {
    name: "Verified Emails",
    path: "/verified-emails",
    icon: <SearchOutlined />,
    isSubMenu: false,
  },
  Trainings: {
    name: "Trainings",
    path: "/trainings",
    icon: <LineHeightOutlined />,
    isSubMenu: false,
  },
  Resources: {
    name: "Resources",
    isSubMenu: true,
    icon: <ContainerOutlined />,
    items: {
      languages: {
        name: "Languages",
        path: "/languages",
      },
      allAppointments: {
        name: "Specializations",
        path: "/specializations",
      },
    },
  },
  reports: {
    name: "Reports",
    isSubMenu: true,
    icon: <DatabaseOutlined />,
    items: {
      accountData: {
        name: "Account Data",
        path: "/account-data",
      },
      allAppointments: {
        name: "All Appointments",
        path: "/all-appointments",
      },
      Messages: {
        name: "Messages",
        path: "/messages-details",
        icon: <MessageOutlined />,
        isSubMenu: false,
      },
    },
  },
};

const subMenus = ["applications", "Resources", "reports"];

function AdminSidebar(props) {
  return (
    <Sidebar
      pages={pages}
      selectedPage={props.selectedPage}
      subMenus={subMenus}
    />
  );
}

export default AdminSidebar;
