import React, { useState, useEffect } from "react";
import { Breadcrumb, Input, Button } from "antd";
import { UserOutlined } from "@ant-design/icons";
import { fetchAllAppointments } from "../../utils/api";
import { SortByDateDropdown, SpecializationsDropdown } from "../AdminDropdowns";
import "../css/AdminAppointments.scss";

function AdminAppointmentData() {
  const [isReloading, setIsReloading] = useState(false);
  const [resetFilters, setResetFilters] = useState(false);
  const [appointments, setAppointments] = useState([]);
  const [filterData, setFilterData] = useState([]);

  useEffect(() => {
    async function getAppointments() {
      const res = await fetchAllAppointments();

      if (res) {
        setAppointments(res.appointments);
        setFilterData(res.appointments);
        // TODO: REMOVE
        console.log(res.appointments);
      }
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
      <div className="appointments-table"></div>
    </div>
  );
}

export default AdminAppointmentData;
