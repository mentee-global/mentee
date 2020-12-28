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
      style={{ width: props.width, height: props.height, border: props.border }}
      onClick={props.onClick}
    >
      {props.content}
    </Button>
  );
}

export default MenteeButton;
