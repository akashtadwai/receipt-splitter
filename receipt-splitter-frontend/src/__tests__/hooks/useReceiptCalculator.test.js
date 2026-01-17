import { renderHook } from '@testing-library/react';
import { act } from 'react';
import useReceiptCalculator from 'src/components/hooks/useReceiptCalculator';

describe('useReceiptCalculator - Multi-Receipt Support', () => {
    it('initializes with empty multi-receipt state', () => {
        const { result } = renderHook(() => useReceiptCalculator());

        expect(result.current.files).toEqual([]);
        expect(result.current.imagePreviews).toEqual([]);
        expect(result.current.receipts).toEqual([]);
        expect(result.current.receiptData).toEqual([]);
    });

    it('calculates per-receipt total correctly', () => {
        const { result } = renderHook(() => useReceiptCalculator());

        act(() => {
            result.current.setReceiptData([{
                items: [{ name: 'Pizza', price: 100 }, { name: 'Pasta', price: 50 }],
                taxes: [{ name: 'GST', amount: 15 }],
                discountType: 'none',
                discountValue: 0
            }]);
        });

        expect(result.current.calculateReceiptTotal(0)).toBe(165);
    });

    it('calculates combined total across all receipts', () => {
        const { result } = renderHook(() => useReceiptCalculator());

        act(() => {
            result.current.setReceiptData([
                { items: [{ name: 'A', price: 100 }], taxes: [], discountType: 'none', discountValue: 0 },
                { items: [{ name: 'B', price: 200 }], taxes: [], discountType: 'none', discountValue: 0 }
            ]);
        });

        expect(result.current.calculateCurrentTotal()).toBe(300);
    });

    it('applies per-receipt discount correctly', () => {
        const { result } = renderHook(() => useReceiptCalculator());

        act(() => {
            result.current.setReceiptData([{
                items: [{ name: 'Item', price: 100 }],
                taxes: [],
                discountType: 'percentage',
                discountValue: 10
            }]);
        });

        expect(result.current.calculateReceiptTotal(0)).toBe(90);
    });

    it('updates item price for specific receipt', () => {
        const { result } = renderHook(() => useReceiptCalculator());

        act(() => {
            result.current.setReceiptData([
                { items: [{ name: 'A', price: 100 }], taxes: [], discountType: 'none', discountValue: 0 },
                { items: [{ name: 'B', price: 200 }], taxes: [], discountType: 'none', discountValue: 0 }
            ]);
        });

        act(() => {
            result.current.handlePriceChange(1, 0, 300);
        });

        expect(result.current.receiptData[0].items[0].price).toBe(100); // Unchanged
        expect(result.current.receiptData[1].items[0].price).toBe(300); // Changed
    });

    it('removes a receipt correctly', () => {
        const { result } = renderHook(() => useReceiptCalculator());

        act(() => {
            result.current.setFiles([{ name: 'a.jpg' }, { name: 'b.jpg' }]);
            result.current.setImagePreviews(['preview1', 'preview2']);
            result.current.setReceipts([{ id: 1 }, { id: 2 }]);
            result.current.setReceiptData([
                { items: [{ name: 'A', price: 100 }], taxes: [], discountType: 'none', discountValue: 0 },
                { items: [{ name: 'B', price: 200 }], taxes: [], discountType: 'none', discountValue: 0 }
            ]);
        });

        act(() => {
            result.current.removeReceipt(0);
        });

        expect(result.current.files.length).toBe(1);
        expect(result.current.receiptData.length).toBe(1);
        expect(result.current.receiptData[0].items[0].name).toBe('B');
    });
});

