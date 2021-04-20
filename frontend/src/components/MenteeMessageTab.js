import React from "react";
import { Collapse, List } from "antd";

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
    ];
    return (
        <Collapse accordion>
            <Panel header="Messages">
                <List
                    itemLayout="horizontal"
                    dataSource={data}
                    renderItem={item => (
                    <List.Item>
                    <List.Item.Meta
                    title={<a href="https://ant.design">{item.title}</a>}
                    description="Ant Design, a design language for background applications, is refined by Ant UED Team"
                />
      </List.Item>
    )}
  />,
            </Panel>
        </Collapse>
    )
}

export default MenteeMessageTab;