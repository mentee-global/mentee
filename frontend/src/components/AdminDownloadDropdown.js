import { DownOutlined } from "@ant-design/icons";
import { Button, Dropdown, Menu } from "antd";
import React from "react";

function AdminDownloadDropdown({ options, title, onClick }) {
  const createOverlay = () => {
    return (
      <Menu>
        {options.map((option) => {
          return (
            <Menu.Item onClick={() => onClick(option.value)}>
              {option.label}
            </Menu.Item>
          );
        })}
      </Menu>
    );
  };

  return (
    <Dropdown trigger={["click"]} overlay={createOverlay()}>
      <Button>
        {title} <DownOutlined />
      </Button>
    </Dropdown>
  );
}

export default AdminDownloadDropdown;