describe('useReceiptCalculator - Split Calculation', () => {
    it('toggles contributors and recalculates equal split', () => {
        const { result } = renderHook(() => useReceiptCalculator());

        act(() => {
            result.current.setPersonsList(['Alice', 'Bob']);
            result.current.setItemSplits([{
                item_name: 'Item',
                price: 100,
                contributors: { 'Alice': 100 },
                useCustomAmounts: false
            }]);
        });

        act(() => {
            result.current.toggleContributor(0, 'Bob');
        });

        expect(result.current.itemSplits[0].contributors).toEqual({
            'Alice': 50,
            'Bob': 50
        });
    });

    it('validates custom amounts must sum to item price', () => {
        const { result } = renderHook(() => useReceiptCalculator());

        act(() => {
            result.current.setItemSplits([{
                price: 100,
                useCustomAmounts: true,
                contributors: { 'Alice': 60, 'Bob': 50 }
            }]);
        });

        expect(result.current.validateCustomAmounts(0)).toBe(false);

        act(() => {
            result.current.setItemSplits([{
                price: 100,
                useCustomAmounts: true,
                contributors: { 'Alice': 60, 'Bob': 40 }
            }]);
        });

        expect(result.current.validateCustomAmounts(0)).toBe(true);
    });

    it('calculates final split with discount applied', async () => {
        const { result } = renderHook(() => useReceiptCalculator());

        act(() => {
            result.current.setReceiptData([{
                items: [{ name: 'Item', price: 100 }],
                taxes: [],
                discountType: 'absolute',
                discountValue: 20
            }]);
            result.current.setPersonsList(['Alice', 'Bob']);
            result.current.setItemSplits([{
                item_name: 'Item',
                price: 100,
                contributors: { 'Alice': 50, 'Bob': 50 },
                useCustomAmounts: false
            }]);
        });

        await act(async () => {
            await result.current.calculateSplit();
        });

        expect(result.current.results.breakdown).toEqual([
            { person: 'Alice', amount: 40 },
            { person: 'Bob', amount: 40 }
        ]);
    });
});

describe('useReceiptCalculator - Navigation', () => {
    it('resets all state correctly', () => {
        const { result } = renderHook(() => useReceiptCalculator());

        act(() => {
            result.current.setFiles([{ name: 'test.jpg' }]);
            result.current.setReceiptData([{ items: [], taxes: [], discountType: 'none', discountValue: 0 }]);
            result.current.setStep(3);
            result.current.setError('some error');
        });

        act(() => {
            result.current.resetApp();
        });

        expect(result.current.files).toEqual([]);
        expect(result.current.receiptData).toEqual([]);
        expect(result.current.step).toBe(1);
        expect(result.current.error).toBe('');
    });

    it('navigates to valid steps only', () => {
        const { result } = renderHook(() => useReceiptCalculator());

        act(() => result.current.goToStep(3));
        expect(result.current.step).toBe(3);

        act(() => result.current.goToStep(0));
        expect(result.current.step).toBe(3); // Should not change

        act(() => result.current.goToStep(5));
        expect(result.current.step).toBe(3); // Should not change
    });
});

describe('useReceiptCalculator - Item & Tax Editing', () => {
    it('updates item name for specific receipt', () => {
        const { result } = renderHook(() => useReceiptCalculator());

        act(() => {
            result.current.setReceiptData([
                { items: [{ name: 'Old Name', price: 100 }], taxes: [], discountType: 'none', discountValue: 0 }
            ]);
        });

        act(() => {
            result.current.handleNameChange(0, 0, 'New Name');
        });

        expect(result.current.receiptData[0].items[0].name).toBe('New Name');
    });

    it('updates tax amount for specific receipt', () => {
        const { result } = renderHook(() => useReceiptCalculator());

        act(() => {
            result.current.setReceiptData([
                { items: [], taxes: [{ name: 'GST', amount: 10 }], discountType: 'none', discountValue: 0 }
            ]);
        });

        act(() => {
            result.current.handleTaxChange(0, 0, 25);
        });

        expect(result.current.receiptData[0].taxes[0].amount).toBe(25);
    });

    it('updates tax name for specific receipt', () => {
        const { result } = renderHook(() => useReceiptCalculator());

        act(() => {
            result.current.setReceiptData([
                { items: [], taxes: [{ name: 'Old Tax', amount: 10 }], discountType: 'none', discountValue: 0 }
            ]);
        });

        act(() => {
            result.current.handleTaxNameChange(0, 0, 'Service Charge');
        });

        expect(result.current.receiptData[0].taxes[0].name).toBe('Service Charge');
    });

    it('adds new tax to specific receipt', () => {
        const { result } = renderHook(() => useReceiptCalculator());

        act(() => {
            result.current.setReceiptData([
                { items: [], taxes: [], discountType: 'none', discountValue: 0 }
            ]);
        });

        act(() => {
            result.current.addNewTax(0);
        });

        expect(result.current.receiptData[0].taxes).toHaveLength(1);
        expect(result.current.receiptData[0].taxes[0].name).toBe('New Tax/Fee');
    });

    it('removes tax from specific receipt', () => {
        const { result } = renderHook(() => useReceiptCalculator());

        act(() => {
            result.current.setReceiptData([
                { items: [], taxes: [{ name: 'GST', amount: 10 }, { name: 'VAT', amount: 5 }], discountType: 'none', discountValue: 0 }
            ]);
        });

        act(() => {
            result.current.removeTax(0, 0);
        });

        expect(result.current.receiptData[0].taxes).toHaveLength(1);
        expect(result.current.receiptData[0].taxes[0].name).toBe('VAT');
    });

    it('sets receipt discount correctly', () => {
        const { result } = renderHook(() => useReceiptCalculator());

        act(() => {
            result.current.setReceiptData([
                { items: [{ name: 'Item', price: 100 }], taxes: [], discountType: 'none', discountValue: 0 }
            ]);
        });

        act(() => {
            result.current.setReceiptDiscount(0, 'percentage', 15);
        });

        expect(result.current.receiptData[0].discountType).toBe('percentage');
        expect(result.current.receiptData[0].discountValue).toBe(15);
        expect(result.current.calculateReceiptTotal(0)).toBe(85);
    });

    it('handles empty string values for price and tax', () => {
        const { result } = renderHook(() => useReceiptCalculator());

        act(() => {
            result.current.setReceiptData([
                { items: [{ name: 'Item', price: 100 }], taxes: [{ name: 'Tax', amount: 10 }], discountType: 'none', discountValue: 0 }
            ]);
        });

        act(() => {
            result.current.handlePriceChange(0, 0, '');
            result.current.handleTaxChange(0, 0, '');
        });

        expect(result.current.receiptData[0].items[0].price).toBe('');
        expect(result.current.receiptData[0].taxes[0].amount).toBe('');
        expect(result.current.calculateReceiptTotal(0)).toBe(0);
    });
});

