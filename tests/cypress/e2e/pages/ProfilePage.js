const baseURL = Cypress.env("BASE_URL");
const mentorProfileID = Cypress.env("MENTOR_PROFILE_ID");

export class ProfilePage {
  visit() {
    cy.visit("/profile");
  }
  interceptMentorApiCall() {
    const apiUrl = `${baseURL}/api/account/${mentorProfileID}?account_type=1`;
    cy.intercept(apiUrl).as("apiCall");
  }

  waitApiCall() {
    cy.wait("@apiCall").then((interception) => {
      expect(interception.response.statusCode).to.equal(200);
    });
  }
  getProfileDecorations() {
    return cy.get(".mentor-profile-decorations");
  }

  getContactInfo() {
    return cy.get(".mentor-profile-contact > div:nth-child(2) > div:nth-child(2)");
  }

  getEditButton() {
    return cy.get(".ant-btn");
  }

  getEmailElement() {
    return cy.get(".mentor-profile-contact > div:nth-child(2) > div:nth-child(1)");
  }
}

