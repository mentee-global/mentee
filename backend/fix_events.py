
import os
from pymongo import MongoClient

def fix_events_direct():
    
    
    client = MongoClient('mongodb://localhost:27017/')
    db = client['MENTEE']  
    events_collection = db['event']  
    
    print("Connected to MongoDB directly")
    
    
    events = list(events_collection.find())
    print(f"Found {len(events)} events")
    
    updated_count = 0
    
    for event in events:
        print(f"\nEvent: {event.get('title', 'Unknown')}")
        print(f"Current roles: {event.get('role', [])}")
        
        current_roles = event.get('role', [])
        
        
        if 6 in current_roles and 2 not in current_roles:
            
            new_roles = current_roles + [2]
            
            
            events_collection.update_one(
                {'_id': event['_id']},
                {'$set': {'role': new_roles}}
            )
            
            print(f"Updated roles to: {new_roles}")
            updated_count += 1
            
        elif 2 in current_roles:
            print("Already includes mentee role")
        else:
            print("No changes needed")
    
    print(f"\nUpdated {updated_count} events")
    
    
    mentee_events = list(events_collection.find({'role': {'$in': [2]}}))
    print(f"Events now visible to mentees: {len(mentee_events)}")
    
    for event in mentee_events:
        print(f"- {event.get('title', 'Unknown')} (roles: {event.get('role', [])})")
    
    client.close()

if __name__ == "__main__":
    fix_events_direct()