describe('useReceiptCalculator - Contributor Management', () => {
    it('toggles custom amounts mode on and off', () => {
        const { result } = renderHook(() => useReceiptCalculator());

        act(() => {
            result.current.setItemSplits([{
                item_name: 'Item',
                price: 100,
                contributors: { 'Alice': 50, 'Bob': 50 },
                useCustomAmounts: false
            }]);
        });

        act(() => {
            result.current.toggleCustomAmounts(0);
        });

        expect(result.current.itemSplits[0].useCustomAmounts).toBe(true);

        // Toggle back - should recalculate equal split
        act(() => {
            result.current.toggleCustomAmounts(0);
        });

        expect(result.current.itemSplits[0].useCustomAmounts).toBe(false);
        expect(result.current.itemSplits[0].contributors).toEqual({ 'Alice': 50, 'Bob': 50 });
    });

    it('toggles all contributors on when not all selected', () => {
        const { result } = renderHook(() => useReceiptCalculator());

        act(() => {
            result.current.setPersonsList(['Alice', 'Bob', 'Charlie']);
            result.current.setItemSplits([{
                item_name: 'Item',
                price: 90,
                contributors: { 'Alice': 90 },
                useCustomAmounts: false
            }]);
        });

        act(() => {
            result.current.toggleAllContributors(0);
        });

        expect(Object.keys(result.current.itemSplits[0].contributors)).toEqual(['Alice', 'Bob', 'Charlie']);
        expect(result.current.itemSplits[0].contributors['Alice']).toBe(30);
    });

    it('toggles all contributors off when all selected', () => {
        const { result } = renderHook(() => useReceiptCalculator());

        act(() => {
            result.current.setPersonsList(['Alice', 'Bob']);
            result.current.setItemSplits([{
                item_name: 'Item',
                price: 100,
                contributors: { 'Alice': 50, 'Bob': 50 },
                useCustomAmounts: false
            }]);
        });

        act(() => {
            result.current.toggleAllContributors(0);
        });

        expect(result.current.itemSplits[0].contributors).toEqual({});
    });

    it('toggles all contributors with custom amounts mode', () => {
        const { result } = renderHook(() => useReceiptCalculator());

        act(() => {
            result.current.setPersonsList(['Alice', 'Bob']);
            result.current.setItemSplits([{
                item_name: 'Item',
                price: 100,
                contributors: {},
                useCustomAmounts: true
            }]);
        });

        act(() => {
            result.current.toggleAllContributors(0);
        });

        expect(result.current.itemSplits[0].contributors).toEqual({ 'Alice': 0, 'Bob': 0 });
    });

    it('handles custom amount changes correctly', () => {
        const { result } = renderHook(() => useReceiptCalculator());

        act(() => {
            result.current.setItemSplits([{
                item_name: 'Item',
                price: 100,
                contributors: { 'Alice': 0, 'Bob': 0 },
                useCustomAmounts: true
            }]);
        });

        act(() => {
            result.current.handleCustomAmountChange(0, 'Alice', 60);
            result.current.handleCustomAmountChange(0, 'Bob', 40);
        });

        expect(result.current.itemSplits[0].contributors['Alice']).toBe(60);
        expect(result.current.itemSplits[0].contributors['Bob']).toBe(40);
    });

    it('handles empty string in custom amount', () => {
        const { result } = renderHook(() => useReceiptCalculator());

        act(() => {
            result.current.setItemSplits([{
                item_name: 'Item',
                price: 100,
                contributors: { 'Alice': 50 },
                useCustomAmounts: true
            }]);
        });

        act(() => {
            result.current.handleCustomAmountChange(0, 'Alice', '');
        });

        expect(result.current.itemSplits[0].contributors['Alice']).toBe('');
    });

    it('removes contributor in equal split mode', () => {
        const { result } = renderHook(() => useReceiptCalculator());

        act(() => {
            result.current.setItemSplits([{
                item_name: 'Item',
                price: 100,
                contributors: { 'Alice': 50, 'Bob': 50 },
                useCustomAmounts: false
            }]);
        });

        act(() => {
            result.current.toggleContributor(0, 'Bob');
        });

        expect(result.current.itemSplits[0].contributors).toEqual({ 'Alice': 100 });
    });

    it('adds contributor in custom amounts mode with zero', () => {
        const { result } = renderHook(() => useReceiptCalculator());

        act(() => {
            result.current.setItemSplits([{
                item_name: 'Item',
                price: 100,
                contributors: { 'Alice': 100 },
                useCustomAmounts: true
            }]);
        });

        act(() => {
            result.current.toggleContributor(0, 'Bob');
        });

        expect(result.current.itemSplits[0].contributors['Bob']).toBe(0);
    });

    it('removes contributor in custom amounts mode', () => {
        const { result } = renderHook(() => useReceiptCalculator());

        act(() => {
            result.current.setItemSplits([{
                item_name: 'Item',
                price: 100,
                contributors: { 'Alice': 60, 'Bob': 40 },
                useCustomAmounts: true
            }]);
        });

        act(() => {
            result.current.toggleContributor(0, 'Bob');
        });

        expect(result.current.itemSplits[0].contributors).toEqual({ 'Alice': 60 });
    });
});

