import React, { useEffect, useState } from "react";
import { BrowserRouter as Router } from "react-router-dom";
import { Layout, ConfigProvider, Result } from "antd";
import { useTranslation } from "react-i18next";
import { getAntdLocale } from "utils/translations";
import Appointments from "components/pages/Appointments";
import MenteeAppointments from "components/pages/MenteeAppointments";
import Videos from "components/pages/Videos";
import Profile from "components/pages/Profile";
import Gallery from "components/pages/Gallery";
import PublicProfile from "components/pages/PublicProfile";
import NewTrainingConfirm from "components/pages/NewTrainingConfirm";
import Login from "components/pages/Login";
import AdminLogin from "components/pages/AdminLogin";
import SupportLogin from "components/pages/SupportLogin";
import ForgotPassword from "components/pages/ForgotPassword";
import ApplicationOrganizer from "components/pages/ApplicationOrganizer";
import AdminAccountData from "components/pages/AdminAccountData";
import AdminAppointmentData from "components/pages/AdminAppointmentData";
import MenteeGallery from "components/pages/MenteeGallery";
import Messages from "components/pages/Messages";
import GroupMessages from "components/pages/GroupMessages";
import ApplicationForm from "components/pages/ApplicationForm";
import SocketComponent from "components/SocketComponent";
import AdminTraining from "components/pages/AdminTraining";
import TrainingData from "components/pages/TrainingData";
import EventDetail from "components/pages/EventDetail";
import { Languages } from "components/Languages";
import { Hubs } from "components/Hubs";
import { Specializations } from "components/Specializations";
import { AdminMessages } from "components/pages/AdminSeeMessages";
import PartnerGallery from "components/pages/PartnerGallery";
import NavigationHeader from "components/NavigationHeader";
import HubFooter from "components/HubFooter";
import NavigationSider from "components/NavigationSider";
import Initiator from "components/Initiator";
import PrivateRoute from "components/PrivateRoute";
import HomeLayout from "components/pages/HomeLayout";
import Home from "components/pages/Home";
import Apply from "components/pages/Apply";
import { getRole } from "utils/auth.service";
import PublicRoute from "components/PublicRoute";
import Training from "components/pages/Training";
import BuildProfile from "components/pages/BuildProfile";
import Events from "components/pages/Events";
import HubInviteLink from "components/pages/HubInviteLink";
import { useSelector } from "react-redux";
import { ACCOUNT_TYPE } from "utils/consts";
import { fetchAccounts } from "utils/api";
import CreateMeetingLink from "components/CreateMeetingLink";
import MeetingPanel from "components/MeetingPanel";

const { Content } = Layout;

