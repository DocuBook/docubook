import { notFound } from "next/navigation"
import { getDocsForSlug, getDocsTocs } from "@/lib/markdown"
import DocsBreadcrumb from "@/components/DocsBreadcrumb"
import Pagination from "@/components/Pagination"
import Toc from "@/components/Toc"
import { Typography } from "@/components/Typography"
import EditThisPage from "@/components/EditWithGithub"
import { formatDate2 } from "@/lib/utils"
import docuConfig from "@/docu.json"
import MobToc from "@/components/DocsSidebar"

const { meta } = docuConfig

type PageProps = {
  params: Promise<{
    slug: string[]
  }>
}

// Function to generate metadata dynamically
export async function generateMetadata(props: PageProps) {
  const params = await props.params

  const { slug = [] } = params

  const pathName = slug.join("/")
  const res = await getDocsForSlug(pathName)

  if (!res) {
    return {
      title: "Page Not Found",
      description: "The requested page was not found.",
    }
  }

  const { title, description, image } = res.frontmatter

  // Absolute URL for og:image
  const ogImage = image ? `${meta.baseURL}/images/${image}` : `${meta.baseURL}/images/og-image.png`

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
  }
}

export default async function DocsPage(props: PageProps) {
  const params = await props.params

  const { slug = [] } = params

  const pathName = slug.join("/")
  const res = await getDocsForSlug(pathName)

  if (!res) notFound()

  const { title, description, image: _image, date } = res.frontmatter
  const filePath = res.filePath
  const tocs = await getDocsTocs(pathName)

  return (
    <div className="flex w-full flex-1 px-0 pb-4 lg:px-8 lg:pb-8 h-[calc(100vh-4rem)]">
      <div id="scroll-container" className="max-lg:scroll-p-16 bg-card dark:bg-card/20 border-muted-foreground/20 flex w-full h-full flex-col items-start rounded-xl border shadow-md backdrop-blur-sm lg:flex-row overflow-y-auto relative">
        <div className="flex-7 w-full min-w-0 px-4 py-4 lg:px-8 lg:py-8">
          <MobToc tocs={tocs} />
          <DocsBreadcrumb paths={slug} />
          <Typography>
            <h1 className="-mt-0.5! text-3xl">{title}</h1>
            <p className="text-muted-foreground -mt-4 text-[16.5px]">{description}</p>
            <div>{res.content}</div>
            <div
              className={`border-x-muted-foreground my-8 flex items-center border-b-2 border-dashed ${docuConfig.repository?.editLink ? "justify-between" : "justify-end"
                }`}
            >
              {docuConfig.repository?.editLink && <EditThisPage filePath={filePath} />}
              {date && (
                <p className="text-muted-foreground text-[13px]">
                  Published on {formatDate2(date)}
                </p>
              )}
            </div>
            <Pagination pathname={pathName} />
          </Typography>
        </div>
        <Toc tocs={tocs} />
      </div>
    </div>
  )
}
