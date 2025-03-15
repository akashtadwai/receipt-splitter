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
        const { container } = render(
            <ItemsEditor
                editedItems={mockEditedItems}
                editingPrices={true}
                handlePriceChange={mockHandlePriceChange}
            />
        );

        const input = container.querySelector('input');
        fireEvent.change(input, { target: { value: '150' } });
        expect(mockHandlePriceChange).toHaveBeenCalledWith(0, '150');
    });
});
