import AdminLayout from "../../components/AdminLayout";
import { withAuth } from "../../lib/withAuth";

function ReportsPage() {
    return (
        <AdminLayout>
            <h1 className="text-2xl font-bold mb-4">Báo cáo</h1>
            {/* Nội dung trang */}
        </AdminLayout>
    );
}

export default withAuth(ReportsPage);
