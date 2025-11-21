import { useEffect } from "react";
import { useRouter } from "next/router";
import { withAuth } from "../../lib/withAuth";

function AdminIndex() {
    const router = useRouter();

    useEffect(() => {
        router.replace("/admin/orders");
    }, [router]);

    return null;
}

export default withAuth(AdminIndex);
