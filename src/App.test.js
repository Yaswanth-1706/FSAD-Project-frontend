import { render, screen } from '@testing-library/react';
import App from './App';

test('renders app title', () => {
  render(<App />);
  const titleElement = screen.getByText(/student project management system/i);
  expect(titleElement).toBeInTheDocument();
});
