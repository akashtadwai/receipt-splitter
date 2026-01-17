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

    it('calls the correct API endpoint for receipt processing', async () => {
        global.fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                ocr_contents: {
                    items: [{ name: 'Test Item', price: 100 }],
                    total_order_bill_details: { taxes: [] }
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

        await waitFor(() => {
            // Verify fetch was called with /process-receipt endpoint
            const fetchCall = global.fetch.mock.calls[0];
            expect(fetchCall[0]).toContain('/process-receipt');
            expect(fetchCall[1].method).toBe('POST');
            expect(fetchCall[1].body).toBeInstanceOf(FormData);
        });
    });

    it('handles receipts with no taxes gracefully', async () => {
        global.fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                ocr_contents: {
                    items: [{ name: 'Coffee', price: 5.50 }],
                    total_order_bill_details: {
                        total_bill: 5.50,
                        taxes: null  // API might return null instead of empty array
                    }
                }
            })
        });

        const props = {
            ...mockProps,
            file: new File(['receipt'], 'receipt.png', { type: 'image/png' })
        };

        render(<ReceiptUpload {...props} />);
        fireEvent.click(screen.getByText('Process Receipt'));

        await waitFor(() => {
            expect(mockProps.setEditedTaxes).toHaveBeenCalledWith([]);
            expect(mockProps.setStep).toHaveBeenCalledWith(2);
        });
    });

    it('handles network failure during upload', async () => {
        global.fetch.mockRejectedValueOnce(new Error('Network error'));

        const props = {
            ...mockProps,
            file: new File(['content'], 'test.jpg', { type: 'image/jpeg' })
        };

        render(<ReceiptUpload {...props} />);
        fireEvent.click(screen.getByText('Process Receipt'));

        await waitFor(() => {
            expect(mockProps.setError).toHaveBeenCalledWith('Error processing receipt: Network error');
            expect(mockProps.setIsLoading).toHaveBeenCalledWith(false);
        });
    });

    it('sends file in FormData with correct field name', async () => {
        global.fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                ocr_contents: {
                    items: [],
                    total_order_bill_details: { taxes: [] }
                }
            })
        });

        const testFile = new File(['image data'], 'my-receipt.jpg', { type: 'image/jpeg' });
        const props = { ...mockProps, file: testFile };

        render(<ReceiptUpload {...props} />);
        fireEvent.click(screen.getByText('Process Receipt'));

        await waitFor(() => {
            const formData = global.fetch.mock.calls[0][1].body;
            expect(formData.get('file')).toBe(testFile);
        });
    });
});
