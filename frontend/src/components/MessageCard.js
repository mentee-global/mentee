import { Avatar, Card } from "antd";
import Meta from "antd/lib/card/Meta";
import React from "react";
import { useHistory } from "react-router";

function MessageCard(props) {
  const history = useHistory();
  const { latestMessage, numNew, timeLatest, otherId } = props.chat;
  
  const openMessage = () => {
    history.push(`/messages/${otherId}`)
  }

  return (
    <Card onClick={openMessage} className={`message-${props.active ? "active-" : ""}card`}>
      <Meta
        avatar={<Avatar src="https://joeschmoe.io/api/v1/random" />}
        title={<div className="message-card-title">{otherId}</div>}
        description={<div className="message-card-description">{latestMessage}</div>}
        style={{color: "white"}}
      />
    </Card>
  );
}

export default MessageCard;
