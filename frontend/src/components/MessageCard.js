import { Avatar, Card } from "antd";
import Meta from "antd/lib/card/Meta";
import React from "react";
import { useHistory } from "react-router";
import { decrement } from "features/notificationsSlice";
import { useDispatch } from "react-redux";
//import { get_unread_count, update_unread_count } from "backend/views/notifications.py"

function MessageCard(props) {
  const history = useHistory();
  const dispatch = useDispatch();
  const { latestMessage, otherName, otherId } = props.chat;

  // console.log(props.active)
  const name = `message-${props.active ? "active-" : ""}card`;
  // console.log(name);

  const openMessage = () => {
    history.push(`/messages/${otherId}`);

    //dispatch(decrement(get_unread_count(otherID, name)));

    //update_unread_count(otherID, name);
  };

  return (
    <Card onClick={openMessage} className={name}>
      <Meta
        avatar={<Avatar src="https://joeschmoe.io/api/v1/random" />}
        title={<div className="message-card-title">{otherId}</div>}
        description={
          <div className="message-card-description">{latestMessage.body}</div>
        }
        style={{ color: "white" }}
      />
    </Card>
  );
}

export default MessageCard;
