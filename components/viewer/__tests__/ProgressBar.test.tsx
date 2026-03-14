import { render, screen } from '@testing-library/react';
import ProgressBar from '../ProgressBar';

describe('ProgressBar', () => {
  it('renders correctly with slide information', () => {
    render(<ProgressBar currentSlide={2} totalSlides={5} />);
    
    expect(screen.getByText('Slide 3 of 5')).toBeInTheDocument();
    expect(screen.getByText('60%')).toBeInTheDocument();
  });

  it('calculates progress correctly for first slide', () => {
    render(<ProgressBar currentSlide={0} totalSlides={10} />);
    
    expect(screen.getByText('Slide 1 of 10')).toBeInTheDocument();
    expect(screen.getByText('10%')).toBeInTheDocument();
  });

  it('calculates progress correctly for last slide', () => {
    render(<ProgressBar currentSlide={9} totalSlides={10} />);
    
    expect(screen.getByText('Slide 10 of 10')).toBeInTheDocument();
    expect(screen.getByText('100%')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(
      <ProgressBar currentSlide={0} totalSlides={5} className="custom-class" />
    );
    
    const progressBar = container.firstChild;
    expect(progressBar).toHaveClass('custom-class');
  });
});
