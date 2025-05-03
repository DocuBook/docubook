"use client";

import { useState, useEffect, useRef } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  List,
  ListOrdered,
  Heading2,
  Heading3,
  Code,
  Quote,
  ImageIcon,
  Link as LinkIcon,
  Table,
  Maximize2,
  Minimize2,
  Type,
  ChevronDown,
  Notebook,
  Component,
  Youtube as YoutubeIcon,
  HelpCircle,
  LayoutGrid,
  MousePointer2,
  Rows,
  LayoutPanelTop,
  Laptop2,
  Copy,
  Download,
  RotateCcw,
  Calendar
} from "lucide-react";
import { Button as UIButton } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    handleParagraphClick,
    handleHeading2Click,
    handleHeading3Click,
    handleBulletListClick,
    handleNumberedListClick,
    handleLinkClick,
    handleImageClick,
    handleBlockquoteClick,
    handleCodeBlockClick,
    handleTableClick,
    handleNoteClick,
    handleComponentClick,
    handleMetadataClick,
  } from "@/components/playground/MarkComponent";

import "@/styles/editor.css";

const ToolbarButton = ({ icon: Icon, label, onClick }: { icon: any, label: string, onClick?: () => void }) => (
  <UIButton
    variant="ghost"
    size="sm"
    className="h-8 w-8 p-0 hover:bg-muted"
    title={label}
    onClick={onClick}
  >
    <Icon className="h-4 w-4" />
  </UIButton>
);

const ToolbarSeparator = () => (
  <Separator orientation="vertical" className="mx-1 h-6" />
);

const MobileMessage = () => (
  <div className="min-h-[80vh] flex flex-col items-center justify-center text-center px-4 animate-in fade-in-50 duration-500">
    <Laptop2 className="w-16 h-16 mb-4 text-muted-foreground animate-bounce" />
    <h2 className="text-2xl font-bold mb-2">Desktop View Recommended</h2>
    <p className="text-muted-foreground max-w-md">
      The Playground works best on larger screens. Please switch to a desktop device for the best experience.
    </p>
  </div>
);

