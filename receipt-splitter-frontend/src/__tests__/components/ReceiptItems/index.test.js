import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react';
import ReceiptItems from 'src/components/ReceiptItems';

describe('ReceiptItems', () => {
    const createMockProps = (overrides = {}) => ({
        imagePreviews: ['/test-image.jpg'],
        receiptData: [{
            items: [{ name: 'Test Item', price: 100 }],
            taxes: [{ name: 'GST', amount: 10 }],
            discountType: 'none',
            discountValue: 0
        }],
        editingPrices: false,
        setEditingPrices: jest.fn(),
        calculateReceiptTotal: jest.fn((i) => 110),
        calculateCurrentTotal: jest.fn(() => 110),
        handlePriceChange: jest.fn(),
        handleNameChange: jest.fn(),
        handleTaxChange: jest.fn(),
        handleTaxNameChange: jest.fn(),
        addNewTax: jest.fn(),
        removeTax: jest.fn(),
        setReceiptDiscount: jest.fn(),
        removeReceipt: jest.fn(),
        ...overrides
    });

    it('renders receipt cards for each receipt', () => {
        const props = createMockProps({
            imagePreviews: ['/img1.jpg', '/img2.jpg'],
            receiptData: [
                { items: [{ name: 'A', price: 50 }], taxes: [], discountType: 'none', discountValue: 0 },
                { items: [{ name: 'B', price: 75 }], taxes: [], discountType: 'none', discountValue: 0 }
            ]
        });

        render(<ReceiptItems {...props} />);

        expect(screen.getByText('Review Receipts (2)')).toBeInTheDocument();
        expect(screen.getByText('Receipt 1')).toBeInTheDocument();
        expect(screen.getByText('Receipt 2')).toBeInTheDocument();
    });

    it('shows combined total across all receipts', () => {
        const props = createMockProps({
            calculateCurrentTotal: jest.fn(() => 500)
        });

        render(<ReceiptItems {...props} />);

        expect(screen.getByText('Combined Total')).toBeInTheDocument();
        expect(screen.getByText('₹500.00')).toBeInTheDocument();
    });

    it('toggles edit mode', () => {
        const props = createMockProps();
        render(<ReceiptItems {...props} />);

        fireEvent.click(screen.getByText('Edit Prices/Names'));

        expect(props.setEditingPrices).toHaveBeenCalledWith(true);
    });

    it('shows edit instructions in edit mode', () => {
        const props = createMockProps({ editingPrices: true });
        render(<ReceiptItems {...props} />);

        expect(screen.getByText(/Edit prices and names/)).toBeInTheDocument();
    });
});
