import React from "react";
import { Select } from "antd";
const { Option } = Select;

export const formatDropdownItems = (items) => {
  let options = [];
  for (let i = 0; i < items.length; i++) {
    options.push(<Option key={i}>{items[i]}</Option>);
  }
  return options;
};
