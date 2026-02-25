import { getDocsTocs } from "@/lib/markdown";
import TocObserver from "./toc-observer";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ListIcon } from "lucide-react";
import Sponsor from "./Sponsor";


export default async function Toc({ path }: { path: string }) {
  const tocs = await getDocsTocs(path);

  return (
    <div className="lg:flex hidden toc flex-[1.5] min-w-[238px] py-5 sticky top-16 h-[calc(100vh-4rem)]">
      <div className="flex flex-col h-full w-full px-2 gap-2 mb-auto">
        <div className="flex items-center gap-2">
          <ListIcon className="w-4 h-4" />
          <h3 className="font-medium text-sm">On this page</h3>
        </div>
        <div className="flex-shrink-0 min-h-0 max-h-[calc(70vh-4rem)]">
          <ScrollArea className="h-full">
            <TocObserver data={tocs} />
          </ScrollArea>
        </div>
        <Sponsor />
      </div>
    </div>
  );
}
