"""
Clears all user data: transactions, budgets, installments, users.
Preserves global categories.
Usage: python reset_data.py
"""
from app.database import SessionLocal
from app.models.transaction import Transaction
from app.models.budget import Budget
from app.models.installment import Installment
from app.models.user import User
from app.models.category import Category


def reset():
    db = SessionLocal()
    try:
        tx_count = db.query(Transaction).count()
        bud_count = db.query(Budget).count()
        inst_count = db.query(Installment).count()

        # Delete custom (user-created) categories first (FK dependency)
        db.query(Category).filter(Category.user_id != None).delete()

        db.query(Transaction).delete()
        db.query(Budget).delete()
        db.query(Installment).delete()
        db.query(User).delete()
        db.commit()

        print(f"✓ Cleared {tx_count} transactions, {bud_count} budgets, {inst_count} installments")
        print("✓ All users deleted — global categories preserved")
    finally:
        db.close()


if __name__ == "__main__":
    reset()
