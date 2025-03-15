import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react';
import DiscountEditor from 'src/components/ReceiptItems/DiscountEditor';

describe('DiscountEditor', () => {
    const mockProps = {
        discountType: 'none',
        setDiscountType: jest.fn(),
        discountValue: '0',
        setDiscountValue: jest.fn()
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders with no discount by default', () => {
        render(<DiscountEditor {...mockProps} />);

        const select = screen.getByRole('combobox');
        expect(select).toHaveValue('none');

        // No input field should be visible with discount type 'none'
        expect(screen.queryByRole('spinbutton')).not.toBeInTheDocument();
    });

    it('shows percentage input when percentage discount selected', () => {
        render(
            <DiscountEditor
                {...mockProps}
                discountType="percentage"
                discountValue="10"
            />
        );

        const input = screen.getByRole('spinbutton');
        expect(input).toBeInTheDocument();
        expect(input).toHaveValue(10);

        // Should show % symbol
        expect(screen.getByText('%')).toBeInTheDocument();
    });

    it('shows absolute amount input when absolute discount selected', () => {
        render(
            <DiscountEditor
                {...mockProps}
                discountType="absolute"
                discountValue="50"
            />
        );

        const input = screen.getByRole('spinbutton');
        expect(input).toBeInTheDocument();
        expect(input).toHaveValue(50);

        // Should show ₹ symbol
        expect(screen.getByText('₹')).toBeInTheDocument();
    });

    it('handles discount type change', () => {
        render(<DiscountEditor {...mockProps} />);

        const select = screen.getByRole('combobox');
        fireEvent.change(select, { target: { value: 'percentage' } });

        expect(mockProps.setDiscountType).toHaveBeenCalledWith('percentage');
    });

    it('handles discount value change', () => {
        render(
            <DiscountEditor
                {...mockProps}
                discountType="percentage"
                discountValue="10"
            />
        );

        const input = screen.getByRole('spinbutton');
        fireEvent.change(input, { target: { value: '15' } });

        expect(mockProps.setDiscountValue).toHaveBeenCalledWith('15');
    });

    it('enforces percentage max value of 100', () => {
        render(
            <DiscountEditor
                {...mockProps}
                discountType="percentage"
                discountValue="10"
            />
        );

        const input = screen.getByRole('spinbutton');
        expect(input).toHaveAttribute('max', '100');
    });

    it('does not enforce max value for absolute discounts', () => {
        render(
            <DiscountEditor
                {...mockProps}
                discountType="absolute"
                discountValue="50"
            />
        );

        const input = screen.getByRole('spinbutton');
        expect(input).not.toHaveAttribute('max');
    });
});
