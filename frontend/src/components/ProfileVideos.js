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
        if (video.tag === "pinned" && !pinnedVideo) {
          setPinnedVideo(video);
        } else {
          grid.push(video);
        }
      });
    }
    setVideoGrid(grid);
  }, [props.videos, pinnedVideo, setPinnedVideo, setVideoGrid]);

  const renderVideoGrid = () => {
    if (!videoGrid || videoGrid.length === 0) return;
    const videoReducer = (rows, cur_video, idx) => {
      idx % 2 === 0
        ? rows.push([cur_video])
        : rows[rows.length - 1].push(cur_video);
      return rows;
    };
    const rows = videoGrid.reduce(videoReducer, []);
    return rows.map((row) => (
      <>
        <Row gutter={16}>
          {row.map((video) => (
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
          ))}
        </Row>
        <br />
      </>
    ));
  };

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
      {renderVideoGrid()}
    </div>
  );
}

export default ProfileVideos;
