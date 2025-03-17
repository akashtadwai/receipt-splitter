import React, { useRef, useState } from 'react';

const Results = ({ results, goToStep, resetApp, itemSplits, calculateCurrentTotal }) => {
    const textAreaRef = useRef(null);
    const [copied, setCopied] = useState(false);

    const generateReceiptText = () => {
        const lines = [];
        lines.push('Receipt Breakdown:\n');

        // Add items
        itemSplits.forEach(item => {
            if (item.isItem) {
                lines.push(`${item.item_name}: ₹${item.price.toFixed(2)}`);
            }
        });

        // Add taxes
        itemSplits.forEach(item => {
            if (item.isTax) {
                lines.push(`${item.item_name}: ₹${item.price.toFixed(2)}`);
            }
        });

        // Add discount if present
        itemSplits.forEach(item => {
            if (item.isDiscount) {
                lines.push(`${item.item_name}: ₹${item.price.toFixed(2)}`);
            }
        });

        lines.push(`\nTotal Bill: ₹${calculateCurrentTotal().toFixed(2)}`);

        // Add individual splits
        lines.push('\nSplit Breakdown:');
        results.breakdown.forEach(({ person, amount }) => {
            lines.push(`${person}: ₹${amount.toFixed(2)}`);
        });

        lines.push('\nContribution Table:');

        const persons = results.breakdown.map(b => b.person);
        const maxItemLength = Math.max(...itemSplits.map(item => item.item_name.length), 'Item'.length);
        const columnWidth = Math.max(...persons.map(p => p.length));

        // Helper function to center text in a given width
        const centerText = (text, width) => {
            const padding = width - text.length;
            const leftPad = Math.floor(padding / 2);
            const rightPad = padding - leftPad;
            return ' '.repeat(leftPad) + text + ' '.repeat(rightPad);
        };

        // Create table border line
        const tableBorder = '+' + '-'.repeat(maxItemLength + 2) + '+' +
            persons.map(() => '-'.repeat(columnWidth + 2) + '+').join('');

        // Header row
        lines.push(tableBorder);
        lines.push(
            '| ' + centerText('Item', maxItemLength) + ' |' +
            persons.map(p => centerText(p, columnWidth + 2) + '|').join('')
        );
        lines.push(tableBorder);

        // Data rows
        itemSplits.forEach(item => {
            if (item.isItem || item.isTax) {
                const rowCells = persons.map(person =>
                    centerText(item.contributors.hasOwnProperty(person) ? '✓' : '×', columnWidth + 2) + '|'
                );
                lines.push(
                    '| ' + centerText(item.item_name, maxItemLength) + ' |' +
                    rowCells.join('')
                );
                lines.push(tableBorder);
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

                {/* Individual splits with cards */}
                <div className="p-6 bg-gradient-to-b from-indigo-50/50">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        {results.breakdown.map(({ person, amount }) => (
                            <div key={person}
                                className="bg-white p-4 rounded-xl shadow-sm border border-indigo-100 hover:shadow-md transition-shadow">
                                <div className="text-sm text-indigo-600 font-medium mb-1">{person}</div>
                                <div className="text-2xl font-bold text-gray-900">₹{amount.toFixed(2)}</div>
                            </div>
                        ))}
                    </div>

                    {/* Receipt Details */}
                    <div className="bg-white rounded-xl shadow-sm border border-indigo-100 p-4 relative">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
                            <h3 className="text-lg font-semibold text-gray-900 mb-2 sm:mb-0">Receipt Details</h3>
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