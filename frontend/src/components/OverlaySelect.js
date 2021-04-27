import React, { useState, useEffect } from "react";
import { Menu, Dropdown } from "antd";
import { DownOutlined } from "@ant-design/icons";

function OverlaySelect({
  onReset,
  defaultValue,
  options,
  onChange,
  className,
}) {
  const [option, setOption] = useState(defaultValue);

  useEffect(() => {
    setOption(defaultValue);
  }, [onReset]);

  const handleClick = (newOption) => {
    setOption(newOption);
    onChange(newOption.key);
  };

  const overlay = (
    <Menu>
      {options &&
        Object.keys(options).map((key, index) => (
          <Menu.Item>
            <a onClick={() => handleClick(options[key])}>{options[key].text}</a>
          </Menu.Item>
        ))}
    </Menu>
  );
  return (
    <Dropdown overlay={overlay} className={className} trigger={["click"]}>
      <a>
        {option && option.text} <DownOutlined />
      </a>
    </Dropdown>
  );
}

export default OverlaySelect;