export default function PlaygroundPage() {
  const [markdown, setMarkdown] = useState("");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [lineCount, setLineCount] = useState(1);
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  useEffect(() => {
    // Update line count when markdown content changes
    const lines = markdown.split('\n').length;
    setLineCount(Math.max(lines, 1));
  }, [markdown]);

  // Sync scroll position between editor and line numbers
  useEffect(() => {
    const textarea = editorRef.current;
    const lineNumbers = lineNumbersRef.current;

    if (!textarea || !lineNumbers) return;

    const handleScroll = () => {
      lineNumbers.scrollTop = textarea.scrollTop;
    };

    textarea.addEventListener('scroll', handleScroll);
    return () => textarea.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(markdown);
      toast.success('Content copied to clipboard');
    } catch (err) {
      toast.error('Failed to copy content');
    }
  };

  const handleDownload = () => {
    try {
      const blob = new Blob([markdown], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'index.mdx';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Content downloaded successfully');
    } catch (err) {
      toast.error('Failed to download content');
    }
  };

  const handleReset = () => {
    if (markdown.trim()) {
      toast.custom((t) => (
        <div className="flex flex-col gap-2 bg-background border rounded-lg p-4 shadow-lg">
          <h3 className="font-semibold">Clear editor content?</h3>
          <p className="text-sm text-muted-foreground">This action cannot be undone.</p>
          <div className="flex gap-2 mt-2">
            <UIButton
              size="sm"
              variant="destructive"
              onClick={() => {
                setMarkdown('');
                toast.success('all content in the editor has been cleaned');
                toast.dismiss(t);
              }}
            >
              Clear
            </UIButton>
            <UIButton
              size="sm"
              variant="outline"
              onClick={() => toast.dismiss(t)}
            >
              Cancel
            </UIButton>
          </div>
        </div>
      ), { duration: 10000 });
    }
  };

  const insertAtCursor = (textArea: HTMLTextAreaElement, text: string) => {
    const start = textArea.selectionStart;
    const end = textArea.selectionEnd;
    const before = markdown.substring(0, start);
    const after = markdown.substring(end);

    // Menambahkan satu baris kosong sebelum dan sesudah komponen
    const newText = `${before}${text}\n${after}`;
    setMarkdown(newText);

    requestAnimationFrame(() => {
      textArea.focus();
      const newPosition = start + text.length + 1;
      textArea.setSelectionRange(newPosition, newPosition);
    });
  };


  if (isMobile) {
    return <MobileMessage />;
  }

  return (
    <div className={cn(
      "flex flex-col transition-all duration-200",
      isFullscreen ? "fixed inset-0 z-50 bg-background" : "min-h-[calc(100vh-4rem)]"
    )}>
      <div className="border-b bg-background">
        <div className="py-8 px-2">
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-extrabold">Docu<span className="text-primary text-lg ml-1">PLAY</span></h1>
            <p className="text-lg text-muted-foreground mt-2">
              Test and experiment with DocuBook markdown components in real-time
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 py-8 px-2">
        <div className="flex flex-col h-full pb-12">
          <ScrollArea className="flex-1 border rounded-lg">
            <div className="sticky top-0 z-20 bg-background border-b">
              <div className="flex items-center justify-between p-2 bg-muted/40">
                <div className="flex items-center gap-2">
                  {markdown.trim() && (
                    <>
                      <UIButton
                        variant="ghost"
                        size="sm"
                        onClick={handleCopy}
                        className="gap-2 text-xs"
                      >
                        <Copy className="h-3.5 w-3.5" />
                        Copy
                      </UIButton>
                      <UIButton
                        variant="ghost"
                        size="sm"
                        onClick={handleDownload}
                        className="gap-2 text-xs"
                      >
                        <Download className="h-3.5 w-3.5" />
                        Download
                      </UIButton>
                      <UIButton
                        variant="ghost"
                        size="sm"
                        onClick={handleReset}
                        className="gap-2 text-xs"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                        Reset
                      </UIButton>
                      <Separator orientation="vertical" className="h-4" />
                    </>
                  )}
                </div>
                <UIButton
                  variant="ghost"
                  size="sm"
                  onClick={toggleFullscreen}
                  className="gap-2 text-xs"
                >
                  {isFullscreen ? (
                    <>
                      <Minimize2 className="h-3.5 w-3.5" />
                      Exit Fullscreen
                    </>
                  ) : (
                    <>
                      <Maximize2 className="h-3.5 w-3.5" />
                      Fullscreen
                    </>
                  )}
                </UIButton>
              </div>
              <div className="flex items-center border-b p-1 bg-background">
                <ToolbarButton icon={Calendar} label="Metadata" onClick={() => handleMetadataClick(insertAtCursor)} />
                <ToolbarSeparator />
                <ToolbarButton icon={Type} label="Paragraph" onClick={() => handleParagraphClick(insertAtCursor)} />
                <ToolbarButton icon={Heading2} label="Heading 2" onClick={() => handleHeading2Click(insertAtCursor)} />
                <ToolbarButton icon={Heading3} label="Heading 3" onClick={() => handleHeading3Click(insertAtCursor)} />
                <ToolbarButton icon={List} label="Bullet List" onClick={() => handleBulletListClick(insertAtCursor)} />
                <ToolbarButton icon={ListOrdered} label="Numbered List" onClick={() => handleNumberedListClick(insertAtCursor)} />
                <ToolbarSeparator />
                <ToolbarButton icon={LinkIcon} label="Link" onClick={() => handleLinkClick(insertAtCursor)} />
                <ToolbarButton icon={ImageIcon} label="Image" onClick={() => handleImageClick(insertAtCursor)} />
                <ToolbarButton icon={Quote} label="Blockquote" onClick={() => handleBlockquoteClick(insertAtCursor)} />
                <ToolbarButton icon={Code} label="Code Block" onClick={() => handleCodeBlockClick(insertAtCursor)} />
                <ToolbarButton icon={Table} label="Table" onClick={() => handleTableClick(insertAtCursor)} />
                <ToolbarSeparator />
                <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <UIButton
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2 flex items-center gap-1 font-normal"
                    >
                    <Notebook className="h-4 w-4" />
                    <ChevronDown className="h-4 w-4" />
                    </UIButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                    <DropdownMenuItem onClick={handleNoteClick(insertAtCursor, 'note')}>
                        Note
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleNoteClick(insertAtCursor, 'danger')}>
                        Danger
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleNoteClick(insertAtCursor, 'warning')}>
                        Warning
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleNoteClick(insertAtCursor, 'success')}>
                        Success
                    </DropdownMenuItem>
                </DropdownMenuContent>
                </DropdownMenu>
                <ToolbarSeparator />
                <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <UIButton
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2 flex items-center gap-1 font-normal"
                    >
                    <Component className="h-4 w-4" />
                    <ChevronDown className="h-4 w-4" />
                    </UIButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                    <DropdownMenuItem onClick={handleComponentClick(insertAtCursor, 'stepper')}>
                    <Rows className="h-4 w-4 mr-2" />
                        Stepper
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleComponentClick(insertAtCursor, 'card')}>
                    <LayoutGrid className="h-4 w-4 mr-2" />
                        Card
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleComponentClick(insertAtCursor, 'button')}>
                    <MousePointer2 className="h-4 w-4 mr-2" />
                        Button
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleComponentClick(insertAtCursor, 'accordion')}>
                    <ChevronDown className="h-4 w-4 mr-2" />
                    Accordion
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleComponentClick(insertAtCursor, 'tabs')}>
                    <LayoutPanelTop className="h-4 w-4 mr-2" />
                        Tabs
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleComponentClick(insertAtCursor, 'youtube')}>
                    <YoutubeIcon className="h-4 w-4 mr-2" />
                        Youtube
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleComponentClick(insertAtCursor, 'tooltip')}>
                    <HelpCircle className="h-4 w-4 mr-2" />
                        Tooltip
                    </DropdownMenuItem>
                </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
            <div className="editor-container">
              <div className="editor-line-numbers" ref={lineNumbersRef}>
                <div className="editor-line-numbers-content">
                  {Array.from({ length: lineCount }).map((_, i) => (
                    <div key={i} data-line-number={i + 1} />
                  ))}
                </div>
              </div>
              <textarea
                    ref={editorRef}
                    value={markdown}
                    onChange={(e) => setMarkdown(e.target.value)}
                    className="editor-textarea"
                    spellCheck={false}
                    placeholder="Type '/' for commands..."
                    />
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}
