import React, { useState, useEffect } from "react";
import { Breadcrumb, Input, Button, Row, Col, Spin } from "antd";
import { UserOutlined } from "@ant-design/icons";
import { fetchAllAppointments } from "../../utils/api";
import { SortByDateDropdown, SpecializationsDropdown } from "../AdminDropdowns";
import AdminAppointmentCard from "../AdminAppointmentCard";
import "../css/AdminAppointments.scss";

function AdminAppointmentData() {
  const [isLoading, setIsLoading] = useState(false);
  const [resetFilters, setResetFilters] = useState(false);
  const [appointments, setAppointments] = useState([]);
  const [filterData, setFilterData] = useState([]);

  useEffect(() => {
    async function getAppointments() {
      setIsLoading(true);
      const res = await fetchAllAppointments();

      if (res) {
        setAppointments(res.appointments);
        setFilterData(res.appointments);
        // TODO: REMOVE
        console.log(res.appointments);
      }
      setIsLoading(false);
    }
    getAppointments();
  }, []);

  const handleSearchAppointment = (value) => {};
  const handleResetFilters = () => {};
  const handleSortData = () => {};
  const handleSpecializationsDisplay = () => {};

  return (
    <div className="appointments-body">
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
        </div>
      </div>
      <Spin spinning={isLoading} size="large" style={{ height: "100vh" }}>
        <div className="appointments-table">
          <Row gutter={[16, 16]} justify="space-between">
            {filterData.map((data, i) => {
              return (
                <Col span={6}>
                  <AdminAppointmentCard data={data} />
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
