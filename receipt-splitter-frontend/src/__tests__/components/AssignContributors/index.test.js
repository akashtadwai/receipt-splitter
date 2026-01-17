import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react';
import AssignContributors from 'src/components/AssignContributors';

describe('AssignContributors', () => {
    const mockProps = {
        itemSplits: [
            {
                item_name: 'Item 1',
                price: 100,
                contributors: { 'Alice': 50, 'Bob': 50 },
                useCustomAmounts: false,
                isItem: true
            },
            {
                item_name: 'GST (Tax/Fee)',
                price: 18,
                contributors: { 'Alice': 9, 'Bob': 9 },
                useCustomAmounts: false,
                isTax: true
            }
        ],
        personsList: ['Alice', 'Bob', 'Charlie'],
        toggleContributor: jest.fn(),
        toggleCustomAmounts: jest.fn(),
        handleCustomAmountChange: jest.fn(),
        validateCustomAmounts: jest.fn(() => true),
        toggleAllContributors: jest.fn(),
        goToStep: jest.fn(),
        calculateSplit: jest.fn(),
        setError: jest.fn()
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders sections for items and taxes', () => {
        render(<AssignContributors {...mockProps} />);

        expect(screen.getByText('Items')).toBeInTheDocument();
        expect(screen.getByText('Taxes & Fees')).toBeInTheDocument();
        expect(screen.getByText('Item 1')).toBeInTheDocument();
        expect(screen.getByText('GST (Tax/Fee)')).toBeInTheDocument();
    });

    it('renders discount section when discount is present', () => {
        const propsWithDiscount = {
            ...mockProps,
            itemSplits: [
                ...mockProps.itemSplits,
                {
                    item_name: 'Discount (10%)',
                    price: -10,
                    contributors: { 'Alice': -5, 'Bob': -5 },
                    useCustomAmounts: false,
                    isDiscount: true
                }
            ]
        };

        render(<AssignContributors {...propsWithDiscount} />);

        expect(screen.getByText('Discounts')).toBeInTheDocument();
        expect(screen.getByText('Discount (10%)')).toBeInTheDocument();
    });

    it('handles back button click', () => {
        render(<AssignContributors {...mockProps} />);

        const backButton = screen.getByText('Back');
        fireEvent.click(backButton);

        expect(mockProps.goToStep).toHaveBeenCalledWith(2);
    });

    it('handles calculate split button click', () => {
        render(<AssignContributors {...mockProps} />);

        const calculateButton = screen.getByText('Calculate Split');
        fireEvent.click(calculateButton);

        expect(mockProps.calculateSplit).toHaveBeenCalled();
    });

    it('renders appropriate contributor selections for each person', () => {
        render(<AssignContributors {...mockProps} />);

        // Check if all persons are listed for the item
        expect(screen.getAllByText('Alice')).toHaveLength(2); // Once for each item
        expect(screen.getAllByText('Bob')).toHaveLength(2);
        expect(screen.getAllByText('Charlie')).toHaveLength(2);

        // Check if the correct amounts are shown for contributors
        expect(screen.getAllByText('₹50.00')).toHaveLength(2); // Alice & Bob for item
        expect(screen.getAllByText('₹9.00')).toHaveLength(2); // Alice & Bob for tax
    });
});