describe('useReceiptCalculator - Initialization & Data Aggregation', () => {
    it('initializes item splits from multi-receipt data', () => {
        const { result } = renderHook(() => useReceiptCalculator());

        act(() => {
            result.current.setReceiptData([
                { items: [{ name: 'Pizza', price: 100 }], taxes: [{ name: 'GST', amount: 18 }], discountType: 'none', discountValue: 0 },
                { items: [{ name: 'Burger', price: 50 }], taxes: [], discountType: 'none', discountValue: 0 }
            ]);
        });

        act(() => {
            result.current.initializeItemSplits();
        });

        expect(result.current.itemSplits).toHaveLength(3);
        expect(result.current.itemSplits[0]).toMatchObject({ item_name: 'Pizza', price: 100, isItem: true, receiptIndex: 0 });
        expect(result.current.itemSplits[1]).toMatchObject({ item_name: 'GST (Tax/Fee)', price: 18, isTax: true, receiptIndex: 0 });
        expect(result.current.itemSplits[2]).toMatchObject({ item_name: 'Burger', price: 50, isItem: true, receiptIndex: 1 });
    });

    it('gets all items across receipts', () => {
        const { result } = renderHook(() => useReceiptCalculator());

        act(() => {
            result.current.setReceiptData([
                { items: [{ name: 'A', price: 10 }], taxes: [], discountType: 'none', discountValue: 0 },
                { items: [{ name: 'B', price: 20 }], taxes: [], discountType: 'none', discountValue: 0 }
            ]);
        });

        const allItems = result.current.getAllItems();
        expect(allItems).toHaveLength(2);
        expect(allItems[0]).toMatchObject({ name: 'A', receiptIndex: 0 });
        expect(allItems[1]).toMatchObject({ name: 'B', receiptIndex: 1 });
    });

    it('gets all taxes across receipts', () => {
        const { result } = renderHook(() => useReceiptCalculator());

        act(() => {
            result.current.setReceiptData([
                { items: [], taxes: [{ name: 'GST', amount: 10 }], discountType: 'none', discountValue: 0 },
                { items: [], taxes: [{ name: 'VAT', amount: 5 }], discountType: 'none', discountValue: 0 }
            ]);
        });

        const allTaxes = result.current.getAllTaxes();
        expect(allTaxes).toHaveLength(2);
        expect(allTaxes[0]).toMatchObject({ name: 'GST', receiptIndex: 0 });
        expect(allTaxes[1]).toMatchObject({ name: 'VAT', receiptIndex: 1 });
    });

    it('returns 0 for non-existent receipt index', () => {
        const { result } = renderHook(() => useReceiptCalculator());

        expect(result.current.calculateReceiptTotal(99)).toBe(0);
    });
});

