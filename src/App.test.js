import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import App from './App';

beforeEach(() => {
  window.history.replaceState(null, '', '/');
});

test('renders the presentation setup screen', () => {
  render(<App />);

  expect(screen.getByText('AIResQ ClimSols')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /begin presentation/i })).toBeInTheDocument();
});

test('restores the current slide from a one-based URL hash', () => {
  window.history.replaceState(null, '', '/#slide=9');

  render(<App />);

  expect(screen.getByTitle('Demo 3: Citizen Reports, Sensors')).toBeInTheDocument();
  expect(screen.getByText('9 / 17')).toBeInTheDocument();
});

test('writes the current slide to the URL hash while presenting', async () => {
  render(<App />);

  fireEvent.click(screen.getByRole('button', { name: /begin presentation/i }));
  expect(window.location.hash).toBe('#slide=1');

  fireEvent.keyDown(window, { key: 'ArrowRight' });

  await waitFor(() => {
    expect(window.location.hash).toBe('#slide=2');
  });
});