function App() {
  const [startPathTime, setStartPathTime] = useState(new Date().getTime());

  const { t, i18n } = useTranslation();
  const [antdLocale, setAntdLocale] = useState(getAntdLocale(i18n.language));
  const { user } = useSelector((state) => state.user);
  const path = window.location.href;
  const [role, setRole] = useState(getRole());
  const [allHubData, setAllHubData] = useState({});

  // TODO: Remove this when we have a proper solution for this
  // some kind of cached method of updating on login status change
  // useEffect(() => {
  //   setRole(getRole());
  // }, [user]);

  useEffect(() => {
    const getData = async () => {
      let data = await fetchAccounts(ACCOUNT_TYPE.HUB);
      if (data) {
        var temp = {};
        data.map((item) => {
          temp["/" + item.url] = item;
          return true;
        });
        setAllHubData(temp);
      }
    };
    getData();
  }, []);

  useEffect(() => {
    setRole(getRole());
  }, [user]);

  useEffect(() => {
    setStartPathTime(new Date().getTime());
  }, [path]);

  useEffect(() => {
    setAntdLocale(getAntdLocale(i18n.language));
  }, [i18n.language]);

  const cur_time = new Date().getTime();

  return (
    <>
      <ConfigProvider
        locale={antdLocale}
        // TODO: Move this to a theme file
        theme={{
          token: {
            colorPrimary: "#800020",
            colorBgLayout: "#ffffff",
          },
        }}
      >
        <Router>
          <SocketComponent />
          <Initiator />
          <Layout hasSider>
            {role && <NavigationSider />}
            <Content>
              {role && <NavigationHeader />}
              {role == ACCOUNT_TYPE.HUB && <HubFooter />}
              <HomeLayout ignoreHomeLayout={role} allHubData={allHubData}>
                <PublicRoute exact path="/">
                  <Home />
                </PublicRoute>
                <PublicRoute path="/login">
                  <Login />
                </PublicRoute>
                <PublicRoute path="/mentor/login">
                  <Login />
                </PublicRoute>
                <PublicRoute path="/mentee/login">
                  <Login />
                </PublicRoute>
                <PublicRoute path="/partner/login">
                  <Login />
                </PublicRoute>
                <PublicRoute path="/readonly/login">
                  <Login />
                </PublicRoute>
                <PublicRoute path="/admin">
                  <AdminLogin />
                </PublicRoute>
                <PublicRoute path="/support">
                  <SupportLogin role={ACCOUNT_TYPE.SUPPORT} />
                </PublicRoute>
                <PublicRoute path="/apply">
                  <Apply />
                </PublicRoute>
                <PublicRoute path="/application-form">
                  <ApplicationForm />
                </PublicRoute>
                <PublicRoute path="/application-training">
                  <Training />
                </PublicRoute>
                <PublicRoute path="/build-profile">
                  <BuildProfile />
                </PublicRoute>
                {Object.keys(allHubData).map((hub_url) => {
                  return (
                    <>
                      <PublicRoute exact path={hub_url}>
                        <SupportLogin role={ACCOUNT_TYPE.HUB} />
                      </PublicRoute>
                      {allHubData[hub_url].invite_key && (
                        <PublicRoute
                          path={hub_url + "/" + allHubData[hub_url].invite_key}
                        >
                          <BuildProfile hub_user={allHubData[hub_url]} />
                        </PublicRoute>
                      )}
                    </>
                  );
                })}
                <PublicRoute path="/forgot-password">
                  <ForgotPassword />
                </PublicRoute>
              </HomeLayout>
              <PrivateRoute path="/support/all-mentors">
                {role == ACCOUNT_TYPE.SUPPORT ? (
                  <Gallery isSupport={true} />
                ) : (
                  <>
                    {cur_time - startPathTime > 100 && (
                      <Result
                        status="403"
                        title="403"
                        subTitle={t("gallery.unauthorizedAccess")}
                      />
                    )}
                  </>
                )}
              </PrivateRoute>
              <PrivateRoute path="/support/all-mentees">
                {role == ACCOUNT_TYPE.SUPPORT ? (
                  <MenteeGallery isSupport={true} />
                ) : (
                  <>
                    {cur_time - startPathTime > 100 && (
                      <Result
                        status="403"
                        title="403"
                        subTitle={t("gallery.unauthorizedAccess")}
                      />
                    )}
                  </>
                )}
              </PrivateRoute>
              <PrivateRoute path="/support/all-partners">
                {role == ACCOUNT_TYPE.SUPPORT ? (
                  <PartnerGallery isSupport={true} />
                ) : (
                  <>
                    {cur_time - startPathTime > 100 && (
                      <Result
                        status="403"
                        title="403"
                        subTitle={t("gallery.unauthorizedAccess")}
                      />
                    )}
                  </>
                )}
              </PrivateRoute>
              <PrivateRoute path="/appointments">
                {role == ACCOUNT_TYPE.MENTOR ? (
                  <Appointments />
                ) : (
                  <>
                    {cur_time - startPathTime > 100 && (
                      <Result
                        status="403"
                        title="403"
                        subTitle={t("gallery.unauthorizedAccess")}
                      />
                    )}
                  </>
                )}
              </PrivateRoute>
              <PrivateRoute path="/mentor/training">
                {role == ACCOUNT_TYPE.MENTOR ? (
                  <TrainingData role={ACCOUNT_TYPE.MENTOR} />
                ) : (
                  <>
                    {cur_time - startPathTime > 100 && (
                      <Result
                        status="403"
                        title="403"
                        subTitle={t("gallery.unauthorizedAccess")}
                      />
                    )}
                  </>
                )}
              </PrivateRoute>
              <PrivateRoute path="/videos">
                {role == ACCOUNT_TYPE.MENTOR ? (
                  <Videos />
                ) : (
                  <>
                    {cur_time - startPathTime > 100 && (
                      <Result
                        status="403"
                        title="403"
                        subTitle={t("gallery.unauthorizedAccess")}
                      />
                    )}
                  </>
                )}
              </PrivateRoute>

              <PrivateRoute path="/mentee-appointments">
                {role == ACCOUNT_TYPE.MENTEE ? (
                  <MenteeAppointments />
                ) : (
                  <>
                    {cur_time - startPathTime > 100 && (
                      <Result
                        status="403"
                        title="403"
                        subTitle={t("gallery.unauthorizedAccess")}
                      />
                    )}
                  </>
                )}
              </PrivateRoute>
              <PrivateRoute path="/mentee/training">
                {role == ACCOUNT_TYPE.MENTEE ? (
                  <TrainingData role={ACCOUNT_TYPE.MENTEE} />
                ) : (
                  <>
                    {cur_time - startPathTime > 100 && (
                      <Result
                        status="403"
                        title="403"
                        subTitle={t("gallery.unauthorizedAccess")}
                      />
                    )}
                  </>
                )}
              </PrivateRoute>
              <PrivateRoute path="/profile">
                {role == ACCOUNT_TYPE.MENTOR ||
                role == ACCOUNT_TYPE.MENTEE ||
                role == ACCOUNT_TYPE.PARTNER ? (
                  <Profile />
                ) : (
                  <>
                    {cur_time - startPathTime > 100 && (
                      <Result
                        status="403"
                        title="403"
                        subTitle={t("gallery.unauthorizedAccess")}
                      />
                    )}
                  </>
                )}
              </PrivateRoute>

              <PrivateRoute path="/gallery" exact>
                {role == ACCOUNT_TYPE.MENTEE ||
                role == ACCOUNT_TYPE.GUEST ||
                role == ACCOUNT_TYPE.ADMIN ? (
                  <Gallery />
                ) : (
                  <>
                    {cur_time - startPathTime > 100 && (
                      <Result
                        status="403"
                        title="403"
                        subTitle={t("gallery.unauthorizedAccess")}
                      />
                    )}
                  </>
                )}
              </PrivateRoute>
              {Object.keys(allHubData).map((hub_url) => {
                return (
                  <>
                    <PrivateRoute path={hub_url + "/partner-gallery"}>
                      <PartnerGallery />
                    </PrivateRoute>
                    <PrivateRoute path={hub_url + "/events"}>
                      <Events />
                    </PrivateRoute>
                    <PrivateRoute path={hub_url + "/partner/training"}>
                      <TrainingData role={ACCOUNT_TYPE.HUB} />
                    </PrivateRoute>
                    <PrivateRoute path={hub_url + "/profile"}>
                      <Profile />
                    </PrivateRoute>
                    <PrivateRoute path={hub_url + "/invite-link"}>
                      <HubInviteLink />
                    </PrivateRoute>
                    <PrivateRoute path={hub_url + "/event/:id"}>
                      <EventDetail />
                    </PrivateRoute>
                    <PrivateRoute
                      path={hub_url + "/group_messages/:hub_user_id"}
                    >
                      <GroupMessages />
                    </PrivateRoute>
                  </>
                );
              })}
              <PrivateRoute path="/partner-gallery" exact>
                {role == ACCOUNT_TYPE.PARTNER ||
                role == ACCOUNT_TYPE.GUEST ||
                role == ACCOUNT_TYPE.HUB ||
                role == ACCOUNT_TYPE.ADMIN ? (
                  <PartnerGallery />
                ) : (
                  <>
                    {cur_time - startPathTime > 100 && (
                      <Result
                        status="403"
                        title="403"
                        subTitle={t("gallery.unauthorizedAccess")}
                      />
                    )}
                  </>
                )}
              </PrivateRoute>
              <PrivateRoute path="/mentee-gallery" exact>
                {role == ACCOUNT_TYPE.MENTOR ||
                role == ACCOUNT_TYPE.MENTEE ||
                role == ACCOUNT_TYPE.GUEST ||
                role == ACCOUNT_TYPE.ADMIN ? (
                  <MenteeGallery />
                ) : (
                  <>
                    {cur_time - startPathTime > 100 && (
                      <Result
                        status="403"
                        title="403"
                        subTitle={t("gallery.unauthorizedAccess")}
                      />
                    )}
                  </>
                )}
              </PrivateRoute>

              <PrivateRoute path="/gallery/:type/:id">
                <PublicProfile />
              </PrivateRoute>
              <PrivateRoute path="/new_training/:type/:id">
                <NewTrainingConfirm />
              </PrivateRoute>

              <PrivateRoute path="/organizer">
                {role == ACCOUNT_TYPE.ADMIN ? (
                  <ApplicationOrganizer isMentor={true} />
                ) : (
                  <>
                    {cur_time - startPathTime > 100 && (
                      <Result
                        status="403"
                        title="403"
                        subTitle={t("gallery.unauthorizedAccess")}
                      />
                    )}
                  </>
                )}
              </PrivateRoute>
              <PrivateRoute path="/menteeOrganizer">
                {role == ACCOUNT_TYPE.ADMIN ? (
                  <ApplicationOrganizer isMentor={false} />
                ) : (
                  <>
                    {cur_time - startPathTime > 100 && (
                      <Result
                        status="403"
                        title="403"
                        subTitle={t("gallery.unauthorizedAccess")}
                      />
                    )}
                  </>
                )}
              </PrivateRoute>
              <PrivateRoute path="/account-data">
                {role == ACCOUNT_TYPE.ADMIN || role == ACCOUNT_TYPE.HUB ? (
                  <AdminAccountData />
                ) : (
                  <>
                    {cur_time - startPathTime > 100 && (
                      <Result
                        status="403"
                        title="403"
                        subTitle={t("gallery.unauthorizedAccess")}
                      />
                    )}
                  </>
                )}
              </PrivateRoute>
              <PrivateRoute path="/hub-data">
                {role == ACCOUNT_TYPE.ADMIN ? (
                  <Hubs />
                ) : (
                  <>
                    {cur_time - startPathTime > 100 && (
                      <Result
                        status="403"
                        title="403"
                        subTitle={t("gallery.unauthorizedAccess")}
                      />
                    )}
                  </>
                )}
              </PrivateRoute>
              <PrivateRoute path="/all-appointments">
                {role == ACCOUNT_TYPE.ADMIN ? (
                  <AdminAppointmentData />
                ) : (
                  <>
                    {cur_time - startPathTime > 100 && (
                      <Result
                        status="403"
                        title="403"
                        subTitle={t("gallery.unauthorizedAccess")}
                      />
                    )}
                  </>
                )}
              </PrivateRoute>
              <PrivateRoute path="/admin-training">
                {role == ACCOUNT_TYPE.ADMIN ? (
                  <AdminTraining />
                ) : (
                  <>
                    {cur_time - startPathTime > 100 && (
                      <Result
                        status="403"
                        title="403"
                        subTitle={t("gallery.unauthorizedAccess")}
                      />
                    )}
                  </>
                )}
              </PrivateRoute>
              <PrivateRoute path="/languages">
                {role == ACCOUNT_TYPE.ADMIN ? (
                  <Languages />
                ) : (
                  <>
                    {cur_time - startPathTime > 100 && (
                      <Result
                        status="403"
                        title="403"
                        subTitle={t("gallery.unauthorizedAccess")}
                      />
                    )}
                  </>
                )}
              </PrivateRoute>
              <PrivateRoute path="/specializations">
                {role == ACCOUNT_TYPE.ADMIN ? (
                  <Specializations />
                ) : (
                  <>
                    {cur_time - startPathTime > 100 && (
                      <Result
                        status="403"
                        title="403"
                        subTitle={t("gallery.unauthorizedAccess")}
                      />
                    )}
                  </>
                )}
              </PrivateRoute>
              <PrivateRoute path="/messages-details">
                {role == ACCOUNT_TYPE.ADMIN ? (
                  <AdminMessages />
                ) : (
                  <>
                    {cur_time - startPathTime > 100 && (
                      <Result
                        status="403"
                        title="403"
                        subTitle={t("gallery.unauthorizedAccess")}
                      />
                    )}
                  </>
                )}
              </PrivateRoute>

              <PrivateRoute path="/partner/training">
                {role == ACCOUNT_TYPE.PARTNER || role == ACCOUNT_TYPE.HUB ? (
                  <TrainingData role={ACCOUNT_TYPE.PARTNER} />
                ) : (
                  <>
                    {cur_time - startPathTime > 100 && (
                      <Result
                        status="403"
                        title="403"
                        subTitle={t("gallery.unauthorizedAccess")}
                      />
                    )}
                  </>
                )}
              </PrivateRoute>

              <PrivateRoute path="/messages/:receiverId">
                <Messages />
              </PrivateRoute>
              <PrivateRoute path="/events">
                <Events />
              </PrivateRoute>
              <PrivateRoute path="/event/:id">
                <EventDetail />
              </PrivateRoute>
              <PrivateRoute path="/createmeetinglink">
                <CreateMeetingLink />
              </PrivateRoute>
            </Content>
            <MeetingPanel />
          </Layout>
        </Router>
      </ConfigProvider>
    </>
  );
}

export default App;
