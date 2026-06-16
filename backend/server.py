"""Waterdrop Survivor - backend save/load API."""
import os
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, Optional

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field

load_dotenv()

MONGO_URL = os.environ.get("MONGO_URL")
DB_NAME = os.environ.get("DB_NAME")

client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]

app = FastAPI(title="Waterdrop Survivor API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class SaveData(BaseModel):
    player_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    data: Dict[str, Any]


class RunResult(BaseModel):
    player_id: str
    duration: float
    level: int
    kills: int
    gold: int
    wave: int


@app.get("/api/health")
async def health():
    return {"status": "ok", "service": "waterdrop-survivor"}


@app.get("/api/save/{player_id}")
async def get_save(player_id: str):
    doc = await db.saves.find_one({"player_id": player_id})
    if not doc:
        return {"player_id": player_id, "data": None}
    return {"player_id": player_id, "data": doc.get("data")}


@app.post("/api/save")
async def post_save(payload: SaveData):
    now = datetime.now(timezone.utc).isoformat()
    await db.saves.update_one(
        {"player_id": payload.player_id},
        {"$set": {"data": payload.data, "updated_at": now}},
        upsert=True,
    )
    return {"player_id": payload.player_id, "saved_at": now}


@app.post("/api/run-result")
async def post_run(payload: RunResult):
    now = datetime.now(timezone.utc).isoformat()
    doc = payload.model_dump()
    doc["created_at"] = now
    doc["_id"] = str(uuid.uuid4())
    await db.runs.insert_one(doc)
    return {"ok": True, "id": doc["_id"]}


@app.get("/api/leaderboard")
async def leaderboard(limit: int = 20):
    cursor = db.runs.find({}, {"_id": 0}).sort("duration", -1).limit(limit)
    return [doc async for doc in cursor]
