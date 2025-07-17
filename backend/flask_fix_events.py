
import sys
import os

def fix_events_with_flask():
   
    
    
    script = '''
from api.models import Event
from api.utils.constants import Account

print("Getting all events...")
events = Event.objects()
print(f"Found {len(events)} events")

updated = 0
for event in events:
    print(f"\\nEvent: {event.title}")
    print(f"Current roles: {event.role}")
    
    # If event doesn't include mentee role, add it
    if Account.MENTEE.value not in event.role:
        event.role.append(Account.MENTEE.value)
        event.save()
        print(f"Added mentee role. New roles: {event.role}")
        updated += 1
    else:
        print("Already includes mentee role")

print(f"\\nUpdated {updated} events")

# Verify mentees can now see events
mentee_events = Event.objects(role__in=[Account.MENTEE.value])
print(f"Events visible to mentees: {len(mentee_events)}")

for event in mentee_events:
    print(f"- {event.title} (roles: {event.role})")
'''
    
    return script

if __name__ == "__main__":
    script = fix_events_with_flask()
    print("Run this in Flask shell:")
    print("python manage.py shell")
    print("Then paste this script:")
    print("-" * 50)
    print(script)
