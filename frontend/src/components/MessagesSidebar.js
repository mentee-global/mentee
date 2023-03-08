import React, { useState } from "react";
import { withRouter } from "react-router-dom";

import { Divider, Input, Layout } from "antd";
import MessageCard from "./MessageCard";
import { SearchOutlined } from "@ant-design/icons";

function MessagesSidebar(props) {
  const { Sider } = Layout;
  const [searchQuery, setSearchQuery] = useState("");

  const styles = {
    searchInput: {
      borderRadius: 10,
      marginBottom: 5,
      backgroundColor: "white",
    },
  };
  const { latestConvos, activeMessageId } = props;

  return (
    <Sider style={{background:'white'}} width={400} className="messages-sidebar-background">
      <div className="messages-sidebar-header">
        <h1>My Messages</h1>
      </div>
      <Divider className="header-divider" orientation="left"></Divider>
      <div className="messages-search-input">
        {/* <Input
          placeholder="Search for a mentor..."
          prefix={<SearchOutlined />}
          style={styles.searchInput}
          onChange={(e) => setSearchQuery(e.target.value)}
        /> */}
      </div>
      <div className="messages-sidebar">
        {latestConvos &&
          latestConvos.length > 0 &&
          latestConvos.map((chat) => {
            if (
              chat.otherId.toLowerCase().includes(searchQuery.toLowerCase())
            ) {
              if (chat.otherId == activeMessageId) {
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
