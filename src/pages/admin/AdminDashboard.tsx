import DashboardOverview from '../../component/DashboardOverview';

const AdminDashboard = () => (
  <DashboardOverview basePath="/admin" isSuperAdmin={false} />
);

export default AdminDashboard;
