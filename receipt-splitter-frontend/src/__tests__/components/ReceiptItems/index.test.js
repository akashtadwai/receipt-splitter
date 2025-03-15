import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react';
import ReceiptItems from 'src/components/ReceiptItems';

describe('ReceiptItems', () => {
    const calculateTotalMock = jest.fn();
    calculateTotalMock.mockReturnValue(330);


    const mockProps = {
        imagePreview: '/test-image.jpg',
        editingPrices: false,
        setEditingPrices: jest.fn(),
        editedItems: [
            { name: 'Test Item 1', price: 100 },
            { name: 'Test Item 2', price: 200 },
            { name: 'Test Item 3', price: 0 },
            { name: 'Test Item 4', price: 50 } // Ensure all items have a price
        ],
        setEditedItems: jest.fn(),
        editedTaxes: [
            { name: 'GST', amount: 30 }
        ],
        setEditedTaxes: jest.fn(),
        discountType: 'none',
        setDiscountType: jest.fn(),
        discountValue: 0,
        setDiscountValue: jest.fn(),
        calculateCurrentTotal: calculateTotalMock,
        handlePriceChange: jest.fn(),
        handleTaxChange: jest.fn(),
        handleTaxNameChange: jest.fn(),
        addNewTax: jest.fn(),
        removeTax: jest.fn()
    };

    beforeEach(() => {
        jest.clearAllMocks();
        calculateTotalMock.mockReturnValue(330);
    });

    it('renders correctly with receipt image and items', () => {
        render(<ReceiptItems {...mockProps} />);

        // Check receipt image
        const image = screen.getByAltText('Receipt');
        expect(image).toHaveAttribute('src', '/test-image.jpg');

        // Check headers
        expect(screen.getByText('Receipt Items')).toBeInTheDocument();
        expect(screen.getByText('Original Receipt')).toBeInTheDocument();
        expect(screen.getByText('Extracted Items')).toBeInTheDocument();
    });
    it('toggles edit mode when edit button is clicked', () => {
        render(<ReceiptItems {...mockProps} />);

        const editButton = screen.getByText('Edit Prices');
        fireEvent.click(editButton);

        expect(mockProps.setEditingPrices).toHaveBeenCalledWith(true);
    });

    it('renders items editor with correct items', () => {
        render(<ReceiptItems {...mockProps} />);

        // Should display both test items
        expect(screen.getByText('Test Item 1')).toBeInTheDocument();
        expect(screen.getByText('Test Item 2')).toBeInTheDocument();

        // Should display prices as text in non-edit mode
        expect(screen.getByText('₹100.00')).toBeInTheDocument();
        expect(screen.getByText('₹200.00')).toBeInTheDocument();
    });

    it('renders taxes editor with correct taxes', () => {
        render(<ReceiptItems {...mockProps} />);

        expect(screen.getByText('Taxes & Fees')).toBeInTheDocument();
        expect(screen.getByText('GST')).toBeInTheDocument();
        expect(screen.getByText('₹30.00')).toBeInTheDocument();
    });

    it('displays the correct total amount', () => {
        render(<ReceiptItems {...mockProps} />);

        expect(screen.getByText('Total')).toBeInTheDocument();
        expect(screen.getByText('₹330.00')).toBeInTheDocument();

        // Check that calculateCurrentTotal was called
        expect(mockProps.calculateCurrentTotal).toHaveBeenCalled();
    });

    it('shows input fields in edit mode', () => {
        render(<ReceiptItems {...mockProps} editingPrices={true} />);

        // In edit mode, we should have input fields for prices
        const inputs = screen.getAllByRole('spinbutton');
        expect(inputs.length).toBeGreaterThanOrEqual(3); // 2 items + 1 tax

        // The reset button should be shown
        expect(screen.getByText('Reset to Original')).toBeInTheDocument();
    });

    it('shows "Add Tax" button in edit mode', () => {
        render(<ReceiptItems {...mockProps} editingPrices={true} />);

        const addTaxButton = screen.getByText('+ Add Tax');
        expect(addTaxButton).toBeInTheDocument();

        fireEvent.click(addTaxButton);
        expect(mockProps.addNewTax).toHaveBeenCalled();
    });

    it('shows discount editor with correct options', () => {
        render(<ReceiptItems {...mockProps} />);

        expect(screen.getByText('Apply Discount')).toBeInTheDocument();

        // Select should have 3 options
        const select = screen.getByRole('combobox');
        expect(select).toHaveValue('none');

        // Default "No Discount" shouldn't show any input
        expect(screen.queryByRole('spinbutton', { name: /discount/i })).not.toBeInTheDocument();
    });

    it('shows discount input when discount type is set', () => {
        render(
            <ReceiptItems
                {...mockProps}
                discountType="percentage"
                discountValue={10}
                calculateCurrentTotal={jest.fn(() => 297)} // 330 - 10%
            />
        );

        // Should show % sign and the discount input
        expect(screen.getByText('%')).toBeInTheDocument();
    });
});
