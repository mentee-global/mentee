
from pymongo import MongoClient

def explore_mongo():
    
    
    client = MongoClient('mongodb://localhost:27017/')
    
   
    print("Available databases:")
    for db_name in client.list_database_names():
        print(f"  - {db_name}")
    
   
    db_names_to_try = ['MENTEE', 'mentee', 'test', 'mentoship', 'app']
    
    for db_name in db_names_to_try:
        if db_name in client.list_database_names():
            print(f"\nExploring database: {db_name}")
            db = client[db_name]
            
            collections = db.list_collection_names()
            print(f"Collections in {db_name}:")
            for coll in collections:
                print(f"  - {coll}")
                
               
                if 'event' in coll.lower():
                    events_count = db[coll].count_documents({})
                    print(f"    Events count: {events_count}")
                    
                    if events_count > 0:
                       
                        sample_event = db[coll].find_one()
                        print(f"    Sample event: {sample_event.get('title', 'No title')} (roles: {sample_event.get('role', [])})")
    
    client.close()

if __name__ == "__main__":
    explore_mongo()
