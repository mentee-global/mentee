import React, { useState } from "react";
import { Collapse, List } from "antd";
import "./css/Navigation.scss";
import {
  UpOutlined,
  MessageOutlined
} from "@ant-design/icons";

const {Panel} = Collapse;

function MenteeMessageTab() {
    const genExtra = () => (
      <UpOutlined/>
    );
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
        <Collapse accordion className="navigation-messages">
            <Panel header={<><MessageOutlined/> Messages</>} showArrow={false} extra={<UpOutlined/>}>
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