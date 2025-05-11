import { getDocsTocs } from "@/lib/markdown";
import TocObserver from "./toc-observer";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ListIcon } from "lucide-react";
import Sponsor from "./Sponsor";


export default async function Toc({ path }: { path: string }) {
  const tocs = await getDocsTocs(path);

  return (
    <div className="lg:flex hidden toc flex-[1.5] min-w-[238px] py-9 sticky top-16 h-[96.95vh]">
      <div className="flex flex-col gap-6 w-full pl-2 h-full">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <ListIcon className="w-5 h-5" />
            <h3 className="font-medium text-sm">On this page</h3>
          </div>
          <ScrollArea className="pb-2 pt-0.5 overflow-y-auto">
            <TocObserver data={tocs} />
          </ScrollArea>
        </div>
          <Sponsor />
      </div>
    </div>
  );
}
