from __future__ import print_function

import os.path, json
from datetime import datetime, timedelta
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
from flask import Blueprint
from api.core import create_response

application = Blueprint("application", __name__)

SCOPES = ['https://www.googleapis.com/auth/calendar']
token = json.loads(os.getenv('OAUTH_TOKEN'))

@application.route("/generate_url", methods=["GET"])
def generate_url():

    creds = Credentials.from_authorized_user_info(token, SCOPES)
    if not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            print('Token has expired please contact admin')

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
                {'email': 'abdullahjavaid39mts@gmail.com', 'role': 'host', 'sendNotifications': False}],
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
