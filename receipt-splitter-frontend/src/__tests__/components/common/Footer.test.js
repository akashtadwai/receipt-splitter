import React from 'react';
import { render, screen } from '@testing-library/react';
import Footer from 'src/components/common/Footer';

describe('Footer', () => {
    it('renders correctly with credits and GitHub link', () => {
        render(<Footer />);

        expect(screen.getByText(/Powered by Claude & Mistral AI/)).toBeInTheDocument();
        const githubLink = screen.getByRole('link');
        expect(githubLink).toHaveAttribute('href', 'https://github.com/akashtadwai/receipt-splitter');
        expect(githubLink).toHaveAttribute('target', '_blank');
    });

    it('has accessibility attributes', () => {
        render(<Footer />);

        const githubLink = screen.getByRole('link');
        expect(githubLink).toHaveAttribute('rel', 'noopener noreferrer');
        expect(githubLink).toHaveAttribute('aria-label', 'View source code on GitHub');
    });
});
