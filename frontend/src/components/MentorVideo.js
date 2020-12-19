import React from "react";
import ReactPlayer from "react-player";
import { DeleteOutlined, PushpinOutlined } from "@ant-design/icons";
import moment from "moment";
import { Button, Select } from "antd";
import { SPECIALIZATIONS } from "utils/consts.js";
import { formatDropdownItems } from "utils/inputs";
import "components/css/MentorVideo.scss";

const MentorVideo = ({
  onPin,
  onChangeTag,
  onDelete,
  title,
  tag,
  id,
  date,
  video,
}) => {
  return (
    <div className="video-row">
      <div className="video-block">
        <ReactPlayer
          url={video.url}
          width="150px"
          height="100px"
          className="video"
        />
        <div className="video-description">
          <div>{title}</div>
          <div>{moment(date).fromNow()}</div>
        </div>
        <div className="video-pin">
          <button
            className="pin-button"
            disabled={id === 0}
            onClick={() => onPin(id)}
            style={id === 0 ? { background: "#F2C94C" } : {}}
          >
            <PushpinOutlined />
          </button>
        </div>
      </div>
      <div className="video-interactions">
        <Select
          style={{ ...styles.interactionVideo, left: "14%", width: 230 }}
          defaultValue={tag}
          onChange={(option) => onChangeTag(id, SPECIALIZATIONS[option])}
        >
          {formatDropdownItems(SPECIALIZATIONS)}
        </Select>
        <Button
          icon={
            <DeleteOutlined style={{ fontSize: "24px", color: "#957520" }} />
          }
          style={{ ...styles.interactionVideo, left: "78%" }}
          type="text"
          onClick={() => onDelete(video)}
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
