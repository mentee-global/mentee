

import requests
import json

def fix_events_via_api():
 
    
    base_url = "http://localhost:8000/api"
    
    print("Getting all events (admin view)...")
    
    # Get all events using admin role (0)
    response = requests.get(f"{base_url}/events/0")
    
    if response.status_code != 200:
        print(f"Failed to get events: {response.status_code}")
        return
    
    data = response.json()
    events = data.get("result", {}).get("events", [])
    
    print(f"Found {len(events)} events")
    
    for event in events:
        event_id = event["_id"]["$oid"]
        title = event.get("title", "Unknown")
        current_roles = event.get("role", [])
        
        print(f"\nEvent: {title}")
        print(f"ID: {event_id}")
        print(f"Current roles: {current_roles}")
        
        
        if 2 not in current_roles:
            
            new_roles = current_roles + [2]
            
            
            print(f"Event needs mentee role added: {current_roles} -> {new_roles}")
            print("Note: This would require an API update endpoint")
        else:
            print("Already includes mentee role")
    

    print("\nTesting mentee events access...")
    response = requests.get(f"{base_url}/events/2")
    
    if response.status_code == 200:
        mentee_data = response.json()
        mentee_events = mentee_data.get("result", {}).get("events", [])
        print(f"Mentees can see {len(mentee_events)} events")
        
        for event in mentee_events:
            print(f"- {event.get('title', 'Unknown')}")
    else:
        print(f"Failed to get mentee events: {response.status_code}")

if __name__ == "__main__":
    fix_events_via_api()
