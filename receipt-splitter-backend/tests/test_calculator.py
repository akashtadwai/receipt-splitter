import pytest
from app.models.schemas import ItemSplit, PersonAmountPair
from app.services.calculator import calculate_split, validate_split_amounts

def test_calculate_split_basic():
    # Create test data
    items = [
        ItemSplit(
            item_name="Test Item 1",
            price=100.0,
            contributors={"Alice": 50.0, "Bob": 50.0}
        ),
        ItemSplit(
            item_name="Test Item 2",
            price=30.0,
            contributors={"Alice": 30.0}
        )
    ]
    persons = ["Alice", "Bob"]
    receipt_total = 140.0  # Items sum up to 130, so 10 extra
    
    # Calculate split
    result = calculate_split(items, persons, receipt_total)
    
    # Verify results
    assert len(result.breakdown) == 2
    assert result.extra_amount == 10.0
    assert result.extra_per_person == 5.0
    
    # Get individual amounts
    alice_amount = next(item.amount for item in result.breakdown if item.person == "Alice")
    bob_amount = next(item.amount for item in result.breakdown if item.person == "Bob")
    
    # Alice paid 50 + 30 + 5 (extra) = 85
    assert alice_amount == 85.0
    # Bob paid 50 + 5 (extra) = 55
    assert bob_amount == 55.0

def test_calculate_split_with_discount():
    # Create test data with a discount (negative extra amount)
    items = [
        ItemSplit(
            item_name="Discounted Item",
            price=100.0,
            contributors={"Alice": 50.0, "Bob": 50.0}
        )
    ]
    persons = ["Alice", "Bob"]
    receipt_total = 90.0  # 10 discount
    
    # Calculate split
    result = calculate_split(items, persons, receipt_total)
    
    # Verify results
    assert result.extra_amount == -10.0
    assert result.extra_per_person == -5.0
    
    # Each person should pay 50 - 5 = 45
    for pair in result.breakdown:
        assert pair.amount == 45.0

def test_validate_split_amounts():
    # Valid split - amounts sum to item price
    valid_item = ItemSplit(
        item_name="Valid Item",
        price=100.0,
        contributors={"Alice": 60.0, "Bob": 40.0}
    )
    assert validate_split_amounts(valid_item) is True
    
    # Invalid split - amounts don't sum to item price
    invalid_item = ItemSplit(
        item_name="Invalid Item",
        price=100.0,
        contributors={"Alice": 60.0, "Bob": 30.0}
    )
    assert validate_split_amounts(invalid_item) is False
    
    # Edge case - small rounding error should still be valid
    almost_valid_item = ItemSplit(
        item_name="Almost Valid Item",
        price=100.0,
        contributors={"Alice": 60.01, "Bob": 39.99}
    )
    assert validate_split_amounts(almost_valid_item) is True
