import { Link } from 'react-router-dom';
import { useTitle } from '../lib/useTitle';

export default function NotFoundPage() {
  useTitle('Not found');
  return (
    <div>
      <h1>Not found</h1>
      <p>
        <Link to="/">Back to the labs</Link>
      </p>
    </div>
  );
}
