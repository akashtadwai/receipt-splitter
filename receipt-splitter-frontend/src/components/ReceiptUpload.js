import React from 'react';
import Constants from '../Constants';

const ReceiptUpload = ({
    files, setFiles,
    imagePreviews, setImagePreviews,
    setReceipts,
    setReceiptData,
    setStep,
    setError,
    isLoading,
    setIsLoading
}) => {
    // Use Cloudflare Worker URL
    const API_URL = process.env.NODE_ENV === 'development'
        ? 'http://localhost:8787'
        : 'https://receipt-splitter-api.akash-tadwai.workers.dev';

    const handleFileChange = (e) => {
        if (e.target.files.length > 0) {
            const newFiles = Array.from(e.target.files);
            const newPreviews = newFiles.map(file => URL.createObjectURL(file));

            setFiles(prev => [...prev, ...newFiles]);
            setImagePreviews(prev => [...prev, ...newPreviews]);
        }
    };

    const removeFile = (index) => {
        const preview = imagePreviews[index];
        if (preview && preview.startsWith('blob:')) {
            URL.revokeObjectURL(preview);
        }
        setFiles(prev => prev.filter((_, i) => i !== index));
        setImagePreviews(prev => prev.filter((_, i) => i !== index));
    };

    const loadDemoData = async () => {
        setIsLoading(true);
        setError('');
        try {
            const data = Constants.MOCK_OCR_OUTPUT;
            setReceipts([data]);
            setImagePreviews(['/images/demo-receipt.jpeg']);
            setReceiptData([{
                items: data.ocr_contents.items.map(item => ({ ...item })),
                taxes: data.ocr_contents.total_order_bill_details.taxes.map(tax => ({ ...tax })),
                discountType: 'none',
                discountValue: 0
            }]);
            setStep(2);
        } catch (err) {
            setError('Error loading demo: ' + err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const processReceipts = async () => {
        if (files.length === 0) {
            setError('Please select at least one file');
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            // Process all files in parallel, catching individual errors
            const results = await Promise.all(
                files.map(async (file, index) => {
                    try {
                        const formData = new FormData();
                        formData.append('file', file);

                        const response = await fetch(`${API_URL}/process-receipt`, {
                            method: 'POST',
                            body: formData
                        });

                        if (!response.ok) {
                            const errorData = await response.json();
                            return {
                                success: false,
                                error: errorData.detail || `Error processing ${file.name}`,
                                fileName: file.name,
                                index
                            };
                        }

                        const data = await response.json();
                        return { success: true, data, index };
                    } catch (err) {
                        return {
                            success: false,
                            error: err.message,
                            fileName: file.name,
                            index
                        };
                    }
                })
            );

            // Separate successful and failed results
            const successfulResults = results.filter(r => r.success);
            const failedResults = results.filter(r => !r.success);

            // If all failed, show error
            if (successfulResults.length === 0) {
                const errorMessages = failedResults.map(r => `${r.fileName}: ${r.error}`).join('; ');
                setError(`No valid receipts found. ${errorMessages}`);
                return;
            }

            // Filter out failed files from state
            const successIndices = new Set(successfulResults.map(r => r.index));
            const filteredFiles = files.filter((_, i) => successIndices.has(i));
            const filteredPreviews = imagePreviews.filter((_, i) => successIndices.has(i));

            // Update files/previews to only include successful ones
            setFiles(filteredFiles);
            setImagePreviews(filteredPreviews);

            // Set receipt data for successful results only
            setReceipts(successfulResults.map(r => r.data));
            setReceiptData(successfulResults.map(r => ({
                items: r.data.ocr_contents.items.map(item => ({ ...item })),
                taxes: r.data.ocr_contents.total_order_bill_details.taxes
                    ? r.data.ocr_contents.total_order_bill_details.taxes.map(tax => ({ ...tax }))
                    : [],
                discountType: 'none',
                discountValue: 0
            })));

            // Show warning about skipped files, but continue
            if (failedResults.length > 0) {
                const skippedNames = failedResults.map(r => r.fileName).join(', ');
                setError(`Skipped ${failedResults.length} file(s) (not valid receipts): ${skippedNames}`);
            }

            setStep(2);
        } catch (err) {
            setError('Error processing receipts: ' + err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-6 p-5 border border-indigo-100 rounded-lg bg-indigo-50">
            <h2 className="text-xl font-bold text-indigo-800">Upload Receipts</h2>

            <div className="border-2 border-dashed border-indigo-300 rounded-lg p-6 bg-white text-center hover:border-indigo-500 transition-colors">
                <input
                    type="file"
                    onChange={handleFileChange}
                    className="hidden"
                    id="file-upload"
                    multiple
                    accept="image/*"
                />
                <label htmlFor="file-upload" className="cursor-pointer">
                    <div className="space-y-2">
                        <svg className="w-12 h-12 mx-auto text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        <p className="text-indigo-700 font-medium">Click to select receipt images</p>
                        <p className="text-indigo-400 text-sm">
                            {files.length === 0 ? "No files selected" : `${files.length} file(s) selected`}
                        </p>
                    </div>
                </label>
            </div>

            {/* Selected files list */}
            {files.length > 0 && (
                <div className="space-y-2">
                    <h3 className="font-medium text-indigo-700">Selected Files:</h3>
                    <div className="flex flex-wrap gap-3">
                        {files.map((file, index) => (
                            <div key={index} className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-indigo-200">
                                <img
                                    src={imagePreviews[index]}
                                    alt={file.name}
                                    className="w-10 h-10 object-cover rounded"
                                />
                                <span className="text-sm text-gray-700 max-w-[150px] truncate">{file.name}</span>
                                <button
                                    onClick={() => removeFile(index)}
                                    className="text-red-500 hover:text-red-700 text-lg font-bold"
                                    aria-label={`Remove ${file.name}`}
                                >
                                    ×
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="flex flex-col md:flex-row gap-4">
                <button
                    onClick={processReceipts}
                    disabled={files.length === 0 || isLoading}
                    className={`flex-1 py-3 rounded-lg font-medium ${files.length === 0 || isLoading
                            ? 'bg-gray-300 text-gray-500'
                            : 'bg-indigo-600 text-white hover:bg-indigo-700'
                        } transition-colors`}
                >
                    {isLoading ? 'Processing...' : `Process ${files.length || ''} Receipt${files.length !== 1 ? 's' : ''}`}
                </button>

                <button
                    onClick={loadDemoData}
                    disabled={isLoading}
                    className="flex-1 py-3 rounded-lg font-medium bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
                >
                    Show Demo
                </button>
            </div>

            <div className="text-sm text-center text-gray-500 mt-2">
                <p>Select multiple receipt images to split bills from different orders</p>
            </div>
        </div>
    );
};

export default ReceiptUpload;
