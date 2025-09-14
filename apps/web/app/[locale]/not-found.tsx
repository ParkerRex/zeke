/**
 * Global not found page
 */

import { FileQuestion } from 'lucide-react';
import { EmptyState } from '../../components/layout';

export default function NotFound() {
  return (
    <div className="container mx-auto">
      <EmptyState
        icon={FileQuestion}
        title="Page Not Found"
        description="The page you're looking for doesn't exist or may have been moved."
        action={{
          label: 'Go Home',
          href: '/',
        }}
      />
    </div>
  );
}
