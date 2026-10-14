import { Link } from 'react-router-dom';
import { EmptyState } from '../components/common/StatusMessage.jsx';

export default function NotFoundPage() {
  return (
    <div className="page">
      <EmptyState
        icon="info"
        title="Page not found"
        message="The page you were looking for does not exist."
        action={<Link className="btn btn--primary" to="/">Back to Dashboard</Link>}
      />
    </div>
  );
}
