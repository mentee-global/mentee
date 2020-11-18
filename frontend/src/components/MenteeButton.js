import React from "react";
import { Button } from "antd";
import "./css/MenteeButton.scss";

function MenteeButton(props) {
  if(props.theme === "dark") {
    return(
      <Button
        className="dark-button"
        style={{ background: "#A58123", color: "white" }}
      >
        {props.content}
      </Button>
    )
  }
  return (
    <Button className="regular-button">{props.content}</Button>
  ); 
}

export default MenteeButton;
