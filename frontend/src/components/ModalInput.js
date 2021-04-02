import React, { useState, useEffect } from "react";
import { Select, Input, InputNumber } from "antd";
import "./css/Modal.scss";
import { NodeExpandOutlined } from "@ant-design/icons";

const { Option } = Select;

function ModalInput(props) {
  const {
    clicked,
    index,
    educationIndex,
    hasBorder = true,
    onEducationChange,
    maxRows,
    type,
    title,
    placeholder,
    options,
    onChange,
    handleClick,
    defaultValue,
    valid,
    validate,
  } = props;
  const [isClicked, setIsClicked] = useState(clicked);

  useEffect(() => {
    setIsClicked(clicked);
  }, [clicked]);

  function handleOnChange(e) {
    if (!onEducationChange) {
      onChange(e);
    } else {
      onEducationChange(e, educationIndex);
    }
    handleClick(index);
  }

  function getContainerStyle() {
    let style = {
      ...styles.container,
      ...props.style,
    };
    if (hasBorder) {
      style = {
        ...style,
        ...styles.border,
      };
    }

    if (isClicked && valid) {
      style = {
        ...style,
        ...styles.clicked,
      };
    } else if (validate && !valid) {
      style = {
        ...style,
        ...styles.invalid,
      };
    }

    return style;
  }

  function getTextStyle() {
    let style = styles.text;

    if (isClicked) {
      style = {
        ...style,
        ...styles.clicked,
      };
    }

    return style;
  }

  // const returnDropdownItems = (items) => {
  //   let options = [];
  //   for (let i = 0; i < items.length; i++) {
  //     options.push(<Option key={items[i]}>{items[i]}</Option>);
  //   }
  //   return options;
  // };

  const InputBox = () => {
    switch (type) {
      case "text":
        return (
          <Input
            className="input-text"
            onClick={() => handleClick(index)}
            onChange={handleOnChange}
            bordered={false}
            placeholder={placeholder}
            value={props.value}
            defaultValue={defaultValue}
          />
        );
      case "dropdown-single":
        return (
          <Select
            className="input-text"
            onClick={() => handleClick(index)}
            allowClear
            bordered={false}
            style={{ width: "100%" }}
            placeholder="Please select"
            onChange={handleOnChange}
            value={props.value}
            defaultValue={defaultValue}
          ></Select>
        );
      case "dropdown-multiple":
        return (
          <Select
            className="input-text"
            onClick={() => handleClick(index)}
            mode={onEducationChange ? "tags" : "multiple"}
            allowClear
            bordered={false}
            style={{ width: "100%" }}
            placeholder={placeholder || "Please select"}
            onChange={handleOnChange}
            value={props.value}
            tokenSeparators={[","]}
            defaultValue={defaultValue}
          ></Select>
        );
      case "textarea":
        return (
          <Input.TextArea
            className="input-textarea"
            autoSize={{ maxRows: maxRows ?? 1 }}
            onClick={() => handleClick(index)}
            onChange={handleOnChange}
            bordered={false}
            placeholder={placeholder}
            value={props.value}
            defaultValue={defaultValue}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div style={getContainerStyle()}>
      <div style={getTextStyle()}>{title}</div>
      {InputBox()}
    </div>
  );
}

const styles = {
  container: {
    flex: 1,
    flexDirection: "column",
    width: "100%",
    backgroundColor: "#FFFDF5",
  },
  border: {
    borderBottomStyle: "solid",
    borderBottomWidth: 3,
    borderColor: "#828282",
  },
  text: {
    flex: 1,
    fontWeight: "bold",
    color: "#828282",
    marginLeft: 11,
  },
  clicked: {
    color: "#F2C94C",
    borderColor: "#F2C94C",
  },
  invalid: {
    color: "#FF0000",
    borderColor: "#FF0000",
  },
};

export default ModalInput;
