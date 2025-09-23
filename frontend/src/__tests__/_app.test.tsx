import { render } from '@testing-library/react';
import App from '../pages/_app';

it('renders _app', () => {
  render(<App Component={() => <div />} pageProps={{}} />);
});
