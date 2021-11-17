import { Avatar, Card } from "antd";
import Meta from "antd/lib/card/Meta";
import React from "react";
import { useHistory } from "react-router";

function MessageCard(props) {
  const history = useHistory();
  const { latestMessage, otherName, otherId, } = props.chat;

  const openMessage = () => {
    history.push(`/messages/${otherId}`);
  };

  console.log(props.active)
  const name = `message-${props.active ? "active-" : ""}card`;
  console.log(name);
  return (
    <Card
      onClick={openMessage}
      className={name}
    >
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
