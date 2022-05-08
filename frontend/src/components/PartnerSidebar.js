import React from "react";
import { UserOutlined, CalendarOutlined } from "@ant-design/icons";
import Sidebar from "./Sidebar";

const pages = {
	profile: {
		name: "Profile",
		path: "/profile",
		icon: <UserOutlined />,
	},
};

function PartnerSidebar(props) {
	return <Sidebar pages={pages} selectedPage={props.selectedPage} />;
}

export default PartnerSidebar;
