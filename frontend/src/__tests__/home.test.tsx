import { render, screen } from '@testing-library/react';
import Home from '../pages';

describe('Home', () => {
  it('renders', () => {
    render(<Home />);
    expect(screen.getByText(/Casapp/)).toBeInTheDocument();
  });
});
