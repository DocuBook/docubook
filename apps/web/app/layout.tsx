import type { Metadata } from "next";
import { ThemeProvider } from "@/components/ThemeProvider";
import { Navbar } from "@/components/Navbar";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { Footer } from "@/components/Footer";
import { SearchProvider } from "@/components/SearchContext";
import docuConfig from "@/docu.json";
import "@docsearch/css";
import "@/styles/algolia.css";
import "@/styles/override.css";
import "@/styles/globals.css";

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
          <SearchProvider>
            <Navbar id="main-navbar" />
            <main id="main-content" className="sm:container mx-auto w-[90vw] h-auto scroll-smooth">
              {children}
            </main>
            <Footer id="main-footer" />
          </SearchProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
