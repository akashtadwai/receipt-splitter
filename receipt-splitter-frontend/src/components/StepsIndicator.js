import React from 'react';

const StepsIndicator = ({ currentStep, goToStep }) => {
    return (
        <div className="flex justify-center mb-8">
            {[1, 2, 3, 4].map((num) => (
                <div key={num} className="flex items-center">
                    <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center font-bold cursor-pointer ${currentStep === num
                                ? 'bg-indigo-600 text-white'
                                : currentStep > num
                                    ? 'bg-green-500 text-white'
                                    : 'bg-gray-200 text-gray-600'
                            }`}
                        onClick={() => num < currentStep && goToStep(num)} // Only allow going back, not forward
                    >
                        {currentStep > num ? '✓' : num}
                    </div>
                    {num < 4 && <div className={`h-1 w-10 ${currentStep > num ? 'bg-green-500' : 'bg-gray-200'}`}></div>}
                </div>
            ))}
        </div>
    );
};

export default StepsIndicator;
