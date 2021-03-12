import React, { useState, useEffect } from "react";
import { Menu, Dropdown } from "antd";
import { DownOutlined } from "@ant-design/icons";

export function SortByApptDropdown(props) {
  const options = {
    ASCENDING: {
      key: 0,
      text: "Greatest to least",
    },
    DESCENDING: {
      key: 1,
      text: "Least to greatest",
    },
  };

  const [option, setOption] = useState({});

  useEffect(() => {
    setOption(false);
  }, [props.onReset, props.onChangeData]);

  const handleClick = (newOption) => {
    setOption(newOption);
    props.onChange(newOption.key);
  };

  const overlay = (
    <Menu>
      <Menu.Item>
        <a onClick={() => handleClick(options.ASCENDING)}>Greatest to least</a>
      </Menu.Item>
      <Menu.Item>
        <a onClick={() => handleClick(options.DESCENDING)}>Least to greatest</a>
      </Menu.Item>
    </Menu>
  );

  return (
    <Dropdown overlay={overlay} className={props.className} trigger={["click"]}>
      <a>
        {option ? option.text : "Sort Order"} <DownOutlined />
      </a>
    </Dropdown>
  );
}

export function MenteeMentorDropdown(props) {
  const options = {
    MENTORS: {
      key: 0,
      text: "Mentors",
    },
    MENTEES: {
      key: 1,
      text: "Mentees",
    },
    ALL: {
      key: 2,
      text: "All",
    },
  };

  const [option, setOption] = useState(options.MENTORS);

  useEffect(() => {
    setOption(options.MENTORS);
  }, [props.onReset]);

  const handleClick = (newOption) => {
    setOption(newOption);
    props.onChange(newOption.key);
  };

  const overlay = (
    <Menu>
      <Menu.Item>
        <a onClick={() => handleClick(options.MENTORS)}>Mentors</a>
      </Menu.Item>
      <Menu.Item>
        <a onClick={() => handleClick(options.MENTEES)}>Mentees</a>
      </Menu.Item>
      <Menu.Item>
        <a onClick={() => handleClick(options.ALL)}>All</a>
      </Menu.Item>
    </Menu>
  );

  return (
    <Dropdown overlay={overlay} className={props.className} trigger={["click"]}>
      <a>
        {option.text} <DownOutlined />
      </a>
    </Dropdown>
  );
}
