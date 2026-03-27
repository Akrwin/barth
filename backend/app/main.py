import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import auth, transactions, budgets, installments, dashboard, categories, checklist

app = FastAPI(title="BARTH API", version="1.0.0")

# Allow localhost for local dev + any Vercel/custom domain via env var
_extra_origins = os.environ.get("ALLOWED_ORIGINS", "")
origins = ["http://localhost:5173", "http://localhost:4173"]
if _extra_origins:
    origins += [o.strip() for o in _extra_origins.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(transactions.router)
app.include_router(budgets.router)
app.include_router(installments.router)
app.include_router(dashboard.router)
app.include_router(categories.router)
app.include_router(checklist.router)

@app.get("/")
def root():
    return {"status": "ok", "app": "BARTH Financial API v1.0"}
