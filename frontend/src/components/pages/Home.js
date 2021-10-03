import React, { useState } from "react";
import { NavLink, withRouter } from "react-router-dom";
import LoginVerificationModal from "../LoginVerificationModal";
import "../css/Home.scss";
import Logo from "../../resources/logo.png";
import Health from "../../resources/focus-for-health.svg";
import useAuth from "../../utils/hooks/useAuth";
import { MENTEE_GALLERY_PAGE, MENTOR_GALLERY_PAGE } from "../../utils/consts";

function Home({ history }) {
    const { isMentor } = useAuth();
    return (
        <div className="home-background">
            <div className="home-content">
                <div className="home-text-container">
                    <h1 className="home-header">Welcome to MENTEE</h1>
                    <p className="home-text">Find a global mentor now...</p>
                    <br />
                    <LoginVerificationModal
                        content={
                            isMentor ? (
                                <b>Find a Mentee</b>
                            ) : (
                                <b>Find a Mentor</b>
                            )
                        }
                        theme="dark"
                        onVerified={() => {
                            let redirect = MENTOR_GALLERY_PAGE;
                            if (isMentor) {
                                redirect = MENTEE_GALLERY_PAGE;
                            }
                            history.push({
                                pathname: redirect,
                                state: { verified: true },
                            });
                        }}
                    />
                </div>
                <img className="logo" src={Logo} alt="Adrinka Logo" />
            </div>
            <img
                className="focus-for-health"
                src={Health}
                alt="Focus for Health Logo"
            />
        </div>
    );
}

export default withRouter(Home);
