import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { StoryCard } from '../../../components/stories/story-card';
import { createMockStory, createMockStoryWithKind, createMockStoryWithChili } from '../../utils';

// Mock the stories-utils functions
vi.mock('../../../lib/stories-utils', () => ({
  deterministicPercent: vi.fn(() => 75),
  domainFromUrl: vi.fn(() => 'example.com'),
  getKindLabel: vi.fn((kind) => {
    if (kind === 'youtube') return 'Video';
    if (kind === 'arxiv') return 'Research';
    return 'AI';
  }),
  hypePercent: vi.fn(() => 60),
  imageFor: vi.fn(() => '/hero-shape.png'),
  MIN_SOURCES_COUNT: 3,
}));

describe('StoryCard', () => {
  it('renders story title and basic information', () => {
    const story = createMockStory({
      title: 'Test Story Title',
      embedKind: 'article',
    });

    render(<StoryCard story={story} />);

    expect(screen.getByText('Test Story Title')).toBeInTheDocument();
    expect(screen.getByText('AI, example.com')).toBeInTheDocument();
  });

  it('renders with different variants', () => {
    const story = createMockStory();

    const { rerender } = render(<StoryCard story={story} variant="default" />);
    
    // Default variant should have larger text
    let titleElement = screen.getByText(story.title);
    expect(titleElement).toHaveClass('text-base');

    rerender(<StoryCard story={story} variant="compact" />);
    
    // Compact variant should have smaller text
    titleElement = screen.getByText(story.title);
    expect(titleElement).toHaveClass('text-sm');
  });

  it('shows coverage bar by default', () => {
    const story = createMockStory();
    render(<StoryCard story={story} />);

    // Should show coverage bar (not hype bar)
    expect(document.querySelector('.h-full.bg-primary')).toBeInTheDocument();
  });

  it('shows hype bar when showHype is true', () => {
    const story = createMockStoryWithChili(4);
    render(<StoryCard story={story} showHype={true} />);

    // Should show hype bar with appropriate styling
    expect(document.querySelector('.h-full')).toBeInTheDocument();
  });

  it('renders story link with correct href', () => {
    const story = createMockStory({ id: 'test-story-123' });
    render(<StoryCard story={story} />);

    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/stories/test-story-123');
  });

  it('displays sources badge with minimum count', () => {
    const story = createMockStory({
      overlays: {
        whyItMatters: 'Test',
        chili: 3,
        confidence: 85,
        sources: [{ title: 'Source 1', url: 'https://example.com', domain: 'example.com' }],
      },
    });

    render(<StoryCard story={story} />);

    // Should show minimum sources count (3) even if actual sources is less
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('handles different embed kinds correctly', () => {
    const youtubeStory = createMockStoryWithKind('youtube');
    const { rerender } = render(<StoryCard story={youtubeStory} />);

    expect(screen.getByText('Video, example.com')).toBeInTheDocument();

    const arxivStory = createMockStoryWithKind('arxiv');
    rerender(<StoryCard story={arxivStory} />);

    expect(screen.getByText('Research, example.com')).toBeInTheDocument();
  });

  it('conditionally renders image based on showImage prop', () => {
    const story = createMockStory();

    const { rerender } = render(<StoryCard story={story} showImage={true} />);
    expect(screen.getByAltText(story.title)).toBeInTheDocument();

    rerender(<StoryCard story={story} showImage={false} />);
    expect(screen.queryByAltText(story.title)).not.toBeInTheDocument();
  });

  it('conditionally renders timestamp based on showTimestamp prop', () => {
    const story = createMockStory();

    const { rerender } = render(<StoryCard story={story} showTimestamp={true} />);
    expect(screen.getByText('1 hour ago')).toBeInTheDocument();

    rerender(<StoryCard story={story} showTimestamp={false} />);
    expect(screen.queryByText('1 hour ago')).not.toBeInTheDocument();
  });

  it('applies custom className when provided', () => {
    const story = createMockStory();
    render(<StoryCard story={story} className="custom-story-card" />);

    const card = document.querySelector('.custom-story-card');
    expect(card).toBeInTheDocument();
  });

  it('handles compact variant styling correctly', () => {
    const story = createMockStory();
    render(<StoryCard story={story} variant="compact" />);

    // Compact variant should have different padding and image height
    expect(document.querySelector('.p-2')).toBeInTheDocument();
    expect(document.querySelector('.h-\\[100px\\]')).toBeInTheDocument();
  });

  it('handles missing overlays gracefully', () => {
    const story = createMockStory({
      overlays: {
        whyItMatters: 'Test',
        chili: 0,
        confidence: 0,
        sources: [],
      },
    });

    render(<StoryCard story={story} />);

    // Should still render without crashing
    expect(screen.getByText(story.title)).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument(); // MIN_SOURCES_COUNT
  });
});
