import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import { useEffect } from "react";

export function withAuth(Component: any) {
    return function ProtectedRoute(props: any) {
        const { data: session, status } = useSession();
        const router = useRouter();

        useEffect(() => {
            if (status === "loading") return;
            
            if (!session) {
                router.push("/auth/login");
            }
        }, [session, status, router]);

        if (status === "loading") {
            return (
				<>
                <div className="min-h-screen flex items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
                </div>
				</>
            );
        }

        if (!session) {
            return null;
        }

        return <Component {...props} />;
    };
}