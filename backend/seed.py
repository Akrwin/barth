"""
Run once to insert global default categories.
Usage: python seed.py
"""
from app.database import SessionLocal
from app.models.category import Category

# (name, icon, category_type)
DEFAULT_CATEGORIES = [
    # ── Expense categories ──
    ("SHOPPING",  "shopping_cart",  "EXPENSE"),
    ("DINING",    "restaurant",     "EXPENSE"),
    ("TRANSPORT", "directions_car", "EXPENSE"),
    ("HOUSING",   "home",           "EXPENSE"),
    ("BILLS",     "receipt_long",   "EXPENSE"),
    ("HEALTH",    "favorite",       "EXPENSE"),
    ("FITNESS",   "fitness_center", "EXPENSE"),
    ("OTHER",     "more_horiz",     "EXPENSE"),
    # ── Income categories ──
    ("SALARY",    "payments",       "INCOME"),
    ("FREELANCE", "work",           "INCOME"),
]


def seed():
    db = SessionLocal()
    try:
        for name, icon, cat_type in DEFAULT_CATEGORIES:
            exists = db.query(Category).filter(
                Category.name == name, Category.user_id == None
            ).first()
            if not exists:
                db.add(Category(
                    name=name,
                    icon=icon,
                    category_type=cat_type,
                    is_custom=False,
                    user_id=None,
                ))
            else:
                # Update category_type in case it was added before this field existed
                exists.category_type = cat_type
        db.commit()
        print(f"✓ Seeded {len(DEFAULT_CATEGORIES)} default categories")
    finally:
        db.close()


if __name__ == "__main__":
    seed()
