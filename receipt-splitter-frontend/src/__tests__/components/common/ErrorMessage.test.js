import React from 'react';
import { render, screen } from '@testing-library/react';
import ErrorMessage from 'src/components/common/ErrorMessage';

describe('ErrorMessage', () => {
    it('renders nothing when no message is provided', () => {
        const { container } = render(<ErrorMessage message="" />);
        expect(container.firstChild).toBeNull();
    });

    it('renders nothing when message is null', () => {
        const { container } = render(<ErrorMessage message={null} />);
        expect(container.firstChild).toBeNull();
    });

    it('renders the error message when provided', () => {
        const errorMessage = 'This is an error message';
        render(<ErrorMessage message={errorMessage} />);

        expect(screen.getByText(errorMessage)).toBeInTheDocument();
        expect(screen.getByText(errorMessage).closest('div')).toHaveClass('bg-red-100');
    });

    it('renders HTML formatted error messages', () => {
        const errorMessage = '<strong>Bold Error</strong>';
        render(<ErrorMessage message={errorMessage} />);

        // Should render as plain text, not HTML
        expect(screen.getByText('<strong>Bold Error</strong>')).toBeInTheDocument();
    });
});
