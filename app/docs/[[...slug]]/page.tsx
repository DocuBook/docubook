import { notFound } from "next/navigation";
import { getDocsForSlug, getDocsTocs } from "@/lib/markdown";
import DocsBreadcrumb from "@/components/docs-breadcrumb";
import Pagination from "@/components/pagination";
import Toc from "@/components/toc";
import { Typography } from "@/components/typography";
import EditThisPage from "@/components/edit-on-github";
import { formatDate2 } from "@/lib/utils";
import docuConfig from "@/docu.json";
import MobToc from "@/components/mob-toc";

const { meta } = docuConfig;

type PageProps = {
  params: Promise<{
    slug: string[];
  }>;
};

// Function to generate metadata dynamically
export async function generateMetadata(props: PageProps) {
  const params = await props.params;

  const {
    slug = []
  } = params;

  const pathName = slug.join("/");
  const res = await getDocsForSlug(pathName);

  if (!res) {
    return {
      title: "Page Not Found",
      description: "The requested page was not found.",
    };
  }

  const { title, description, image } = res.frontmatter;

  // Absolute URL for og:image
  const ogImage = image
    ? `${meta.baseURL}/images/${image}`
    : `${meta.baseURL}/images/og-image.png`;

  return {
    title: `${title}`,
    description,
    openGraph: {
      title,
      description,
      url: `${meta.baseURL}/docs/${pathName}`,
      type: "article",
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
  };
}

export default async function DocsPage(props: PageProps) {
  const params = await props.params;

  const {
    slug = []
  } = params;

  const pathName = slug.join("/");
  const res = await getDocsForSlug(pathName);

  if (!res) notFound();

  const { title, description, image: _image, date } = res.frontmatter;

  // File path for edit link
  const filePath = `contents/docs/${slug.join("/") || ""}/index.mdx`;

  const tocs = await getDocsTocs(pathName);

  return (
    <div className="flex items-start gap-10">
      <div className="flex-[4.5] pt-5">
        <MobToc tocs={tocs} />
        <DocsBreadcrumb paths={slug} />
        <Typography>
          <h1 className="text-3xl !-mt-0.5">{title}</h1>
          <p className="-mt-4 text-muted-foreground text-[16.5px]">{description}</p>
          <div>{res.content}</div>
          <div
            className={`my-8 flex items-center border-b-2 border-dashed border-x-muted-foreground ${
                docuConfig.repository?.editLink ? "justify-between" : "justify-end"
            }`}
            >
            {docuConfig.repository?.editLink && <EditThisPage filePath={filePath} />}
            {date && (
                <p className="text-[13px] text-muted-foreground">
                Published on {formatDate2(date)}
                </p>
            )}
            </div>
          <Pagination pathname={pathName} />
        </Typography>
      </div>
      <Toc path={pathName} />
    </div>
  );
}
