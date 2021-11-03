import React, { useState } from "react";
import { Divider, Input, Layout } from "antd";
import MessageCard from "./MessageCard";
import { SearchOutlined } from "@ant-design/icons";

function MessagesSidebar({ history, activeMessageId }) {
  const { Sider } = Layout;

  const [searchQuery, setSearchQuery] = useState("");

  const styles = {
    searchInput: {
      borderRadius: 10,
      marginBottom: 5,
    },
  };

  const data = [
    {
      otherId: "Jane Jockey",
      latestMessage: "Hi man what's up!",
      numNew: 5,
      timeLatest: "2021-10-27T00:52:26+0000",
    },
    {
      otherId: "Brett James",
      latestMessage: "Sorry bruv, running late.",
      numNew: 3,
      timeLatest: "2021-10-27T00:52:26+0000",
    },
    {
      otherId: "Joshua Carrey",
      latestMessage: "I love you too :)))",
      numNew: 0,
      timeLatest: "2021-10-27T00:52:20+0000",
    },
    {
      otherId: "Rajesh Ramesh",
      latestMessage: "Yeah man, Nikhil is mad cute.",
      numNew: 2,
      timeLatest: "2021-10-27T00:52:18+0000",
    },
    {
      otherId: "Kane Papi",
      latestMessage: "Hi man what's up!",
      numNew: 5,
      timeLatest: "2021-10-27T00:52:26+0000",
    },
    {
      otherId: "Lava Bowl",
      latestMessage: "Sorry bruv, running late.",
      numNew: 3,
      timeLatest: "2021-10-27T00:52:26+0000",
    },
    {
      otherId: "Hallo",
      latestMessage: "I love you too :)))",
      numNew: 0,
      timeLatest: "2021-10-27T00:52:20+0000",
    },
    {
      otherId: "Yah Yah",
      latestMessage: "Yeah man, Nikhil is mad cute.",
      numNew: 2,
      timeLatest: "2021-10-27T00:52:18+0000",
    },
    {
      otherId: "fdafdafd",
      latestMessage: "Sorry bruv, running late.",
      numNew: 3,
      timeLatest: "2021-10-27T00:52:26+0000",
    },
    {
      otherId: "f fdfsf d",
      latestMessage: "I love you too :)))",
      numNew: 0,
      timeLatest: "2021-10-27T00:52:20+0000",
    },
    {
      otherId: "BEEB",
      latestMessage: "Yeah man, Nikhil is mad cute.",
      numNew: 2,
      timeLatest: "2021-10-27T00:52:18+0000",
    },
  ];

  console.log(activeMessageId);

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
        {data.map((chat) => {
          if (chat.otherId.toLowerCase().includes(searchQuery.toLowerCase())) {
            if (chat.otherId == activeMessageId) {
              return <MessageCard key={chat.otherId} chat={chat} active />;
            } else {
              return <MessageCard key={chat.otherId} chat={chat} />;
            }
          } else {
            return <></>;
          }
        })}
      </div>
    </Sider>
  );
}

export default MessagesSidebar;