describe('useReceiptCalculator - Calculate Split Errors', () => {
    it('shows error when item has no contributors', async () => {
        const { result } = renderHook(() => useReceiptCalculator());

        act(() => {
            result.current.setPersonsList(['Alice']);
            result.current.setItemSplits([{
                item_name: 'Orphan Item',
                price: 100,
                contributors: {},
                useCustomAmounts: false
            }]);
        });

        await act(async () => {
            await result.current.calculateSplit();
        });

        expect(result.current.error).toContain('Orphan Item');
        expect(result.current.error).toContain('no contributors');
        expect(result.current.results).toBeNull();
    });

    it('shows error when custom amounts do not sum correctly', async () => {
        const { result } = renderHook(() => useReceiptCalculator());

        act(() => {
            result.current.setPersonsList(['Alice', 'Bob']);
            result.current.setItemSplits([{
                item_name: 'Mismatched Item',
                price: 100,
                contributors: { 'Alice': 30, 'Bob': 30 },
                useCustomAmounts: true
            }]);
        });

        await act(async () => {
            await result.current.calculateSplit();
        });

        expect(result.current.error).toContain('Mismatched Item');
        expect(result.current.error).toContain('invalid split amounts');
        expect(result.current.results).toBeNull();
    });

    it('completes calculation and navigates to step 4', async () => {
        const { result } = renderHook(() => useReceiptCalculator());

        act(() => {
            result.current.setReceiptData([{
                items: [{ name: 'Item', price: 100 }],
                taxes: [],
                discountType: 'none',
                discountValue: 0
            }]);
            result.current.setPersonsList(['Alice', 'Bob']);
            result.current.setItemSplits([{
                item_name: 'Item',
                price: 100,
                contributors: { 'Alice': 50, 'Bob': 50 },
                useCustomAmounts: false
            }]);
        });

        await act(async () => {
            await result.current.calculateSplit();
        });

        expect(result.current.step).toBe(4);
        expect(result.current.error).toBe('');
        expect(result.current.results).not.toBeNull();
    });
});

describe('useReceiptCalculator - Edge Cases', () => {
    it('handles discount that exceeds total (returns 0)', () => {
        const { result } = renderHook(() => useReceiptCalculator());

        act(() => {
            result.current.setReceiptData([{
                items: [{ name: 'Item', price: 50 }],
                taxes: [],
                discountType: 'absolute',
                discountValue: 100
            }]);
        });

        expect(result.current.calculateReceiptTotal(0)).toBe(0);
    });

    it('validates custom amounts with empty string contributors', () => {
        const { result } = renderHook(() => useReceiptCalculator());

        act(() => {
            result.current.setItemSplits([{
                price: 100,
                useCustomAmounts: true,
                contributors: { 'Alice': '', 'Bob': 100 }
            }]);
        });

        expect(result.current.validateCustomAmounts(0)).toBe(true);
    });

    it('returns true for non-custom amounts validation', () => {
        const { result } = renderHook(() => useReceiptCalculator());

        act(() => {
            result.current.setItemSplits([{
                price: 100,
                useCustomAmounts: false,
                contributors: { 'Alice': 100 }
            }]);
        });

        expect(result.current.validateCustomAmounts(0)).toBe(true);
    });

    it('clears error when navigating to valid step', () => {
        const { result } = renderHook(() => useReceiptCalculator());

        act(() => {
            result.current.setError('Some error');
            result.current.goToStep(2);
        });

        expect(result.current.error).toBe('');
        expect(result.current.step).toBe(2);
    });
});