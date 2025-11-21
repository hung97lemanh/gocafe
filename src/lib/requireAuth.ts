import { GetServerSidePropsContext, GetServerSidePropsResult } from "next";
import { getSession } from "next-auth/react";

export function requireAuth<P extends { [key: string]: any } = { [key: string]: any }>(
  handler?: (
    ctx: GetServerSidePropsContext,
    session: any
  ) => Promise<GetServerSidePropsResult<P>>
) {
  return async (ctx: GetServerSidePropsContext) => {
    const session = await getSession({ req: ctx.req });
    const callbackUrl = encodeURIComponent(ctx.resolvedUrl || ctx.req.url || "/");
    if (!session) {
      return {
        redirect: {
          destination: `/api/auth/signin?callbackUrl=${callbackUrl}`,
          permanent: false,
        },
      };
    }

    if (handler) {
      return handler(ctx, session);
    }

    return { props: {} as P };
  };
}