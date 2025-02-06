import React from "react";
import ReactPlayer from "react-player";
import { DeleteOutlined, PushpinOutlined } from "@ant-design/icons";
import moment from "moment";
import { Button, Select } from "antd";
import "components/css/MentorVideo.scss";
import { useSelector } from "react-redux";

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
  const options = useSelector((state) => state.options);

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
          <b>{title}</b>
          <div>
            {moment(date).format("MM/DD/YY")} • {moment(date).fromNow()}
          </div>
        </div>
        <div className="pin-container">
          <button
            className="pin-button"
            disabled={id === 0}
            onClick={() => onPin(id)}
            style={id === 0 ? { background: "#800020", color: "white" } : {}}
          >
            <PushpinOutlined />
          </button>
        </div>
      </div>
      <div className="video-interactions">
        <Select
          style={{ ...styles.interactionVideo, left: "14%", width: 230 }}
          value={tag}
          onChange={(option) => onChangeTag(id, option)}
          options={options.specializations}
        />

        <Button
          icon={<DeleteOutlined style={{ fontSize: "24px" }} />}
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
