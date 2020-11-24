import React, { useState, useEffect } from "react";
import { Row, Col, Button, Form, Input, Select } from "antd";
import { DeleteOutlined, PushpinOutlined } from "@ant-design/icons";
import moment from "moment";
import ReactPlayer from "react-player";
import { SPECIALIZATIONS } from "utils/consts.js";
import "../css/Videos.scss";
import videosJSON from "utils/videos.json";
const { Option } = Select;

function Videos() {
  const [videos, setVideos] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [selectFilter, setSelectFilter] = useState("");
  const [titleFilter, setTitleFilter] = useState("");

  useEffect(() => {
    async function getVideos() {
      setVideos(videosJSON.data.videos);
      setFiltered(videosJSON.data.videos);
    }
    getVideos();
  }, []);

  const handleSearchVideo = (query) => {
    query = query.toUpperCase();
    let newVideos = [];
    for (let video of videos) {
      let title = video.title.toUpperCase();
      if (title.search(query) > -1) {
        newVideos.push(video);
      }
    }
    setTitleFilter(query);
    setFiltered(newVideos);
  }

  const handleDeleteVideo = (video) => {
    let newVideos = [...videos];
    let id = newVideos.indexOf(video);
    newVideos.splice(id, 1);
    setVideos(newVideos);

    if (!selectFilter) {
      const filteredVideos = newVideos.filter((video, index, arr) => {
        return SPECIALIZATIONS.indexOf(video.tag) === selectFilter;
      });
      newVideos = filteredVideos;
    } else if (!titleFilter) {
      newVideos = [];
      for (let video in videos) {
        if (video.title.search(titleFilter) > -1) {
          newVideos.push(video);
        }
      }
    }
    setFiltered(newVideos);
  };

  const handleVideoTag = (id, specialization) => {
    const newVideos = [...videos];
    const video = {
      ...newVideos[id],
      tag: specialization,
    };
    newVideos[id] = video;
    setVideos(newVideos);
    setFiltered(newVideos);
  };

  const returnDropdownItems = (items) => {
    let options = [];
    for (let i = 0; i < items.length; i++) {
      options.push(<Option key={i}>{items[i]}</Option>);
    }
    return options;
  };

  const handlePinVideo = (id) => {
    if (id != 0) {
      const newVideos = [...videos];
      const video = newVideos.splice(id, 1)[0];
      newVideos.sort(
        (a, b) => moment(a.date_uploaded).diff(moment(b.date_uploaded)) * -1
      );
      newVideos.unshift(video);
      setVideos(newVideos);
      setFiltered(newVideos);
    }
  };

  const filterSpecialization = (value) => {
    const filteredVideos = videos.filter((video, index, arr) => {
      return SPECIALIZATIONS.indexOf(video.tag) == value;
    });
    setFiltered(filteredVideos);
    setSelectFilter(value);
  };

  const handleClearFilters = () => {
    setFiltered(videos);
    setTitleFilter("");
    setSelectFilter("");
  };

  const MentorVideo = (props) => {
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
              onClick={() => props.onPinVideo(props.id)}
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
            onChange={(option) =>
              props.onChangeTag(props.id, SPECIALIZATIONS[option])
            }
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

  const VideosContainer = () => {
    return (
      <div className="videos-container">
        <div className="videos-table-title">
          <h1>Specializations Tag</h1>
          <h1>Delete</h1>
        </div>
        {filtered &&
          filtered.map((video, index) => (
            <MentorVideo
              title={video.title}
              date={video.date_uploaded}
              tag={video.tag}
              id={index}
              video={video}
              onChangeTag={handleVideoTag}
              onPinVideo={handlePinVideo}
              url={video.url}
            />
          ))}
      </div>
    );
  };

  const VideoSubmit = () => {
    return (
      <div className="video-submit-card">
        <h1 className="video-submit-title">Add Video</h1>
        <Form
          name="video-submit"
          initialValues={{
            remember: true,
          }}
        >
          <Form.Item
            name="title"
            rules={[
              {
                required: true,
                message: "Please input a video title",
              },
            ]}
          >
            <Input placeholder="Video Title" />
          </Form.Item>
          <Form.Item
            name="url"
            rules={[
              {
                required: true,
                message: "Please input a video link",
              },
            ]}
          >
            <Input placeholder="Video Link" />
          </Form.Item>
          <Form.Item>
            <Select>{returnDropdownItems(SPECIALIZATIONS)}</Select>
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit">
              Submit
            </Button>
          </Form.Item>
        </Form>
      </div>
    );
  };

  return (
    <div style={{ height: "100%" }}>
      <div className="videos-header">
        <h1 className="videos-header-title">Welcome, {"Insert name"}</h1>
        <Button className="edit-videos" shape="round" size="large">
          Manage Uploads
        </Button>
      </div>
      <div className="filter-card">
        <h1 style={{ fontWeight: "bold", fontSize: 18 }}>Your Uploads</h1>
        <div className="filters">
          <Input.Search
            style={{ width: 300 }}
            value={titleFilter}
            onSearch={(value) => handleSearchVideo(value)}
          />
          <Select
            style={{ width: 200 }}
            onChange={(value) => filterSpecialization(value)}
            value={selectFilter}
          >
            {returnDropdownItems(SPECIALIZATIONS)}
          </Select>
          <Button onClick={handleClearFilters}>Clear</Button>
        </div>
      </div>
      <Row>
        <Col span={16}>
          <VideosContainer />
        </Col>
        <Col span={8}>
          <VideoSubmit />
        </Col>
      </Row>
    </div>
  );
}

const styles = {
  interactionVideo: {
    position: "absolute",
    top: "50%",
    margin: "-25px 0 0 -25px",
  },
};

export default Videos;
