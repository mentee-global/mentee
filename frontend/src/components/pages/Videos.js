import React, { useState, useEffect } from "react";
import { Row, Col, Button, Form, Input, Select } from "antd";
import moment from "moment";
import MentorVideo from "../MentorVideo";
import { SPECIALIZATIONS } from "utils/consts.js";
import { returnDropdownItems } from "utils/inputs";
import "../css/Videos.scss";
import videosJSON from "utils/videos.json";

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
    setTitleFilter(query);
    query = query.toUpperCase();
    let newVideos = [];
    for (let video of videos) {
      let title = video.title.toUpperCase();
      if (title.search(query) > -1) {
        newVideos.push(video);
      }
    }
    setFiltered(newVideos);
  };

  const handleDeleteVideo = (video) => {
    let newVideos = [...videos];
    let id = newVideos.indexOf(video);
    newVideos.splice(id, 1);
    setVideos(newVideos);

    if (selectFilter !== "") {
      const filteredVideos = newVideos.filter((video, index, arr) => {
        return SPECIALIZATIONS.indexOf(video.tag) === selectFilter;
      });
      newVideos = filteredVideos;
    } else if (titleFilter !== "") {
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

  const handleSearchChange = (event) => {
    setTitleFilter(event.target.value);
  };

  const handleSubmitVideo = (video) => {
    console.log(video);
    let newVideos = [...videos];
    video = {
      ...video,
      date_uploaded: moment().format(),
      tag: SPECIALIZATIONS[video.tag],
    };
    newVideos.push(video);

    handleClearFilters();
    setVideos(newVideos);
    setFiltered(newVideos);
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
              onPin={handlePinVideo}
              onDelete={handleDeleteVideo}
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
          onFinish={handleSubmitVideo}
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
          <Form.Item
            name="tag"
            rules={[
              {
                required: true,
                message: "Please select a tag",
              },
            ]}
          >
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
      </div>
      <div className="filter-card">
        <h1 style={{ fontWeight: "bold", fontSize: 18 }}>Your Uploads</h1>
        <div className="filters">
          <Input.Search
            style={{ width: 300 }}
            value={titleFilter}
            onChange={handleSearchChange}
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

export default Videos;
