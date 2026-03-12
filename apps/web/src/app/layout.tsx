import './globals.css';

export const metadata = {
    title: 'G-DX UI',
    description: 'G-DX Application',
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="ja">
            <body>{children}</body>
        </html>
    );
}