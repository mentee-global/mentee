import React, { useState } from "react";
import { Collapse, List, Avatar, Drawer, Space, Button, Row, Col} from "antd";
import "./css/Navigation.scss";
import {
  UpOutlined,
  RightOutlined,
  MessageOutlined,
  UserOutlined,
  ArrowLeftOutlined,
  MailOutlined
} from "@ant-design/icons";

const { Panel } = Collapse;

const data = [
  {
    sender_name: "Bernie Sanders",
    email: "bernie@gmail.com",
    link: "berniesanders.com",
    time: new Date("April 8, 2021 16:56:00"),
    message:
      "Hello! My name is Bernie Sanders and I am interested in connecting withyou. We have similar backgrounds so I think we could help each other out. Feel free to contact me at my email! Looking forward to hearing from you!",
  },
  {
    sender_name: "Barack Obama",
    email: "Obama@gmail.com",
    link: "barackobama.com",
    time: new Date("April 5, 2021 16:56:00"),
    message:
      "Hello! My name is Barack Obama and I am interested in connecting withyou. We have similar backgrounds so I think we could help each other out. Feel free to contact me at my email! Looking forward to hearing from you!",
  },
  {
    sender_name: "Joe Biden",
    email: "biden@gmail.com",
    link: "joebiden.com",
    time: new Date("April 7, 2021 16:56:00"),
    message:
      "Hello! My name is Joe Biden and I am interested in connecting withyou. We have similar backgrounds so I think we could help each other out. Feel free to contact me at my email! Looking forward to hearing from you!",
  },
  {
    sender_name: "John Doe",
    email: "jdoe@gmail.com",
    link: "jd.com",
    time: new Date("April 9, 2021 22:53:00"),
    message:
      "Hello! My name is John and I am interested in connecting withyou. We have similar backgrounds so I think we could help each other out. Feel free to contact me at my email! Looking forward to hearing from you!",
  },
  {
    sender_name: "Bob Ross",
    email: "ross@gmail.com",
    link: "ross.com",
    time: new Date("April 3, 2021 16:56:00"),
    message: "Hello would you like to witness some beautiful trees?",
  },
  {
    sender_name: "Steve Jobs",
    email: "jobs@gmail.com",
    link: "apple.com",
    time: new Date("April 1, 2021 16:56:00"),
    message: "Ayo home boy wya",
  },
  {
    sender_name: "Mark Zuckerburg",
    email: "zuck@gmail.com",
    link: "facebook.com",
    time: new Date("March 24, 2021 16:56:00"),
    message: "U want internship?",
  },
];

function MenteeMessageTab() {
  const [visible, setVisible] = useState(false);
  const [drawerItem, setDrawerItem] = useState(data[0]);
  const previewCutoff = 50;

  const getMessagePreview = (message) => {
    let preview = message;
    if (preview.length > previewCutoff) {
      preview = preview.slice(0, previewCutoff) + "...";
    }
    return preview;
  };

  const timeSince = (date) => {
    var seconds = Math.floor((new Date() - date) / 1000);

    var interval = seconds / 31536000;

    if (interval > 1) {
      return Math.floor(interval) + " years";
    }
    interval = seconds / 2592000;
    if (interval > 1) {
      return Math.floor(interval) + " months";
    }
    interval = seconds / 86400;
    if (interval > 1) {
      return Math.floor(interval) + " days";
    }
    interval = seconds / 3600;
    if (interval > 1) {
      return Math.floor(interval) + " hours";
    }
    interval = seconds / 60;
    if (interval > 1) {
      return Math.floor(interval) + " minutes";
    }
    return Math.floor(seconds) + " seconds";
  };

  const getFormattedDate = (date) => {
    let options = {
      weekday: "short",
      month: "numeric",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "numeric",
      hour12: true,
    };
    return new Intl.DateTimeFormat("en-US", options).format(date);
  };

  const showDrawer = (item) => {
    setDrawerItem(item);
    setVisible(true);
  };

  const closeDrawer = () => {
    setVisible(false);
  };

  return (
    <Collapse
      accordion
      className="navigation-messages"
      expandIcon={(props) => (
        <UpOutlined
          style={{ color: "#e4bb4f" }}
          rotate={props.isActive ? 180 : 0}
        />
      )}
      expandIconPosition={"right"}
    >
      <Panel
        header={
          <>
            <MessageOutlined /> <b>Messages</b>
          </>
        }
      >
        <div className="message-box">
          <List
            itemLayout="horizontal"
            dataSource={data}
            renderItem={(item) => (
              <List.Item
                style={{
                  paddingLeft: "20px",
                  paddingRight: "20px",
                  paddingTop: "10px",
                  paddingBottom: "10px",
                }}
                actions={[<RightOutlined style={{ color: "#e4bb4f" }} />]}
                onClick={(user, message) => showDrawer(item)}
              >
                <List.Item.Meta
                  avatar={<Avatar size="large" icon={<UserOutlined />} />}
                  title={
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                      }}
                    >
                      <b>{item.sender_name}</b>
                      <span>{timeSince(item.time)} ago</span>
                    </div>
                  }
                  description={getMessagePreview(item.message)}
                />
              </List.Item>
            )}
          />
          <Drawer
            title={
              <Space>
                <ArrowLeftOutlined
                  style={{ color: "#e4bb4f" }}
                  onClick={closeDrawer}
                />{" "}
                <b>{drawerItem.sender_name}</b>
              </Space>
            }
            footer={
              <Button type="primary" shape="round" href={"mailto:"+drawerItem.email} icon={<MailOutlined />} size={"middle"} style={{background: "#e4bb4f", borderColor: "#e4bb4f"}}>Reply Over Email</Button>
            }
            placement="right"
            closable={false}
            visible={visible}
            getContainer={false}
            style={{ position: "absolute" }}
            width={"100%"}
          >
            <Space direction="vertical" size="large">
              <Space direction="vertical" style={{ width: "100%" }}>
                <div className="drawerHeader">
                  <span>{drawerItem.email}</span>
                  <span>{getFormattedDate(drawerItem.time)}</span>
                </div>
                <div className="drawerHeader">
                  <span>{drawerItem.link}</span>
                </div>
              </Space>
              <p>{drawerItem.message}</p>
            </Space>

          </Drawer>
        </div>
      </Panel>
    </Collapse>
  );
}

export default MenteeMessageTab;
