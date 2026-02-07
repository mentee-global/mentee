import React, { useState, useEffect } from "react";
import { Menu, Dropdown, Button } from "antd";
import { DownOutlined, SortAscendingOutlined } from "@ant-design/icons";
import { getDisplaySpecializations } from "utils/api";

export function SortByApptDropdown(props) {
  const options = {
    ASCENDING: {
      key: 0,
      text: "Most appointments",
    },
    DESCENDING: {
      key: 1,
      text: "Least appointments",
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
      <Menu.Item onClick={() => handleClick(options.ASCENDING)}>
        <span style={{ fontWeight: 500 }}>Most appointments</span>
      </Menu.Item>
      <Menu.Item onClick={() => handleClick(options.DESCENDING)}>
        <span style={{ fontWeight: 500 }}>Least appointments</span>
      </Menu.Item>
    </Menu>
  );

  return (
    <Dropdown overlay={overlay} className={props.className} trigger={["click"]}>
      <Button style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <SortAscendingOutlined />
        <span style={{ fontWeight: 500 }}>{option ? option.text : "Sort by"}</span>
        <DownOutlined style={{ fontSize: 12 }} />
      </Button>
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
    PARTNERS: {
      key: 2,
      text: "Partners",
    },
    GUESTS: {
      key: 4,
      text: "Guests",
    },
    SUPPORT: {
      key: 5,
      text: "Supporters",
    },
    MODERATOR: {
      key: 7,
      text: "Moderators",
    },
    // ALL: {
    //   key: 3,
    //   text: "All",
    // },
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
      <Menu.Item onClick={() => handleClick(options.MENTORS)}>
        <span style={{ fontWeight: 500 }}>Mentors</span>
      </Menu.Item>
      <Menu.Item onClick={() => handleClick(options.MENTEES)}>
        <span style={{ fontWeight: 500 }}>Mentees</span>
      </Menu.Item>
      <Menu.Item onClick={() => handleClick(options.PARTNERS)}>
        <span style={{ fontWeight: 500 }}>Partners</span>
      </Menu.Item>
      <Menu.Item onClick={() => handleClick(options.GUESTS)}>
        <span style={{ fontWeight: 500 }}>Guests</span>
      </Menu.Item>
      <Menu.Item onClick={() => handleClick(options.SUPPORT)}>
        <span style={{ fontWeight: 500 }}>Supporters</span>
      </Menu.Item>
      <Menu.Item onClick={() => handleClick(options.MODERATOR)}>
        <span style={{ fontWeight: 500 }}>Moderators</span>
      </Menu.Item>
    </Menu>
  );
  return (
    <Dropdown overlay={overlay} className={props.className} trigger={["click"]}>
      <Button style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontWeight: 500 }}>{option.text}</span>
        <DownOutlined style={{ fontSize: 12 }} />
      </Button>
    </Dropdown>
  );
}

export function SpecializationsDropdown(props) {
  const [option, setOption] = useState("Filter by");
  const [selected, setSelected] = useState([]);
  const [specMasters, setSpecMasters] = useState([]);

  useEffect(() => {
    setOption("Filter by");
  }, [props.onReset]);

  useEffect(() => {
    async function getMasters() {
      setSpecMasters(await getDisplaySpecializations());
    }
    getMasters();
  }, []);

  const handleClick = (newOption, text) => {
    setOption(text);
    const newSelected = selected;
    newSelected.push(newSelected);
    setSelected(newSelected);
    props.onChange(newOption);
  };

  const overlay = (
    <Menu>
      {specMasters.map((element, i) => {
        return (
          <Menu.Item>
            <a
              onClick={() => handleClick(i, element.label)}
              style={{ color: selected.includes(i) ? "red" : "black" }}
            >
              {element.label}
            </a>
          </Menu.Item>
        );
      })}
    </Menu>
  );

  return (
    <Dropdown
      overlay={overlay}
      className={props.className}
      trigger={["click"]}
      overlayStyle={{ overflowY: "scroll", height: "20em" }}
    >
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

export function HubsDropdown(props) {
  const [option, setOption] = useState("All Hubs");
  const [selected, setSelected] = useState([]);

  useEffect(() => {
    setOption("All Hubs");
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
      <Menu.Item onClick={() => handleClick(null, "All Hubs")}>
        <span style={{ fontWeight: 500 }}>All Hubs</span>
      </Menu.Item>
      {props.options &&
        props.options.map((element, i) => {
          return (
            <Menu.Item 
              key={element.value}
              onClick={() => handleClick(element.value, element.label)}
            >
              <span style={{ fontWeight: selected.includes(i) ? 600 : 400 }}>
                {element.label}
              </span>
            </Menu.Item>
          );
        })}
    </Menu>
  );

  return (
    <Dropdown
      overlay={overlay}
      className={props.className}
      trigger={["click"]}
      overlayStyle={{ overflowY: "auto", maxHeight: 300 }}
    >
      <Button style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 140 }}>
        <span style={{ fontWeight: 500 }}>{option}</span>
        <DownOutlined style={{ fontSize: 12 }} />
      </Button>
    </Dropdown>
  );
}
