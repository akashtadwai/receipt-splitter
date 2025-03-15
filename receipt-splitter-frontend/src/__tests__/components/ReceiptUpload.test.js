import React from 'react';
import { render, fireEvent, screen, waitFor } from '@testing-library/react';
import ReceiptUpload from 'src/components/ReceiptUpload';
import Constants from 'src/Constants';

// Mock fetch
global.fetch = jest.fn();

describe('ReceiptUpload', () => {
    const mockProps = {
        setReceipt: jest.fn(),
        setEditedItems: jest.fn(),
        setEditedTaxes: jest.fn(),
        setItemSplits: jest.fn(),
        setStep: jest.fn(),
        setError: jest.fn(),
        isLoading: false,
        setIsLoading: jest.fn(),
        file: null,
        setFile: jest.fn(),
        imagePreview: null,
        setImagePreview: jest.fn()
    };

    beforeEach(() => {
        jest.clearAllMocks();
        // Mock URL.createObjectURL
        URL.createObjectURL = jest.fn(() => 'mocked-url');
    });

    it('renders upload button in disabled state when no file selected', () => {
        render(<ReceiptUpload {...mockProps} />);

        const processButton = screen.getByText('Process Receipt');
        expect(processButton).toBeDisabled();
    });

    it('handles file selection', () => {
        render(<ReceiptUpload {...mockProps} />);

        const file = new File(['dummy content'], 'receipt.jpg', { type: 'image/jpeg' });
        const fileInput = screen.getByLabelText(/Click to select receipt image/i);

        fireEvent.change(fileInput, { target: { files: [file] } });

        expect(mockProps.setFile).toHaveBeenCalledWith(file);
        expect(mockProps.setImagePreview).toHaveBeenCalledWith('mocked-url');
    });

    it('loads demo data correctly', async () => {
        render(<ReceiptUpload {...mockProps} />);

        const demoButton = screen.getByText('Show Demo');
        fireEvent.click(demoButton);

        expect(mockProps.setIsLoading).toHaveBeenCalledWith(true);
        expect(mockProps.setReceipt).toHaveBeenCalledWith(Constants.MOCK_OCR_OUTPUT);
        expect(mockProps.setImagePreview).toHaveBeenCalledWith('/images/demo-receipt.jpeg');
        expect(mockProps.setStep).toHaveBeenCalledWith(2);
    });

    it('handles successful receipt upload', async () => {
        // Mock successful API response
        global.fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                ocr_contents: {
                    items: [{ name: 'Test Item', price: 100 }],
                    total_order_bill_details: { taxes: [{ name: 'GST', amount: 18 }] }
                }
            })
        });

        const props = {
            ...mockProps,
            file: new File(['dummy content'], 'receipt.jpg', { type: 'image/jpeg' })
        };

        render(<ReceiptUpload {...props} />);

        const processButton = screen.getByText('Process Receipt');
        fireEvent.click(processButton);

        expect(mockProps.setIsLoading).toHaveBeenCalledWith(true);

        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalled();
            expect(mockProps.setReceipt).toHaveBeenCalled();
            expect(mockProps.setStep).toHaveBeenCalledWith(2);
        });
    });

    it('handles API error during receipt upload', async () => {
        // Mock API error
        global.fetch.mockResolvedValueOnce({
            ok: false,
            json: async () => ({ detail: 'API error message' })
        });

        const props = {
            ...mockProps,
            file: new File(['dummy content'], 'receipt.jpg', { type: 'image/jpeg' })
        };

        render(<ReceiptUpload {...props} />);

        const processButton = screen.getByText('Process Receipt');
        fireEvent.click(processButton);

        await waitFor(() => {
            expect(mockProps.setError).toHaveBeenCalledWith('Error processing receipt: API error message');
            expect(mockProps.setIsLoading).toHaveBeenCalledWith(false);
        });
    });
});
