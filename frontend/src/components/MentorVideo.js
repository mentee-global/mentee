import React, { useState, useEffect } from "react";
import ReactPlayer from "react-player";
import { DeleteOutlined, PushpinOutlined } from "@ant-design/icons";
import moment from "moment";
import { Button, Select } from "antd";
import { formatDropdownItems } from "utils/inputs";
import "components/css/MentorVideo.scss";
import { getDisplaySpecializations } from "utils/api";

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
  const [specMasters, setSpecMasters] = useState([]);
  useEffect(() => {
    async function getMasters() {
      setSpecMasters(await getDisplaySpecializations());
    }
    getMasters();
  }, []);
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
          onChange={(option) => onChangeTag(id, specMasters[option])}
        >
          {formatDropdownItems(specMasters)}
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
