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

    it('handles split calculation with discount', () => {
        const { result } = renderHook(() => useReceiptCalculator());

        act(() => {
            result.current.setEditedItems([{
                price: 100,
                contributors: { 'Alice': 50, 'Bob': 50 },
                useCustomAmounts: false
            }]);
            result.current.setPersonsList(['Alice', 'Bob']);
            result.current.setDiscountType('absolute');
            result.current.setDiscountValue(20);
            result.current.setItemSplits([{
                item_name: 'Test Item',
                price: 80,
                contributors: { 'Alice': 50, 'Bob': 50 },
                useCustomAmounts: false
            }]);
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

describe('useReceiptCalculator - additional functions', () => {
    it('handles price and tax changes correctly', () => {
        const { result } = renderHook(() => useReceiptCalculator());

        // First set initial items
        act(() => {
            result.current.setEditedItems([
                { name: 'Item 1', price: 100 },
                { name: 'Item 2', price: 200 }
            ]);
        });

        // Verify initial state
        expect(result.current.editedItems).toEqual([
            { name: 'Item 1', price: 100 },
            { name: 'Item 2', price: 200 }
        ]);

        // Then handle price changes
        act(() => {
            result.current.handlePriceChange(0, '150');
        });

        // Verify price change
        expect(result.current.editedItems[0].price).toBe(150);

        // Test empty string
        act(() => {
            result.current.handlePriceChange(1, '');
        });

        // Verify empty string handling
        expect(result.current.editedItems[1].price).toBe('');

        // Test tax changes separately
        act(() => {
            result.current.setEditedTaxes([
                { name: 'Tax 1', amount: 30 }
            ]);
        });

        act(() => {
            result.current.handleTaxChange(0, '40');
        });

        expect(result.current.editedTaxes[0].amount).toBe(40);
    });

    it('handles app reset correctly', () => {
        const { result } = renderHook(() => useReceiptCalculator());
        const mockRevokeObjectURL = jest.fn();
        global.URL.revokeObjectURL = mockRevokeObjectURL;

        act(() => {
            // Set various states
            result.current.setImagePreview('blob:test');
            result.current.setReceipt({ data: 'test' });
            result.current.setPersons('Alice, Bob');
            result.current.setPersonsList(['Alice', 'Bob']);
            result.current.setStep(3);
            result.current.setError('test error');

            // Reset the app
            result.current.resetApp();
        });

        // Verify all states are reset
        expect(result.current.receipt).toBeNull();
        expect(result.current.persons).toBe('');
        expect(result.current.personsList).toEqual([]);
        expect(result.current.step).toBe(1);
        expect(result.current.error).toBe('');
    });
});

describe('useReceiptCalculator - integration test', () => {
    it('handles complete receipt splitting flow', async () => {
        const { result } = renderHook(() => useReceiptCalculator());

        // Step 1: Set up receipt data
        act(() => {
            result.current.setReceipt({
                ocr_contents: {
                    items: [
                        { name: 'Pizza', price: 200 },
                        { name: 'Pasta', price: 150 }
                    ],
                    total_order_bill_details: {
                        taxes: [{ name: 'Service Tax', amount: 35 }]
                    }
                }
            });
            result.current.setEditedItems([
                { name: 'Pizza', price: 200 },
                { name: 'Pasta', price: 150 }
            ]);
            result.current.setEditedTaxes([
                { name: 'Service Tax', amount: 35 }
            ]);
        });

        // Step 2: Add persons and set up splits
        act(() => {
            result.current.setPersonsList(['Alice', 'Bob']);
            result.current.setItemSplits([
                {
                    item_name: 'Pizza',
                    price: 200,
                    contributors: {},
                    useCustomAmounts: false,
                    isItem: true
                },
                {
                    item_name: 'Pasta',
                    price: 150,
                    contributors: {},
                    useCustomAmounts: false,
                    isItem: true
                },
                {
                    item_name: 'Service Tax',
                    price: 35,
                    contributors: {},
                    useCustomAmounts: false,
                    isTax: true
                }
            ]);
        });

        // Step 3: Assign contributors
        act(() => {
            result.current.toggleContributor(0, 'Alice'); // Pizza - Alice
            result.current.toggleContributor(1, 'Bob');   // Pasta - Bob
            result.current.toggleContributor(2, 'Alice'); // Tax - Split
            result.current.toggleContributor(2, 'Bob');   // Tax - Split
        });

        // Add a discount
        act(() => {
            result.current.setDiscountType('percentage');
            result.current.setDiscountValue(10);
        });

        // Calculate final split
        await act(async () => {
            await result.current.calculateSplit();
        });

        // Verify results
        expect(result.current.results).toBeTruthy();
        expect(result.current.step).toBe(4);

        // Verify split amounts (with 10% discount)
        const aliceAmount = result.current.results.breakdown
            .find(x => x.person === 'Alice').amount;
        const bobAmount = result.current.results.breakdown
            .find(x => x.person === 'Bob').amount;

        // Pizza (200) + Half Tax (17.5) - 10% discount
        expect(aliceAmount).toBeCloseTo(195.75, 2);
        // Pasta (150) + Half Tax (17.5) - 10% discount
        expect(bobAmount).toBeCloseTo(150.75, 2);
    });

});
describe('useReceiptCalculator - custom amounts handling', () => {
    it('handles custom amount toggling correctly', () => {
        const { result } = renderHook(() => useReceiptCalculator());

        // Setup initial state
        act(() => {
            result.current.setPersonsList(['Alice', 'Bob', 'Charlie']);
            result.current.setItemSplits([{
                item_name: 'Pizza',
                price: 100,
                contributors: {},
                useCustomAmounts: true,
                isItem: true
            }]);
        });

        // Add first contributor with custom amount
        act(() => {
            result.current.toggleContributor(0, 'Alice');
        });

        // Check initial custom amount is 0
        expect(result.current.itemSplits[0].contributors['Alice']).toBe(0);

        // Add second contributor
        act(() => {
            result.current.toggleContributor(0, 'Bob');
        });

        expect(result.current.itemSplits[0].contributors['Bob']).toBe(0);

        // Remove a contributor
        act(() => {
            result.current.toggleContributor(0, 'Alice');
        });

        // Check Alice was removed
        expect(result.current.itemSplits[0].contributors['Alice']).toBeUndefined();
        // Check Bob still exists with original amount
        expect(result.current.itemSplits[0].contributors['Bob']).toBe(0);
    });

    it('switches between custom and equal splitting modes', () => {
        const { result } = renderHook(() => useReceiptCalculator());

        // Setup initial state with equal splitting
        act(() => {
            result.current.setPersonsList(['Alice', 'Bob']);
            result.current.setItemSplits([{
                item_name: 'Pizza',
                price: 100,
                contributors: { 'Alice': 50, 'Bob': 50 },
                useCustomAmounts: false,
                isItem: true
            }]);
        });

        // Switch to custom amounts
        act(() => {
            result.current.toggleCustomAmounts(0);
        });

        expect(result.current.itemSplits[0].useCustomAmounts).toBe(true);
        expect(result.current.itemSplits[0].contributors['Alice']).toBe(50);
        expect(result.current.itemSplits[0].contributors['Bob']).toBe(50);

        // Switch back to equal splitting
        act(() => {
            result.current.toggleCustomAmounts(0);
        });

        expect(result.current.itemSplits[0].useCustomAmounts).toBe(false);
        expect(result.current.itemSplits[0].contributors['Alice']).toBe(50);
        expect(result.current.itemSplits[0].contributors['Bob']).toBe(50);
    });

    it('validates custom amounts correctly', () => {
        const { result } = renderHook(() => useReceiptCalculator());

        // Setup state with custom amounts
        act(() => {
            result.current.setItemSplits([{
                item_name: 'Pizza',
                price: 100,
                contributors: { 'Alice': 60, 'Bob': 40 },
                useCustomAmounts: true,
                isItem: true
            }]);
        });

        // Test valid amounts (sum equals price)
        expect(result.current.validateCustomAmounts(0)).toBe(true);

        // Update to invalid amounts
        act(() => {
            result.current.handleCustomAmountChange(0, 'Alice', 70);
            result.current.handleCustomAmountChange(0, 'Bob', 40);
        });

        // Test invalid amounts (sum exceeds price)
        expect(result.current.validateCustomAmounts(0)).toBe(false);

        // Test with empty string input
        act(() => {
            result.current.handleCustomAmountChange(0, 'Alice', '');
            result.current.handleCustomAmountChange(0, 'Bob', 100);
        });

        // Should treat empty string as 0
        expect(result.current.validateCustomAmounts(0)).toBe(true);
    });

    it('handles rounding differences in custom amounts', () => {
        const { result } = renderHook(() => useReceiptCalculator());

        // Setup state with amounts that have rounding issues
        act(() => {
            result.current.setItemSplits([{
                item_name: 'Pizza',
                price: 100,
                contributors: {
                    'Alice': 33.33,
                    'Bob': 33.33,
                    'Charlie': 33.33
                },
                useCustomAmounts: true,
                isItem: true
            }]);
        });
    });
});

describe('useReceiptCalculator - toggleAllContributors', () => {
    it('selects all contributors when none are selected', () => {
        const { result } = renderHook(() => useReceiptCalculator());

        // Setup initial state with no contributors
        act(() => {
            result.current.setPersonsList(['Alice', 'Bob', 'Charlie']);
            result.current.setItemSplits([{
                item_name: 'Test Item',
                price: 90,
                contributors: {},
                useCustomAmounts: false
            }]);
        });

        // Toggle all contributors
        act(() => {
            result.current.toggleAllContributors(0);
        });

        // Check if all persons are now contributors with equal split
        expect(result.current.itemSplits[0].contributors).toEqual({
            'Alice': 30,
            'Bob': 30,
            'Charlie': 30
        });
    });

    it('deselects all contributors when all are selected', () => {
        const { result } = renderHook(() => useReceiptCalculator());

        // Setup initial state with all contributors selected
        act(() => {
            result.current.setPersonsList(['Alice', 'Bob', 'Charlie']);
            result.current.setItemSplits([{
                item_name: 'Test Item',
                price: 90,
                contributors: {
                    'Alice': 30,
                    'Bob': 30,
                    'Charlie': 30
                },
                useCustomAmounts: false
            }]);
        });

        // Toggle all contributors
        act(() => {
            result.current.toggleAllContributors(0);
        });

        // Check if all contributors are now deselected
        expect(result.current.itemSplits[0].contributors).toEqual({});
    });

    it('selects all contributors with custom amounts set to 0', () => {
        const { result } = renderHook(() => useReceiptCalculator());

        // Setup initial state with no contributors and custom amounts enabled
        act(() => {
            result.current.setPersonsList(['Alice', 'Bob', 'Charlie']);
            result.current.setItemSplits([{
                item_name: 'Test Item',
                price: 90,
                contributors: {},
                useCustomAmounts: true
            }]);
        });

        // Toggle all contributors
        act(() => {
            result.current.toggleAllContributors(0);
        });

        // Check if all persons are now contributors with custom amounts set to 0
        expect(result.current.itemSplits[0].contributors).toEqual({
            'Alice': 0,
            'Bob': 0,
            'Charlie': 0
        });
    });

    it('deselects all contributors when all are selected with custom amounts', () => {
        const { result } = renderHook(() => useReceiptCalculator());

        // Setup initial state with all contributors selected and custom amounts enabled
        act(() => {
            result.current.setPersonsList(['Alice', 'Bob', 'Charlie']);
            result.current.setItemSplits([{
                item_name: 'Test Item',
                price: 90,
                contributors: {
                    'Alice': 30,
                    'Bob': 30,
                    'Charlie': 30
                },
                useCustomAmounts: true
            }]);
        });

        // Toggle all contributors
        act(() => {
            result.current.toggleAllContributors(0);
        });

        // Check if all contributors are now deselected
        expect(result.current.itemSplits[0].contributors).toEqual({});
    });
});

describe('useReceiptCalculator - goToStep', () => {
    it('sets the step correctly within valid range', () => {
        const { result } = renderHook(() => useReceiptCalculator());

        act(() => {
            result.current.goToStep(2);
        });

        expect(result.current.step).toBe(2);
        expect(result.current.error).toBe('');

        act(() => {
            result.current.goToStep(4);
        });

        expect(result.current.step).toBe(4);
        expect(result.current.error).toBe('');
    });

    it('does not set the step outside valid range', () => {
        const { result } = renderHook(() => useReceiptCalculator());

        act(() => {
            result.current.goToStep(0);
        });

        expect(result.current.step).toBe(1); // Initial step should remain unchanged

        act(() => {
            result.current.goToStep(5);
        });

        expect(result.current.step).toBe(1); // Initial step should remain unchanged
    });
});