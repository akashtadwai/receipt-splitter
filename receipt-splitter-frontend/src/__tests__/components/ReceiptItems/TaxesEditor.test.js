import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react';
import TaxesEditor from 'src/components/ReceiptItems/TaxesEditor'

describe('TaxesEditor', () => {
    const mockEditedTaxes = [
        { name: 'GST', amount: 50 },
        { name: 'Service Charge', amount: 20 }
    ];

    const mockProps = {
        editedTaxes: mockEditedTaxes,
        editingPrices: false,
        handleTaxChange: jest.fn(),
        handleTaxNameChange: jest.fn(),
        addNewTax: jest.fn(),
        removeTax: jest.fn()
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders nothing when taxes array is empty and not editing', () => {
        const { container } = render(
            <TaxesEditor {...mockProps} editedTaxes={[]} />
        );

        expect(container.firstChild).toBeNull();
    });

    it('renders taxes in read-only mode', () => {
        render(<TaxesEditor {...mockProps} />);

        expect(screen.getByText('GST')).toBeInTheDocument();
        expect(screen.getByText('₹50.00')).toBeInTheDocument();
        expect(screen.getByText('Service Charge')).toBeInTheDocument();
        expect(screen.getByText('₹20.00')).toBeInTheDocument();

        // In read-only mode, there should be no input fields
        expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
        expect(screen.queryByRole('spinbutton')).not.toBeInTheDocument();
    });

    it('renders taxes in edit mode with input fields', () => {
        render(<TaxesEditor {...mockProps} editingPrices={true} />);

        // Should have text inputs for names
        const nameInputs = screen.getAllByRole('textbox');
        expect(nameInputs).toHaveLength(2);
        expect(nameInputs[0]).toHaveValue('GST');

        // Should have number inputs for amounts
        const amountInputs = screen.getAllByRole('spinbutton');
        expect(amountInputs).toHaveLength(2);
        expect(amountInputs[0]).toHaveValue(50);
    });

    it('shows add tax button in edit mode', () => {
        render(<TaxesEditor {...mockProps} editingPrices={true} />);

        const addButton = screen.getByText('+ Add Tax');
        expect(addButton).toBeInTheDocument();

        fireEvent.click(addButton);
        expect(mockProps.addNewTax).toHaveBeenCalled();
    });

    it('handles tax name changes', () => {
        render(<TaxesEditor {...mockProps} editingPrices={true} />);

        const nameInputs = screen.getAllByRole('textbox');
        fireEvent.change(nameInputs[0], { target: { value: 'New GST' } });

        expect(mockProps.handleTaxNameChange).toHaveBeenCalledWith(0, 'New GST');
    });

    it('handles tax amount changes', () => {
        render(<TaxesEditor {...mockProps} editingPrices={true} />);

        const amountInputs = screen.getAllByRole('spinbutton');
        fireEvent.change(amountInputs[0], { target: { value: '75' } });

        expect(mockProps.handleTaxChange).toHaveBeenCalledWith(0, '75');
    });

    it('handles removing a tax', () => {
        render(<TaxesEditor {...mockProps} editingPrices={true} />);

        // Click the first tax's remove button
        const removeButtons = screen.getAllByRole('button').filter(btn =>
            btn.innerHTML.includes('path') && !btn.innerHTML.includes('Add Tax')
        );
        fireEvent.click(removeButtons[0]);

        expect(mockProps.removeTax).toHaveBeenCalledWith(0);
    });
});
