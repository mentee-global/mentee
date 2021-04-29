import React, { useState } from "react";
import { Collapse, List, Avatar } from "antd";
import "./css/Navigation.scss";
import {
  UpOutlined,
  RightOutlined,
  MessageOutlined,
  UserOutlined,
} from "@ant-design/icons";

const {Panel} = Collapse;


function MenteeMessageTab() {
    const getMessagePreview = (message) => {
      let preview = message
      if(preview.length > 50) {
        preview = preview.slice(0, 50)+"..."
      }
      return preview
    };
    const sampleMessage = "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Quisque ligula lectus, commodo eget risus nec, auctor tempor. "
    const data = [
        {
          title: 'Ant Design Title 1',
        },
        {
          title: 'Ant Design Title 2',
        },
        {
          title: 'Ant Design Title 3',
        },
        {
          title: 'Ant Design Title 4',
        },
        {
          title: 'Ant Design Title 4',
        },
        {
          title: 'Ant Design Title 4',
        },
        {
          title: 'Ant Design Title 4',
        },
        {
          title: 'Ant Design Title 4',
        }
    ];
    return (
        <Collapse accordion className="navigation-messages" expandIcon={(props) => <UpOutlined style={{ color: "#e4bb4f" }} rotate={props.isActive ? 180 : 0}/>} expandIconPosition={"right"}>
            <Panel header={<><MessageOutlined/> Messages</>} >
              <div className="message-box">
                <List
                    itemLayout="horizontal"
                    dataSource={data}
                    renderItem={item => (
                    <List.Item style={{paddingLeft:"20px", paddingRight:"20px", paddingTop:"10px", paddingBottom:"10px"}} actions={[<RightOutlined style={{ color: "#e4bb4f" }}/>]}>
                    <List.Item.Meta
                    avatar={<Avatar size="large" icon={<UserOutlined/>} />}
                    title={<div style={{display:"flex", justifyContent: "space-between"}}><b>Bernie Sanders</b><span>3 days ago</span></div>}
                    description={getMessagePreview(sampleMessage)}
                    />
                    </List.Item>
                  )}
                />
              </div>
            </Panel>
        </Collapse>
    )
}

export default MenteeMessageTab;