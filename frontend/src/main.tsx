import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';
import './i18n';

const rootElement = document.getElementById('root');

if (rootElement) {
    createRoot(rootElement).render(<App />);
}
