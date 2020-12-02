import React, { useState, useEffect } from "react";
import { Select, Input } from "antd";
import "./css/Modal.scss";

const { Option } = Select;

function ModalInput(props) {
  const {
    height,
    clicked,
    index,
    educationIndex,
    onEducationChange,
    type,
    title,
    placeholder,
    options,
    onChange,
    handleClick,
    defaultValue,
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
      height: height,
    };

    if (isClicked) {
      style = {
        ...style,
        ...styles.clicked,
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

  const returnDropdownItems = (items) => {
    let options = [];
    for (let i = 0; i < items.length; i++) {
      options.push(<Option key={i}>{items[i]}</Option>);
    }
    return options;
  };

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
            value={defaultValue}
          />
        );
      case "dropdown":
        return (
          <Select
            className="input-text"
            onClick={() => handleClick(index)}
            mode="tags"
            allowClear
            bordered={false}
            style={{ width: "100%" }}
            placeholder={placeholder || "Please select"}
            onChange={handleOnChange}
            defaultValue={defaultValue}
            tokenSeparators={[","]}
          >
            {returnDropdownItems(options)}
          </Select>
        );
      case "textarea":
        return (
          <Input.TextArea
            className="input-text"
            onClick={() => handleClick(index)}
            onChange={handleOnChange}
            bordered={false}
            placeholder={placeholder}
            value={defaultValue}
          />
        );
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
    borderBottomStyle: "solid",
    borderBottomWidth: 3,
    borderColor: "#828282",
    margin: 18,
    padding: 4,
    paddingTop: 6,
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
};

export default ModalInput;
