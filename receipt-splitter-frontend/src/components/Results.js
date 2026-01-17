import React, { useRef, useState } from 'react';

const Results = ({
    results,
    goToStep,
    resetApp,
    itemSplits,
    calculateCurrentTotal,
    receiptData,
    receiptPayers,
    setReceiptPayer,
    personsList,
    calculateReceiptTotal
}) => {
    const textAreaRef = useRef(null);
    const [copied, setCopied] = useState(false);

    // Calculate totals paid by each person
    const calculatePaidTotals = () => {
        const paidTotals = {};
        personsList.forEach(p => paidTotals[p] = 0);

        receiptData.forEach((_, index) => {
            const payer = receiptPayers[index];
            if (payer) {
                paidTotals[payer] = (paidTotals[payer] || 0) + calculateReceiptTotal(index);
            }
        });
        return paidTotals;
    };

    const paidTotals = calculatePaidTotals();

    const generateReceiptText = () => {
        const lines = [];

        // Check if multiple receipts
        const hasMultipleReceipts = itemSplits.some(item => item.receiptIndex > 0);
        const formatReceiptTag = (index) => hasMultipleReceipts ? ` [R${index + 1}]` : '';

        // Start with Total Bill
        lines.push('Total Bill: ₹' + calculateCurrentTotal().toFixed(2));

        // Payment Summary
        lines.push('\nPayment Summary:');
        receiptData.forEach((_, index) => {
            const payer = receiptPayers[index] || 'Unassigned';
            const total = calculateReceiptTotal(index).toFixed(2);
            lines.push(`Receipt ${index + 1} (₹${total}): Paid by ${payer}`);
        });

        // Total Paid per person
        /* Only show if payers are assigned */
        if (Object.keys(receiptPayers).length > 0) {
            Object.entries(paidTotals).forEach(([person, amount]) => {
                if (amount > 0) {
                    lines.push(`Total Paid by ${person}: ₹${amount.toFixed(2)}`);
                }
            });
        }

        // Add Split Breakdown (Consumption)
        lines.push('\nConsumption Breakdown (Split):');
        results.breakdown.forEach(({ person, amount }) => {
            lines.push(`${person}: ₹${amount.toFixed(2)}`);
        });

        // Add Contribution List header
        lines.push('\nContribution List:');

        // Add items with contributors
        itemSplits.forEach(item => {
            if (item.isItem) {
                const receiptTag = formatReceiptTag(item.receiptIndex);
                lines.push(`\n${item.item_name}${receiptTag}: ₹${(parseFloat(item.price) || 0).toFixed(2)}`);
                const contributors = Object.entries(item.contributors)
                    .map(([person, amount]) => `  • ${person}: ₹${(parseFloat(amount) || 0).toFixed(2)}`)
                    .join('\n');
                if (contributors) {
                    lines.push(contributors);
                }
            }
        });

        // Add taxes with contributors
        itemSplits.forEach(item => {
            if (item.isTax) {
                const receiptTag = formatReceiptTag(item.receiptIndex);
                lines.push(`\n${item.item_name}${receiptTag}: ₹${(parseFloat(item.price) || 0).toFixed(2)}`);
                const contributors = Object.entries(item.contributors)
                    .map(([person, amount]) => `  • ${person}: ₹${(parseFloat(amount) || 0).toFixed(2)}`)
                    .join('\n');
                if (contributors) {
                    lines.push(contributors);
                }
            }
        });

        // Add discount if present
        itemSplits.forEach(item => {
            if (item.isDiscount) {
                const receiptTag = formatReceiptTag(item.receiptIndex);
                lines.push(`\n${item.item_name}${receiptTag}: ₹${(parseFloat(item.price) || 0).toFixed(2)}`);
                const contributors = Object.entries(item.contributors)
                    .map(([person, amount]) => `  • ${person}: ₹${(parseFloat(amount) || 0).toFixed(2)}`)
                    .join('\n');
                if (contributors) {
                    lines.push(contributors);
                }
            }
        });

        return lines.join('\n');
    };

    const handleCopy = async () => {
        if (textAreaRef.current) {
            try {
                await navigator.clipboard.writeText(textAreaRef.current.value);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000); // Reset copied state after 2 seconds
            } catch (err) {
                console.error('Failed to copy text: ', err);
                alert('Failed to copy text. Please try again.');
            }
        }
    };

    return (
        <div className="space-y-8">
            {/* Main Results Card */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-indigo-100">
                {/* Header with total amount */}
                <div className="bg-gradient-to-r from-indigo-600 to-indigo-800 px-6 py-8 text-white">
                    <h2 className="text-2xl font-bold mb-2">Final Split</h2>
                    <div className="text-4xl font-bold">₹{calculateCurrentTotal().toFixed(2)}</div>
                    <div className="text-indigo-200 mt-1">Total Bill Amount</div>
                </div>

                {/* Payer Selection Section */}
                <div className="px-6 py-4 bg-indigo-50 border-b border-indigo-100">
                    <h3 className="text-sm font-bold text-indigo-900 mb-3 uppercase tracking-wide">Who paid for what?</h3>
                    <div className="space-y-3">
                        {receiptData.map((_, index) => (
                            <div key={index} className="flex items-center justify-between bg-white p-3 rounded-lg border border-indigo-200">
                                <div className="flex flex-col">
                                    <span className="font-medium text-indigo-800">Receipt {index + 1}</span>
                                    <span className="text-xs text-indigo-500">₹{calculateReceiptTotal(index).toFixed(2)}</span>
                                </div>
                                <select
                                    value={receiptPayers[index] || ''}
                                    onChange={(e) => setReceiptPayer(index, e.target.value)}
                                    className="p-2 border border-indigo-300 rounded-md text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                >
                                    <option value="" disabled>Select payer</option>
                                    {personsList.map(person => (
                                        <option key={person} value={person}>{person}</option>
                                    ))}
                                </select>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Individual splits with cards */}
                <div className="p-6 bg-gradient-to-b from-indigo-50/50">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">
                        Consumption Breakdown
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        {results.breakdown.map(({ person, amount }) => (
                            <div key={person}
                                className="bg-white p-4 rounded-xl shadow-sm border border-indigo-100 hover:shadow-md transition-shadow">
                                <div className="text-sm text-indigo-600 font-medium mb-1">{person} consumed</div>
                                <div className="text-2xl font-bold text-gray-900">₹{amount.toFixed(2)}</div>
                                {(paidTotals[person] || 0) > 0 && (
                                    <div className="mt-2 text-xs text-green-600 font-medium border-t border-gray-100 pt-2">
                                        Paid: ₹{paidTotals[person].toFixed(2)}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Receipt Details */}
                    <div className="bg-white rounded-xl shadow-sm border border-indigo-100 p-4 relative">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
                            <div className="mb-2 sm:mb-0">
                                <h3 className="text-lg font-semibold text-gray-900">Receipt Details</h3>
                                <p className="text-xs text-gray-500">Copy this to Splitwise/WhatsApp</p>
                            </div>
                            <button
                                onClick={handleCopy}
                                className={`
                inline-flex items-center gap-2 px-4 py-2 rounded-lg
                ${copied ? 'bg-green-500' : 'bg-indigo-600'}
                text-white shadow-sm hover:shadow-md transition-all
                text-sm sm:text-base font-medium
            `}
                            >
                                {copied ? (
                                    <>
                                        <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                        <span>Copied!</span>
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                                d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                                        </svg>
                                        <span>Copy Details</span>
                                    </>
                                )}
                            </button>
                        </div>
                        <textarea
                            ref={textAreaRef}
                            className="w-full h-48 p-4 bg-gray-50 rounded-lg font-mono text-sm border-0 focus:ring-2 focus:ring-indigo-500 resize-none"
                            value={generateReceiptText()}
                            readOnly
                        />
                    </div>

                </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-between gap-4">
                <button
                    onClick={() => goToStep(3)}
                    className="flex-1 bg-white border border-indigo-200 text-indigo-600 px-6 py-3 rounded-xl 
                        hover:bg-indigo-50 transition-colors font-medium shadow-sm hover:shadow"
                >
                    ← Back to Edit
                </button>
                <button
                    onClick={resetApp}
                    className="flex-1 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white px-6 py-3 
                        rounded-xl hover:from-indigo-700 hover:to-indigo-800 transition-all font-medium 
                        shadow-sm hover:shadow-lg"
                >
                    Split Another Receipt →
                </button>
            </div>
        </div>
    );
};

export default Results;