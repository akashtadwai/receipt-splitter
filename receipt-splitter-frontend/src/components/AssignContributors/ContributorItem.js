import React from 'react';

const ContributorItem = ({
    item,
    itemIndex,
    personsList,
    toggleContributor,
    toggleCustomAmounts,
    handleCustomAmountChange,
    validateCustomAmounts,
    toggleAllContributors,
    colorScheme = 'indigo', // Default color
    itemType = 'Item'       // Default type label
}) => {
    // Define color classes based on colorScheme prop
    const colorClasses = {
        indigo: {
            border: 'border-indigo-200',
            bg: 'bg-indigo-50',
            text: 'text-indigo-900',
            secondaryText: 'text-indigo-800',
            buttonBg: 'bg-indigo-100',
            buttonText: 'text-indigo-800',
            buttonHover: 'hover:bg-indigo-200',
            checkbox: 'text-indigo-600 border-indigo-300 focus:ring-indigo-500',
            input: 'border-indigo-200 focus:ring-indigo-500 focus:border-indigo-500',
            valueText: 'text-indigo-600',
            totalText: 'text-indigo-800'
        },
        amber: {
            border: 'border-amber-200',
            bg: 'bg-amber-50',
            text: 'text-amber-900',
            secondaryText: 'text-amber-800',
            buttonBg: 'bg-amber-100',
            buttonText: 'text-amber-800',
            buttonHover: 'hover:bg-amber-200',
            checkbox: 'text-amber-600 border-amber-300 focus:ring-amber-500',
            input: 'border-amber-200 focus:ring-amber-500 focus:border-amber-500',
            valueText: 'text-amber-600',
            totalText: 'text-amber-800'
        },
        green: {
            border: 'border-green-200',
            bg: 'bg-green-50',
            text: 'text-green-900',
            secondaryText: 'text-green-800',
            buttonBg: 'bg-green-100',
            buttonText: 'text-green-800',
            buttonHover: 'hover:bg-green-200',
            checkbox: 'text-green-600 border-green-300 focus:ring-green-500',
            input: 'border-green-200 focus:ring-green-500 focus:border-green-500',
            valueText: 'text-green-600',
            totalText: 'text-green-800'
        }
    }[colorScheme];

    return (
        <div className={`p-4 ${colorClasses.border} rounded-lg ${colorClasses.bg} mb-3`}>
            <div className="flex justify-between items-center mb-2">
                <h3 className={`font-semibold ${colorClasses.text}`}>{item.item_name}</h3>
                <p className={`font-medium ${colorClasses.secondaryText}`}>₹{item.price.toFixed(2)}</p>
            </div>

            {/* Toggle All Button */}
            <button
                onClick={() => toggleAllContributors(itemIndex)}
                className={`mb-3 text-xs ${colorClasses.buttonBg} ${colorClasses.buttonText} px-2 py-1 rounded ${colorClasses.buttonHover}`}
            >
                {personsList.every(person => item.contributors.hasOwnProperty(person))
                    ? "Deselect All"
                    : "Select All"}
            </button>

            <div className="flex items-center mb-3">
                <label className={`flex items-center ${colorClasses.secondaryText}`}>
                    <input
                        type="checkbox"
                        checked={item.useCustomAmounts}
                        onChange={() => toggleCustomAmounts(itemIndex)}
                        className={`mr-2 h-4 w-4 ${colorClasses.checkbox} rounded`}
                    />
                    Use custom amounts
                </label>
            </div>

            <div className="space-y-2">
                {personsList.map((person) => (
                    <div key={person} className="flex items-center justify-between bg-white p-2 rounded-lg">
                        <label className="flex items-center flex-1">
                            <input
                                type="checkbox"
                                checked={item.contributors.hasOwnProperty(person)}
                                onChange={() => toggleContributor(itemIndex, person)}
                                className={`mr-2 h-4 w-4 ${colorClasses.checkbox} rounded`}
                            />
                            <span className={colorClasses.text}>{person}</span>
                        </label>
                        {item.useCustomAmounts && item.contributors.hasOwnProperty(person) && (
                            <input
                                type="number"
                                step="0.01"
                                value={item.contributors[person]}
                                onChange={(e) => handleCustomAmountChange(itemIndex, person, e.target.value)}
                                className={`w-24 p-1 ${colorClasses.input} rounded`}
                            />
                        )}
                        {!item.useCustomAmounts && item.contributors.hasOwnProperty(person) && (
                            <span className={colorClasses.valueText}>₹{item.contributors[person].toFixed(2)}</span>
                        )}
                    </div>
                ))}
            </div>

            {item.useCustomAmounts && (
                <div className="mt-2 space-y-1">
                    <div className="flex justify-between text-sm">
                        <span className={colorClasses.totalText}>Total assigned:</span>
                        <span className={`font-medium ${validateCustomAmounts(itemIndex) ? 'text-green-600' : 'text-red-600'}`}>
                            ₹{Object.values(item.contributors)
                                .reduce((sum, amount) => {
                                    const numAmount = amount === '' ? 0 : parseFloat(amount) || 0;
                                    return sum + numAmount;
                                }, 0)
                                .toFixed(2)} / ₹{item.price.toFixed(2)}
                        </span>
                    </div>
                    {!validateCustomAmounts(itemIndex) && (
                        <div className="flex justify-between text-sm">
                            <span className={colorClasses.totalText}>Remaining to allocate:</span>
                            <span className="font-medium text-amber-600">
                                ₹{(item.price - Object.values(item.contributors)
                                    .reduce((sum, amount) => {
                                        const numAmount = amount === '' ? 0 : parseFloat(amount) || 0;
                                        return sum + numAmount;
                                    }, 0))
                                    .toFixed(2)}
                            </span>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default ContributorItem;
