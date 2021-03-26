import React, { useState, useEffect } from "react";
import moment from "moment";
import { Breadcrumb, Input, Button, Row, Col, Spin } from "antd";
import { DownloadOutlined } from "@ant-design/icons";
import { UserOutlined } from "@ant-design/icons";
import {
  fetchAllAppointments,
  downloadAllApplicationData,
} from "../../utils/api";
import { SortByDateDropdown, SpecializationsDropdown } from "../AdminDropdowns";
import AdminAppointmentCard from "../AdminAppointmentCard";
import "../css/AdminAppointments.scss";
import { SPECIALIZATIONS } from "utils/consts";

const keys = {
  ASCENDING: 0,
  DESCENDING: 1,
};

function AdminAppointmentData() {
  const [isLoading, setIsLoading] = useState(false);
  const [resetFilters, setResetFilters] = useState(false);
  const [appointments, setAppointments] = useState([]);
  const [filterData, setFilterData] = useState([]);
  const [render, setRender] = useState(false);
  const [isDownloadingAppointments, setIsDownloadingAppointments] = useState(
    false
  );
  const [downloadFile, setDownloadFile] = useState(null);

  useEffect(() => {
    async function getAppointments() {
      setIsLoading(true);
      const res = await fetchAllAppointments();

      if (res) {
        const sorted = res.appointments.reverse();
        setAppointments(sorted);
        setFilterData(sorted);
      }
      setIsLoading(false);
    }
    getAppointments();
  }, []);

  const handleSearchAppointment = (searchValue) => {
    if (!searchValue) {
      setFilterData(appointments);
    }

    const newFiltered = filterData.filter((appt) => {
      return (
        appt.mentor.match(new RegExp(searchValue, "i")) ||
        appt.appointment.name.match(new RegExp(searchValue, "i"))
      );
    });
    // setFiltering(!filtering);
    setFilterData(newFiltered);
  };
  const handleResetFilters = () => {
    setFilterData(appointments);
    setResetFilters(!resetFilters);
    // setFiltering(!filtering);
  };
  const handleSortData = (sortingKey) => {
    // setFiltering(!filtering);
    const isAscending = sortingKey === keys.ASCENDING;
    const newSorted = filterData.sort((a, b) => {
      const aDate = moment(a.appointment.timeslot.start_time.$date);
      const bDate = moment(b.appointment.timeslot.start_time.$date);
      return isAscending ? bDate.diff(aDate) : aDate.diff(bDate);
    });
    setFilterData(newSorted);
    setRender(!render);
  };
  const handleSpecializationsDisplay = (index) => {
    const newFiltered = filterData.filter((appt) => {
      return appt.appointment.specialist_categories.includes(
        SPECIALIZATIONS[index]
      );
    });
    setFilterData(newFiltered);
    // setFiltering(!filtering);
  };

  const handleAppointmentDownload = async () => {
    setIsDownloadingAppointments(true);
    const file = await downloadAllApplicationData();
    setDownloadFile(file);
    setIsDownloadingAppointments(false);
  };

  return (
    <div className="appointments-body">
      <div style={{ display: "none" }}>
        <iframe src={downloadFile} />
      </div>
      <Breadcrumb>
        <Breadcrumb.Item>User Reports</Breadcrumb.Item>
        <Breadcrumb.Item>
          <a href="all-appointments">All Appointments</a>
        </Breadcrumb.Item>
      </Breadcrumb>
      <div className="table-header">
        <div className="appointment-search">
          <Input.Search
            placeholder="Search by name"
            prefix={<UserOutlined />}
            allowClear
            size="medium"
            onSearch={(value) => handleSearchAppointment(value)}
          />
        </div>
        <div className="table-button-group">
          <SpecializationsDropdown
            className="table-button"
            onChange={(key) => handleSpecializationsDisplay(key)}
            onReset={resetFilters}
          />
          <SortByDateDropdown
            className="table-button"
            onChange={(key) => handleSortData(key)}
            onReset={resetFilters}
          />
          <Button className="table-button" onClick={() => handleResetFilters()}>
            Clear Filters
          </Button>
          <Button
            className="table-button"
            icon={<DownloadOutlined />}
            onClick={() => handleAppointmentDownload()}
            loading={isDownloadingAppointments}
          >
            Appointment Data
          </Button>
        </div>
      </div>
      <Spin spinning={isLoading} size="large" style={{ height: "100vh" }}>
        <div className="appointments-table">
          <Row gutter={[16, 16]} justify="start">
            {filterData.map((data) => {
              return (
                <Col span={6}>
                  <AdminAppointmentCard data={data} render={render} />
                </Col>
              );
            })}
          </Row>
        </div>
      </Spin>
    </div>
  );
}

export default AdminAppointmentData;
