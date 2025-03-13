from typing import List, Dict
import math

from app.models.schemas import ItemSplit, PersonAmountPair, ReceiptSplitResponse

def calculate_split(items: List[ItemSplit], persons: List[str], receipt_total: float) -> ReceiptSplitResponse:
    """
    Calculate how much each person owes based on items and contributions
    
    Args:
        items: List of items with their prices and contributors
        persons: List of all persons involved in the split
        receipt_total: Total bill amount from receipt
        
    Returns:
        ReceiptSplitResponse with breakdown of what each person owes
    """
    # Calculate the sum of all item prices
    items_total = sum(item.price for item in items)
    
    # Calculate extra amount (tax/discount)
    extra_amount = receipt_total - items_total
    extra_per_person = extra_amount / len(persons) if persons else 0
    
    # Calculate how much each person owes for items
    person_totals = {person: 0.0 for person in persons}
    
    # Add item costs based on contributions
    for item in items:
        for person, amount in item.contributors.items():
            if person in person_totals:
                person_totals[person] += amount
    
    # Add extra amount per person
    for person in person_totals:
        person_totals[person] += extra_per_person
    
    # Format the response with rounding
    breakdown = [
        PersonAmountPair(person=person, amount=round(amount, 2))
        for person, amount in person_totals.items()
    ]
    
    return ReceiptSplitResponse(
        breakdown=breakdown,
        extra_amount=round(extra_amount, 2),
        extra_per_person=round(extra_per_person, 2)
    )

def validate_split_amounts(item: ItemSplit) -> bool:
    """
    Validate that custom contribution amounts sum to the item price
    
    Args:
        item: The item with its contributors and amounts
        
    Returns:
        True if valid, False otherwise
    """
    total = sum(item.contributors.values())
    return math.isclose(total, item.price, abs_tol=0.01)  # Allow for small rounding errors
