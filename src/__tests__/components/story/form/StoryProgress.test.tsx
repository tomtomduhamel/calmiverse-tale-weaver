
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StoryProgress } from '@/components/story/form/StoryProgress';

describe('StoryProgress', () => {
  it('should not render when isSubmitting is false', () => {
    const { container } = render(
      <StoryProgress isSubmitting={false} progress={50} />
    );
    
    expect(container.firstChild).toBeNull();
  });
  
  it('should render progress bar and starting message when progress is low', () => {
    render(
      <StoryProgress isSubmitting={true} progress={15} />
    );
    
    expect(screen.getByText(/Starting story generation/i)).toBeInTheDocument();
    expect(screen.getByText('15%')).toBeInTheDocument();
  });
  
  it('should render progress bar and creation message when progress is medium', () => {
    render(
      <StoryProgress isSubmitting={true} progress={40} />
    );
    
    expect(screen.getByText(/Creating characters/i)).toBeInTheDocument();
    expect(screen.getByText('40%')).toBeInTheDocument();
  });
  
  it('should render progress bar and writing message when progress is high', () => {
    render(
      <StoryProgress isSubmitting={true} progress={70} />
    );
    
    expect(screen.getByText(/Writing your personalized story/i)).toBeInTheDocument();
    expect(screen.getByText('70%')).toBeInTheDocument();
  });
  
  it('should render progress bar and finalizing message when progress is very high', () => {
    render(
      <StoryProgress isSubmitting={true} progress={90} />
    );
    
    expect(screen.getByText(/Finalizing your story/i)).toBeInTheDocument();
    expect(screen.getByText('90%')).toBeInTheDocument();
  });
  
  it('should cap percentage display at 99%', () => {
    render(
      <StoryProgress isSubmitting={true} progress={105} />
    );
    
    expect(screen.getByText('99%')).toBeInTheDocument();
  });
});
