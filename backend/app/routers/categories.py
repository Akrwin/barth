from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.models.category import Category
from app.schemas.transaction import CategoryInfo, CategoryCreate

router = APIRouter(prefix="/categories", tags=["categories"])

@router.get("", response_model=list[CategoryInfo])
def list_categories(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Return global categories + user's custom ones
    return (
        db.query(Category)
        .filter((Category.user_id == None) | (Category.user_id == current_user.id))
        .order_by(Category.is_custom, Category.name)
        .all()
    )

@router.post("", response_model=CategoryInfo, status_code=201)
def create_category(
    body: CategoryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    cat = Category(
        name=body.name.upper(),
        icon=body.icon,
        category_type=body.category_type,
        is_custom=True,
        user_id=current_user.id,
    )
    db.add(cat)
    db.commit()
    db.refresh(cat)
    return cat
