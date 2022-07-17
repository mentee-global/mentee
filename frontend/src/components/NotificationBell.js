import React, { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Badge } from "antd";
import { MessageOutlined, BellOutlined } from "@ant-design/icons";
import {
	fetchNotificationsCount,
	notificationIncrement,
} from "features/notificationsSlice";
import useInterval from "utils/hooks/useInterval";
import "./css/Navigation.scss";

function NotificationBell() {
	const count = useSelector((state) => state.notifications.count);
	const dispatch = useDispatch();
	const profileID = useSelector((state) => state.user.user?._id?.$oid);

	useEffect(() => {
		dispatch(fetchNotificationsCount({ id: profileID }));
	}, []);

	return (
		<div className="notifications-section">
			<Badge count={count ?? 0} size="small">
				<BellOutlined className="notifications-icon" />
			</Badge>
		</div>
	);
}

export default NotificationBell;
