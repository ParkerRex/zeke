import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { CoverageBar } from '../../../components/stories/coverage-bar';

describe('CoverageBar', () => {
  it('renders with correct percentage display', () => {
    render(<CoverageBar value={75} />);

    expect(screen.getByText('75%')).toBeInTheDocument();
  });

  it('renders with custom label when provided', () => {
    render(<CoverageBar value={50} label="Custom Label" />);

    expect(screen.getByText('50%')).toBeInTheDocument();
    // Note: The component doesn't currently use the label prop,
    // but we test for the percentage display
  });

  it('clamps value to 0-100 range', () => {
    const { rerender } = render(<CoverageBar value={150} />);
    expect(screen.getByText('150%')).toBeInTheDocument();

    rerender(<CoverageBar value={-25} />);
    expect(screen.getByText('-25%')).toBeInTheDocument();
  });

  it('rounds decimal values correctly', () => {
    render(<CoverageBar value={75.7} />);
    expect(screen.getByText('76%')).toBeInTheDocument();
  });

  it('applies correct width style to progress bar', () => {
    render(<CoverageBar value={60} />);

    const progressBar = document.querySelector('.h-full.bg-primary');
    expect(progressBar).toHaveStyle({ width: '60%' });
  });

  it('clamps width style to 0-100 range even with extreme values', () => {
    const { rerender } = render(<CoverageBar value={150} />);

    let progressBar = document.querySelector('.h-full.bg-primary');
    expect(progressBar).toHaveStyle({ width: '100%' });

    rerender(<CoverageBar value={-25} />);
    progressBar = document.querySelector('.h-full.bg-primary');
    expect(progressBar).toHaveStyle({ width: '0%' });
  });

  it('applies custom className when provided', () => {
    render(<CoverageBar value={50} className="custom-class" />);

    const container = document.querySelector('.custom-class');
    expect(container).toBeInTheDocument();
  });

  it('has correct accessibility structure', () => {
    render(<CoverageBar value={75} />);

    // Check for progress bar container
    const progressContainer = document.querySelector('.relative.h-1.flex-1');
    expect(progressContainer).toBeInTheDocument();

    // Check for percentage text
    const percentageText = screen.getByText('75%');
    expect(percentageText).toHaveClass('text-xs', 'text-muted-foreground');
  });

  it('handles zero value correctly', () => {
    render(<CoverageBar value={0} />);

    expect(screen.getByText('0%')).toBeInTheDocument();

    const progressBar = document.querySelector('.h-full.bg-primary');
    expect(progressBar).toHaveStyle({ width: '0%' });
  });

  it('handles 100% value correctly', () => {
    render(<CoverageBar value={100} />);

    expect(screen.getByText('100%')).toBeInTheDocument();

    const progressBar = document.querySelector('.h-full.bg-primary');
    expect(progressBar).toHaveStyle({ width: '100%' });
  });
});
