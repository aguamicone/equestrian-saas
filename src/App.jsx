import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { DataProvider } from './context/DataContext';
import { NotificationProvider } from './context/NotificationContext';
import Login from './pages/Login';

// Super Admin
import SuperAdminDashboard from './pages/dashboards/SuperAdminDashboard';
import TenantManager from './pages/admin/TenantManager';

// Tenant Admin
import TenantAdminDashboard from './pages/dashboards/TenantAdminDashboard';
import RequestsCenter from './pages/tenant/RequestsCenter';
import SpaceGrid from './components/spaces/SpaceGrid';
import HorseManagement from './pages/tenant/HorseManagement';
import RoutineManagement from './pages/tenant/RoutineManagement';
import FinanceOverview from './pages/tenant/FinanceOverview';
import DebtorsDashboard from './pages/tenant/DebtorsDashboard';
import HealthManagement from './pages/tenant/HealthManagement';
import TenantSettings from './pages/tenant/Settings';
import StaffManagement from './pages/tenant/StaffManagement';
import ActivityLog from './pages/tenant/ActivityLog';
import SupplyRequests from './pages/tenant/SupplyRequests';
import InventoryManager from './pages/tenant/InventoryManager'; // Fix: Import added
import UserManagement from './pages/tenant/UserManagement';
import EventsManager from './pages/tenant/EventsManager';

// Client
import ClientDashboard from './pages/dashboards/ClientDashboard';
import HorseDetails from './pages/client/HorseDetails';
import MyHorses from './pages/client/MyHorses';
import ServiceRequest from './pages/client/ServiceRequest';
import BoxReservation from './pages/client/BoxReservation';
import ClientStaffView from './pages/client/ClientStaffView';
import ClientFinance from './pages/client/ClientFinance';
import Events from './pages/client/Events';

// Staff
import StaffDashboard from './pages/dashboards/StaffDashboard';
import TaskManager from './pages/staff/TaskManager';
import QuickLog from './pages/staff/QuickLog';
import StaffSupplies from './pages/staff/StaffSupplies';

import ProtectedRoute from './components/ProtectedRoute';
import SuperAdminLayout from './components/layout/SuperAdminLayout';
import TenantAdminLayout from './components/layout/TenantAdminLayout';
import ClientLayout from './components/layout/ClientLayout';
import StaffLayout from './components/layout/StaffLayout';

function App() {
    return (
        <NotificationProvider>
            <AuthProvider>
                <DataProvider>
                    <Router>
                        <Routes>
                            <Route path="/login" element={<Login />} />

                            {/* Super Admin Routes */}
                            <Route path="/admin" element={
                                <ProtectedRoute allowedRoles={['superAdmin']}>
                                    <SuperAdminLayout />
                                </ProtectedRoute>
                            }>
                                <Route index element={<SuperAdminDashboard />} />
                                <Route path="tenants" element={<TenantManager />} />
                            </Route>

                            {/* Tenant Admin Routes */}
                            <Route path="/tenant-admin" element={
                                <ProtectedRoute allowedRoles={['tenantAdmin']}>
                                    <TenantAdminLayout />
                                </ProtectedRoute>
                            }>
                                <Route index element={<TenantAdminDashboard />} />
                                <Route path="routines" element={<RoutineManagement />} />
                                <Route path="spaces" element={<SpaceGrid />} />
                                <Route path="horses" element={<HorseManagement />} />
                                <Route path="finance" element={<FinanceOverview />} />
                                <Route path="finance/debtors" element={<DebtorsDashboard />} />
                                <Route path="health" element={<HealthManagement />} />
                                <Route path="activity" element={<ActivityLog />} />
                                <Route path="staff" element={<StaffManagement />} />
                                <Route path="requests-center" element={<RequestsCenter />} />
                                <Route path="inventory" element={<InventoryManager />} />
                                <Route path="users" element={<UserManagement />} />
                                <Route path="events" element={<EventsManager />} />
                                <Route path="settings" element={<TenantSettings />} />
                            </Route>

                            {/* Client/Owner Routes */}
                            <Route path="/client" element={
                                <ProtectedRoute allowedRoles={['client']}>
                                    <ClientLayout />
                                </ProtectedRoute>
                            }>
                                <Route index element={<ClientDashboard />} />
                                <Route path="horses" element={<MyHorses />} />
                                <Route path="horses/:id" element={<HorseDetails />} />
                                <Route path="request" element={<ServiceRequest />} />
                                <Route path="reserve" element={<BoxReservation />} />
                                <Route path="staff" element={<ClientStaffView />} />
                                <Route path="finance" element={<ClientFinance />} />
                                <Route path="events" element={<Events />} />
                            </Route>

                            {/* Staff Routes */}
                            <Route path="/staff" element={
                                <ProtectedRoute allowedRoles={['staff']}>
                                    <StaffLayout />
                                </ProtectedRoute>
                            }>
                                <Route index element={<StaffDashboard />} />
                                <Route path="tasks" element={<TaskManager />} />
                                <Route path="log" element={<QuickLog />} />
                                <Route path="supplies" element={<StaffSupplies />} />
                                <Route path="events" element={<Events />} />
                            </Route>

                            <Route path="*" element={<Navigate to="/login" replace />} />
                        </Routes>
                    </Router>
                </DataProvider>
            </AuthProvider>
        </NotificationProvider>
    );
}

export default App;
