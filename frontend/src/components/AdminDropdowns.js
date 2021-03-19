import React, { useState, useEffect } from "react";
import { Menu, Dropdown } from "antd";
import { DownOutlined } from "@ant-design/icons";
import { SPECIALIZATIONS } from "../utils/consts";

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

export function SpecializationsDropdown(props) {
  const [option, setOption] = useState("Filter by");
  const [selected, setSelected] = useState([]);

  useEffect(() => {
    setOption("Filter by");
  }, [props.onReset]);

  const handleClick = (newOption, text) => {
    setOption(text);
    const newSelected = selected;
    newSelected.push(newSelected);
    setSelected(newSelected);
    props.onChange(newOption);
  };

  const overlay = (
    <Menu>
      {SPECIALIZATIONS.map((element, i) => {
        const color = selected.includes(i) ? "red" : "black";
        return (
          <Menu.Item>
            <a
              onClick={() => handleClick(i, element)}
              style={{ color: selected.includes(i) ? "red" : "black" }}
            >
              {element}
            </a>
          </Menu.Item>
        );
      })}
    </Menu>
  );

  return (
    <Dropdown overlay={overlay} className={props.className} trigger={["click"]}>
      <a>
        {option} <DownOutlined />
      </a>
    </Dropdown>
  );
}

export function SortByDateDropdown(props) {
  const options = {
    ASCENDING: {
      key: 0,
      text: "Date added (newest)",
    },
    DESCENDING: {
      key: 1,
      text: "Date added (oldest)",
    },
  };

  const [option, setOption] = useState({});

  useEffect(() => {
    setOption(false);
  }, [props.onReset]);

  const handleClick = (newOption) => {
    setOption(newOption);
    props.onChange(newOption.key);
  };

  const overlay = (
    <Menu>
      <Menu.Item>
        <a onClick={() => handleClick(options.ASCENDING)}>
          {options.ASCENDING.text}
        </a>
      </Menu.Item>
      <Menu.Item>
        <a onClick={() => handleClick(options.DESCENDING)}>
          {options.DESCENDING.text}
        </a>
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
