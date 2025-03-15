import React from 'react';
import { render, fireEvent, screen, within } from '@testing-library/react';
import StepsIndicator from 'src/components/StepsIndicator';

describe('StepsIndicator', () => {
    const mockGoToStep = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders all step indicators', () => {
        render(<StepsIndicator currentStep={1} goToStep={mockGoToStep} />);
        // Current step (1) should be highlighted
        const stepOne = screen.getByText('1');
        expect(stepOne.closest('div')).toHaveClass('bg-indigo-600');
    });

    it('only allows going back to previous steps', () => {
        render(<StepsIndicator currentStep={3} goToStep={mockGoToStep} />);

        // Step 1 and 2 should be clickable (completed)
        const stepOne = within(screen.getAllByText('✓')[0].closest('.flex.items-center')).getByText('✓');
        fireEvent.click(stepOne);
        expect(mockGoToStep).toHaveBeenCalledWith(1);

        // Step 3 (current) should not trigger goToStep when clicked
        const stepThree = screen.getByText('3');
        fireEvent.click(stepThree);
        expect(mockGoToStep).toHaveBeenCalledTimes(1); // still just the one call

        // Step 4 (future) should not trigger goToStep when clicked
        const stepFour = screen.getByText('4');
        fireEvent.click(stepFour);
        expect(mockGoToStep).toHaveBeenCalledTimes(1); // still just the one call
    });

    it('shows checkmarks for completed steps', () => {
        render(<StepsIndicator currentStep={4} goToStep={mockGoToStep} />);

        // Steps 1, 2, and 3 should show checkmarks
        const checkmarks = screen.getAllByText('✓');
        expect(checkmarks).toHaveLength(3);

        // Step 4 should show the number 4
        expect(screen.getByText('4')).toBeInTheDocument();
    });
});
