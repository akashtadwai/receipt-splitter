import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import ItemsEditor from 'src/components/ReceiptItems/ItemsEditor'

describe('ItemsEditor', () => {
    const mockEditedItems = [{ price: 100 }, { price: 200 }];
    const mockHandlePriceChange = jest.fn();
    const mockEditingPrices = false;

    it('displays non-editable prices', () => {
        const { container } = render(
            <ItemsEditor
                editedItems={mockEditedItems}
                editingPrices={mockEditingPrices}
                handlePriceChange={mockHandlePriceChange}
            />
        );

        expect(container.querySelector('input')).toBeNull();
        expect(container.querySelectorAll('p')[1]).toHaveTextContent('₹100.00');
    });

    it('allows price editing when enabled', () => {
        const mockEditedItems = [
            { name: 'Item1', price: 100 },
            { name: 'Item2', price: 200 }
        ];
        const mockHandlePriceChange = jest.fn();

        const { getAllByRole } = render(
            <ItemsEditor
                editedItems={mockEditedItems}
                editingPrices={true}
                handlePriceChange={mockHandlePriceChange}
                handleNameChange={jest.fn()}
            />
        );

        // Simulate editing the price of the first item
        const priceInputs = getAllByRole('spinbutton');
        fireEvent.change(priceInputs[0], { target: { value: '150' } });

        // Verify that the handlePriceChange function was called with the correct arguments
        expect(mockHandlePriceChange).toHaveBeenCalledWith(0, '150');
    });
});
