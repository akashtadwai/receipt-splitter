import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react';
import Results from 'src/components/Results';

describe('Results', () => {
    const mockResults = {
        breakdown: [
            { person: 'Alice', amount: 25.5 },
            { person: 'Bob', amount: 30.75 },
            { person: 'Charlie', amount: 15.25 }
        ]
    };

    const mockProps = {
        results: mockResults,
        goToStep: jest.fn(),
        resetApp: jest.fn()
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders all person amounts correctly', () => {
        render(<Results {...mockProps} />);

        expect(screen.getByText('Alice')).toBeInTheDocument();
        expect(screen.getByText('₹25.50')).toBeInTheDocument();
        expect(screen.getByText('Bob')).toBeInTheDocument();
        expect(screen.getByText('₹30.75')).toBeInTheDocument();
        expect(screen.getByText('Charlie')).toBeInTheDocument();
        expect(screen.getByText('₹15.25')).toBeInTheDocument();
    });

    it('calls goToStep when back button is clicked', () => {
        render(<Results {...mockProps} />);

        const backButton = screen.getByRole('button', { name: /Back/i });
        fireEvent.click(backButton);

        expect(mockProps.goToStep).toHaveBeenCalledWith(3);
    });

    it('calls resetApp when start new split button is clicked', () => {
        render(<Results {...mockProps} />);

        const resetButton = screen.getByRole('button', { name: /Start New Split/i });
        fireEvent.click(resetButton);

        expect(mockProps.resetApp).toHaveBeenCalled();
    });

    it('handles zero amount display correctly', () => {
        const resultsWithZero = {
            breakdown: [
                { person: 'Alice', amount: 25.5 },
                { person: 'Bob', amount: 0 }
            ]
        };

        render(<Results results={resultsWithZero} goToStep={mockProps.goToStep} resetApp={mockProps.resetApp} />);

        expect(screen.getByText('₹0.00')).toBeInTheDocument();
    });
});
