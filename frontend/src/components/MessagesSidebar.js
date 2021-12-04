import React, { useEffect, useState } from "react";
import { useHistory } from "react-router";
import { withRouter } from "react-router-dom";

import { Divider, Input, Layout } from "antd";
import MessageCard from "./MessageCard";
import { SearchOutlined } from "@ant-design/icons";
import useAuth from "utils/hooks/useAuth";
import { getLatestMessages } from "utils/api";

function MessagesSidebar(props) {
  const { Sider } = Layout;
  const history = useHistory();

  const [searchQuery, setSearchQuery] = useState("");
  // const [latestConvos, setLatestConvos] = useState([]);
  const [activeMessageId, setActiveMessageId] = useState("");

  const styles = {
    searchInput: {
      borderRadius: 10,
      marginBottom: 5,
      backgroundColor: "white",
    },
  };
  const { latestConvos } = props;

  if (!latestConvos || !latestConvos.length) {
    return <div>Loading...</div>;
  }
  return (
    <Sider width={400} className="messages-sidebar-background">
      <div className="messages-sidebar-header">
        <h1>My Messages</h1>
      </div>
      <Divider className="header-divider" orientation="left"></Divider>
      <div className="messages-search-input">
        <Input
          placeholder="Search for a mentor..."
          prefix={<SearchOutlined />}
          style={styles.searchInput}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>
      <div className="messages-sidebar">
        {latestConvos.map((chat) => {
          if (chat.otherId.toLowerCase().includes(searchQuery.toLowerCase())) {
            if (chat.otherId == activeMessageId) {
              console.log(chat.otherId, activeMessageId);
              return (
                <MessageCard key={chat.otherId} chat={chat} active={true} />
              );
            } else {
              return (
                <MessageCard key={chat.otherId} chat={chat} active={false} />
              );
            }
          } else {
            return <></>;
          }
        })}
      </div>
    </Sider>
  );
}

export default withRouter(MessagesSidebar);
