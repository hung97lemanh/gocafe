import { useEffect } from "react";
import { useRouter } from "next/router";

export default function AdminIndex() {
    const router = useRouter();

    useEffect(() => {
        router.replace("/admin/orders");
    }, [router]);

    return null; // hoặc có thể trả về spinner nếu muốn
}
