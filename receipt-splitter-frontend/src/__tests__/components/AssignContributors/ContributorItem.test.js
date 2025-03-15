import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react';
import ContributorItem from 'src/components/AssignContributors/ContributorItem';

describe('ContributorItem', () => {
    const mockItem = {
        item_name: 'Test Item',
        price: 100,
        contributors: { 'Alice': 50 },
        useCustomAmounts: false,
        isItem: true
    };

    const mockProps = {
        item: mockItem,
        itemIndex: 0,
        personsList: ['Alice', 'Bob'],
        toggleContributor: jest.fn(),
        toggleCustomAmounts: jest.fn(),
        handleCustomAmountChange: jest.fn(),
        validateCustomAmounts: jest.fn(),
        toggleAllContributors: jest.fn()
    };

    it('renders correctly with initial state', () => {
        render(<ContributorItem {...mockProps} />);

        expect(screen.getByText('Test Item')).toBeInTheDocument();
        expect(screen.getByText('₹100.00')).toBeInTheDocument();
        expect(screen.getByText('Alice')).toBeInTheDocument();
    });

    it('toggles contributor checkbox', () => {
        render(<ContributorItem {...mockProps} />);

        const checkbox = screen.getByLabelText('Alice');
        fireEvent.click(checkbox);

        expect(mockProps.toggleContributor).toHaveBeenCalledTimes(1);
    });

});
