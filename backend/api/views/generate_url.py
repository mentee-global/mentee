from __future__ import print_function

import os.path
from datetime import datetime, timedelta
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build


from os import name
from bson import is_valid
from flask import Blueprint, request
from sqlalchemy import null
from api.models import (
    Admin,
    NewMentorApplication,
    VerifiedEmail,
    Users,
    MenteeApplication,
    PartnerApplication,
    MenteeProfile,
    MentorProfile,
    PartnerProfile,
    MentorApplication,
)
from api.core import create_response, logger
from api.utils.require_auth import admin_only
from api.utils.constants import (
    MENTOR_APP_SUBMITTED,
    MENTEE_APP_SUBMITTED,
    MENTOR_APP_REJECTED,
    NEW_APPLICATION_STATUS,
    APP_APROVED,
    TRAINING_COMPLETED,
    PROFILE_COMPLETED,
    TRANSLATIONS,
    ALERT_TO_ADMINS,
    
)
from api.utils.request_utils import (
    send_email,
    is_invalid_form,
    MentorApplicationForm,
    MenteeApplicationForm,
    PartnerApplicationForm,
    get_profile_model,
)
from api.utils.constants import Account
from firebase_admin import auth as firebase_admin_auth
import urllib

application = Blueprint("application", __name__)

SCOPES = ['https://www.googleapis.com/auth/calendar']

@application.route("/generate_url", methods=["GET"])
def generate_url():

    creds = None
    if os.path.exists('token.json'):
        creds = Credentials.from_authorized_user_file('token.json', SCOPES)
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            flow = InstalledAppFlow.from_client_secrets_file(
                'oauth.json', SCOPES)
            creds = flow.run_local_server(port=0)
        # Save the credentials for the next run
        with open('token.json', 'w') as token:
            token.write(creds.to_json())

    try:
        service = build('calendar', 'v3', credentials=creds)

        # Define the event details
        start_time = datetime.now() - timedelta(days=1)
        end_time = start_time + timedelta(days=365)
        event = {
            'summary': 'Open Meeting',
            'description': 'This is an open meeting',
            'start': {'dateTime': start_time.strftime('%Y-%m-%dT%H:%M:%S'), 'timeZone': 'UTC'},
            'end': {'dateTime': end_time.strftime('%Y-%m-%dT%H:%M:%S'), 'timeZone': 'UTC'},
            'visibility': 'public',
            "settings.access_type":'Open',
            'attendees': [
                {'email': 'm.zeeshanasghar101@gmail.com', 'role': 'host', 'sendNotifications': False}],
            'conferenceData': {
                'createRequest': {
                    'requestId': 'your-unique-request-id',
                    'conferenceSolutionKey': {
                        'type': 'hangoutsMeet'
                    },
                    'status': {
                        'statusCode': 'success'
                    },
                    'additionalGuests': 'true'
                }
            }
        }

        event = service.events().insert(calendarId='primary', body=event, conferenceDataVersion=1).execute()
        return create_response(data={"url": event.get('hangoutLink')})

    except Exception as error:
        return create_response(status=422, message=f'Token has expired please contact admin')
