import { Avatar, Card } from "antd";
import Meta from "antd/lib/card/Meta";
import React from "react";

function MessageCard(props) {
  const { latestMessage, numNew, timeLatest, otherId } = props.chat;
  
  return (
    <Card className="message-card">
      <Meta
        avatar={<Avatar src="https://joeschmoe.io/api/v1/random" />}
        title={otherId}
        description={latestMessage}
      />
    </Card>
  );
}

export default MessageCard;
