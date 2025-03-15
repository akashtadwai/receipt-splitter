import React from 'react';

const Results = ({ results, goToStep, resetApp }) => {
    return (
        <div className="space-y-6">
            <h2 className="text-xl font-bold text-indigo-800">Payment Breakdown</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {results.breakdown.map((item, index) => (
                    <div key={index} className="p-4 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-lg shadow-md">
                        <p className="text-xl font-bold">{item.person}</p>
                        <p className="text-3xl font-bold mt-2">₹{item.amount.toFixed(2)}</p>
                    </div>
                ))}
            </div>

            <div className="flex justify-between mt-6">
                <button
                    onClick={() => goToStep(3)}
                    className="bg-gray-200 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                >
                    Back
                </button>
                <button
                    onClick={resetApp}
                    className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-medium"
                >
                    Start New Split
                </button>
            </div>
        </div>
    );
};

export default Results;
