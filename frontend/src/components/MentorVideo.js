import React from "react";
import ReactPlayer from "react-player";
import { DeleteOutlined, PushpinOutlined } from "@ant-design/icons";
import moment from "moment";
import { Button, Select } from "antd";
import { SPECIALIZATIONS } from "utils/consts.js";
import { returnDropdownItems } from "utils/inputs";
import "components/css/MentorProfile.scss";

const MentorVideo = (props) => {
  const { onPin, onChangeTag, handleDeleteVideo } = props;

  return (
    <div className="video-row">
      <div className="video-block">
        <ReactPlayer
          url={props.url}
          width="150px"
          height="100px"
          className="video"
        />
        <div className="video-description">
          <div>{props.title}</div>
          <div>{moment(props.date).fromNow()}</div>
        </div>
        <div className="video-pin">
          <button
            className="pin-button"
            onClick={() => onPin(props.id)}
            style={props.id == 0 ? { background: "#F2C94C" } : {}}
          >
            <PushpinOutlined />
          </button>
        </div>
      </div>
      <div className="video-interactions">
        <Select
          style={{ ...styles.interactionVideo, left: "14%", width: 230 }}
          defaultValue={props.tag}
          onChange={(option) => onChangeTag(props.id, SPECIALIZATIONS[option])}
        >
          {returnDropdownItems(SPECIALIZATIONS)}
        </Select>
        <Button
          icon={
            <DeleteOutlined style={{ fontSize: "24px", color: "#957520" }} />
          }
          style={{ ...styles.interactionVideo, left: "78%" }}
          type="text"
          onClick={() => handleDeleteVideo(props.video)}
        ></Button>
      </div>
    </div>
  );
};

const styles = {
  interactionVideo: {
    position: "absolute",
    top: "50%",
    margin: "-25px 0 0 -25px",
  },
};

export default MentorVideo;
