import type { Metadata } from "next";
import { ThemeProvider } from "@/components/contexts/theme-provider";
import { Navbar } from "@/components/navbar";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { Footer } from "@/components/footer";
import docuConfig from "@/docu.json";
import { Toaster } from "@/components/ui/sonner";
import "@/styles/globals.css";
import "@/styles/algolia.css";

const { meta } = docuConfig;

// Default Metadata
const defaultMetadata: Metadata = {
  metadataBase: new URL(meta.baseURL),
  description: meta.description,
  title: meta.title,
  icons: {
    icon: meta.favicon,
  },
  openGraph: {
    title: meta.title,
    description: meta.description,
    images: [
      {
        url: new URL("/images/og-image.png", meta.baseURL).toString(),
        width: 1200,
        height: 630,
        alt: String(meta.title),
      },
    ],
    locale: "en_US",
    type: "website",
  },
};

// Dynamic Metadata Getter
export function getMetadata({
  title,
  description,
  image,
}: {
  title?: string;
  description?: string;
  image?: string;
}): Metadata {
  const ogImage = image ? new URL(`/images/${image}`, meta.baseURL).toString() : undefined;

  return {
    ...defaultMetadata,
    title: title ? `${title}` : defaultMetadata.title,
    description: description || defaultMetadata.description,
    openGraph: {
      ...defaultMetadata.openGraph,
      title: title || defaultMetadata.openGraph?.title,
      description: description || defaultMetadata.openGraph?.description,
      images: ogImage ? [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: String(title || defaultMetadata.openGraph?.title),
        },
      ] : defaultMetadata.openGraph?.images,
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${GeistSans.variable} ${GeistMono.variable} font-regular antialiased`}
        suppressHydrationWarning
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <Navbar />
          <main className="sm:container mx-auto w-[90vw] h-auto scroll-smooth">
            {children}
          </main>
          <Footer />
          <Toaster position="top-center" />
        </ThemeProvider>
      </body>
    </html>
  );
}
