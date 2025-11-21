import AdminLayout from "../../components/AdminLayout";
import { withAuth } from "../../lib/withAuth";

function SystemSettingsPage() {
    return (
        <AdminLayout>
            <h1 className="text-2xl font-bold mb-4">Cấu hình hệ thống</h1>
            {/* Nội dung trang */}
        </AdminLayout>
    );
}

export default withAuth(SystemSettingsPage);
