import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react';
import PersonsInput from 'src/components/PersonsInput';

describe('PersonsInput', () => {
    const createMockProps = (overrides = {}) => ({
        persons: '',
        setPersons: jest.fn(),
        setPersonsList: jest.fn(),
        setStep: jest.fn(),
        goToStep: jest.fn(),
        editingPrices: false,
        receiptData: [{
            items: [{ name: 'Coffee', price: 100 }],
            taxes: [{ name: 'GST', amount: 10 }],
            discountType: 'none',
            discountValue: 0
        }],
        setError: jest.fn(),
        setItemSplits: jest.fn(),
        ...overrides
    });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders input and buttons', () => {
        render(<PersonsInput {...createMockProps()} />);
        expect(screen.getByPlaceholderText(/Sachin, Rohit, Kohli/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Continue/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Back/i })).toBeInTheDocument();
    });

    it('shows error for empty input', () => {
        const props = createMockProps();
        render(<PersonsInput {...props} />);

        fireEvent.click(screen.getByRole('button', { name: /Continue/i }));

        expect(props.setError).toHaveBeenCalledWith('Please enter at least one person');
    });

    it('parses comma-separated names correctly', () => {
        const props = createMockProps({ persons: 'Alice, Bob, Charlie' });
        render(<PersonsInput {...props} />);

        fireEvent.click(screen.getByRole('button', { name: /Continue/i }));

        expect(props.setPersonsList).toHaveBeenCalledWith(['Alice', 'Bob', 'Charlie']);
        expect(props.setStep).toHaveBeenCalledWith(3);
    });

    it('combines items from all receipts into splits', () => {
        const props = createMockProps({
            persons: 'Alice, Bob',
            receiptData: [
                { items: [{ name: 'Pizza', price: 200 }], taxes: [], discountType: 'none', discountValue: 0 },
                { items: [{ name: 'Pasta', price: 100 }], taxes: [], discountType: 'none', discountValue: 0 }
            ]
        });

        render(<PersonsInput {...props} />);
        fireEvent.click(screen.getByRole('button', { name: /Continue/i }));

        const splits = props.setItemSplits.mock.calls[0][0];
        expect(splits).toHaveLength(2);
        expect(splits[0].item_name).toBe('Pizza');
        expect(splits[1].item_name).toBe('Pasta');
    });

    it('applies per-receipt discounts', () => {
        const props = createMockProps({
            persons: 'Alice',
            receiptData: [{
                items: [{ name: 'Item', price: 100 }],
                taxes: [{ name: 'Tax', amount: 10 }],
                discountType: 'percentage',
                discountValue: 10
            }]
        });

        render(<PersonsInput {...props} />);
        fireEvent.click(screen.getByRole('button', { name: /Continue/i }));

        const splits = props.setItemSplits.mock.calls[0][0];
        const discountItem = splits.find(s => s.isDiscount);
        expect(discountItem).toBeDefined();
        expect(discountItem.price).toBe(-11); // 10% of (100 + 10)
    });

    it('navigates back to step 1', () => {
        const props = createMockProps();
        render(<PersonsInput {...props} />);

        fireEvent.click(screen.getByRole('button', { name: /Back/i }));

        expect(props.goToStep).toHaveBeenCalledWith(1);
    });
});