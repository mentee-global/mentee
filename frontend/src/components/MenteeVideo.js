import React from "react";

import "components/css/MenteeVideo.scss";
import { Col, Row } from "antd";
import ReactPlayer from "react-player";

function MenteeVideo({ video }) {
  return (
    <div className="mentee-video-container">
      <h1>
        <b>Introduction</b>
      </h1>
      <hr className="mentee-profile-video-divider" />
      <Row>
        <Col span={24}>
          <div className="pinned-video-default-preview">
            {video && (
              <ReactPlayer
                url={video.url}
                width="100%"
                height="100%"
                className="video-border"
              />
            )}
          </div>
          {video && (
            <div style={{ marginTop: "12px" }}>
              <b>{video.title}</b>
            </div>
          )}
        </Col>
      </Row>
    </div>
  );
}

export default MenteeVideo;
