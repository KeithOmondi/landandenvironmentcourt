import { Heart } from 'lucide-react';

const SuperAdminTributes = () => (
  <div className="mx-auto max-w-2xl py-16 text-center">
    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 text-amber-700">
      <Heart className="h-7 w-7" />
    </div>
    <h1>Tributes</h1>
    <p className="mt-2 text-sm text-gray-500">
      Tributes management isn't available yet. This section will let you publish
      tributes to serving and retired judicial officers once the feature is connected.
    </p>
  </div>
);

export default SuperAdminTributes;
