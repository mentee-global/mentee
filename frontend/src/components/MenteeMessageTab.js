import React, { useState } from "react";
import { Collapse, List } from "antd";
import "./css/Navigation.scss";
import {
  UpOutlined,
  MessageOutlined
} from "@ant-design/icons";

const {Panel} = Collapse;

function MenteeMessageTab() {
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
        <Collapse accordion className="navigation-messages" expandIcon={(props) => <UpOutlined rotate={props.isActive ? 180 : 0}/>} expandIconPosition={"right"}>
            <Panel header={<><MessageOutlined/> Messages</>} >
              <div className="message-box">
                <List
                    itemLayout="horizontal"
                    dataSource={data}
                    renderItem={item => (
                    <List.Item>
                    <List.Item.Meta
                    title={<a href="https://ant.design">{item.title}</a>}
                    description="1"
                    />
                    </List.Item>
                  )}
                />
              </div>,
            </Panel>
        </Collapse>
    )
}

export default MenteeMessageTab;