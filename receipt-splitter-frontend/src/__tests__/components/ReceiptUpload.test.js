import React from 'react';
import { render, fireEvent, screen, waitFor } from '@testing-library/react';
import ReceiptUpload from 'src/components/ReceiptUpload';
import Constants from 'src/Constants';

// Mock fetch
global.fetch = jest.fn();

describe('ReceiptUpload', () => {
    const mockProps = {
        files: [],
        setFiles: jest.fn(),
        imagePreviews: [],
        setImagePreviews: jest.fn(),
        setReceipts: jest.fn(),
        setReceiptData: jest.fn(),
        setStep: jest.fn(),
        setError: jest.fn(),
        isLoading: false,
        setIsLoading: jest.fn()
    };

    beforeEach(() => {
        jest.clearAllMocks();
        URL.createObjectURL = jest.fn(() => 'mocked-url');
    });

    it('renders upload button disabled when no files selected', () => {
        render(<ReceiptUpload {...mockProps} />);
        expect(screen.getByText(/Process.*Receipt/)).toBeDisabled();
    });

    it('allows multiple file selection', () => {
        render(<ReceiptUpload {...mockProps} />);

        const files = [
            new File(['content1'], 'receipt1.jpg', { type: 'image/jpeg' }),
            new File(['content2'], 'receipt2.jpg', { type: 'image/jpeg' })
        ];
        const fileInput = screen.getByLabelText(/Click to select receipt images/i);

        fireEvent.change(fileInput, { target: { files } });

        expect(mockProps.setFiles).toHaveBeenCalled();
        expect(mockProps.setImagePreviews).toHaveBeenCalled();
    });

    it('loads demo data with single receipt', async () => {
        render(<ReceiptUpload {...mockProps} />);

        fireEvent.click(screen.getByText('Show Demo'));

        expect(mockProps.setIsLoading).toHaveBeenCalledWith(true);
        expect(mockProps.setReceipts).toHaveBeenCalledWith([Constants.MOCK_OCR_OUTPUT]);
        expect(mockProps.setImagePreviews).toHaveBeenCalledWith(['/images/demo-receipt.jpeg']);
        expect(mockProps.setReceiptData).toHaveBeenCalled();
        expect(mockProps.setStep).toHaveBeenCalledWith(2);
    });

    it('processes multiple receipts in parallel', async () => {
        global.fetch.mockResolvedValue({
            ok: true,
            json: async () => ({
                ocr_contents: {
                    items: [{ name: 'Item', price: 100 }],
                    total_order_bill_details: { taxes: [] }
                }
            })
        });

        const propsWithFiles = {
            ...mockProps,
            files: [
                new File(['content1'], 'receipt1.jpg', { type: 'image/jpeg' }),
                new File(['content2'], 'receipt2.jpg', { type: 'image/jpeg' })
            ],
            imagePreviews: ['preview1', 'preview2']
        };

        render(<ReceiptUpload {...propsWithFiles} />);
        fireEvent.click(screen.getByText(/Process 2 Receipts/));

        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledTimes(2);
            expect(mockProps.setReceipts).toHaveBeenCalled();
            expect(mockProps.setReceiptData).toHaveBeenCalled();
        });
    });

    it('handles API error during processing', async () => {
        global.fetch.mockResolvedValueOnce({
            ok: false,
            json: async () => ({ detail: 'Not a valid receipt' })
        });

        const propsWithFile = {
            ...mockProps,
            files: [new File(['content'], 'receipt.jpg', { type: 'image/jpeg' })],
            imagePreviews: ['preview']
        };

        render(<ReceiptUpload {...propsWithFile} />);
        fireEvent.click(screen.getByText(/Process 1 Receipt/));

        await waitFor(() => {
            expect(mockProps.setError).toHaveBeenCalledWith(expect.stringContaining('Not a valid receipt'));
        });
    });

    it('continues with valid receipts when some fail', async () => {
        // First call succeeds, second fails
        global.fetch
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    ocr_contents: {
                        items: [{ name: 'Valid Item', price: 50 }],
                        total_order_bill_details: { taxes: [] }
                    }
                })
            })
            .mockResolvedValueOnce({
                ok: false,
                json: async () => ({ detail: 'This is a menu, not a receipt' })
            });

        const propsWithFiles = {
            ...mockProps,
            files: [
                new File(['valid'], 'receipt.jpg', { type: 'image/jpeg' }),
                new File(['invalid'], 'menu.jpg', { type: 'image/jpeg' })
            ],
            imagePreviews: ['preview1', 'preview2']
        };

        render(<ReceiptUpload {...propsWithFiles} />);
        fireEvent.click(screen.getByText(/Process 2 Receipts/));

        await waitFor(() => {
            // Should proceed with the valid receipt
            expect(mockProps.setReceipts).toHaveBeenCalledWith([
                expect.objectContaining({
                    ocr_contents: expect.objectContaining({
                        items: [{ name: 'Valid Item', price: 50 }]
                    })
                })
            ]);
            // Should show warning about skipped file
            expect(mockProps.setError).toHaveBeenCalledWith(expect.stringContaining('Skipped 1 file'));
            expect(mockProps.setError).toHaveBeenCalledWith(expect.stringContaining('menu.jpg'));
            // Should still navigate to step 2
            expect(mockProps.setStep).toHaveBeenCalledWith(2);
        });
    });

    it('shows error when all receipts fail', async () => {
        global.fetch.mockResolvedValue({
            ok: false,
            json: async () => ({ detail: 'Not a receipt' })
        });

        const propsWithFiles = {
            ...mockProps,
            files: [
                new File(['a'], 'a.jpg', { type: 'image/jpeg' }),
                new File(['b'], 'b.jpg', { type: 'image/jpeg' })
            ],
            imagePreviews: ['p1', 'p2']
        };

        render(<ReceiptUpload {...propsWithFiles} />);
        fireEvent.click(screen.getByText(/Process 2 Receipts/));

        await waitFor(() => {
            expect(mockProps.setError).toHaveBeenCalledWith(expect.stringContaining('No valid receipts found'));
            expect(mockProps.setStep).not.toHaveBeenCalled();
        });
    });
});

