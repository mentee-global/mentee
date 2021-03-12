import React from "react";
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
  immigration: "Are you an immigrant or refugee do you come from",
  languages: "Languages:",
  topics: "What special topics could you teach or offer guidance on?",
  knowledge_location:
    "Please share which region(s), country(s), state(s), cities your knowledge is based in:",
};

function MentorAppInfo({ info }) {
  return (
    <div className="info-container">
      <div className="single-info-section" style={{ marginTop: "0em" }}>
        <div className="answer">{info.date_submitted}</div>
      </div>
      <div className="single-info-section">
        <h2 style={{ fontWeight: "bold" }}>{info.name}</h2>
      </div>
      <div className="single-info-section">
        <div className="question">Linkedin</div>
        <div className="answer">Answer</div>
      </div>
      <div className="double-info-section">
        <div style={{ width: "50%" }}>
          <div className="question">Phone</div>
          <div className="answer">Answer</div>
        </div>
        <div style={{ width: "50%" }}>
          <div className="question">Phone (Business)</div>
          <div className="answer">Answer</div>
        </div>
      </div>
      <div className="single-info-section">
        <div className="question">Email</div>
        <div className="answer">Answer</div>
      </div>
      <div className="single-info-section">
        <div className="question">{questions.referral}</div>
        <div className="answer">Answer</div>
      </div>
      <div className="single-info-section">
        <div className="question">{questions.donation}</div>
        <div className="answer">Answer</div>
      </div>
      <div className="single-info-section">
        <div className="question">{questions.methods}</div>
        <div className="answer">Answer</div>
      </div>
      <div className="single-info-section">
        <div className="question">{questions.availability}</div>
        <div className="answer">Answer</div>
      </div>
      <div className="double-info-section">
        <div style={{ width: "50%" }}>
          <div className="question">{questions.company}</div>
          <div className="answer">Answer</div>
        </div>
        <div style={{ width: "50%" }}>
          <div className="question">{questions.job}</div>
          <div className="answer">Answer</div>
        </div>
      </div>
      <div className="single-info-section">
        <div className="question">{questions.sector}</div>
        <div className="answer">Answer</div>
      </div>
      <div className="single-info-section">
        <div className="question">{questions.reason}</div>
        <div className="answer">Answer</div>
      </div>
      <div className="double-info-section">
        <div style={{ width: "50%" }}>
          <div className="question">{questions.immigration}</div>
          <div className="answer">Answer</div>
        </div>
        <div style={{ width: "50%" }}>
          <div className="question">{questions.languages}</div>
          <div className="answer">Answer</div>
        </div>
      </div>
      <div className="single-info-section">
        <div className="question">{questions.topics}</div>
        <div className="answer">Answer</div>
      </div>
      <div className="single-info-section">
        <div className="question">{questions.knowledge_location}</div>
        <div className="answer">Answer</div>
      </div>
    </div>
  );
}

export default MentorAppInfo;
