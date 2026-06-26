import os
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient

load_dotenv()

MONGO_URL = os.getenv("MONGODB_URL") or os.getenv(
    "MONGO_URL",
    "mongodb+srv://helpdesk_user:4YscbIOUIjUqrwkm@cluster0.oembuln.mongodb.net/?appName=Cluster0",
)

# Global variables for db client and database
_client = None
_db = None

def get_db():
    """
    Retrieves or initializes the async MongoDB client database instance.
    Uses serverSelectionTimeoutMS to fail fast if offline.
    """
    global _client, _db
    if _db is None:
        try:
            # Short timeout of 2 seconds for failover to in-memory stub
            _client = AsyncIOMotorClient(MONGO_URL, serverSelectionTimeoutMS=2000)
            _db = _client["windops_copilot"]
        except Exception as e:
            print(f"[Database Connection Error] Could not connect to MongoDB Atlas: {e}")
            _db = None
    return _db
