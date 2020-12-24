import React, { useState, useEffect } from "react";
import { Row, Col, Button, Form, Input, Select } from "antd";
import moment from "moment";
import MentorVideo from "../MentorVideo";
import VideoSubmit from "../VideoSubmit";
import { getMentorID } from "utils/auth.service";
import { SPECIALIZATIONS } from "utils/consts.js";
import { formatDropdownItems } from "utils/inputs";
import { fetchMentorByID, editMentorProfile } from "utils/api";
import "../css/Videos.scss";

function Videos() {
  const [videos, setVideos] = useState([]);
  const [name, setName] = useState("");
  const [filtered, setFiltered] = useState([]);
  const [selectFilter, setSelectFilter] = useState("");
  const [titleFilter, setTitleFilter] = useState("");
  const [mentorID, setMentorID] = useState("");
  const [form] = Form.useForm();

  useEffect(() => {
    async function getVideos() {
      const newMentorID = await getMentorID();
      const mentor = await fetchMentorByID(newMentorID);
      setName(mentor.name);
      if (mentor) {
        let videos = mentor.videos;
        // Formats all dates from objects (in Epoch) to MongoDB parseable
        for (let i = 0; i < videos.length; i++) {
          const date = videos[i].date_uploaded.$date;
          videos[i].date_uploaded = moment(date).format();
        }

        setVideos(videos);
        setFiltered(videos);
      }
      setMentorID(newMentorID);
    }
    getVideos();
  }, [mentorID]);

  async function updateVideos(data, id) {
    const update = {
      videos: data,
    };
    await editMentorProfile(update, id);
  }

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
    }
    if (titleFilter !== "") {
      let titleFiltered = [];
      for (let video in newVideos) {
        if (video.title.search(titleFilter) > -1) {
          titleFiltered.push(video);
        }
      }
      newVideos = titleFiltered;
    }
    setFiltered(newVideos);
    updateVideos(newVideos, mentorID);
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
    updateVideos(newVideos, mentorID);
  };

  const handlePinVideo = (id) => {
    const newVideos = [...videos];
    const video = newVideos.splice(id, 1)[0];
    newVideos.sort(
      (a, b) => moment(a.date_uploaded).diff(moment(b.date_uploaded)) * -1
    );
    newVideos.unshift(video);
    setVideos(newVideos);
    setFiltered(newVideos);
    updateVideos(newVideos, mentorID);
  };

  const filterSpecialization = (value) => {
    const filteredVideos = videos.filter((video, index, arr) => {
      // eslint-disable-next-line eqeqeq
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
    let newVideos = [...videos];
    video = {
      ...video,
      date_uploaded: moment().format(),
      tag: SPECIALIZATIONS[video.tag],
    };
    newVideos.push(video);
    newVideos.sort(
      (a, b) => moment(a.date_uploaded).diff(moment(b.date_uploaded)) * -1
    );

    form.resetFields();
    handleClearFilters();
    setVideos(newVideos);
    setFiltered(newVideos);
    updateVideos(newVideos, mentorID);
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
            />
          ))}
      </div>
    );
  };

  return (
    <div style={{ height: "100%" }}>
      <div className="videos-header">
        <h1 className="videos-header-title">Welcome, {name}</h1>
      </div>
      <div className="filter-card">
        <h1 style={{ fontWeight: "bold", fontSize: 18 }}>Your Uploads</h1>
        <div className="filters">
          <Input.Search
            style={{ width: 300 }}
            value={titleFilter}
            onChange={handleSearchChange}
            onSearch={(value) => handleSearchVideo(value)}
            placeholder="Title"
          />
          <Select
            style={{ width: 200 }}
            onChange={(value) => filterSpecialization(value)}
            value={selectFilter}
          >
            {formatDropdownItems(SPECIALIZATIONS)}
          </Select>
          <Button onClick={handleClearFilters}>Clear</Button>
        </div>
      </div>
      <Row>
        <Col span={16}>
          <VideosContainer />
        </Col>
        <Col span={8}>
          <VideoSubmit handleSubmitVideo={handleSubmitVideo} form={form} />
        </Col>
      </Row>
    </div>
  );
}

export default Videos;
