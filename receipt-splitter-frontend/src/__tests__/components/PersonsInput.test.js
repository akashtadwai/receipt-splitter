import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react';
import PersonsInput from 'src/components/PersonsInput';

describe('PersonsInput', () => {
    const mockProps = {
        persons: '',
        setPersons: jest.fn(),
        setPersonsList: jest.fn(),
        setStep: jest.fn(),
        goToStep: jest.fn(),
        editingPrices: false,
        receipt: { ocr_contents: { items: [], total_order_bill_details: { taxes: [] } } },
        editedItems: [],
        editedTaxes: [],
        discountType: 'none',
        discountValue: 0,
        setError: jest.fn(),
        setItemSplits: jest.fn()
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders correctly', () => {
        render(<PersonsInput {...mockProps} />);
        expect(screen.getByPlaceholderText(/e\.g\. Sachin, Rohit, Kohli/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Continue/i })).toBeInTheDocument();
    });

    it('handles empty input', () => {
        render(<PersonsInput {...mockProps} />);

        const continueButton = screen.getByRole('button', { name: /Continue/i });
        fireEvent.click(continueButton);

        expect(mockProps.setError).toHaveBeenCalledWith('Please enter at least one person');
        expect(mockProps.setPersonsList).not.toHaveBeenCalled();
    });

    it('handles comma-separated names correctly', () => {
        const props = { ...mockProps, persons: 'Alice, Bob, Charlie' };
        render(<PersonsInput {...props} />);

        const continueButton = screen.getByRole('button', { name: /Continue/i });
        fireEvent.click(continueButton);

        expect(mockProps.setPersonsList).toHaveBeenCalledWith(['Alice', 'Bob', 'Charlie']);
        expect(mockProps.setStep).toHaveBeenCalledWith(3);
    });

    it('handles whitespace and empty entries correctly', () => {
        const props = { ...mockProps, persons: 'Alice, , Bob, ,' };
        render(<PersonsInput {...props} />);

        const continueButton = screen.getByRole('button', { name: /Continue/i });
        fireEvent.click(continueButton);

        expect(mockProps.setPersonsList).toHaveBeenCalledWith(['Alice', 'Bob']);
    });

    it('creates item splits with equal division', () => {
        const props = {
            ...mockProps,
            persons: 'Alice, Bob',
            editedItems: [{ name: 'Item 1', price: 100 }],
            editedTaxes: [{ name: 'GST', amount: 20 }]
        };

        render(<PersonsInput {...props} />);
        fireEvent.click(screen.getByRole('button', { name: /Continue/i }));

        expect(mockProps.setItemSplits).toHaveBeenCalledWith(
            expect.arrayContaining([
                expect.objectContaining({
                    item_name: 'Item 1',
                    price: 100,
                    contributors: { Alice: 50, Bob: 50 }
                }),
                expect.objectContaining({
                    item_name: 'GST (Tax/Fee)',
                    price: 20,
                    contributors: { Alice: 10, Bob: 10 }
                })
            ])
        );
    });
});
