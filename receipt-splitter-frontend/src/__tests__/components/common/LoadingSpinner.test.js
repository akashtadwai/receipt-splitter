import React from 'react';
import { render, screen } from '@testing-library/react';
import LoadingSpinner from 'src/components/common/LoadingSpinner';

describe('LoadingSpinner', () => {
    it('renders nothing when isLoading is false', () => {
        const { container } = render(<LoadingSpinner isLoading={false} />);
        expect(container.firstChild).toBeNull();
    });

    it('renders the spinner when isLoading is true', () => {
        render(<LoadingSpinner isLoading={true} />);

        expect(screen.getByText('Processing...')).toBeInTheDocument();
        expect(document.querySelector('svg')).toHaveClass('animate-spin');
    });

    it('renders a modal overlay', () => {
        render(<LoadingSpinner isLoading={true} />);

        const overlay = document.querySelector('.fixed.inset-0');
        expect(overlay).toBeInTheDocument();
        expect(overlay).toHaveClass('bg-black');
        expect(overlay).toHaveClass('bg-opacity-50');
    });
});
