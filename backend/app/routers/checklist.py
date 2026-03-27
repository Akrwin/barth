from datetime import date
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.models.checklist import ChecklistItem, MonthlyChecklistSnapshot
from app.schemas.checklist import ChecklistItemOut, ChecklistBulkUpdate, MonthChecklistResponse

router = APIRouter(prefix="/checklist", tags=["checklist"])


def _is_past_month(month: int, year: int) -> bool:
    today = date.today()
    return (year, month) < (today.year, today.month)


def _is_current_month(month: int, year: int) -> bool:
    today = date.today()
    return year == today.year and month == today.month


# ── Master list ───────────────────────────────────────────────────────────────

@router.get("", response_model=list[ChecklistItemOut])
def get_master_list(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return (
        db.query(ChecklistItem)
        .filter(ChecklistItem.user_id == current_user.id)
        .order_by(ChecklistItem.sort_order)
        .all()
    )


@router.put("", response_model=list[ChecklistItemOut])
def update_master_list(
    body: ChecklistBulkUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Replace the entire master list.

    Rules:
    - Past month snapshots are left untouched (frozen history).
    - Current month snapshot is deleted so it regenerates from the new master.
    - Future months have no snapshots, so they'll auto-use the new master.
    """
    uid = current_user.id
    today = date.today()

    # Delete only current-month snapshot (let it regenerate from new master)
    db.query(MonthlyChecklistSnapshot).filter(
        MonthlyChecklistSnapshot.user_id == uid,
        MonthlyChecklistSnapshot.year == today.year,
        MonthlyChecklistSnapshot.month == today.month,
    ).delete()

    # Replace master list
    db.query(ChecklistItem).filter(ChecklistItem.user_id == uid).delete()
    new_items = []
    for idx, name in enumerate(body.items):
        name = name.strip()
        if not name:
            continue
        item = ChecklistItem(user_id=uid, name=name, sort_order=idx)
        db.add(item)
        new_items.append(item)

    db.commit()
    for item in new_items:
        db.refresh(item)
    return new_items


# ── Per-month checklist view ──────────────────────────────────────────────────

@router.get("/month", response_model=MonthChecklistResponse)
def get_month_checklist(
    month: int = Query(...),
    year: int = Query(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Return the checklist items to display for a given month.

    - Past month: return frozen snapshot (create lazily from master if missing).
    - Current/future month: return live master list.
    Also returns is_past so the frontend can hide the edit button.
    """
    uid = current_user.id
    is_past = _is_past_month(month, year)
    is_current = _is_current_month(month, year)

    if is_past:
        # Check for existing snapshot
        snapshots = (
            db.query(MonthlyChecklistSnapshot)
            .filter(
                MonthlyChecklistSnapshot.user_id == uid,
                MonthlyChecklistSnapshot.month == month,
                MonthlyChecklistSnapshot.year == year,
            )
            .order_by(MonthlyChecklistSnapshot.sort_order)
            .all()
        )
        if not snapshots:
            # Lazily create snapshot from current master list
            master = (
                db.query(ChecklistItem)
                .filter(ChecklistItem.user_id == uid)
                .order_by(ChecklistItem.sort_order)
                .all()
            )
            for item in master:
                snap = MonthlyChecklistSnapshot(
                    user_id=uid, month=month, year=year,
                    item_name=item.name, sort_order=item.sort_order,
                )
                db.add(snap)
            db.commit()
            # Re-fetch
            snapshots = (
                db.query(MonthlyChecklistSnapshot)
                .filter(
                    MonthlyChecklistSnapshot.user_id == uid,
                    MonthlyChecklistSnapshot.month == month,
                    MonthlyChecklistSnapshot.year == year,
                )
                .order_by(MonthlyChecklistSnapshot.sort_order)
                .all()
            )
        return MonthChecklistResponse(
            items=[s.item_name for s in snapshots],
            is_past=True,
            is_current=False,
        )

    else:
        # Current or future — use live master list
        # For current month: also ensure a snapshot exists so it gets frozen
        # when the month ends (lazy snapshot for current month)
        if is_current:
            existing = db.query(MonthlyChecklistSnapshot).filter(
                MonthlyChecklistSnapshot.user_id == uid,
                MonthlyChecklistSnapshot.month == month,
                MonthlyChecklistSnapshot.year == year,
            ).first()
            if not existing:
                master = (
                    db.query(ChecklistItem)
                    .filter(ChecklistItem.user_id == uid)
                    .order_by(ChecklistItem.sort_order)
                    .all()
                )
                for item in master:
                    snap = MonthlyChecklistSnapshot(
                        user_id=uid, month=month, year=year,
                        item_name=item.name, sort_order=item.sort_order,
                    )
                    db.add(snap)
                db.commit()

        master = (
            db.query(ChecklistItem)
            .filter(ChecklistItem.user_id == uid)
            .order_by(ChecklistItem.sort_order)
            .all()
        )
        return MonthChecklistResponse(
            items=[m.name for m in master],
            is_past=False,
            is_current=is_current,
        )
