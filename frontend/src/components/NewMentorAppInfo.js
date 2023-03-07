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
        <div className="question">Cell Phone Number</div>
        <div className="answer">{info.cell_number}</div>
      </div>
      <div className="single-info-section info2">
        <div className="question">
          {"From whom or where did you hear about us?"}
        </div>
        <div className="answer">{info.hear_about_us}</div>
      </div>

      <div className="single-info-section info2">
        <div className="question">
          {
            "Please share which region(s), country(s), state(s), cities your knowledge is based in"
          }
        </div>
        <div className="answer">{info.knowledge_location}</div>
      </div>
      <div className="single-info-section info2">
        <div className="question">
          {"Where have you lived in your life besides where you live now?"}
        </div>
        <div className="answer">{info.pastLiveLocation}</div>
      </div>
      <div className="single-info-section info2">
        <div className="question">{"Full name of your company/employer"}</div>
        <div className="answer">{info.employer_name}</div>
      </div>
      <div className="single-info-section info2">
        <div className="question">
          {"Your full title and a brief description of your role."}
        </div>
        <div className="answer">{info.role_description}</div>
      </div>
      <div className="single-info-section info2">
        <div className="question">
          {"How long have you been with this company?"}
        </div>
        <div className="answer">{info.companyTime}</div>
      </div>

      <div className="single-info-section info2">
        <div className="question">
          {
            "If you are accepted as a global mentor, would you like to commit to..."
          }
        </div>
        <div className="answer">{info.specialistTime}</div>
      </div>

      <div className="single-info-section info2">
        <div className="question">
          {
            "Are you an immigrant or refugee or do you come from an immigrant family or refugee family?"
          }
        </div>
        <div className="answer">{info.immigrant_status ? "Yes" : "No"}</div>
      </div>

      <div className="single-info-section info2">
        <div className="question">
          {"Are you or your family from a native or aboriginal community?"}
        </div>
        <div className="answer">{info.isFamilyNative ? "Yes" : "No"}</div>
      </div>
      <div className="single-info-section info2">
        <div className="question">
          {"Did you grow up economically challenged?"}
        </div>
        <div className="answer">{info.isEconomically ? "Yes" : "No"}</div>
      </div>

      <div className="single-info-section info2">
        <div className="question">
          {"Would you consider yourself of person of color"}
        </div>
        <div className="answer">{info.isColorPerson ? "Yes" : "No"}</div>
      </div>

      <div className="single-info-section info2">
        <div className="question">{"How do you identify?"}</div>
        <div className="answer">{info.identify}</div>
      </div>

      <div className="single-info-section info2">
        <div className="question">
          {"Would you define yourself as having been or currently marginalized"}
        </div>
        <div className="answer">{info.isMarginalized ? "Yes" : "No"}</div>
      </div>

      <div className="single-info-section info2">
        <div className="question">
          {
            "Do you speak a language(s) other than English? If yes, please write the language(s) below and include your fluency level (conversational, fluent, native)."
          }
        </div>
        <div className="answer">{info.languages}</div>
      </div>
      <div className="single-info-section info2">
        <div className="question">
          {
            "If you know someone who would be a great global mentor, please share their name, email, and we'll contact them!"
          }
        </div>
        <div className="answer">{info.referral}</div>
      </div>

      <div className="single-info-section info2">
        <div className="question">
          {
            "MENTEE is a volunteer organization and we are sustained by donations. Are you able to offer a donation for one year?"
          }
        </div>
        <div className="answer">{info.offer_donation}</div>
      </div>
    </div>
  );
}

export default NewMentorAppInfo;
