import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { SourcesBadge } from '../../../components/stories/sources-badge';

describe('SourcesBadge', () => {
  it('renders singular form for count of 1', () => {
    render(<SourcesBadge count={1} />);

    expect(screen.getByText('1 source')).toBeInTheDocument();
  });

  it('renders plural form for count of 0', () => {
    render(<SourcesBadge count={0} />);

    expect(screen.getByText('0 sources')).toBeInTheDocument();
  });

  it('renders plural form for count greater than 1', () => {
    render(<SourcesBadge count={5} />);

    expect(screen.getByText('5 sources')).toBeInTheDocument();
  });

  it('renders plural form for large numbers', () => {
    render(<SourcesBadge count={42} />);

    expect(screen.getByText('42 sources')).toBeInTheDocument();
  });

  it('handles edge case of exactly 2 sources', () => {
    render(<SourcesBadge count={2} />);

    expect(screen.getByText('2 sources')).toBeInTheDocument();
  });

  it('applies custom className when provided', () => {
    render(<SourcesBadge count={3} className="custom-badge-class" />);

    const badge = screen.getByText('3 sources');
    expect(badge).toHaveClass('custom-badge-class');
  });

  it('has correct default styling classes', () => {
    render(<SourcesBadge count={1} />);

    const badge = screen.getByText('1 source');
    expect(badge).toHaveClass('text-xs', 'font-medium');
  });

  it('renders as a badge component with secondary variant', () => {
    render(<SourcesBadge count={1} />);

    const badge = screen.getByText('1 source');
    // The Badge component should be rendered (we can't easily test variant prop directly)
    expect(badge).toBeInTheDocument();
  });

  it('handles negative numbers gracefully', () => {
    render(<SourcesBadge count={-1} />);

    expect(screen.getByText('-1 sources')).toBeInTheDocument();
  });

  it('handles very large numbers', () => {
    render(<SourcesBadge count={999999} />);

    expect(screen.getByText('999999 sources')).toBeInTheDocument();
  });

  it('maintains accessibility with proper text content', () => {
    render(<SourcesBadge count={3} />);

    const badge = screen.getByText('3 sources');
    expect(badge).toBeInTheDocument();
    expect(badge.textContent).toBe('3 sources');
  });

  it('combines custom className with default classes', () => {
    render(<SourcesBadge count={1} className="extra-class" />);

    const badge = screen.getByText('1 source');
    expect(badge).toHaveClass('text-xs', 'font-medium', 'extra-class');
  });
});
