import React from "react";
import moment from "moment";
import "./css/MentorApplicationView.scss";

const questions = {
  referral: "From whom or where did you hear about us?",
  donation: "Are you able to offer a donation for one year?",
  methods: "Methods of mentorship:",
  availability: "How often can you mentor?",
  company: "Full name of your company/employer:",
  job: "Your full title and a brief description of your role:",
  sector: "Which Sectors do you work in?",
  reason:
    "Please share why you would like to become a part of our MENTEE Mentor Specialist team?",
  immigration:
    "Are you an immigrant or refugee or do you come from an immigrant or refugee family?",
  languages: "Languages:",
  topics: "What special topics could you teach or offer guidance on?",
  knowledge_location:
    "Please share which region(s), country(s), state(s), cities your knowledge is based in:",
};

function MentorAppInfo({ info }) {
  return (
    <div className="info-container">
      <div className="single-info-section" style={{ marginTop: "0em" }}>
        <div className="answer">
          {info.date_submitted &&
            `Submission Date: ${moment(info.date_submitted.$date).format(
              "MMMM, D, YYYY"
            )}`}
        </div>
      </div>
      <div className="single-info-section">
        <h1 style={{ fontWeight: "bold" }}>{info.name}</h1>
      </div>
      <div className="single-info-section">
        <div className="question">Linkedin</div>
        <div className="answer">{info.linkedin}</div>
      </div>
      <div className="double-info-section">
        <div style={{ width: "50%" }}>
          <div className="question">Phone</div>
          <div className="answer">{info.cell_number}</div>
        </div>
        <div style={{ width: "50%" }}>
          <div className="question">Phone (Business)</div>
          <div className="answer">{info.business_number}</div>
        </div>
      </div>
      <div className="single-info-section">
        <div className="question">Email</div>
        <div className="answer">{info.email}</div>
      </div>
      <div className="single-info-section">
        <div className="question">{questions.referral}</div>
        <div className="answer">{info.hear_about_us}</div>
      </div>
      <div className="single-info-section">
        <div className="question">{questions.donation}</div>
        <div className="answer">{info.offer_donation ? "Yes" : "No"}</div>
      </div>
      <div className="single-info-section">
        <div className="question">{questions.methods}</div>
        <div className="answer">{info.mentoring_options}</div>
      </div>
      <div className="single-info-section">
        <div className="question">{questions.availability}</div>
        <div className="answer">{info.commit_time}</div>
      </div>
      <div className="double-info-section">
        <div style={{ width: "50%" }}>
          <div className="question">{questions.company}</div>
          <div className="answer">{info.employer_name}</div>
        </div>
        <div style={{ width: "50%" }}>
          <div className="question">{questions.job}</div>
          <div className="answer">{info.role_description}</div>
        </div>
      </div>
      <div className="single-info-section">
        <div className="question">{questions.sector}</div>
        <div className="answer">{info.work_sectors}</div>
      </div>
      <div className="single-info-section">
        <div className="question">{questions.reason}</div>
        <div className="answer">{info.why_join_mentee}</div>
      </div>
      <div className="double-info-section">
        <div style={{ width: "40%" }}>
          <div className="question">{questions.immigration}</div>
          <div className="answer">{info.immigrant_status}</div>
        </div>
        <div style={{ width: "50%" }}>
          <div className="question">{questions.languages}</div>
          <div className="answer">
            {info.languages &&
              (!Array.isArray(info.languages)
                ? info.languages
                : info.languages.map((elem) => {
                    return <div>• {elem}</div>;
                  }))}
          </div>
        </div>
      </div>
      <div className="single-info-section">
        <div className="question">{questions.topics}</div>
        <div className="answer">
          {info.specializations &&
            info.specializations.map((elem) => {
              return <div>• {elem}</div>;
            })}
        </div>
      </div>
      <div className="single-info-section">
        <div className="question">{questions.knowledge_location}</div>
        <div className="answer">{info.knowledge_location}</div>
      </div>
    </div>
  );
}

export default MentorAppInfo;
