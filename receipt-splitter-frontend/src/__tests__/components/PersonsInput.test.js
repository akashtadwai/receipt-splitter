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

    it('calculates splits correctly with percentage discount', () => {
        const mockSetPersonsList = jest.fn();
        const mockSetItemSplits = jest.fn();
        const mockSetStep = jest.fn();
        const mockSetError = jest.fn();

        const mockPropsWithDiscount = {
            persons: 'Alice, Bob',
            setPersons: jest.fn(),
            setPersonsList: mockSetPersonsList,
            setStep: mockSetStep,
            goToStep: jest.fn(),
            editingPrices: true,
            receipt: {
                ocr_contents: {
                    items: [{ price: 100 }, { price: 200 }],
                    total_order_bill_details: {
                        taxes: [{ name: 'GST', amount: 30 }]
                    }
                }
            },
            editedItems: [
                { name: 'Item1', price: 100 },
                { name: 'Item2', price: 200 }
            ],
            editedTaxes: [
                { name: 'GST', amount: 30 }
            ],
            discountType: 'percentage',
            discountValue: '10',
            setError: mockSetError,
            setItemSplits: mockSetItemSplits
        };

        const { getByText } = render(<PersonsInput {...mockPropsWithDiscount} />);

        const continueButton = getByText('Continue');
        fireEvent.click(continueButton);

        // Verify that the splits are calculated correctly
        expect(mockSetItemSplits).toHaveBeenCalled();
        const updatedSplits = mockSetItemSplits.mock.calls[0][0];

        // Check item splits
        expect(updatedSplits[0]).toEqual({
            item_name: 'Item1',
            price: 100,
            contributors: { Alice: 50, Bob: 50 },
            useCustomAmounts: false,
            isItem: true
        });
        expect(updatedSplits[1]).toEqual({
            item_name: 'Item2',
            price: 200,
            contributors: { Alice: 100, Bob: 100 },
            useCustomAmounts: false,
            isItem: true
        });

        // Check tax splits
        expect(updatedSplits[2]).toEqual({
            item_name: 'GST (Tax/Fee)',
            price: 30,
            contributors: { Alice: 15, Bob: 15 },
            useCustomAmounts: false,
            isTax: true
        });

        // Check discount split
        expect(updatedSplits[3]).toEqual({
            item_name: 'Discount (10%)',
            price: -33,
            contributors: { Alice: -16.5, Bob: -16.5 },
            useCustomAmounts: false,
            isDiscount: true
        });

        // Verify step is updated
        expect(mockSetStep).toHaveBeenCalledWith(3);
    });

    it('calculates splits correctly with absolute discount', () => {
        const mockSetPersonsList = jest.fn();
        const mockSetItemSplits = jest.fn();
        const mockSetStep = jest.fn();
        const mockSetError = jest.fn();

        const absoluteDiscountProps = {
            persons: 'Alice, Bob',
            setPersons: jest.fn(),
            setPersonsList: mockSetPersonsList,
            setStep: mockSetStep,
            goToStep: jest.fn(),
            editingPrices: true,
            receipt: {
                ocr_contents: {
                    items: [{ price: 100 }, { price: 200 }],
                    total_order_bill_details: {
                        taxes: [{ name: 'GST', amount: 30 }]
                    }
                }
            },
            editedItems: [
                { name: 'Item1', price: 100 },
                { name: 'Item2', price: 200 }
            ],
            editedTaxes: [
                { name: 'GST', amount: 30 }
            ],
            discountType: 'absolute',
            discountValue: '50',
            setError: mockSetError,
            setItemSplits: mockSetItemSplits
        };

        const { getByText } = render(<PersonsInput {...absoluteDiscountProps} />);

        const continueButton = getByText('Continue');
        fireEvent.click(continueButton);

        // Verify that the splits are calculated correctly
        expect(mockSetItemSplits).toHaveBeenCalled();
        const updatedSplits = mockSetItemSplits.mock.calls[0][0];

        // Check discount split
        expect(updatedSplits[3]).toEqual({
            item_name: 'Discount ',
            price: -50,
            contributors: { Alice: -25, Bob: -25 },
            useCustomAmounts: false,
            isDiscount: true
        });
    });

    it('shows error when no persons are entered', () => {
        const mockSetPersonsList = jest.fn();
        const mockSetItemSplits = jest.fn();
        const mockSetStep = jest.fn();
        const mockSetError = jest.fn();

        const mockPropsWithNoPersons = {
            persons: '',
            setPersons: jest.fn(),
            setPersonsList: mockSetPersonsList,
            setStep: mockSetStep,
            goToStep: jest.fn(),
            editingPrices: true,
            receipt: {
                ocr_contents: {
                    items: [{ price: 100 }, { price: 200 }],
                    total_order_bill_details: {
                        taxes: [{ name: 'GST', amount: 30 }]
                    }
                }
            },
            editedItems: [
                { name: 'Item1', price: 100 },
                { name: 'Item2', price: 200 }
            ],
            editedTaxes: [
                { name: 'GST', amount: 30 }
            ],
            discountType: 'percentage',
            discountValue: '10',
            setError: mockSetError,
            setItemSplits: mockSetItemSplits
        };

        const { getByText } = render(<PersonsInput {...mockPropsWithNoPersons} />);

        const continueButton = getByText('Continue');
        fireEvent.click(continueButton);

        // Verify error is set
        expect(mockSetError).toHaveBeenCalledWith('Please enter at least one person');
    });

    it('shows error when invalid names are entered', () => {
        const mockSetError = jest.fn();

        const mockPropsWithInvalidNames = {
            ...mockProps,
            persons: ' ',
            setError: mockSetError
        };

        render(<PersonsInput {...mockPropsWithInvalidNames} />);

        const continueButton = screen.getByRole('button', { name: /Continue/i });
        fireEvent.click(continueButton);

        // Verify error is set
        expect(mockSetError).toHaveBeenCalledWith('Please enter at least one person');
        expect(mockProps.setPersonsList).not.toHaveBeenCalled();
    });
});

