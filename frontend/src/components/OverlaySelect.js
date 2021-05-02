import React, { useState, useEffect } from "react";
import { Menu, Dropdown } from "antd";
import { DownOutlined } from "@ant-design/icons";

/**
 * Wrapper component for the dropdown component in Antd
 * Given an object of all possible desired options
 * Display it as an overlay and call respective onChange function
 */
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
    // Call parent onChange function
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
