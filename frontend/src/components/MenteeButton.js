import React from "react";
import { Button } from "antd";
import "./css/MenteeButton.scss";

function MenteeButton(props) {
  return (
    <Button
      className={`${props.className}`}
      type="primary"
      disabled={props.disabled ?? false}
      loading={props.loading ?? false}
      style={{
        ...props.style,
        width: props.width,
        height: props.height,
        borderRadius: props.radius,
        border: props.border,
      }}
      onClick={props.onClick}
      id={props.id}
      htmlType={props.htmlType}
      form={props.form}
    >
      {props.content}
    </Button>
  );
}

export default MenteeButton;
