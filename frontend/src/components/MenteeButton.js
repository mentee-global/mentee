import React from "react";
import { Button } from "antd";
import "./css/MenteeButton.scss";

function MenteeButton(props) {
  const getButtonClass = (theme, focus) => {
    let style = "";
    if (theme === "dark") style = "dark-button";
    else if (theme === "light") style = "light-button";
    else style = "regular-button";

    if (focus) style += "-focus";
    return style;
  };

  return (
    <Button
      className={getButtonClass(props.theme, props.borderOnClick)}
      disabled={props.disabled ?? false}
      loading={props.loading ?? false}
      style={{
        ...props.style,
        width: props.width,
        height: props.height,
        borderRadius: props.radius ?? "13px",
        border: props.border,
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
