import React from "react";
import moment from "moment";
import "./css/MentorApplicationView.scss";

function NewMentorAppInfo({ info }) {
  return (
    <div className="info-container">
      <div className="single-info-section info2" style={{ marginTop: "0em" }}>
        <div className="answer">
          {info.date_submitted &&
            `Submission Date: ${moment(info.date_submitted.$date).format(
              "MMMM, D, YYYY"
            )}`}
        </div>
      </div>
      <div className="single-info-section info2">
        <h1 style={{ fontWeight: "bold" }}>{info.name}</h1>
      </div>
      <div className="single-info-section info2">
        <div className="question">Email</div>
        <div className="answer">{info.email}</div>
      </div>
      <div className="single-info-section info2">
        <div className="question">
          {
            "What organization is supporting you locally or what organization are you affiliated with? "
          }
        </div>
        <div className="answer">
          {info.organization ? info.organization : "No affiliation"}
        </div>
      </div>
      {/* <div className="single-info-section info2">
        <div className="question">{"Age"}</div>
        <div className="answer">{info.age}</div>
      </div> */}

      <div className="single-info-section info2">
        <div className="question">
          {
            "Let us know more about you. Check ALL of the boxes that apply. When filling out other, please be very specific."
          }
        </div>
        <div className="answer">
          {info?.immigrant_status.map((elem) => {
            return <div key={elem}>• {elem}</div>;
          })}
        </div>
      </div>
      <div className="single-info-section info2">
        <div className="question">{"Country"}</div>
        <div className="answer">{info.Country}</div>
      </div>
      <div className="single-info-section info2">
        <div className="question">
          {"Let us know more about you. How do you identify?"}
        </div>
        <div className="answer">{info.identify}</div>
      </div>
      <div className="single-info-section info2">
        <div className="question">{"What is your native language?"}</div>
        <div className="answer">{info.language}</div>
      </div>

      <div className="single-info-section info2">
        <div className="question">
          {
            "What special topics would you be interested in? If one is not on the list please add it in other:"
          }
        </div>
        <div className="answer">
          {info?.topics.map((elem) => {
            return <div key={elem}>{elem}</div>;
          })}
        </div>
      </div>

      <div className="single-info-section info2">
        <div className="question">
          {
            "What do you currently do? Please check ALL the options that apply to you. If you select ''other'', please be specific"
          }
        </div>
        <div className="answer">
          {" "}
          {info?.workstate.map((elem) => {
            return <div key={elem}>{elem}</div>;
          })}
        </div>
      </div>

      <div className="single-info-section info2">
        <div className="question">
          {
            "	Would you be interested in being highlighted as one of our mentees on social media?"
          }
        </div>
        <div className="answer">{info.isSocial}</div>
      </div>

      <div className="single-info-section info2">
        <div className="question">{"Do you have any questions?"}</div>
        <div className="answer">{info.questions}</div>
      </div>
    </div>
  );
}

export default NewMentorAppInfo;