describe('PersonsInput - Receipt Editing Warnings', () => {
    const baseProps = {
        persons: 'Alice, Bob',
        setPersons: jest.fn(),
        setPersonsList: jest.fn(),
        setStep: jest.fn(),
        goToStep: jest.fn(),
        editingPrices: true,
        setError: jest.fn(),
        setItemSplits: jest.fn(),
        discountType: 'none',
        discountValue: 0
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('shows warning when item prices are edited', () => {
        const props = {
            ...baseProps,
            editedItems: [
                { name: 'Pizza', price: 120 }, // Changed price
                { name: 'Pasta', price: 200 }
            ],
            editedTaxes: [{ name: 'Service Tax', amount: 30 }],
            receipt: {
                ocr_contents: {
                    items: [
                        { name: 'Pizza', price: 100 }, // Original price
                        { name: 'Pasta', price: 200 }
                    ],
                    total_order_bill_details: {
                        taxes: [{ name: 'Service Tax', amount: 30 }]
                    }
                }
            }
        };

        render(<PersonsInput {...props} />);
        expect(screen.getByText(/You've edited the receipt/)).toBeInTheDocument();
    });

    it('shows warning when item price is empty', () => {
        const props = {
            ...baseProps,
            editedItems: [
                { name: 'Pizza', price: '' }, // Empty price
                { name: 'Pasta', price: 200 }
            ],
            editedTaxes: [{ name: 'Service Tax', amount: 30 }],
            receipt: {
                ocr_contents: {
                    items: [
                        { name: 'Pizza', price: 100 },
                        { name: 'Pasta', price: 200 }
                    ],
                    total_order_bill_details: {
                        taxes: [{ name: 'Service Tax', amount: 30 }]
                    }
                }
            }
        };

        render(<PersonsInput {...props} />);
        expect(screen.getByText(/You've edited the receipt/)).toBeInTheDocument();
    });

    it('shows warning when tax count changes', () => {
        const props = {
            ...baseProps,
            editedItems: [
                { name: 'Pizza', price: 100 },
                { name: 'Pasta', price: 200 }
            ],
            editedTaxes: [
                { name: 'Service Tax', amount: 30 },
                { name: 'New Tax', amount: 20 } // Added new tax
            ],
            receipt: {
                ocr_contents: {
                    items: [
                        { name: 'Pizza', price: 100 },
                        { name: 'Pasta', price: 200 }
                    ],
                    total_order_bill_details: {
                        taxes: [{ name: 'Service Tax', amount: 30 }]
                    }
                }
            }
        };

        render(<PersonsInput {...props} />);
        expect(screen.getByText(/You've edited the receipt/)).toBeInTheDocument();
    });

    it('shows warning when tax amount is edited', () => {
        const props = {
            ...baseProps,
            editedItems: [
                { name: 'Pizza', price: 100 },
                { name: 'Pasta', price: 200 }
            ],
            editedTaxes: [{ name: 'Service Tax', amount: 40 }], // Changed amount
            receipt: {
                ocr_contents: {
                    items: [
                        { name: 'Pizza', price: 100 },
                        { name: 'Pasta', price: 200 }
                    ],
                    total_order_bill_details: {
                        taxes: [{ name: 'Service Tax', amount: 30 }]
                    }
                }
            }
        };

        render(<PersonsInput {...props} />);
        expect(screen.getByText(/You've edited the receipt/)).toBeInTheDocument();
    });

    it('shows warning when tax name is edited', () => {
        const props = {
            ...baseProps,
            editedItems: [
                { name: 'Pizza', price: 100 },
                { name: 'Pasta', price: 200 }
            ],
            editedTaxes: [{ name: 'Changed Tax Name', amount: 30 }], // Changed name
            receipt: {
                ocr_contents: {
                    items: [
                        { name: 'Pizza', price: 100 },
                        { name: 'Pasta', price: 200 }
                    ],
                    total_order_bill_details: {
                        taxes: [{ name: 'Service Tax', amount: 30 }]
                    }
                }
            }
        };

        render(<PersonsInput {...props} />);
        expect(screen.getByText(/You've edited the receipt/)).toBeInTheDocument();
    });

    it('shows warning when discount is added', () => {
        const props = {
            ...baseProps,
            editedItems: [
                { name: 'Pizza', price: 100 },
                { name: 'Pasta', price: 200 }
            ],
            editedTaxes: [{ name: 'Service Tax', amount: 30 }],
            discountType: 'percentage', // Added discount
            discountValue: 10,
            receipt: {
                ocr_contents: {
                    items: [
                        { name: 'Pizza', price: 100 },
                        { name: 'Pasta', price: 200 }
                    ],
                    total_order_bill_details: {
                        taxes: [{ name: 'Service Tax', amount: 30 }]
                    }
                }
            }
        };

        render(<PersonsInput {...props} />);
        expect(screen.getByText(/You've edited the receipt/)).toBeInTheDocument();
    });

    it('does not show warning when nothing is edited', () => {
        const props = {
            ...baseProps,
            editedItems: [
                { name: 'Pizza', price: 100 },
                { name: 'Pasta', price: 200 }
            ],
            editedTaxes: [{ name: 'Service Tax', amount: 30 }],
            receipt: {
                ocr_contents: {
                    items: [
                        { name: 'Pizza', price: 100 },
                        { name: 'Pasta', price: 200 }
                    ],
                    total_order_bill_details: {
                        taxes: [{ name: 'Service Tax', amount: 30 }]
                    }
                }
            }
        };

        render(<PersonsInput {...props} />);
        expect(screen.queryByText(/You've edited the receipt/)).not.toBeInTheDocument();
    });
});