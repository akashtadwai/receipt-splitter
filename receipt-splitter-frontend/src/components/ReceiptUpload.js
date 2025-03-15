import React from 'react';
import Constants from '../Constants';

const ReceiptUpload = ({
    setReceipt,
    setEditedItems,
    setEditedTaxes,
    setItemSplits,
    setStep,
    setError,
    isLoading,
    setIsLoading,
    file,
    setFile,
    imagePreview,
    setImagePreview
}) => {
    const API_URL = process.env.REACT_APP_API_URL || '';

    const handleFileChange = (e) => {
        if (e.target.files.length > 0) {
            const selectedFile = e.target.files[0];
            setFile(selectedFile);
            // Create a URL for the image preview
            const imageUrl = URL.createObjectURL(selectedFile);
            setImagePreview(imageUrl);
        }
    };

    const loadDemoData = async () => {
        setIsLoading(true);
        setError('');
        try {
            // Fetch mock data
            const data = Constants.MOCK_OCR_OUTPUT;
            setReceipt(data);

            // Set demo image preview
            setImagePreview('/images/demo-receipt.jpeg');

            // Initialize edited items and taxes with the OCR results
            setEditedItems(data.ocr_contents.items.map(item => ({ ...item })));
            setEditedTaxes(data.ocr_contents.total_order_bill_details.taxes.map(tax => ({ ...tax })));

            // Initialize item splits with regular items
            const initialSplits = data.ocr_contents.items.map(item => ({
                item_name: item.name,
                price: item.price,
                contributors: {},
                useCustomAmounts: false,
                isItem: true
            }));

            // Add tax items to splits if they exist
            const taxSplits = data.ocr_contents.total_order_bill_details.taxes
                ? data.ocr_contents.total_order_bill_details.taxes.map(tax => ({
                    item_name: `${tax.name} (Tax/Fee)`,
                    price: tax.amount,
                    contributors: {},
                    useCustomAmounts: false,
                    isTax: true
                }))
                : [];

            // Combine regular items and taxes
            setItemSplits([...initialSplits, ...taxSplits]);
            setStep(2);
        } catch (err) {
            setError('Error loading demo: ' + err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const uploadReceipt = async () => {
        if (!file) {
            setError('Please select a file first');
            return;
        }
        setIsLoading(true);
        setError('');
        try {
            // Create form data for file upload
            const formData = new FormData();
            formData.append('file', file);
            // Send to backend for OCR processing
            const response = await fetch(`${API_URL}/process-receipt`, {
                method: 'POST',
                body: formData
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Error processing receipt');
            }
            const data = await response.json();
            setReceipt(data);

            // Initialize edited items and taxes with the OCR results
            setEditedItems(data.ocr_contents.items.map(item => ({ ...item })));
            setEditedTaxes(data.ocr_contents.total_order_bill_details.taxes
                ? data.ocr_contents.total_order_bill_details.taxes.map(tax => ({ ...tax }))
                : []);

            // Initialize item splits
            const initialSplits = data.ocr_contents.items.map(item => ({
                item_name: item.name,
                price: item.price,
                contributors: {},
                useCustomAmounts: false,
                isItem: true
            }));

            // Add tax items to splits if they exist
            const taxSplits = data.ocr_contents.total_order_bill_details.taxes
                ? data.ocr_contents.total_order_bill_details.taxes.map(tax => ({
                    item_name: `${tax.name} (Tax/Fee)`,
                    price: tax.amount,
                    contributors: {},
                    useCustomAmounts: false,
                    isTax: true
                }))
                : [];

            // Combine regular items and taxes
            setItemSplits([...initialSplits, ...taxSplits]);
            setStep(2);
        } catch (err) {
            setError('Error processing receipt: ' + err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-6 p-5 border border-indigo-100 rounded-lg bg-indigo-50">
            <h2 className="text-xl font-bold text-indigo-800">Upload Receipt</h2>
            <div className="border-2 border-dashed border-indigo-300 rounded-lg p-6 bg-white text-center hover:border-indigo-500 transition-colors">
                <input
                    type="file"
                    onChange={handleFileChange}
                    className="hidden"
                    id="file-upload"
                />
                <label htmlFor="file-upload" className="cursor-pointer">
                    <div className="space-y-2">
                        <svg className="w-12 h-12 mx-auto text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        <p className="text-indigo-700 font-medium">Click to select receipt image</p>
                        <p className="text-indigo-400 text-sm">{file ? file.name : "No file selected"}</p>
                    </div>
                </label>
            </div>

            <div className="flex flex-col md:flex-row gap-4">
                <button
                    onClick={uploadReceipt}
                    disabled={!file || isLoading}
                    className={`flex-1 py-3 rounded-lg font-medium ${!file || isLoading ? 'bg-gray-300 text-gray-500' : 'bg-indigo-600 text-white hover:bg-indigo-700'
                        } transition-colors`}
                >
                    {isLoading ? 'Processing...' : 'Process Receipt'}
                </button>

                {/* Demo Button */}
                <button
                    onClick={loadDemoData}
                    disabled={isLoading}
                    className="flex-1 py-3 rounded-lg font-medium bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
                >
                    Show Demo
                </button>
            </div>

            <div className="text-sm text-center text-gray-500 mt-2">
                <p>Demo uses sample data for an Instamart grocery order</p>
            </div>
        </div>
    );
};

export default ReceiptUpload;
