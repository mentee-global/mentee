import React, { useEffect, useState } from "react";
import { NavLink, useHistory } from "react-router-dom";
import { logout, getMentorID, getAdminID } from "utils/auth.service";
import { Layout, Dropdown, Menu } from "antd";
import MenteeMessageTab from "MenteeMessageTab";


const { Footer } = Layout;

function MenteeFooter() {
  const history = useHistory();

  return (
    <Footer>
      <MenteeMessageTab></MenteeMessageTab>
    </Footer>
  );
}

export default withRouter(MenteeFooter);
