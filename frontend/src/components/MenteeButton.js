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
      style={{
        ...props.style,
        width: props.width,
        height: props.height,
        borderRadius: props.radius ?? "13px",
      }}
      onClick={props.onClick}
      loading={props.loading ?? false}
      htmlType={props.htmlType}
      form={props.form}
    >
      {props.content}
    </Button>
  );
}

export default MenteeButton;
