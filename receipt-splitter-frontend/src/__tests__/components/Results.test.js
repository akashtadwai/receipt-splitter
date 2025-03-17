import {React, act} from 'react';
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

        const mockItemSplits = [
            { isItem: true, item_name: 'Item1', price: 10, contributors: { 'Alice': 10 } },
            { isTax: true, item_name: 'Tax1', price: 2, contributors: { 'Alice': 2 } },
            { isDiscount: true, item_name: 'Discount1', price: -1, contributors: { 'Alice': -1 } }
        ];

        const mockCalculateCurrentTotal = jest.fn();

        const mockProps = {
            results: mockResults,
            goToStep: jest.fn(),
            resetApp: jest.fn(),
            itemSplits: mockItemSplits,
            calculateCurrentTotal: mockCalculateCurrentTotal.mockImplementation(() => 45.5)
        };

        beforeEach(() => {
            jest.clearAllMocks();
            mockCalculateCurrentTotal.mockImplementation(() => 45.5);
            Object.assign(navigator, {
                clipboard: {
                    writeText: jest.fn().mockResolvedValue(),
                    readText: jest.fn().mockResolvedValue('Receipt Breakdown:')
                }
            });
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

            const backButton = screen.getByRole('button', { name: /Back to Edit/i });
            fireEvent.click(backButton);

            expect(mockProps.goToStep).toHaveBeenCalledWith(3);
        });

        it('calls resetApp when start new split button is clicked', () => {
            render(<Results {...mockProps} />);

            const resetButton = screen.getByRole('button', { name: /Split Another Receipt/i });
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

            render(<Results results={resultsWithZero} goToStep={mockProps.goToStep} resetApp={mockProps.resetApp} itemSplits={mockItemSplits} calculateCurrentTotal={mockCalculateCurrentTotal} />);

            expect(screen.getByText('₹0.00')).toBeInTheDocument();
        });

        it('generates correct receipt text', () => {
            render(<Results {...mockProps} />);

            const receiptText = screen.getByRole('textbox').value;
            expect(receiptText).toContain('Receipt Breakdown:');
            expect(receiptText).toContain('Item1: ₹10.00');
            expect(receiptText).toContain('Tax1: ₹2.00');
            expect(receiptText).toContain('Discount1: ₹-1.00');
            expect(receiptText).toContain('Total Bill: ₹45.50');
            expect(receiptText).toContain('Split Breakdown:');
            expect(receiptText).toContain('Alice: ₹25.50');
            expect(receiptText).toContain('Bob: ₹30.75');
            expect(receiptText).toContain('Charlie: ₹15.25');
        });


    it('copies receipt text to clipboard', async () => {
        jest.useFakeTimers();
        render(<Results {...mockProps} />);

        const copyButton = screen.getByRole('button', { name: /Copy Details/i });

        await act(async () => {
            fireEvent.click(copyButton);
            // Wait for the clipboard operation
            await Promise.resolve();
        });

        expect(navigator.clipboard.writeText).toHaveBeenCalled();

        // Clean up timers
        jest.useRealTimers();
    });

    it('displays "Copied!" message after copying and removes it', async () => {
        jest.useFakeTimers();
        render(<Results {...mockProps} />);

        const copyButton = screen.getByRole('button', { name: /Copy Details/i });

        await act(async () => {
            fireEvent.click(copyButton);
            // Wait for the clipboard operation
            await Promise.resolve();
        });

        // Check if "Copied!" appears
        expect(screen.getByText('Copied!')).toBeInTheDocument();

        // Fast-forward 2 seconds
        await act(async () => {
            jest.advanceTimersByTime(2000);
        });

        // Check if "Copied!" is removed
        expect(screen.queryByText('Copied!')).not.toBeInTheDocument();

        // Clean up timers
        jest.useRealTimers();
    });
    it('generates table with centered content', () => {
        const mockData = {
            results: {
                breakdown: [
                    { person: 'Alexander', amount: 25.50 },
                    { person: 'Bob', amount: 30.75 }
                ]
            },
            itemSplits: [
                {
                    item_name: 'Long Pizza Name',
                    price: 40,
                    isItem: true,
                    contributors: { 'Alexander': 20, 'Bob': 20 }
                },
                {
                    item_name: 'Coke',
                    price: 10,
                    isItem: true,
                    contributors: { 'Bob': 10 }
                }
            ],
            calculateCurrentTotal: () => 50,
            goToStep: jest.fn(),
            resetApp: jest.fn()
        };

        render(<Results {...mockData} />);

        const receiptText = screen.getByRole('textbox').value;
        const tableLines = receiptText.split('\n').filter(line =>
            line.includes('|') || line.includes('+')
        );

        // Expected centered content
        expect(tableLines[1]).toMatch(/\| *Item *\| *Alexander *\| *Bob *\|/);
        expect(tableLines[3]).toMatch(/\| *Long Pizza Name *\| *✓ *\| *✓ *\|/);

        // Check that content is actually centered
        const headerRow = tableLines[1];
        const headerCells = headerRow.split('|').filter(cell => cell.trim());

        headerCells.forEach(cell => {
            const trimmed = cell.trim();
            const leftSpace = cell.indexOf(trimmed);
            const rightSpace = cell.length - trimmed.length - leftSpace;
            // Allow for off-by-one in odd-length strings
            expect(Math.abs(leftSpace - rightSpace)).toBeLessThanOrEqual(1);
        });
    });
    });