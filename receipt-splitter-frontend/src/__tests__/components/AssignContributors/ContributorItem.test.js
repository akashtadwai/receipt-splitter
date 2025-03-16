import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ContributorItem from 'src/components/AssignContributors/ContributorItem';

describe('ContributorItem', () => {
    const defaultProps = {
        item: {
            item_name: 'Test Item',
            price: 100,
            contributors: { 'Alice': 50 },
            useCustomAmounts: false
        },
        itemIndex: 0,
        personsList: ['Alice', 'Bob'],
        toggleContributor: jest.fn(),
        toggleCustomAmounts: jest.fn(),
        handleCustomAmountChange: jest.fn(),
        validateCustomAmounts: jest.fn(),
        toggleAllContributors: jest.fn()
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('handles custom amount changes with empty and invalid inputs', async () => {
        const mockHandleCustomAmountChange = jest.fn();
        const props = {
            ...defaultProps,
            item: {
                ...defaultProps.item,
                useCustomAmounts: true
            },
            handleCustomAmountChange: mockHandleCustomAmountChange
        };

        render(<ContributorItem {...props} />);

        // Find the custom amount input
        const amountInput = screen.getByRole('spinbutton');

        // Test empty input
        fireEvent.change(amountInput, { target: { value: '' } });
        expect(mockHandleCustomAmountChange).toHaveBeenCalledWith(0, 'Alice', '');
        
        // Test valid input
        fireEvent.change(amountInput, { target: { value: '75.50' } });
        expect(mockHandleCustomAmountChange).toHaveBeenCalledWith(0, 'Alice', '75.50');
    });

    it('calculates total and remaining amounts correctly with various input types', () => {
        const props = {
            ...defaultProps,
            item: {
                ...defaultProps.item,
                useCustomAmounts: true,
                contributors: {
                    'Alice': '', // empty string
                    'Bob': 'invalid', // invalid input
                    'Charlie': '30.50' // valid input
                },
                price: 100
            },
            personsList: ['Alice', 'Bob', 'Charlie'],
            validateCustomAmounts: () => false
        };

        render(<ContributorItem {...props} />);

        // Check if total assigned is calculated correctly (should be 30.50)
        expect(screen.getByText('₹30.50 / ₹100.00')).toBeInTheDocument();

        // Check if remaining to allocate is calculated correctly (100 - 30.50 = 69.50)
        expect(screen.getByText('₹69.50')).toBeInTheDocument();
    });

    it('toggles custom amounts mode', async () => {
        const mockToggleCustomAmounts = jest.fn();
        const user = userEvent.setup();

        render(<ContributorItem {...defaultProps} toggleCustomAmounts={mockToggleCustomAmounts} />);

        // Find and click the custom amounts checkbox
        const checkbox = screen.getByLabelText('Use custom amounts');
        await user.click(checkbox);

        expect(mockToggleCustomAmounts).toHaveBeenCalledWith(0);
    });

    it('shows correct total when handling special number cases', () => {
        const props = {
            ...defaultProps,
            item: {
                ...defaultProps.item,
                useCustomAmounts: true,
                contributors: {
                    'Alice': '33.33',
                    'Bob': '33.33',
                    'Charlie': '33.33' // Total should be 99.99
                },
                price: 100
            },
            personsList: ['Alice', 'Bob', 'Charlie'],
            validateCustomAmounts: () => true // Consider small differences as valid
        };

        render(<ContributorItem {...props} />);

        // Verify the total is displayed correctly
        expect(screen.getByText('₹99.99 / ₹100.00')).toBeInTheDocument();

        // Verify the validation class is applied (should be green because validateCustomAmounts returns true)
        const totalSpan = screen.getByText('₹99.99 / ₹100.00');
        expect(totalSpan).toHaveClass('text-green-600');
    });
});