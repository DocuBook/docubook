import fs from 'fs-extra';
import path from 'path';
import crypto from 'crypto';

export interface DocuConfig {
  routes: any[];
  // tambahkan field lain jika perlu
}

export interface EachRoute {
  title: string;
  href: string;
  noLink?: boolean;
  context?: any;
  items?: EachRoute[];
}

export class DocsTreeBuilder {
  private docsDir: string;
  private configPath: string;
  private outputPath: string;
  private cachePath: string;

  constructor(docsDir: string, configPath: string, outputPath: string) {
    this.docsDir = path.resolve(docsDir);
    this.configPath = path.resolve(configPath);
    this.outputPath = path.resolve(outputPath);
    this.cachePath = path.join(path.dirname(this.outputPath), '.docs-tree-cache.json');
  }

  private async collectDocsMetadata(dir: string, baseDir: string, acc: string[]): Promise<void> {
    const items = await fs.readdir(dir);
    items.sort();

    for (const item of items) {
      const fullPath = path.join(dir, item);
      const relativePath = path.relative(baseDir, fullPath);
      const stat = await fs.stat(fullPath);

      if (stat.isDirectory()) {
        await this.collectDocsMetadata(fullPath, baseDir, acc);
      } else if (stat.isFile()) {
        acc.push(`${relativePath}:${stat.mtimeMs}:${stat.size}`);
      }
    }
  }

  private async getHash(): Promise<string> {
    const configContent = await fs.readFile(this.configPath, 'utf-8');
    const docsMetadata: string[] = [];
    await this.collectDocsMetadata(this.docsDir, this.docsDir, docsMetadata);

    const hash = crypto.createHash('md5');
    hash.update(configContent);
    hash.update(docsMetadata.join('\n'));
    return hash.digest('hex');
  }

  private async scanDocs(dir: string): Promise<string[]> {
    const items = await fs.readdir(dir);
    const files: string[] = [];

    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = await fs.stat(fullPath);

      if (stat.isFile() && (item.endsWith('.mdx') || item.endsWith('.md'))) {
        files.push(item.replace(/\.(mdx|md)$/, ''));
      }
    }

    return files;
  }

  private async buildRoutes(routes: any[], basePath: string = ''): Promise<EachRoute[]> {
    const result: EachRoute[] = [];

    for (const route of routes) {
      const fullHref = basePath + route.href;
      const routeItem: EachRoute = {
        title: route.title,
        href: route.href, // keep relative
        noLink: route.noLink,
        context: route.context
      };

      if (route.items) {
        routeItem.items = await this.buildRoutes(route.items, fullHref);
      } else {
        // Jika tidak ada items, cek apakah ada folder atau file di docs
        const docsSubDir = path.join(this.docsDir, fullHref.replace(/^\//, ''));
        if (await fs.pathExists(docsSubDir)) {
          const files = await this.scanDocs(docsSubDir);
          routeItem.items = files.map(file => ({
            title: file.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
            href: `/${file}`
          }));
        }
      }

      result.push(routeItem);
    }

    return result;
  }

  public async build(): Promise<void> {
    const currentHash = await this.getHash();

    // Cek cache
    if (await fs.pathExists(this.cachePath)) {
      const cache = await fs.readJson(this.cachePath);
      if (cache.hash === currentHash && await fs.pathExists(this.outputPath)) {
        console.log('Using cached docs-tree.json');
        return;
      }
    }

    // Baca config
    const config: DocuConfig = await fs.readJson(this.configPath);

    // Build routes
    const navigationRoutes = await this.buildRoutes(config.routes);

    // Write output
    await fs.writeJson(this.outputPath, navigationRoutes, { spaces: 2 });

    // Update cache
    await fs.writeJson(this.cachePath, { hash: currentHash });

    console.log('Generated docs-tree.json');
  }
}