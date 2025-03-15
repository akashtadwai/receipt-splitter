import { renderHook } from '@testing-library/react';
import {act} from 'react'
import useReceiptCalculator from 'src/components/hooks/useReceiptCalculator';

describe('useReceiptCalculator', () => {
    it('calculates total with items, taxes, and discount', () => {
        const { result } = renderHook(() => useReceiptCalculator());

        act(() => {
            // Set items
            result.current.setEditedItems([
                { price: 100 },
                { price: 200 },
                { price: 300 }
            ]);
            // Set taxes
            result.current.setEditedTaxes([
                { amount: 20 },
                { amount: 30 }
            ]);
            // Set discount
            result.current.setDiscountType('percentage');
            result.current.setDiscountValue(10);
        });

        // 650 total * 0.9 = 585
        expect(result.current.calculateCurrentTotal()).toBeCloseTo(585);
    });

    it('handles invalid custom amounts', () => {
        const { result } = renderHook(() => useReceiptCalculator());

        act(() => {
            result.current.setItemSplits([{
                price: 100,
                useCustomAmounts: true,
                contributors: { 'Alice': 50, 'Bob': 60 } // Total 110 instead of 100
            }]);
        });

        expect(result.current.validateCustomAmounts(0)).toBe(false);
    });

    // skip temporarily
    it.skip('handles split calculation with discount', () => {
        const { result } = renderHook(() => useReceiptCalculator());

        act(() => {
            result.current.setItemSplits([{
                price: 100,
                contributors: { 'Alice': 50, 'Bob': 50 },
                useCustomAmounts: false
            }]);
            result.current.setDiscountType('absolute');
            result.current.setDiscountValue(20);
        });

        act(() => {
            result.current.calculateSplit();
        });

        // Verify the breakdown structure exists
        expect(result.current.results).toHaveProperty('breakdown');
        // Verify the actual amounts (80 split equally)
        expect(result.current.results.breakdown).toEqual([
            { person: 'Alice', amount: 40 },
            { person: 'Bob', amount: 40 }
        ]);
    });
});

describe('useReceiptCalculator - advanced calculations', () => {
    it('toggles contributor correctly in equal split mode', () => {
        const { result } = renderHook(() => useReceiptCalculator());

        // Setup initial state
        act(() => {
            result.current.setItemSplits([{
            item_name: 'Test Item',
            price: 100,
            contributors: { 'Alice': 50, 'Bob': 50 },
            useCustomAmounts: false
            }]);
            result.current.personsList = ['Alice', 'Bob', 'Charlie'];
        });

        // Add a new contributor (Charlie)
        act(() => {
            result.current.toggleContributor(0, 'Charlie');
        });

        // Check if all three people now split the item equally
        expect(result.current.itemSplits[0].contributors).toEqual({
            'Alice': 33.333333333333336,
            'Bob': 33.333333333333336,
            'Charlie': 33.333333333333336
        });

        // Remove a contributor (Bob)
        act(() => {
            result.current.toggleContributor(0, 'Bob');
        });

        // Check if the remaining two people now split the item equally
        expect(result.current.itemSplits[0].contributors).toEqual({
            'Alice': 50,
            'Charlie': 50
        });
    });

    it('toggles custom amounts mode correctly', () => {
        const { result } = renderHook(() => useReceiptCalculator());

        // Setup initial state with equal splitting
        act(() => {
            result.current.setItemSplits([{
            item_name: 'Test Item',
            price: 100,
            contributors: { 'Alice': 50, 'Bob': 50 },
            useCustomAmounts: false
            }]);
        });

        // Switch to custom amounts mode
        act(() => {
            result.current.toggleCustomAmounts(0);
        });

        // Check if custom amounts mode is enabled but amounts are preserved
        expect(result.current.itemSplits[0].useCustomAmounts).toBe(true);
        expect(result.current.itemSplits[0].contributors).toEqual({
            'Alice': 50,
            'Bob': 50
        });

        // Switch back to equal splitting
        act(() => {
            result.current.toggleCustomAmounts(0);
        });

        // Check if equal splitting mode is restored
        expect(result.current.itemSplits[0].useCustomAmounts).toBe(false);
        expect(result.current.itemSplits[0].contributors).toEqual({
            'Alice': 50,
            'Bob': 50
        });
    });

    it('validates custom amounts correctly', () => {
        const { result } = renderHook(() => useReceiptCalculator());

        // Setup with valid custom amounts
        act(() => {
            result.current.setItemSplits([{  // Call setItemSplits as a function
                item_name: 'Test Item',
                price: 100,
                contributors: { 'Alice': 60, 'Bob': 40 },
                useCustomAmounts: true
            }]);
        });

        
        // Should be valid since amounts sum to price
        expect(result.current.validateCustomAmounts(0)).toBe(true);

        // Change to invalid amounts
        act(() => {
            result.current.setItemSplits([{
                ...result.current.itemSplits[0],
                contributors: { 'Alice': 60, 'Bob': 30 }
            }]);
        });

        // Should be invalid since amounts don't sum to price
        expect(result.current.validateCustomAmounts(0)).toBe(false);

        // Test with small rounding difference (should be valid)
        act(() => {
            result.current.setItemSplits([{
                ...result.current.itemSplits[0],
                contributors: { 'Alice': 33.333, 'Bob': 33.333, 'Charlie': 33.333 }
            }]);
        });

        // Small rounding differences should be allowed (99.99 vs 100)
        expect(result.current.validateCustomAmounts(0)).toBe(true);
    });

    it('calculates correct splits with discounts', () => {
        const { result } = renderHook(() => useReceiptCalculator());

        // Setup state with items, taxes and a discount
        act(() => {
            result.current.setEditedItems([
                { price: 100 },
                { price: 200 }
            ]);
            result.current.setEditedTaxes([
                { amount: 30 }
            ]);
            result.current.setDiscountType('percentage');
            result.current.setDiscountValue(10);
            result.current.setPersonsList(['Alice', 'Bob']);

            result.current.setItemSplits([
                {
                    item_name: 'Item 1',
                    price: 100,
                    contributors: { 'Alice': 100 }, // Alice pays for item 1
                    useCustomAmounts: false,
                    isItem: true
                },
                {
                    item_name: 'Item 2',
                    price: 200,
                    contributors: { 'Bob': 200 }, // Bob pays for item 2
                    useCustomAmounts: false,
                    isItem: true
                },
                {
                    item_name: 'Tax',
                    price: 30,
                    contributors: { 'Alice': 15, 'Bob': 15 }, // Split tax equally
                    useCustomAmounts: false,
                    isTax: true
                },
                {
                    item_name: 'Discount (10%)',
                    price: -33, // 10% of 330
                    contributors: { 'Alice': -16.5, 'Bob': -16.5 }, // Split discount equally
                    useCustomAmounts: false,
                    isDiscount: true
                }
            ]);
        });

        // Calculate the final split
        act(() => {
            result.current.calculateSplit();
        });

        // Check results - Alice: 100 (item) + 15 (tax) - 16.5 (discount) = 98.5
        // Bob: 200 (item) + 15 (tax) - 16.5 (discount) = 198.5
        expect(result.current.results.breakdown).toEqual([
            { person: 'Alice', amount: 98.5 },
            { person: 'Bob', amount: 198.5 }
        ]);
    });
});
