import "@/styles/globals.css";
import { SessionProvider } from "next-auth/react";
import type { AppProps } from "next/app";
import Head from "next/head";

export default function App({ Component, pageProps: { session, ...pageProps } }: AppProps) {
    return (
        <>
            <SessionProvider session={session}>
                <Head>
                    <link rel="icon" href="/image/favicon.png" />
                    {/* Nếu bạn dùng favicon.png thì thay bằng /favicon.png */}

                    <meta
                        name="description"
                        content="Chào mừng đến với Go Cafe, nơi bạn có thể tìm thấy sự bình yên giữa lòng thành phố nhộn nhịp. Chúng tôi tự hào mang đến không gian Vintage ấm cúng, gần gũi với thiên nhiên và những món đồ uống, đồ ăn kèm hấp dẫn."
                    />
                </Head>
                <Component {...pageProps} />
            </SessionProvider>
        </>
    );
}
