import React, { useState } from "react";
import { withRouter } from "react-router-dom";

import { Divider, Input, Layout } from "antd";
import MessageCard from "./MessageCard";
import { useSelector } from "react-redux";

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
  const user = useSelector((state) => state.user.user);
  var side_data = [];
  if (user && user.pair_partner && user.pair_partner.restricted) {
    if (latestConvos && latestConvos.length > 0){
      if (user.pair_partner.assign_mentees && user.pair_partner.assign_mentees.length > 0) {
        user.pair_partner.assign_mentees.map(item => {
          var record = latestConvos.find(x=>x.otherId === item.id);
          if (record !== undefined && record !== null){
            side_data.push(record);
          }
          return false;
        });
        user.pair_partner.assign_mentors.map(item => {
          var record = latestConvos.find(x=>x.otherId === item.id);
          if (record !== undefined && record !== null){
            side_data.push(record);
          }
          return false;
        });
      }
      if (user.pair_partner.assign_mentors && user.pair_partner.assign_mentors.length) {
        
      }
    }
  } else {
    side_data = latestConvos;
  }
  return (
    <Sider
      style={{ background: "white" }}
      width={400}
      className="messages-sidebar-background"
    >
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
        {side_data &&
          side_data.length > 0 &&
          side_data.map((chat) => {
            if (
              chat.otherId.toLowerCase().includes(searchQuery.toLowerCase())
            ) {
              if (chat.otherId === activeMessageId) {
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
