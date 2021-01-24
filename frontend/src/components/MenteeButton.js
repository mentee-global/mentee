import React from "react";
import { Button } from "antd";
import "./css/MenteeButton.scss";

function MenteeButton(props) {
  const getButtonClass = (theme) => {
    if (theme === "dark") return "dark-button";
    else if (theme === "light") return "light-button";
    else return "regular-button";
  };

  return (
    <Button
      className={getButtonClass(props.theme)}
      disabled={props.disabled ?? false}
      loading={props.loading ?? false}
      size={props.size}
      style={{ width: props.width, height: props.height }}
      onClick={props.onClick}
      htmlType={props.htmlType}
      form={props.form}
    >
      {props.content}
    </Button>
  );
}

export default MenteeButton;
