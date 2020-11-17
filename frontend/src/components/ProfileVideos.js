import React, { useEffect, useState } from "react";
import { Row, Col } from "antd";
import ReactPlayer from "react-player";

import "./css/PublicProfile.scss";

function ProfileVideos(props) {
  const [pinnedVideo, setPinnedVideo] = useState();
  const [videoGrid, setVideoGrid] = useState([]);

  useEffect(() => {
    let grid = [];
    if (props.videos) {
      props.videos.forEach((video) => {
        if (video.tag === "pinned") {
          setPinnedVideo(video);
        } else {
          grid.push(
            <Col span={12}>
              <div className="video-default-preview">
                <ReactPlayer
                  url={video.url}
                  width="100%"
                  height="100%"
                  className="video-border"
                />
              </div>
            </Col>
          );
        }
      });
    }
    if (grid.length < 6) {
      for (let i = grid.length; i < 6; i++) {
        grid.push(
          <Col span={12}>
            <div className="video-default-preview"></div>
          </Col>
        );
      }
    }
    setVideoGrid(grid);
  }, [props.videos]);

  return (
    <div>
      <h1>
        <b>Videos</b>
      </h1>
      <hr className="mentor-profile-videos-divider" />
      <Row>
        <Col span={24}>
          <div className="pinned-video-default-preview">
            {pinnedVideo && (
              <ReactPlayer
                url={pinnedVideo.url}
                width="100%"
                height="100%"
                className="video-border"
              />
            )}
          </div>
        </Col>
      </Row>
      <br />
      <Row gutter={16}>
        {videoGrid[0]}
        {videoGrid[1]}
      </Row>
      <br />
      <Row gutter={16}>
        {videoGrid[2]}
        {videoGrid[3]}
      </Row>
      <br />
      <Row gutter={16}>
        {videoGrid[4]}
        {videoGrid[5]}
      </Row>
    </div>
  );
}

export default ProfileVideos;
